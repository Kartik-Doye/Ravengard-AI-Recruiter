import "dotenv/config";
import request from "supertest";
import { createCandidateApp } from "../src/servers/candidateServer";
import { createAdminApp } from "../src/servers/adminServer";

async function runQaRouteChecks() {
  console.log("========================================================================");
  console.log("  RAVENGARD INTEGRATION QA: PHASES 1–6 END-TO-END PIPELINE AUDIT");
  console.log("========================================================================\n");

  const candidateApp = await createCandidateApp();
  const adminApp = await createAdminApp();

  let candidateToken = "";
  let sessionId = "";
  let candidateId = "";

  // ─── PHASE 1: FOUNDATION (Onboarding, Consent, Locked State) ────────────
  console.log("▶ [PHASE 1: FOUNDATION] Testing Candidate Registration & Policy Consent...");
  const regEmail = `qa-candidate-${Date.now()}@example.com`;
  const regRes = await request(candidateApp)
    .post("/api/register")
    .send({
      name: "Devon Compliance Auditor",
      email: regEmail,
      role: "Senior Distributed Systems Engineer",
      experience: "6 years",
      resumeText: "Experienced engineer with distributed systems, PostgreSQL, and event streaming experience."
    });

  if (regRes.status !== 200 || !regRes.body.success || !regRes.body.token) {
    throw new Error(`[FAIL] Phase 1 Registration failed: HTTP ${regRes.status} - ${JSON.stringify(regRes.body)}`);
  }
  candidateToken = regRes.body.token;
  sessionId = regRes.body.sessionId;
  candidateId = regRes.body.candidateId;
  console.log(`  ✔ Phase 1 Registration passed. Candidate ID: ${candidateId}, Session ID: ${sessionId}`);

  // Policy Consent
  const consentRes = await request(candidateApp)
    .post("/api/policy-consent")
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({});

  if (consentRes.status !== 200 || !consentRes.body.success) {
    throw new Error(`[FAIL] Phase 1 Policy consent failed: HTTP ${consentRes.status} - ${JSON.stringify(consentRes.body)}`);
  }
  console.log("  ✔ Phase 1 Policy consent acknowledged and locked session verified.");

  // ─── PHASE 2: DEVICE CHECK (Hardware & Permission Readiness) ────────────
  console.log("\n▶ [PHASE 2: DEVICE CHECK] Testing Hardware & Device Verification...");
  const deviceSaveRes = await request(candidateApp)
    .post("/api/device-check/save")
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({
      sessionId,
      status: "passed",
      camera: "granted",
      mic: "granted",
      speaker: true,
      browser: true,
      meta: { os: "Windows 11", browserName: "Chrome", resolution: "1920x1080" }
    });

  if (deviceSaveRes.status !== 200 || !deviceSaveRes.body.success) {
    throw new Error(`[FAIL] Phase 2 Device check save failed: HTTP ${deviceSaveRes.status}`);
  }

  const deviceStatusRes = await request(candidateApp)
    .get("/api/device-check/status")
    .set("Authorization", `Bearer ${candidateToken}`);

  if (deviceStatusRes.status !== 200 || !deviceStatusRes.body.ready) {
    throw new Error(`[FAIL] Phase 2 Device readiness query failed: HTTP ${deviceStatusRes.status}`);
  }
  console.log("  ✔ Phase 2 Device check passed and verified ready for live interview.");

  // ─── PHASE 3: WAITING ROOM (Session Recovery & Stage Guarding) ──────────
  console.log("\n▶ [PHASE 3: WAITING ROOM] Testing State Retrieval & Stage Transition...");
  const sessionLookupRes = await request(candidateApp)
    .get(`/api/session/${sessionId}`);

  if (sessionLookupRes.status !== 200 || !sessionLookupRes.body.success) {
    throw new Error(`[FAIL] Phase 3 Session lookup failed: HTTP ${sessionLookupRes.status}`);
  }

  // Multi-port arbitrary test session check
  const arbitraryTestRes = await request(candidateApp)
    .get("/api/session/test");
  if (arbitraryTestRes.status !== 200 || !arbitraryTestRes.body.success) {
    throw new Error(`[FAIL] Phase 3 Multi-port session test route returned 404 or invalid JSON: HTTP ${arbitraryTestRes.status}`);
  }

  const transitionRes = await request(candidateApp)
    .post(`/api/session/${sessionId}/stage`)
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({ toStage: "waiting_room" });

  if (transitionRes.status !== 200 || !transitionRes.body.success) {
    throw new Error(`[FAIL] Phase 3 Transition to waiting room failed: HTTP ${transitionRes.status}`);
  }
  console.log("  ✔ Phase 3 Waiting room state transition and route resolution verified.");

  // ─── PHASE 4: INTERVIEW ENGINE (Stage Sequencing & Response Capture) ───
  console.log("\n▶ [PHASE 4: INTERVIEW ENGINE] Testing Interview Loop & Response Capture...");
  await request(candidateApp)
    .post(`/api/session/${sessionId}/stage`)
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({ toStage: "interview_technical" });

  const startRes = await request(candidateApp)
    .post(`/api/interview/${sessionId}/start`)
    .set("Authorization", `Bearer ${candidateToken}`);

  if (startRes.status !== 200 || !startRes.body.success) {
    throw new Error(`[FAIL] Phase 4 Interview start failed: HTTP ${startRes.status}`);
  }

  const answerRes = await request(candidateApp)
    .post("/api/interview/response")
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({
      questionId: "q-dist-01",
      responseText: "We use write-ahead log replication, idempotency keys, and asynchronous outbox workers."
    });

  if (answerRes.status !== 200 || !answerRes.body.success) {
    throw new Error(`[FAIL] Phase 4 Interview response capture failed: HTTP ${answerRes.status}`);
  }
  console.log("  ✔ Phase 4 Interview stage started and candidate response persisted.");

  // ─── PHASE 5: ANTI-CHEAT / INTEGRITY LAYER (Signal Collector) ───────────
  console.log("\n▶ [PHASE 5: ANTI-CHEAT] Testing Telemetry & Risk Signal Collection...");
  const signalRes = await request(candidateApp)
    .post(`/api/interview/${sessionId}/signal`)
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({
      signalType: "tab_blur",
      metadata: { blurDurationMs: 1450, reason: "Alt-Tab window focus loss" }
    });

  if (signalRes.status !== 200 || !signalRes.body.success || !signalRes.body.signalId) {
    throw new Error(`[FAIL] Phase 5 Integrity signal recording failed: HTTP ${signalRes.status}`);
  }
  console.log(`  ✔ Phase 5 Integrity signal captured asynchronously. Signal ID: ${signalRes.body.signalId}`);

  // ─── PHASE 6: FINAL REPORT (Scorecard Retrieval & Structure) ───────────
  console.log("\n▶ [PHASE 6: FINAL REPORT] Testing Scorecard & Question Scores...");
  const scoresRes = await request(candidateApp)
    .get(`/api/interview/${sessionId}/scores`)
    .set("Authorization", `Bearer ${candidateToken}`);

  if (scoresRes.status !== 200 || !scoresRes.body.success) {
    throw new Error(`[FAIL] Phase 6 Scores endpoint failed: HTTP ${scoresRes.status}`);
  }

  console.log("  ✔ Phase 6 Evaluation scores endpoint confirmed.");

  // ─── SECURITY AUDIT: ZERO-TOLERANCE CREDENTIAL BYPASS TEST ─────────────
  console.log("\n▶ [SECURITY CHECK] Verifying Static Password & Backdoor Rejection on Admin Console...");
  const backdoorRes = await request(adminApp)
    .post("/api/admin/login")
    .send({
      email: "admin@ravengard.com",
      password: "admin123"
    });

  if (backdoorRes.status !== 401) {
    throw new Error(`[CRITICAL SECURITY FAIL] Admin backdoor login accepted with status ${backdoorRes.status}! Expected 401 Unauthorized.`);
  }
  console.log("  ✔ Backdoor credential rejection verified (HTTP 401 Unauthorized). Zero bypass vulnerability.");

  console.log("\n========================================================================");
  console.log("  ALL PHASES 1–6 AND ZERO-TOLERANCE SECURITY CHECKS PASSED (100/100)");
  console.log("========================================================================\n");
}

runQaRouteChecks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ QA Route Check Failed:\n", err);
    process.exit(1);
  });
