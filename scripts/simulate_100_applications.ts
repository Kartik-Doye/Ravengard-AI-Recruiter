import "dotenv/config";
import crypto from "crypto";
import { performance } from "perf_hooks";
import { db } from "../src/db/index";
import { jobs, organizations } from "../src/db/schema";
import { eq } from "drizzle-orm";

interface ApplicationResult {
  index: number;
  email: string;
  name: string;
  profileType: "high_match" | "borderline" | "unmatched";
  submitStatus: number;
  submitDurationMs: number;
  applicationId?: string;
  submitError?: string;
}

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const TOTAL_APPLICATIONS = 100;
const CONCURRENCY = 10; // Batch concurrency

const HIGH_MATCH_RESUME = `
Senior Full Stack Engineer with 7 years of production experience.
Extensive background in TypeScript, Node.js, React, and PostgreSQL.
Architected high-scale distributed systems, microservices, and GraphQL APIs.
Deep expertise in CI/CD, Docker, Kubernetes, system design, and database query optimization.
`;

const BORDERLINE_RESUME = `
Junior Frontend Developer with 2 years of experience.
Proficient in JavaScript, HTML5, CSS3, and foundational React.
Basic exposure to Node.js scripts and relational databases like PostgreSQL.
Seeking to expand skills in full stack software engineering and distributed architecture.
`;

const UNMATCHED_RESUME = `
Digital Marketing and Content Specialist with 5 years experience.
Expertise in SEO, SEM, social media growth marketing, copy writing, and Google Analytics.
Familiar with WordPress and no-code website builders.
Looking for roles in marketing operations or product growth.
`;

async function setupTestJob(): Promise<{ orgId: string; jobId: string }> {
  const pool = (db as any).session?.client || (global as any)._postgresPool;
  const orgId = "org_ravengard_loadtest_100";
  const jobId = "job_fullstack_benchmark_100";

  await pool.query(
    `INSERT INTO organizations (id, name)
     VALUES ($1, 'Ravengard Load Test Lab')
     ON CONFLICT (id) DO NOTHING;`,
    [orgId]
  );

  // Clean previous run data for this test job
  await pool.query(
    `DELETE FROM applications WHERE job_id = $1;`,
    [jobId]
  );
  await pool.query(
    `DELETE FROM jobs WHERE id = $1;`,
    [jobId]
  );

  await pool.query(
    `INSERT INTO jobs (
       id, organization_id, title, department, description, requirements_json, screening_threshold, require_human_rejection_approval, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active');`,
    [
      jobId,
      orgId,
      "Senior Full Stack Distributed Systems Engineer",
      "Core Engineering",
      "Seeking elite engineers to architect next-generation autonomous AI platforms using TypeScript, Node.js, React, PostgreSQL, and resilient system design.",
      JSON.stringify({
        required_skills: ["TypeScript", "Node.js", "React", "PostgreSQL", "System Design"],
        min_years_experience: 5
      }),
      75,
      false // automated rejection emails for load test
    ]
  );

  console.log(`✔ Initialized test job: [${jobId}] under organization [${orgId}]`);
  return { orgId, jobId };
}

async function submitApplication(
  jobId: string,
  index: number,
  profileType: "high_match" | "borderline" | "unmatched"
): Promise<ApplicationResult> {
  const email = `candidate_test_${index}_${Date.now()}@ravengard-test.io`;
  const name = `Benchmark Candidate ${index}`;
  const resumeText =
    profileType === "high_match"
      ? HIGH_MATCH_RESUME
      : profileType === "borderline"
      ? BORDERLINE_RESUME
      : UNMATCHED_RESUME;

  const payload = {
    name,
    email,
    mobile: `+1555${String(index).padStart(7, "0")}`,
    college: profileType === "high_match" ? "MIT" : "State University",
    degree: profileType === "high_match" ? "M.S. Computer Science" : "B.A. Communications",
    gradYear: 2020 + (index % 5),
    preferredLanguage: "TypeScript",
    resumeText,
  };

  const startTime = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const duration = performance.now() - startTime;
    const body = await res.json().catch(() => ({}));

    return {
      index,
      email,
      name,
      profileType,
      submitStatus: res.status,
      submitDurationMs: duration,
      applicationId: body.applicationId,
      submitError: res.ok ? undefined : body.error || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    const duration = performance.now() - startTime;
    return {
      index,
      email,
      name,
      profileType,
      submitStatus: 0,
      submitDurationMs: duration,
      submitError: err.message,
    };
  }
}

