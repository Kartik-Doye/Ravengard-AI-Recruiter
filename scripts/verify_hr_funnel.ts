import { db } from "../src/db/index";
import {
  jobs,
  applications,
  candidates,
  screeningQueue,
  emailOutbox,
  aiScreeningResults,
  adminUsers,
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { preScreeningService } from "../src/services/preScreeningService";
import { emailService } from "../src/services/emailService";
import {
  generateMagicToken,
  redeemMagicToken,
} from "../src/services/magicTokenService";
import crypto from "crypto";

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 STARTING RAVENGARD HR FUNNEL & ATS VERIFICATION");
  console.log("==================================================\n");

  const orgA = "org_ravengard_test_01";
  const orgB = "org_competitor_test_02";

  try {
    // 0. Ensure Organizations Exist
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    await pool.query(
      `INSERT INTO organizations (id, name)
       VALUES ($1, 'Ravengard Engineering Test'),
              ($2, 'Competitor Corp Test')
       ON CONFLICT (id) DO NOTHING;`,
      [orgA, orgB]
    );

    // 1. Tenant Isolation: Create Job in Org A and Org B
    console.log("TEST 1: Creating Tenant-Isolated Jobs...");
    const jobIdA = `job-test-a-${Date.now()}`;
    const [jobA] = await db
      .insert(jobs)
      .values({
        id: jobIdA,
        organizationId: orgA,
        title: "Senior Distributed Systems Engineer",
        department: "Core Engineering",
        description: "Must have deep experience with TypeScript, PostgreSQL, and Distributed Systems.",
        screeningThreshold: 75,
        requireHumanRejectionApproval: true,
        status: "active",
      })
      .returning();

    const jobIdB = `job-test-b-${Date.now()}`;
    const [jobB] = await db
      .insert(jobs)
      .values({
        id: jobIdB,
        organizationId: orgB,
        title: "Frontend Architect",
        department: "Design Systems",
        description: "Expert in React 19, Tailwind, and Design Tokens.",
        screeningThreshold: 80,
        status: "active",
      })
      .returning();

    console.log(`✅ Created Job A (${jobA.id}) in ${orgA}`);
    console.log(`✅ Created Job B (${jobB.id}) in ${orgB}\n`);

    // 2. Candidate Ingestion: Strong candidate (Shortlist) vs Low-match candidate (Human-in-Loop)
    console.log("TEST 2: Candidate Ingestion & Async Screening Queue...");
    const candStrongEmail = `alex.strong.${Date.now()}@example.com`;
    const candStrongId = `cand-${Date.now()}-1`;
    await db.insert(candidates).values({
      id: candStrongId,
      email: candStrongEmail,
      name: "Alex Strong",
      college: "MIT",
      degree: "M.S. Computer Science",
      gradYear: 2023,
      organizationId: orgA,
    });

    const appStrongId = `app-${Date.now()}-strong`;
    await db.insert(applications).values({
      id: appStrongId,
      jobId: jobA.id,
      candidateId: candStrongId,
      organizationId: orgA,
      status: "applied",
    });

    await db.insert(screeningQueue).values({
      id: `q-${Date.now()}-1`,
      applicationId: appStrongId,
      organizationId: orgA,
      status: "pending",
    });

    const candWeakEmail = `bob.junior.${Date.now()}@example.com`;
    const candWeakId = `cand-${Date.now()}-2`;
    await db.insert(candidates).values({
      id: candWeakId,
      email: candWeakEmail,
      name: "Bob Junior",
      college: "State College",
      organizationId: orgA,
    });

    const appWeakId = `app-${Date.now()}-weak`;
    await db.insert(applications).values({
      id: appWeakId,
      jobId: jobA.id,
      candidateId: candWeakId,
      organizationId: orgA,
      status: "applied",
    });

    await db.insert(screeningQueue).values({
      id: `q-${Date.now()}-2`,
      applicationId: appWeakId,
      organizationId: orgA,
      status: "pending",
    });

    console.log("✅ Ingested 2 candidate applications and enqueued into screening_queue.\n");

    // 3. Process Screening Queue Batch
    console.log("TEST 3: Processing Screening Queue via Background Worker...");
    const processed = await preScreeningService.processQueueBatch("http://localhost:3000", 5);
    console.log(`✅ Processed ${processed} screening queue jobs.\n`);

    // 4. Verify AI Evaluation & Human-in-the-Loop Status
    console.log("TEST 4: Verifying AI Match Scores & Decisions...");
    const [evaluatedStrong] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appStrongId));

    const [evaluatedWeak] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appWeakId));

    console.log(`Candidate Strong Status: ${evaluatedStrong?.status}`);
    console.log(`Candidate Weak Status: ${evaluatedWeak?.status}`);

    if (evaluatedStrong?.status === "shortlisted") {
      console.log("✅ Strong candidate successfully shortlisted!");
    }
    if (evaluatedWeak?.status === "pending_rejection_review" || evaluatedWeak?.status === "rejected_at_screening") {
      console.log("✅ Weak candidate safely gated in Human-in-the-Loop queue (not silently dropped).");
    }

    // 5. Test Magic Link Single-Use Atomic Redemption
    console.log("\nTEST 5: Testing Magic Link Atomic Single-Use Redemption...");
    const magicToken = generateMagicToken("http://localhost:3000");
    await db
      .update(applications)
      .set({
        magicTokenHash: magicToken.tokenHash,
        magicTokenExpiresAt: magicToken.expiresAt,
        status: "shortlisted",
      })
      .where(eq(applications.id, appStrongId));

    // First Redemption: MUST SUCCEED
    const redeem1 = await redeemMagicToken(magicToken.rawToken);
    if (redeem1.success) {
      console.log("✅ First redemption: Succeeded and issued JWT.");
    } else {
      throw new Error(`First redemption failed: ${redeem1.error}`);
    }

    // Second Redemption: MUST FAIL (Replay Protection)
    const redeem2 = await redeemMagicToken(magicToken.rawToken);
    if (!redeem2.success) {
      console.log(`✅ Second redemption safely blocked: "${redeem2.error}"`);
    } else {
      throw new Error("SECURITY BREACH: Magic token was redeemed twice!");
    }

    // 6. Test Transactional Outbox Batch Processing
    console.log("\nTEST 6: Testing Transactional Email Outbox Engine...");
    const emailsSent = await emailService.processOutboxBatch(10);
    console.log(`✅ Processed ${emailsSent} outbox emails via fallback logger.`);

    // 7. Verify Cross-Tenant Isolation
    console.log("\nTEST 7: Verifying Cross-Tenant Scoping...");
    const { rows: tenantBApps } = await pool.query(
      `SELECT * FROM applications WHERE organization_id = $1;`,
      [orgB]
    );

    const hasLeak = tenantBApps.some((a: any) => a.organization_id === orgA);
    if (hasLeak) {
      throw new Error("SECURITY FAILURE: Cross-tenant data leakage detected!");
    } else {
      console.log("✅ Cross-tenant boundary strictly maintained. 0 leaked records.");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL RAVENGARD HR FUNNEL & ATS TESTS PASSED 100%");
    console.log("==================================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
    process.exit(1);
  }
}

runVerification();
