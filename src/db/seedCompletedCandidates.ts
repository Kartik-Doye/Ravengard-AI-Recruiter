import { db, createPool } from "./index";
import {
  candidates,
  sessions,
  interviewReports,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  adminUsers,
  organizations,
  jobs,
  applications
} from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ensureDefaultRubric } from "../services/rubricService";

export async function seedCompletedCandidatesAndAdmin() {
  try {
    // Ensure organizations table and columns exist before any Drizzle queries
    const pool = createPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            billing_tier TEXT NOT NULL DEFAULT 'enterprise',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          );
          ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_tier TEXT DEFAULT 'enterprise';
          ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        `);
      } catch (tableErr) {
        console.warn("Organizations table ensure notice:", tableErr);
      }
    }

    // 0. Ensure Default Rubrics (v1.0 and v2.4-enterprise-strict)
    await ensureDefaultRubric("v1.0");
    await ensureDefaultRubric("v2.4-enterprise-strict");

    // Ensure schema columns exist for adminUsers and jobs, plus enterprise tables
    if (pool) {
      try {
        await pool.query(`
          ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS setup_token TEXT;
          ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
          ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
          ALTER TABLE candidates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

          CREATE TABLE IF NOT EXISTS sso_configurations (
            id TEXT PRIMARY KEY,
            provider_type TEXT NOT NULL DEFAULT 'SAML_2_0',
            entity_id TEXT NOT NULL DEFAULT 'https://ravengard.ai/saml/metadata',
            sign_on_url TEXT NOT NULL DEFAULT 'https://login.microsoftonline.com/common/saml2',
            x509_certificate TEXT,
            issuer_url TEXT,
            client_id TEXT,
            client_secret TEXT,
            enabled BOOLEAN NOT NULL DEFAULT true,
            mfa_policy TEXT NOT NULL DEFAULT 'TOTP',
            allowed_domains JSONB NOT NULL DEFAULT '["ravengard.com", "enterprise.corp"]'::jsonb,
            attribute_mapping JSONB NOT NULL DEFAULT '{"email": "email", "name": "displayName", "role": "groups"}'::jsonb,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS scim_tokens (
            id TEXT PRIMARY KEY,
            token_hash TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT 'Okta SCIM 2.0 Connector',
            permissions JSONB NOT NULL DEFAULT '["users:read", "users:write", "groups:read"]'::jsonb,
            last_used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS directory_sync_logs (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL DEFAULT 'Okta SCIM',
            action TEXT NOT NULL DEFAULT 'SYNC_BATCH',
            email TEXT,
            status TEXT NOT NULL DEFAULT 'SUCCESS',
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS security_threat_logs (
            id TEXT PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
            threat_type TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'MEDIUM',
            ip_address TEXT NOT NULL,
            country_code TEXT NOT NULL DEFAULT 'US',
            city TEXT NOT NULL DEFAULT 'Unknown',
            latitude NUMERIC(9, 6) NOT NULL DEFAULT 37.7749,
            longitude NUMERIC(9, 6) NOT NULL DEFAULT -122.4194,
            raw_payload_snippet TEXT NOT NULL,
            action_taken TEXT NOT NULL DEFAULT 'BLOCKED',
            metadata JSONB
          );

          CREATE TABLE IF NOT EXISTS tenant_branding (
            id TEXT PRIMARY KEY DEFAULT 'default_tenant',
            custom_domain TEXT DEFAULT 'careers.ravengard.ai',
            domain_verified BOOLEAN NOT NULL DEFAULT false,
            dns_status TEXT NOT NULL DEFAULT 'PENDING',
            dns_records JSONB NOT NULL DEFAULT '{"cname": {"host": "careers", "value": "cname.ravengard.ai", "status": "verified"}, "txt": {"host": "_ravengard-verify", "value": "rvg_verify_8f7b2c9a1d", "status": "pending"}}'::jsonb,
            brand_name TEXT NOT NULL DEFAULT 'Ravengard Talent',
            logo_url TEXT DEFAULT '',
            favicon_url TEXT DEFAULT '',
            primary_color_hex TEXT NOT NULL DEFAULT '#4F46E5',
            accent_color_hex TEXT NOT NULL DEFAULT '#06B6D4',
            candidate_agreement_html TEXT DEFAULT 'I hereby consent to participate in this AI-assisted structured interview evaluation. All answers are recorded, evaluated against standardized role competencies, and maintained securely under enterprise data privacy regulations.',
            smtp_host TEXT DEFAULT 'smtp.sendgrid.net',
            smtp_port INTEGER NOT NULL DEFAULT 587,
            smtp_user TEXT DEFAULT 'apikey',
            smtp_sender_email TEXT DEFAULT 'recruiting@ravengard.ai',
            smtp_sender_name TEXT DEFAULT 'Ravengard Talent Acquisition',
            smtp_secure BOOLEAN NOT NULL DEFAULT true,
            smtp_verified BOOLEAN NOT NULL DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );

          INSERT INTO tenant_branding (id, custom_domain, brand_name, primary_color_hex, accent_color_hex, domain_verified, dns_status)
          VALUES ('default_tenant', 'careers.ravengard.ai', 'Ravengard Talent', '#4F46E5', '#06B6D4', false, 'PENDING')
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO sso_configurations (id, provider_type, entity_id, sign_on_url, mfa_policy, enabled)
          VALUES ('default_sso', 'SAML_2_0', 'https://ravengard.ai/saml/metadata', 'https://login.microsoftonline.com/common/saml2', 'TOTP', true)
          ON CONFLICT (id) DO NOTHING;
        `);
      } catch (colErr) {
        console.warn("Schema extension notice:", colErr);
      }
    }

    // 1. Ensure Primary Super Admin (madhunand@gmail.com) and Persona Accounts exist
    const { AdminSetupService } = await import("../services/adminSetupService");
    const superAdminEmail = 'madhunand@gmail.com';
    const hasExplicitPass = Boolean(process.env.SUPER_ADMIN_INIT_PASSWORD);
    const autoSetupToken = AdminSetupService.generateSetupToken(superAdminEmail);
    const initPassword = process.env.SUPER_ADMIN_INIT_PASSWORD || `SuperAdmin#${autoSetupToken.slice(0, 8)}!`;
    const superHash = await bcrypt.hash(initPassword, 10);

    const [existingSuperAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.email, superAdminEmail)).limit(1);
    if (!existingSuperAdmin) {
      await db.insert(adminUsers).values({
        id: 'admin-super-primary',
        email: superAdminEmail,
        name: 'Madhunand (Super Admin)',
        role: 'super_admin',
        department: 'Executive Oversight',
        passwordHash: superHash,
      });
      console.log(`\n========================================================================`);
      console.log(`[SUPER_ADMIN_BOOTSTRAP] Provisioned Primary Super Admin: ${superAdminEmail}`);
      console.log(`Role: super_admin`);
      if (!hasExplicitPass) {
        console.log(`Auto-Generated Setup Token: ${autoSetupToken}`);
        console.log(`Instant Setup URL: http://localhost:3000/admin/setup?token=${autoSetupToken}`);
      }
      console.log(`========================================================================\n`);
    }

    // 2. Ensure Default Organization exists
    const [existingOrg] = await db.select().from(organizations).where(eq(organizations.id, 'org-ravengard-default')).limit(1);
    if (!existingOrg) {
      await db.insert(organizations).values({
        id: 'org-ravengard-default',
        name: 'Ravengard Systems Inc.'
      });
    }

    const defaultJobsList = [
      {
        id: 'job-dist-sys-01',
        organizationId: 'org-ravengard-default',
        title: 'Senior Distributed Systems Engineer',
        department: 'Infrastructure & Platform',
        description: 'Design and implement fault-tolerant consensus mechanisms, low-latency replication engines, and highly available microservices.',
        requirementsJson: ['Distributed consensus (Raft/Paxos)', 'High-throughput stream processing', 'Fault-tolerant state machines'],
        screeningThreshold: 75,
        status: 'active'
      },
      {
        id: 'job-staff-backend-02',
        organizationId: 'org-ravengard-default',
        title: 'Staff Backend Architect',
        department: 'Core Services',
        description: 'Own technical architecture for enterprise APIs, resilient database sharding, and real-time candidate processing pipelines.',
        requirementsJson: ['PostgreSQL & distributed data stores', 'Enterprise security & IAM', 'High concurrency async processing'],
        screeningThreshold: 70,
        status: 'active'
      },
      {
        id: 'job-fullstack-sys-03',
        organizationId: 'org-ravengard-default',
        title: 'Full Stack Systems Engineer',
        department: 'Product Engineering',
        description: 'Develop performant client-side state engines and streaming evaluation interfaces for real-time candidate experiences.',
        requirementsJson: ['React & Vite architecture', 'Server-Sent Events / streaming pipelines', 'Accessible UI systems'],
        screeningThreshold: 65,
        status: 'active'
      }
    ];

    // 3. Seed Demo Personas & Default Jobs only if explicitly requested
    if (process.env.SEED_DEMO_DATA === "true") {
      const personas = [
        { id: 'admin-root', email: 'admin@ravengard.com', name: 'Ravengard Lead Auditor', role: 'admin', dept: 'Compliance & Audit' },
        { id: 'admin-recruiter', email: 'recruiter@ravengard.com', name: 'Sarah Jenkins (Recruiter)', role: 'recruiter', dept: 'Talent Acquisition' },
        { id: 'admin-hm-eng', email: 'hiringmanager@ravengard.com', name: 'Alex Rivera (Engineering HM)', role: 'hiring_manager', dept: 'Engineering' },
        { id: 'admin-tech-int', email: 'interviewer@ravengard.com', name: 'Devon Vance (Tech Interviewer)', role: 'technical_interviewer', dept: 'Engineering' },
        { id: 'admin-finance', email: 'finance@ravengard.com', name: 'Morgan Taylor (Finance Approver)', role: 'finance_approver', dept: 'Finance' },
      ];

      for (const p of personas) {
        const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, p.email)).limit(1);
        if (!existing) {
          const adminPassword = process.env.ADMIN_PASSWORD_HASH;
          const hashed = adminPassword 
            ? (adminPassword.startsWith("$2b$") ? adminPassword : await bcrypt.hash(adminPassword, 10))
            : await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

          await db.insert(adminUsers).values({
            id: p.id,
            email: p.email,
            name: p.name,
            role: p.role as any,
            department: p.dept,
            passwordHash: hashed
          });
        }
      }

      for (const j of defaultJobsList) {
        const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, j.id)).limit(1);
        if (!existingJob) {
          await db.insert(jobs).values(j);
        }
      }
    }

    // 4. Production Clean-Slate Guard: Strictly disable demo candidates/transcripts unless explicitly enabled
    const disableDemoSeeds = 
      process.env.DISABLE_DEMO_SEEDS === 'true' || 
      process.env.SEED_DEMO_DATA === 'false' || 
      process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_DEMO_SEEDS !== 'true';

    if (disableDemoSeeds) {
      console.log('[PROD_CLEAN_SLATE] Startup seed script: Demo candidates, test transcripts, and mock notifications are strictly DISABLED.');
      return;
    }

    // Check if completed candidates exist
    const existingCandidates = await db.select().from(candidates).limit(3);
    if (existingCandidates.length >= 3) {
      // Ensure application links exist for existing candidates
      const allExisting = await db.select().from(candidates);
      for (let i = 0; i < allExisting.length; i++) {
        const cand = allExisting[i];
        const assignedJobId = defaultJobsList[i % defaultJobsList.length].id;
        const [existingApp] = await db.select().from(applications).where(eq(applications.candidateId, cand.id)).limit(1);
        if (!existingApp) {
          await db.insert(applications).values({
            id: crypto.randomUUID(),
            jobId: assignedJobId,
            candidateId: cand.id,
            organizationId: 'org-ravengard-default',
            status: 'assessment_completed'
          });
        }
      }
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
