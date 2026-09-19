import { db } from "../src/db/index";
import {
  candidates,
  sessions,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  interviewReports,
  questionScores,
  rubrics,
  rubricCriteria,
} from "../src/db/schema";
import {
  ensureDefaultRubric,
  getRubricByVersion,
  DEFAULT_RUBRIC_VERSION,
} from "../src/services/rubricService";
import {
  calculateWeightedScore,
  deriveRecommendation,
  scoreResponse,
  evaluateAndScoreSession,
} from "../src/services/scoringService";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✘ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✔ PASSED: ${message}`);
}

async function runScoringTests() {
  console.log("========================================================");
  console.log("     SCORING PIPELINE & WEIGHTED AGGREGATION TESTS     ");
  console.log("========================================================");

  // ──────────────────────────────────────────────────────────────────
  // TEST 1: Active Rubric and Criteria Weight Verification
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 1: Verifying active rubric and criteria weights...");
  const rubric = await ensureDefaultRubric(DEFAULT_RUBRIC_VERSION);
  assert(rubric.version === "v1.0", "Default rubric version is v1.0");
  assert(rubric.criteria.length === 4, "Default rubric has 4 standard criteria");

  const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
  assert(totalWeight === 100, `Criteria weights sum to 100% (actual: ${totalWeight}%)`);

  const weightMap = Object.fromEntries(rubric.criteria.map((c) => [c.name, c.weight]));
  assert(weightMap["technical"] === 40, "Technical weight is 40%");
  assert(weightMap["problem_solving"] === 30, "Problem Solving weight is 30%");
  assert(weightMap["communication"] === 20, "Communication weight is 20%");
  assert(weightMap["behavioral"] === 10, "Behavioral weight is 10%");

  // ──────────────────────────────────────────────────────────────────
  // TEST 2: Mathematical Precision of Weighted Aggregation (User Spec)
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 2: Verifying mathematical calculation matches user prompt spec...");
  // Example spec from prompt:
  // Technical:        80 × 0.40 = 32
  // Problem solving:  70 × 0.30 = 21
  // Communication:    90 × 0.20 = 18
  // Behavioral:       60 × 0.10 = 6
  // Overall score: 77
  const inputAverages = {
    technical: 80,
    problem_solving: 70,
    communication: 90,
    behavioral: 60,
  };

  const calculated = calculateWeightedScore(inputAverages, rubric.criteria);
  assert(calculated.breakdown["technical"] === 80, "Breakdown Technical is 80");
  assert(calculated.breakdown["problem_solving"] === 70, "Breakdown Problem Solving is 70");
  assert(calculated.breakdown["communication"] === 90, "Breakdown Communication is 90");
  assert(calculated.breakdown["behavioral"] === 60, "Breakdown Behavioral is 60");
  assert(calculated.overallScore === 77, `Overall score equals exactly 77 (actual: ${calculated.overallScore})`);

  const rec = deriveRecommendation(calculated.overallScore);
  assert(rec === "hire", `Score 77 derives recommendation 'hire' (actual: ${rec})`);

  // ──────────────────────────────────────────────────────────────────
  // TEST 3: Handling Missing & Empty Responses Explicitly
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 3: Handling empty or missing candidate answers...");
  const emptyScores = await scoreResponse(
    "How do you design a high-throughput queue?",
    "",
    rubric.criteria,
    rubric.version
  );
  assert(emptyScores.length === rubric.criteria.length, "Empty response returns all criteria");
  assert(
    emptyScores.every((s) => s.score === 0),
    "All scores are strictly 0 for empty answers"
  );
  assert(
    emptyScores.every((s) => s.notes === "No response provided"),
    "Notes explicitly mark 'No response provided'"
  );

  // ──────────────────────────────────────────────────────────────────
  // TEST 4: End-to-End Scoring Pipeline & Idempotency Check
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 4: Executing evaluateAndScoreSession with database persistence...");
  const testCandidateId = `test-cand-${Date.now()}`;
  const testSessionId = `test-sess-${Date.now()}`;
  const testIvSessionId = `test-iv-${Date.now()}`;
  const testQ1Id = `test-q1-${Date.now()}`;
  const testQ2Id = `test-q2-${Date.now()}`;

  // Seed test candidate and session
  await db.insert(candidates).values({
    id: testCandidateId,
    email: `candidate-${Date.now()}@ravengard.test`,
    name: "Pipeline Test Candidate",
    emailVerified: true,
  });

  await db.insert(sessions).values({
    id: testSessionId,
    candidateId: testCandidateId,
    currentStage: "interview_technical",
    status: "in_progress",
    locked: true,
  });

  await db.insert(interviewSessions).values({
    id: testIvSessionId,
    sessionId: testSessionId,
    roundType: "technical",
    status: "completed",
  });

  await db.insert(interviewQuestions).values([
    {
      id: testQ1Id,
      interviewSessionId: testIvSessionId,
      questionIndex: 1,
      questionText: "Explain how you handle database connection pooling and failover under load.",
    },
    {
      id: testQ2Id,
      interviewSessionId: testIvSessionId,
      questionIndex: 2,
      questionText: "How do you communicate a critical production regression to cross-functional stakeholders?",
    },
  ]);

  await db.insert(interviewResponses).values([
    {
      id: crypto.randomUUID(),
      questionId: testQ1Id,
      responseText:
        "We implement connection pooling via pg-pool with min/max pool limits, idle timeouts, and read replica routing. When failover occurs, the health-checker catches circuit breaker trips and routes traffic to the standby cluster.",
    },
    {
      id: testQ2Id, // intentional empty response to test explicit missing handling
      questionId: testQ2Id,
      responseText: "",
    },
  ]);

  console.log("  Running evaluateAndScoreSession (First execution)...");
  const report1 = await evaluateAndScoreSession(testSessionId, { rubricVersion: "v1.0" });
  assert(Boolean(report1 && report1.id), "First evaluation returned report with ID");
  assert(report1.rubricVersion === "v1.0", "Report retains rubric version v1.0");

  // Verify records in questionScores
  const initialScores = await db
    .select()
    .from(questionScores)
    .where(eq(questionScores.sessionId, testSessionId));
  const expectedRecordCount = 2 * 4; // 2 questions * 4 criteria
  assert(
    initialScores.length === expectedRecordCount,
    `Persisted exactly ${expectedRecordCount} questionScores records (actual: ${initialScores.length})`
  );

  // Verify that empty response for Q2 produced 0 scores
  const q2Scores = initialScores.filter((s) => s.questionId === testQ2Id);
  assert(
    q2Scores.length === 4 && q2Scores.every((s) => s.score === 0),
    "Question 2 (empty answer) has 0 scores across all criteria"
  );

  // ──────────────────────────────────────────────────────────────────
  // TEST 5: Idempotency: Running Twice Must NOT Duplicate Records
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 5: Checking idempotency under duplicate scoring attempts...");
  const report2 = await evaluateAndScoreSession(testSessionId, { rubricVersion: "v1.0" });
  const postSecondRunScores = await db
    .select()
    .from(questionScores)
    .where(eq(questionScores.sessionId, testSessionId));

  assert(
    postSecondRunScores.length === expectedRecordCount,
    `No duplicate questionScores created on re-run (count remains ${postSecondRunScores.length})`
  );

  const reportCount = await db
    .select()
    .from(interviewReports)
    .where(eq(interviewReports.sessionId, testSessionId));
  assert(reportCount.length === 1, "Exactly one interviewReports record exists for the session");

  // ──────────────────────────────────────────────────────────────────
  // TEST 6: Verify Session State Protection
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 6: Verifying session state transition...");
  const [updatedSession] = await db.select().from(sessions).where(eq(sessions.id, testSessionId));
  assert(
    updatedSession.currentStage === "report_generation",
    "Session currentStage updated to 'report_generation'"
  );
  assert(updatedSession.status === "completed", "Session status updated to 'completed'");

  // ──────────────────────────────────────────────────────────────────
  // TEST 7: Historical Rubric Version Retention
  // ──────────────────────────────────────────────────────────────────
  console.log("\n▶ TEST 7: Verifying historical enterprise rubric retention (v2.4)...");
  const enterpriseRubric = await getRubricByVersion("v2.4-enterprise-strict");
  assert(
    enterpriseRubric.version === "v2.4-enterprise-strict",
    "Enterprise rubric v2.4-enterprise-strict loaded successfully"
  );

  console.log("\n========================================================");
  console.log("       ALL SCORING PIPELINE ACCEPTANCE TESTS PASSED     ");
  console.log("========================================================");
}

runScoringTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  });
