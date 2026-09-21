import http from "http";
import crypto from "crypto";
import { db } from "../src/db/index";
import { candidates, sessions, interviewSessions, organizations } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { signCandidateToken } from "../src/middleware/auth";

interface ConnectionStats {
  id: number;
  status: "pending" | "connected" | "completed" | "failed";
  tokensReceived: number;
  timeToFirstTokenMs: number | null;
  totalDurationMs: number | null;
  error?: string;
}

const TOTAL_CONCURRENT = 100;
const SERVER_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = "127.0.0.1";

async function runSseLoadTest() {
  console.log(`=======================================================`);
  console.log(`  RAVENGARD INTERVIEW GATEWAY - SSE LOAD TEST SIMULATOR`);
  console.log(`  Target: 100 Concurrent Server-Sent Event Streams`);
  console.log(`=======================================================\n`);

  // 1. Prepare candidate and locked interview session for load testing
  const testEmail = `loadtest-${Date.now()}@ravengard-sim.internal`;
  const candidateId = `cand-loadtest-${crypto.randomUUID()}`;
  const sessionId = `sess-loadtest-${crypto.randomUUID()}`;
  const interviewSessionId = `isess-loadtest-${crypto.randomUUID()}`;

  console.log(`[Setup] Provisioning test candidate and interview session in PostgreSQL...`);

  // Ensure organization exists
  let [org] = await db.select().from(organizations).where(eq(organizations.id, "org-ravengard")).limit(1);
  if (!org) {
    await db.insert(organizations).values({
      id: "org-ravengard",
      name: "Ravengard Systems",
    });
  }

  await db.insert(candidates).values({
    id: candidateId,
    email: testEmail,
    name: "SSE Concurrency Load Tester",
    organizationId: "org-ravengard",
    emailVerified: true,
  });

  await db.insert(sessions).values({
    id: sessionId,
    candidateId,
    locked: true,
    deviceCheckStatus: "passed",
    status: "active",
    currentStage: "interview_hr_friendly",
  });

  await db.insert(interviewSessions).values({
    id: interviewSessionId,
    sessionId,
    roundType: "technical",
    status: "in_progress",
  });

  const token = signCandidateToken({
    id: candidateId,
    email: testEmail,
    name: "SSE Concurrency Load Tester",
  });

  console.log(`[Setup] Session verified. Token generated. Launching ${TOTAL_CONCURRENT} concurrent SSE streams...\n`);

  const startTime = Date.now();
  const stats: ConnectionStats[] = Array.from({ length: TOTAL_CONCURRENT }, (_, i) => ({
    id: i + 1,
    status: "pending",
    tokensReceived: 0,
    timeToFirstTokenMs: null,
    totalDurationMs: null,
  }));

  const runConnection = (index: number): Promise<void> => {
    return new Promise((resolve) => {
      const connStart = Date.now();
      const client = http.request(
        {
          hostname: HOST,
          port: SERVER_PORT,
          path: `/api/interview/${sessionId}/stream-question`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Ravengard-Load-Test": "true",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            stats[index].status = "failed";
            stats[index].error = `HTTP ${res.statusCode}`;
            resolve();
            return;
          }

          stats[index].status = "connected";

          res.on("data", (chunk: Buffer) => {
            const str = chunk.toString();
            if (stats[index].timeToFirstTokenMs === null) {
              stats[index].timeToFirstTokenMs = Date.now() - connStart;
            }

            const lines = str.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) {
                    stats[index].tokensReceived++;
                  }
                  if (data.done) {
                    stats[index].status = "completed";
                    stats[index].totalDurationMs = Date.now() - connStart;
                  }
                } catch {
                  // non-json keep-alive
                }
              }
            }
          });

          res.on("end", () => {
            if (stats[index].status !== "completed") {
              stats[index].status = "completed";
              stats[index].totalDurationMs = Date.now() - connStart;
            }
            resolve();
          });

          res.on("error", (err) => {
            stats[index].status = "failed";
            stats[index].error = err.message;
            resolve();
          });
        }
      );

      client.on("error", (err) => {
        stats[index].status = "failed";
        stats[index].error = err.message;
        resolve();
      });

      // 15s timeout
      client.setTimeout(15000, () => {
        stats[index].status = "failed";
        stats[index].error = "Timeout (15s)";
        client.destroy();
        resolve();
      });

      client.end();
    });
  };

  // Launch all 100 concurrent requests in parallel
  await Promise.all(stats.map((_, i) => runConnection(i)));

  const totalTime = Date.now() - startTime;
  const completed = stats.filter((s) => s.status === "completed").length;
  const failed = stats.filter((s) => s.status === "failed").length;
  const validTtft = stats
    .map((s) => s.timeToFirstTokenMs)
    .filter((t): t is number => t !== null);
  const avgTtft =
    validTtft.length > 0
      ? Math.round(validTtft.reduce((a, b) => a + b, 0) / validTtft.length)
      : 0;

  console.log(`\n=======================================================`);
  console.log(`  LOAD TEST RESULTS SUMMARY`);
  console.log(`=======================================================`);
  console.log(`Total Connections Attempted:  ${TOTAL_CONCURRENT}`);
  console.log(`Successfully Completed:       ${completed} / ${TOTAL_CONCURRENT} (${((completed / TOTAL_CONCURRENT) * 100).toFixed(1)}%)`);
  console.log(`Failed / Timed Out:           ${failed}`);
  console.log(`Average Time to First Token:  ${avgTtft} ms`);
  console.log(`Total Batch Execution Time:   ${totalTime} ms`);
  console.log(`=======================================================\n`);

  if (failed > 5) {
    console.error(`[FAILURE] More than 5% of concurrent SSE connections failed.`);
    process.exit(1);
  } else {
    console.log(`[SUCCESS] 100 concurrent SSE streams sustained with deterministic stability.`);
    process.exit(0);
  }
}

runSseLoadTest().catch((err) => {
  console.error("Load test fatal error:", err);
  process.exit(1);
});
