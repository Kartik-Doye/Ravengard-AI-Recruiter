import { db } from "./index";
import {
  candidates,
  sessions,
  interviewReports,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  adminUsers
} from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ensureDefaultRubric } from "../services/rubricService";

export async function seedCompletedCandidatesAndAdmin() {
  try {
    // 0. Ensure Default Rubrics (v1.0 and v2.4-enterprise-strict)
    await ensureDefaultRubric("v1.0");
    await ensureDefaultRubric("v2.4-enterprise-strict");

    // 1. Ensure Root Admin exists
    const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.email, 'admin@ravengard.com')).limit(1);
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await db.insert(adminUsers).values({
        id: 'admin-root',
        email: 'admin@ravengard.com',
        name: 'Ravengard Lead Auditor',
        role: 'admin',
        passwordHash: hashed
      });
      console.log('Seeded root admin: admin@ravengard.com / admin123');
    }

    // 2. Check if completed candidates exist
    const existingCandidates = await db.select().from(candidates).limit(3);
    if (existingCandidates.length >= 3) {
      return;
    }

    console.log('Seeding completed candidate audit records...');

    // Candidate 1: Elena Rostova (Proceed)
    const c1Id = crypto.randomUUID();
    await db.insert(candidates).values({
      id: c1Id,
      name: "Elena Rostova",
      email: "elena.rostova@enterprise.tech",
      mobile: "+1-415-555-0192",
      college: "Stanford University",
      degree: "M.S. Distributed Systems",
      gradYear: 2020,
      preferredLanguage: "TypeScript / Go",
      emailVerified: true
    });

    const s1Id = crypto.randomUUID();
    const s1Date = new Date(Date.now() - 1000 * 60 * 60 * 22); // 22 hours ago
    await db.insert(sessions).values({
      id: s1Id,
      candidateId: c1Id,
      currentStage: "report_generation",
      status: "completed",
      locked: true,
      flagged: false,
      createdAt: s1Date,
      updatedAt: s1Date,
      consentAcceptedAt: s1Date,
      deviceCheckStatus: "passed",
      speakerTestPassed: true,
      browserSupported: true
    });

    const iv1Id = crypto.randomUUID();
    await db.insert(interviewSessions).values({
      id: iv1Id,
      sessionId: s1Id,
      roundType: "technical_architecture",
      status: "completed",
      startedAt: s1Date,
      endedAt: new Date(s1Date.getTime() + 1000 * 60 * 35)
    });

    const q1_1 = crypto.randomUUID();
    await db.insert(interviewQuestions).values({
      id: q1_1,
      interviewSessionId: iv1Id,
      questionIndex: 1,
      questionText: "How do you ensure data consistency and prevent split-brain states across a multi-region transactional database cluster?"
    });
    await db.insert(interviewResponses).values({
      id: crypto.randomUUID(),
      questionId: q1_1,
      responseText: "We enforce quorum consensus using the Raft algorithm for metadata leasing and Cockroach/Spanner-style Two-Phase Commit with TrueTime or hybrid logical clocks. Split-brain is prevented by requiring a strict majority (N/2 + 1) of voting replicas before acknowledging writes to the WAL.",
      submittedAt: new Date(s1Date.getTime() + 1000 * 60 * 5)
    });

    const q1_2 = crypto.randomUUID();
    await db.insert(interviewQuestions).values({
      id: q1_2,
      interviewSessionId: iv1Id,
      questionIndex: 2,
      questionText: "Explain how you handle backpressure in a reactive streaming pipeline when downstream subscribers cannot keep up with high-frequency ingest."
    });
    await db.insert(interviewResponses).values({
      id: crypto.randomUUID(),
      questionId: q1_2,
      responseText: "I utilize dynamic reactive pull streams with bounded ring buffers. When downstream lag breaches our SLO threshold, backpressure signals propagate upstream to throttle ingestion rates at the gateway level, spilling transient overflow into a durable partitioned Kafka topic.",
      submittedAt: new Date(s1Date.getTime() + 1000 * 60 * 12)
    });

    await db.insert(interviewReports).values({
      id: crypto.randomUUID(),
      sessionId: s1Id,
      overallScore: 94,
      recommendation: "Proceed",
      rubricVersion: "v2.4-enterprise-strict",
      breakdown: {
        technicalArchitecturalProwess: 96,
        distributedSystemsIntegrity: 95,
        systemicFaultTolerance: 92,
        communicationPrecision: 93
      },
      strengths: [
        "Flawless explanation of Raft quorum replication and two-phase commit edge cases",
        "Demonstrated deep production intuition for reactive backpressure and Kafka partition durability",
        "Clear, structured technical delivery with zero hesitation on latency trade-offs"
      ],
      weaknesses: [
        "Could expand on automated canary rollback triggers during live schema migrations"
      ],
      evidence: [
        {
          competency: "Distributed Systems Architecture",
          score: 96,
          notes: "Step 1/3: Candidate established mathematical proof of quorum consensus (N/2+1) and articulated hybrid logical clock mechanics. Fully satisfies Level 5 Principal Engineer rubric criteria."
        },
        {
          competency: "Concurrency & High-Throughput Ingestion",
          score: 94,
          notes: "Step 2/3: In-depth breakdown of bounded ring buffers and backpressure propagation without data loss. Rubric weighting: 35%."
        },
        {
          competency: "Architectural Pragmatism & Communication",
          score: 92,
          notes: "Step 3/3: Succinct answers, structured trade-off analysis, zero filler words."
        }
      ],
      generatedAt: s1Date
    });

    // Candidate 2: Marcus Chen (Review)
    const c2Id = crypto.randomUUID();
    await db.insert(candidates).values({
      id: c2Id,
      name: "Marcus Chen",
      email: "marcus.chen@innovate.io",
      mobile: "+1-650-555-0811",
      college: "University of Waterloo",
      degree: "B.S. Software Engineering",
      gradYear: 2021,
      preferredLanguage: "TypeScript / Node.js",
      emailVerified: true
    });

    const s2Id = crypto.randomUUID();
    const s2Date = new Date(Date.now() - 1000 * 60 * 60 * 46); // 46 hours ago
    await db.insert(sessions).values({
      id: s2Id,
      candidateId: c2Id,
      currentStage: "report_generation",
      status: "completed",
      locked: true,
      flagged: true,
      flagReason: "Minor integrity flag: 1 tab switch detected during architectural question",
      createdAt: s2Date,
      updatedAt: s2Date,
      consentAcceptedAt: s2Date,
      deviceCheckStatus: "passed",
      speakerTestPassed: true,
      browserSupported: true
    });

    const iv2Id = crypto.randomUUID();
    await db.insert(interviewSessions).values({
      id: iv2Id,
      sessionId: s2Id,
      roundType: "fullstack_architecture",
      status: "completed",
      startedAt: s2Date,
      endedAt: new Date(s2Date.getTime() + 1000 * 60 * 28)
    });

    const q2_1 = crypto.randomUUID();
    await db.insert(interviewQuestions).values({
      id: q2_1,
      interviewSessionId: iv2Id,
      questionIndex: 1,
      questionText: "How would you optimize a slow PostgreSQL query involving multi-million row joins across tenants?"
    });
    await db.insert(interviewResponses).values({
      id: crypto.randomUUID(),
      questionId: q2_1,
      responseText: "I would analyze EXPLAIN ANALYZE for sequential scans, create composite B-tree indexes including the tenant ID prefix, and partition tables by tenant if skew is high. Also consider denormalization or materialized views.",
      submittedAt: new Date(s2Date.getTime() + 1000 * 60 * 6)
    });

    await db.insert(interviewReports).values({
      id: crypto.randomUUID(),
      sessionId: s2Id,
      overallScore: 76,
      recommendation: "Review",
      rubricVersion: "v2.4-enterprise-strict",
      breakdown: {
        databaseOptimization: 78,
        apiDesign: 75,
        tradeOffAnalysis: 74,
        communicationPrecision: 79
      },
      strengths: [
        "Solid command of PostgreSQL EXPLAIN ANALYZE interpretation and indexing strategies",
        "Clear knowledge of tenant isolation and table partitioning fundamentals"
      ],
      weaknesses: [
        "Could provide deeper consideration for distributed query caching"
      ],
      evidence: [
        {
          competency: "Database Performance & Indexing",
          score: 78,
          notes: "Step 1/2: Accurate description of composite B-tree indexes and tenant partitioning. 78/100 criteria met."
        },
        {
          competency: "Technical Trade-Offs & Scalability",
          score: 74,
          notes: "Step 2/2: Candidate discussed trade-offs between read replicas and tenant partitioning."
        }
      ],
      generatedAt: s2Date
    });

    // Candidate 3: David Okafor (Candidate Notes Ready)
    const c3Id = crypto.randomUUID();
    await db.insert(candidates).values({
      id: c3Id,
      name: "David Okafor",
      email: "david.okafor@techpulse.org",
      mobile: "+1-206-555-0144",
      college: "Georgia Institute of Technology",
      degree: "B.S. Computer Science",
      gradYear: 2023,
      preferredLanguage: "Python",
      emailVerified: true
    });

    const s3Id = crypto.randomUUID();
    const s3Date = new Date(Date.now() - 1000 * 60 * 60 * 72); // 72 hours ago
    await db.insert(sessions).values({
      id: s3Id,
      candidateId: c3Id,
      currentStage: "report_generation",
      status: "completed",
      locked: true,
      flagged: false,
      createdAt: s3Date,
      updatedAt: s3Date,
      consentAcceptedAt: s3Date,
      deviceCheckStatus: "passed",
      speakerTestPassed: true,
      browserSupported: true
    });

    const iv3Id = crypto.randomUUID();
    await db.insert(interviewSessions).values({
      id: iv3Id,
      sessionId: s3Id,
      roundType: "systems_core",
      status: "completed",
      startedAt: s3Date,
      endedAt: new Date(s3Date.getTime() + 1000 * 60 * 20)
    });

    const q3_1 = crypto.randomUUID();
    await db.insert(interviewQuestions).values({
      id: q3_1,
      interviewSessionId: iv3Id,
      questionIndex: 1,
      questionText: "How do you mitigate race conditions when two concurrent workers attempt to deduct funds from the same account balance?"
    });
    await db.insert(interviewResponses).values({
      id: crypto.randomUUID(),
      questionId: q3_1,
      responseText: "I would check the balance in code with an if statement and then update the table if it is greater than zero.",
      submittedAt: new Date(s3Date.getTime() + 1000 * 60 * 4)
    });

    await db.insert(interviewReports).values({
      id: crypto.randomUUID(),
      sessionId: s3Id,
      overallScore: 52,
      recommendation: "Candidate Notes Ready",
      rubricVersion: "v2.4-enterprise-strict",
      breakdown: {
        concurrencyControl: 45,
        transactionalIntegrity: 48,
        distributedSafety: 55,
        communicationPrecision: 60
      },
      strengths: [
        "Friendly delivery and clear audio communication throughout the session"
      ],
      weaknesses: [
        "Needs panel follow-up on basic concurrency protection (unaware of SELECT FOR UPDATE, pessimistic/optimistic locking, or atomic balance checks)",
        "Application-level balance checking introduces severe check-then-act race conditions"
      ],
      evidence: [
        {
          competency: "Concurrency & Transactional ACID Safety",
          score: 45,
          notes: "Step 1/2: Candidate proposed client-side balance validation without database row-level locking or atomic conditions."
        },
        {
          competency: "Architectural Robustness",
          score: 55,
          notes: "Step 2/2: Candidate was unable to explain optimistic locking or idempotency keys when prompted for follow-up."
        }
      ],
      generatedAt: s3Date
    });

    console.log('Successfully seeded completed candidates for Recruiter Copilot digest.');
  } catch (err) {
    console.error('Error seeding completed candidates:', err);
  }
}