async function runLoadTest() {
  console.log("===============================================================");
  console.log("  RAVENGARD LOAD TEST: 100 END-TO-END CANDIDATE APPLICATIONS  ");
  console.log("===============================================================\n");

  const { jobId, orgId } = await setupTestJob();

  // Distribution: 40 High Match, 30 Borderline, 30 Unmatched
  const tasks: Array<{ index: number; type: "high_match" | "borderline" | "unmatched" }> = [];
  for (let i = 1; i <= TOTAL_APPLICATIONS; i++) {
    let type: "high_match" | "borderline" | "unmatched";
    if (i <= 40) type = "high_match";
    else if (i <= 70) type = "borderline";
    else type = "unmatched";
    tasks.push({ index: i, type });
  }

  console.log(`Submitting ${TOTAL_APPLICATIONS} candidate applications (Concurrency: ${CONCURRENCY})...`);
  const results: ApplicationResult[] = [];
  const testStartTime = performance.now();

  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    const batchPromises = batch.map((t) => submitApplication(jobId, t.index, t.type));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    process.stdout.write(`  Processed ${results.length}/${TOTAL_APPLICATIONS} applications...\r`);
  }

  const totalSubmissionTime = performance.now() - testStartTime;
  console.log(`\n✔ Completed ${TOTAL_APPLICATIONS} submissions in ${(totalSubmissionTime / 1000).toFixed(2)}s\n`);

  // Analyze Submission Results
  const successfulSubmissions = results.filter((r) => r.submitStatus === 201);
  const failedSubmissions = results.filter((r) => r.submitStatus !== 201);
  const durations = results.map((r) => r.submitDurationMs).sort((a, b) => a - b);

  const minDuration = durations[0];
  const maxDuration = durations[durations.length - 1];
  const avgDuration = durations.reduce((acc, v) => acc + v, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  console.log("----------------- SUBMISSION PHASE METRICS --------------------");
  console.log(`Total Applications Submitted : ${TOTAL_APPLICATIONS}`);
  console.log(`Successful (HTTP 201)        : ${successfulSubmissions.length} (${((successfulSubmissions.length / TOTAL_APPLICATIONS) * 100).toFixed(1)}%)`);
  console.log(`Failed Submissions           : ${failedSubmissions.length}`);
  console.log(`Throughput                   : ${(TOTAL_APPLICATIONS / (totalSubmissionTime / 1000)).toFixed(1)} req/sec`);
  console.log(`Latency Min                  : ${minDuration.toFixed(1)}ms`);
  console.log(`Latency Avg                  : ${avgDuration.toFixed(1)}ms`);
  console.log(`Latency p50                  : ${p50.toFixed(1)}ms`);
  console.log(`Latency p95                  : ${p95.toFixed(1)}ms`);
  console.log(`Latency p99                  : ${p99.toFixed(1)}ms`);
  console.log(`Latency Max                  : ${maxDuration.toFixed(1)}ms`);

  if (failedSubmissions.length > 0) {
    console.error("\n✘ Sample Submission Errors:");
    failedSubmissions.slice(0, 5).forEach((f) => {
      console.error(`  - Candidate #${f.index} (${f.email}): status=${f.submitStatus}, error=${f.submitError}`);
    });
  }

  // ─── STAGE 2: PRE-SCREENING PIPELINE PROCESSING ───────────────────────────
  console.log("\n----------------- PRE-SCREENING & ATS EVALUATION --------------");
  console.log("Processing pre-screening queue for submitted applications...");

  const { preScreeningService } = await import("../src/services/preScreeningService");
  const pool = (db as any).session?.client || (global as any)._postgresPool;
  let remainingQueue = TOTAL_APPLICATIONS;
  let waitLoops = 0;
  const maxWaitLoops = 20;

  while (waitLoops < maxWaitLoops) {
    // Proactively drain batch of 10
    await preScreeningService.processQueueBatch(BASE_URL, 10);

    const qCountRes = await pool.query(
      `SELECT count(*) as count FROM screening_queue WHERE status = 'pending' AND organization_id = $1;`,
      [orgId]
    );
    remainingQueue = parseInt(qCountRes.rows[0].count, 10);
    const completedRes = await pool.query(
      `SELECT count(*) as count FROM ai_screening_results asr
       JOIN applications a ON asr.application_id = a.id
       WHERE a.job_id = $1;`,
      [jobId]
    );
    const completedCount = parseInt(completedRes.rows[0].count, 10);

    process.stdout.write(`  Pending in Queue: ${remainingQueue} | Evaluated by AI: ${completedCount}/${TOTAL_APPLICATIONS}\r`);

    if (remainingQueue === 0 && completedCount >= successfulSubmissions.length) {
      break;
    }

    await new Promise((r) => setTimeout(r, 2000));
    waitLoops++;
  }

  console.log("\n");

  // Fetch AI Evaluation Breakdown
  const evalBreakdownRes = await pool.query(
    `SELECT 
       a.status,
       count(*) as count,
       avg(asr.match_score) as avg_score,
       min(asr.match_score) as min_score,
       max(asr.match_score) as max_score
     FROM applications a
     LEFT JOIN ai_screening_results asr ON asr.application_id = a.id
     WHERE a.job_id = $1
     GROUP BY a.status;`,
    [jobId]
  );

  console.log("AI Screening Decision Breakdown:");
  for (const row of evalBreakdownRes.rows) {
    console.log(
      `  • Status: [${row.status.padEnd(14)}] | Count: ${String(row.count).padStart(3)} | Avg Score: ${Number(row.avg_score || 0).toFixed(1)}% | Range: ${row.min_score || 0}% - ${row.max_score || 0}%`
    );
  }

  // ─── STAGE 3: OUTBOX EMAILS & MAGIC TOKENS ─────────────────────────────────
  console.log("\n----------------- OUTBOX & MAGIC TOKEN VERIFICATION -----------");
  const emailsRes = await pool.query(
    `SELECT template_type, status, count(*) as count
     FROM email_outbox
     WHERE organization_id = $1
     GROUP BY template_type, status;`,
    [orgId]
  );

  console.log("Email Notifications Generated:");
  for (const row of emailsRes.rows) {
    console.log(`  • Template: [${row.template_type}] | Status: [${row.status}] | Count: ${row.count}`);
  }

  // ─── STAGE 4: SAMPLE SHORTLISTED JOURNEY PROGRESSION ──────────────────────
  console.log("\n----------------- SAMPLE CANDIDATE JOURNEY TEST ---------------");
  const sampleShortlisted = await pool.query(
    `SELECT a.id, a.candidate_id, a.session_id, a.magic_token_hash, s.current_stage, s.locked
     FROM applications a
     JOIN sessions s ON a.session_id = s.id
     WHERE a.job_id = $1 AND a.status = 'shortlisted'
     LIMIT 1;`,
    [jobId]
  );

  if (sampleShortlisted.rows.length > 0) {
    const candidateSession = sampleShortlisted.rows[0];
    console.log(`✔ Found shortlisted candidate session: ${candidateSession.session_id}`);
    console.log(`  Current Stage: ${candidateSession.current_stage} | Locked: ${candidateSession.locked}`);

    // Verify stage transition to device_check
    const [user] = await pool.query(`SELECT id, email FROM candidates WHERE id = $1;`, [candidateSession.candidate_id]).then((r: any) => r.rows);
    console.log(`  Candidate email: ${user?.email}`);

    // Test transition endpoint
    const transRes = await fetch(`${BASE_URL}/api/session/${candidateSession.session_id}/stage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${candidateSession.candidate_id}`
      },
      body: JSON.stringify({ stage: "device_check" })
    });

    console.log(`  Transition to device_check HTTP Status: ${transRes.status}`);
    if (transRes.ok) {
      const transBody = await transRes.json();
      console.log(`  Stage successfully progressed to: ${transBody.currentStage}`);
    }
  } else {
    console.warn("  ⚠ No candidate was shortlisted. Check rubric threshold and keyword matching.");
  }

  console.log("\n===============================================================");
  console.log("  100 APPLICATION BENCHMARK COMPLETED                          ");
  console.log("===============================================================\n");

  pool.end();
}

runLoadTest().catch((err) => {
  console.error("Benchmark failed fatally:", err);
  process.exit(1);
});
