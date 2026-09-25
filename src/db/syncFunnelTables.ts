import { createPool, createAdminPool } from "./index";
import crypto from "crypto";

export async function syncFunnelTablesAndSeed() {
  const adminPool = createAdminPool();
  let client;
  try {
    client = await adminPool.connect();
  } catch {
    const fallbackPool = createPool();
    if (!fallbackPool) return;
    client = await fallbackPool.connect();
  }

  try {
    // 1. Ensure table columns exist
    const initialAlters = [
      `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, billing_tier TEXT NOT NULL DEFAULT 'enterprise', is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_tier TEXT DEFAULT 'enterprise'`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS password_hash TEXT`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS assessment_expires_at TIMESTAMP`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMP`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS mcq_score INTEGER`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_score INTEGER`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_details_json JSONB`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS magic_token_hash TEXT`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS magic_token_expires_at TIMESTAMP`,
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS magic_token_used_at TIMESTAMP`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Remote'`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-time'`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range TEXT DEFAULT '$120k - $160k'`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS token_budget INTEGER DEFAULT 50000`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approval_feedback TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approval_history JSONB DEFAULT '[]'::jsonb`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS finance_approved_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS finance_approved_at TIMESTAMP`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tech_approved_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tech_approved_at TIMESTAMP`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rubric_id TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
      `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering'`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS title TEXT`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS department TEXT`,
      `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
      `CREATE TABLE IF NOT EXISTS hr_notifications (id TEXT PRIMARY KEY, organization_id TEXT, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, application_id TEXT, candidate_id TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, user_id TEXT, user_email TEXT NOT NULL, user_name TEXT, user_role TEXT NOT NULL, user_department TEXT, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, details JSONB NOT NULL, ip_address TEXT, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS shadow_calibrations (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, job_id TEXT NOT NULL, candidate_id TEXT NOT NULL, candidate_name TEXT NOT NULL, human_score INTEGER NOT NULL, human_recommendation TEXT NOT NULL, ai_score INTEGER NOT NULL, ai_recommendation TEXT NOT NULL, interviewer_id TEXT, interviewer_name TEXT NOT NULL, variance INTEGER NOT NULL, notes TEXT, calibrated_weights_snapshot JSONB, created_at TIMESTAMP DEFAULT NOW())`,
      `CREATE TABLE IF NOT EXISTS eeo_audits (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, audit_period TEXT NOT NULL, total_assessed INTEGER NOT NULL, impact_ratio TEXT NOT NULL, passes_four_fifths_rule BOOLEAN NOT NULL DEFAULT true, cohort_metrics JSONB NOT NULL, certificate_hash TEXT NOT NULL, compliance_standard TEXT NOT NULL DEFAULT 'EEOC Title VII & EU AI Act Annex IV', generated_by TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`
    ];

    for (const sql of initialAlters) {
      try {
        await client.query(sql);
      } catch {
        // Safe fallback
      }
    }

    // 2. Create Rubric Dimensions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rubric_dimensions (
        id TEXT PRIMARY KEY,
        rubric_id TEXT REFERENCES rubrics(id) ON DELETE CASCADE,
        dimension_name TEXT NOT NULL,
        weight INTEGER NOT NULL DEFAULT 20,
        eval_instruction TEXT NOT NULL
      );
    `);

    // 3. Create MCQ Questions Bank table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mcq_questions (
        id TEXT PRIMARY KEY,
        skill_tag TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'medium',
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Create Assessment Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_sessions (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES applications(id),
        candidate_id TEXT REFERENCES candidates(id),
        type TEXT NOT NULL DEFAULT 'mcq_battery',
        started_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        score INTEGER,
        question_snapshot JSONB,
        answers_snapshot JSONB,
        radar_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Create AI Evaluations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_evaluations (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES applications(id),
        candidate_id TEXT REFERENCES candidates(id),
        overall_recommendation TEXT NOT NULL DEFAULT 'HIRE',
        overall_score INTEGER NOT NULL DEFAULT 85,
        duration_minutes INTEGER DEFAULT 12,
        executive_summary TEXT NOT NULL,
        strengths JSONB,
        weaknesses JSONB,
        rubric_breakdown JSONB,
        transcript JSONB,
        media_urls JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Create Candidate Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidate_tasks (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL REFERENCES candidates(id),
        application_id TEXT NOT NULL REFERENCES applications(id),
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        action_url TEXT,
        due_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    // 6b. Create Interview Schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interview_schedules (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'UTC',
        round_type TEXT NOT NULL DEFAULT 'ai_technical',
        status TEXT NOT NULL DEFAULT 'confirmed',
        notes TEXT,
        calendar_event_uid TEXT,
        meeting_link TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_interview_schedules_cand ON interview_schedules(candidate_id, status);
      CREATE INDEX IF NOT EXISTS idx_interview_schedules_time ON interview_schedules(scheduled_at);
    `);


    // Seed MCQ Questions if empty
    const checkQuestions = await client.query(`SELECT COUNT(*)::int as count FROM mcq_questions;`);
    if (checkQuestions.rows[0].count === 0) {
      console.log("[DB Seed] Seeding comprehensive MCQ question bank across Behavioral, Aptitude, Technical Aptitude...");

      const mcqs = [
        // --- Behavioral (Easy to Brutal) ---
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Conflict Resolution",
          category: "Behavioral",
          difficulty: "easy",
          questionText: "When two senior engineers on your team strongly disagree on database schema normalization vs denormalization, what is your first step?",
          options: JSON.stringify([
            "Escalate immediately to the VP of Engineering without team discussion",
            "Facilitate an architecture trade-off review based on query throughput, write amplification, and SLA requirements",
            "Choose whichever option has fewer lines of migration SQL",
            "Vote randomly to prevent project deadline delays"
          ]),
          correctOption: "Facilitate an architecture trade-off review based on query throughput, write amplification, and SLA requirements",
          explanation: "Objective technical trade-off analysis resolves architectural stalemates."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Ownership & Incident Response",
          category: "Behavioral",
          difficulty: "medium",
          questionText: "A production release triggers a Sev-1 latency spike affecting 30% of enterprise users. Your PR was part of the batch. How do you respond?",
          options: JSON.stringify([
            "Initiate instant rollback or feature-flag disable, announce incident channel status, and inspect telemetry traces",
            "Silently push hotfix commits directly to main branch without notifying team",
            "Wait for the QA team to reproduce the issue in staging environment",
            "Argue that the database cluster was under-provisioned"
          ]),
          correctOption: "Initiate instant rollback or feature-flag disable, announce incident channel status, and inspect telemetry traces",
          explanation: "Blameless rapid containment and transparent communication are standard enterprise incident practices."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "High-Pressure Delivery",
          category: "Behavioral",
          difficulty: "hard",
          questionText: "Product management demands cutting end-to-end telemetry and automated tests to hit a critical enterprise customer launch deadline in 48 hours. What is your recommendation?",
          options: JSON.stringify([
            "Unconditionally cut all tests and hope runtime errors are minimal",
            "Negotiate reducing scope to core golden paths while keeping non-negotiable data integrity checks and telemetry active",
            "Refuse to work until management completely reschedules the quarter",
            "Deploy mock endpoints that return hardcoded 200 OK responses"
          ]),
          correctOption: "Negotiate reducing scope to core golden paths while keeping non-negotiable data integrity checks and telemetry active",
          explanation: "Scope negotiation protects data integrity while honoring business urgency."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Cross-Functional Influence",
          category: "Behavioral",
          difficulty: "brutal",
          questionText: "A critical external API vendor unexpectedly deprecates v1 endpoints with only 7 days notice. Your dependent pipeline processes $2M daily. How do you lead the response?",
          options: JSON.stringify([
            "Assemble rapid migration strike-team, implement backward-compatible adapter layer with canary verification, and establish daily executive checkpoint",
            "File a support ticket asking the vendor to indefinitely postpone deprecation",
            "Shut down all dependent payment processing features until next sprint",
            "Blame procurement for choosing an unreliable vendor"
          ]),
          correctOption: "Assemble rapid migration strike-team, implement backward-compatible adapter layer with canary verification, and establish daily executive checkpoint",
          explanation: "Adapter architecture and canary validation mitigate high-risk vendor migrations."
        },

        // --- Aptitude & Analytical Reasoning (Easy to Brutal) ---
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Probability & Reliability",
          category: "Aptitude",
          difficulty: "easy",
          questionText: "If a cloud microservice has an independent 99.9% uptime SLA and downstream payment gateway has 99.0% SLA in series, what is the composite availability SLA?",
          options: JSON.stringify([
            "99.9%",
            "98.901%",
            "99.45%",
            "97.80%"
          ]),
          correctOption: "98.901%",
          explanation: "In series, composite uptime is 0.999 * 0.990 = 0.98901 (98.901%)."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Capacity & Throughput Math",
          category: "Aptitude",
          difficulty: "medium",
          questionText: "A system receives 12,000 requests per minute. Average payload size is 50 KB. What is the sustained network ingress bandwidth requirement?",
          options: JSON.stringify([
            "10 MB/s (80 Mbps)",
            "50 MB/s (400 Mbps)",
            "1 MB/s (8 Mbps)",
            "100 MB/s (800 Mbps)"
          ]),
          correctOption: "10 MB/s (80 Mbps)",
          explanation: "12,000 req/min = 200 req/sec. 200 * 50 KB = 10,000 KB/sec = 10 MB/sec = 80 Mbps."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Distributed Queuing Theory",
          category: "Aptitude",
          difficulty: "hard",
          questionText: "According to Little's Law (L = λW), if an async worker queue receives 500 tasks/second (λ) and average task processing time is 400ms (W), what is the average in-flight concurrency (L)?",
          options: JSON.stringify([
            "200 concurrent tasks",
            "125 concurrent tasks",
            "2,000 concurrent tasks",
            "50 concurrent tasks"
          ]),
          correctOption: "200 concurrent tasks",
          explanation: "L = 500 tasks/s * 0.4s = 200 concurrent tasks."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Algorithmic Complexity & Amortization",
          category: "Aptitude",
          difficulty: "brutal",
          questionText: "Consider a dynamic hash table that doubles capacity whenever load factor α > 0.75. For N insertions starting from capacity 1, what is the amortized cost per insertion?",
          options: JSON.stringify([
            "O(1) amortized",
            "O(log N) amortized",
            "O(N) amortized",
            "O(N log N) amortized"
          ]),
          correctOption: "O(1) amortized",
          explanation: "Geometric series table doubling yields O(1) amortized cost per item insertion."
        },

        // --- Technical Aptitude & Systems/Data Engineering (Easy to Brutal) ---
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "SQL & Query Optimization",
          category: "Technical Aptitude",
          difficulty: "easy",
          questionText: "In PostgreSQL, what index type is most suitable for range queries (e.g. WHERE created_at BETWEEN x AND y)?",
          options: JSON.stringify([
            "B-tree Index",
            "Hash Index",
            "GIN Index",
            "Bloom Filter"
          ]),
          correctOption: "B-tree Index",
          explanation: "B-tree index supports O(log N) equality and range scans."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Distributed Systems & Outbox Pattern",
          category: "Technical Aptitude",
          difficulty: "medium",
          questionText: "Why is the Transactional Outbox pattern preferred over dual-writing to PostgreSQL and Apache Kafka in the same HTTP request?",
          options: JSON.stringify([
            "Prevents partial failure where database write succeeds but message broker publish fails or vice-versa",
            "Reduces Kafka broker storage costs by 90%",
            "Eliminates the need for database indexes",
            "Makes HTTP requests synchronous"
          ]),
          correctOption: "Prevents partial failure where database write succeeds but message broker publish fails or vice-versa",
          explanation: "Atomicity inside local DB transaction guarantees at-least-once outbox dispatch."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Data Modeling & Window Functions",
          category: "Technical Aptitude",
          difficulty: "hard",
          questionText: "Which SQL window function allows ranking candidates partitioned by department without skipping rank numbers on ties?",
          options: JSON.stringify([
            "DENSE_RANK() OVER (PARTITION BY department ORDER BY score DESC)",
            "RANK() OVER (PARTITION BY department ORDER BY score DESC)",
            "ROW_NUMBER() OVER (PARTITION BY department ORDER BY score DESC)",
            "NTILE(4) OVER (PARTITION BY department ORDER BY score DESC)"
          ]),
          correctOption: "DENSE_RANK() OVER (PARTITION BY department ORDER BY score DESC)",
          explanation: "DENSE_RANK() generates consecutive integer ranks without gaps on duplicate scores."
        },
        {
          id: `mcq-${crypto.randomUUID()}`,
          skillTag: "Concurrency & Cache Stampede",
          category: "Technical Aptitude",
          difficulty: "brutal",
          questionText: "Under massive read concurrency when a hot cached key expires simultaneously for 50,000 clients, how do you prevent cache stampede on the primary database?",
          options: JSON.stringify([
            "Implement Mutex Distributed Locking with Probabilistic Early Expiration (XFetch)",
            "Increase database connection pool to 50,000",
            "Disable caching completely and query DB directly",
            "Return 503 Service Unavailable to 95% of traffic"
          ]),
          correctOption: "Implement Mutex Distributed Locking with Probabilistic Early Expiration (XFetch)",
          explanation: "Single-flight mutex locking + probabilistic refresh ensures only 1 worker computes cold cache while others read warm value."
        }
      ];

      for (const q of mcqs) {
        await client.query(`
          INSERT INTO mcq_questions (id, skill_tag, category, difficulty, question_text, options, correct_option, explanation)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `, [q.id, q.skillTag, q.category, q.difficulty, q.questionText, q.options, q.correctOption, q.explanation]);
      }
      console.log(`[DB Seed] Seeded ${mcqs.length} MCQ assessment questions.`);
    }

    // 7. Seed Default Requisitions and Rubrics if needed
    const checkRubrics = await client.query(`SELECT COUNT(*)::int as count FROM rubrics;`);
    const defaultRubricId = `rubric-data-analyst-01`;
    if (checkRubrics.rows[0].count === 0) {
      await client.query(`
        INSERT INTO rubrics (id, organization_id, title, department, job_id, version)
        VALUES ($1, 'org-ravengard', 'Senior Data Analyst Assessment', 'Analytics & Business Intelligence', 'job-data-analyst-01', 'v1.0')
        ON CONFLICT (id) DO NOTHING;
      `, [defaultRubricId]);

      const dimensions = [
        { name: "Technical Depth (SQL & Data Architecture)", weight: 40, desc: "Evaluates mastery of SQL window functions, relational modeling, indexing, and query execution plans." },
        { name: "Problem Solving Methodology", weight: 30, desc: "Assesses structured reasoning, STAR framework clarity, edge case analysis, and root cause debugging." },
        { name: "Communication & Team Alignment", weight: 30, desc: "Measures concise articulation, trade-off explanation, cross-functional empathy, and technical leadership." }
      ];

      for (const d of dimensions) {
        await client.query(`
          INSERT INTO rubric_dimensions (id, rubric_id, dimension_name, weight, eval_instruction)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING;
        `, [`dim-${crypto.randomUUID()}`, defaultRubricId, d.name, d.weight, d.desc]);

        await client.query(`
          INSERT INTO rubric_criteria (id, rubric_id, name, weight, description)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING;
        `, [`crit-${crypto.randomUUID()}`, defaultRubricId, d.name, d.weight, d.desc]);
      }
    } else {
      // Ensure existing rubrics have title and department populated
      await client.query(`
        UPDATE rubrics
        SET title = COALESCE(title, 'Senior Data Analyst Assessment'),
            department = COALESCE(department, 'Analytics & Business Intelligence'),
            organization_id = COALESCE(organization_id, 'org-ravengard')
        WHERE title IS NULL;
      `);
    }

    // 7b. Seed Granular Admin/HR accounts in admin_users with Department Sandboxing
    await client.query(`
      INSERT INTO admin_users (id, email, name, role, department, organization_id, password_hash)
      VALUES 
        ('admin-root', 'admin@ravengard.com', 'Ravengard Lead Auditor', 'super_admin', 'Executive Oversight', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('hr-root', 'hr@ravengard.com', 'Ravengard HR Director', 'hr_admin', 'People Operations', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('recruiter-01', 'recruiter@ravengard.com', 'Elena Rostova (Lead Recruiter)', 'recruiter', 'Talent Acquisition', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('hm-eng-01', 'hm.eng@ravengard.com', 'Marcus Chen (VP Engineering)', 'hiring_manager', 'Engineering', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('hm-prod-01', 'hm.product@ravengard.com', 'Sophia Patel (Head of Product)', 'hiring_manager', 'Product', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('tech-int-01', 'tech.interviewer@ravengard.com', 'Devon Vance (Principal Architect)', 'technical_interviewer', 'Engineering', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('fin-app-01', 'finance@ravengard.com', 'Claire Sinclair (VP Finance & Budget)', 'finance_approver', 'Finance', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G')
      ON CONFLICT (email) DO UPDATE SET 
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        organization_id = EXCLUDED.organization_id;
    `);

    // 8. Ensure Multi-Stage Jobs with Real Department Sandboxing and Approval Histories
    await client.query(`
      INSERT INTO jobs (id, organization_id, title, department, description, requirements_json, screening_threshold, status, token_budget, location, employment_type, salary_range, approval_history)
      VALUES 
        ('job-data-analyst-01', 'org-ravengard', 'Senior Data Analyst (High-Throughput)', 'Engineering', 'Lead analytical architecture, data modeling, SQL query optimization, and real-time dashboard analytics across high-throughput distributed pipelines.', '["Advanced SQL & Window Functions", "Data Modeling & Normalization", "Distributed Systems & Telemetry", "Business Metric Forecasting"]'::jsonb, 70, 'published', 65000, 'Remote / Hybrid', 'Full-time', '$135,000 - $170,000', '[{"stage":"draft","action":"SUBMIT_FOR_APPROVAL","user":"recruiter@ravengard.com","timestamp":"2026-09-20T10:00:00Z"},{"stage":"pending_finance","action":"FINANCE_APPROVED","user":"finance@ravengard.com","notes":"Token budget 65,000 approved within Q3 envelope","timestamp":"2026-09-21T14:30:00Z"},{"stage":"pending_tech_lead","action":"TECH_LEAD_APPROVED","user":"hm.eng@ravengard.com","notes":"Rubric weights verified against Level 5 engineering competency matrix","timestamp":"2026-09-22T09:15:00Z"}]'::jsonb),
        ('job-backend-eng-01', 'org-ravengard', 'Staff Backend Systems Engineer', 'Engineering', 'Architect high-throughput transactional outboxes, real-time streaming engines, and fault-tolerant microservices using TypeScript, Node.js, and PostgreSQL.', '["Node.js & TypeScript", "PostgreSQL & Drizzle ORM", "Distributed Systems", "Server-Sent Events & Realtime Pipelines"]'::jsonb, 75, 'published', 80000, 'San Francisco, CA / Remote', 'Full-time', '$180,000 - $225,000', '[{"stage":"draft","action":"SUBMIT_FOR_APPROVAL","user":"recruiter@ravengard.com","timestamp":"2026-09-18T08:00:00Z"},{"stage":"pending_finance","action":"FINANCE_APPROVED","user":"finance@ravengard.com","notes":"Approved $180k-$225k band with 80k token allocation","timestamp":"2026-09-18T16:00:00Z"},{"stage":"pending_tech_lead","action":"TECH_LEAD_APPROVED","user":"hm.eng@ravengard.com","notes":"STAR rubric benchmarks validated","timestamp":"2026-09-19T11:00:00Z"}]'::jsonb),
        ('job-frontend-lead-01', 'org-ravengard', 'Lead Frontend Architect', 'Engineering', 'Design ultra-responsive, accessible candidate evaluation workflows, voice-orb visualizers, and real-time HR pipeline dashboards with Tailwind CSS and React.', '["React 19 & TypeScript", "Tailwind CSS & Design Systems", "Web Speech & Audio Visualizers", "Performance Optimization"]'::jsonb, 70, 'pending_tech_lead', 50000, 'New York, NY / Remote', 'Full-time', '$160,000 - $200,000', '[{"stage":"draft","action":"SUBMIT_FOR_APPROVAL","user":"recruiter@ravengard.com","timestamp":"2026-09-24T09:00:00Z"},{"stage":"pending_finance","action":"FINANCE_APPROVED","user":"finance@ravengard.com","notes":"Token budget 50,000 confirmed","timestamp":"2026-09-24T15:30:00Z"}]'::jsonb),
        ('job-product-lead-01', 'org-ravengard', 'Principal AI Product Manager', 'Product', 'Define the multi-modal product roadmap for voice assessment agents, candidate evaluation rubrics, and enterprise ATS compliance workflows.', '["Enterprise SaaS Strategy", "AI/ML Product Lifecycle", "B2B Compliance Frameworks", "Customer Discovery"]'::jsonb, 75, 'pending_finance', 45000, 'Seattle, WA / Remote', 'Full-time', '$175,000 - $210,000', '[{"stage":"draft","action":"SUBMIT_FOR_APPROVAL","user":"recruiter@ravengard.com","timestamp":"2026-09-25T07:30:00Z"}]'::jsonb),
        ('job-security-eng-01', 'org-ravengard', 'Lead Security & Anti-Cheat Researcher', 'Engineering', 'Engineer synthetic telemetry detectors, keystroke interval analyzers, and secondary-device proxy classifiers for live interview environments.', '["Keystroke Biometrics", "Audio Cadence & Prosody Analysis", "Network Forensics", "Secondary Device Detection"]'::jsonb, 80, 'draft', 60000, 'Remote', 'Full-time', '$190,000 - $230,000', '[]'::jsonb)
      ON CONFLICT (id) DO UPDATE SET 
        token_budget = EXCLUDED.token_budget,
        approval_history = EXCLUDED.approval_history;
    `);

    // 9. Seed Initial Immutable Audit Logs for Enterprise Compliance Defensibility
    await client.query(`
      INSERT INTO audit_logs (id, organization_id, user_id, user_email, user_name, user_role, user_department, action, resource_type, resource_id, details, ip_address)
      VALUES 
        ('audit-01', 'org-ravengard', 'hm-eng-01', 'hm.eng@ravengard.com', 'Marcus Chen', 'hiring_manager', 'Engineering', 'RUBRIC_UPDATE', 'rubric', 'rubric-data-analyst-01', '{"field":"Technical Depth Weight","before":35,"after":40,"justification":"Elevated SQL index optimization weight to meet Q3 distributed systems standard"}'::jsonb, '192.168.1.104'),
        ('audit-02', 'org-ravengard', 'fin-app-01', 'finance@ravengard.com', 'Claire Sinclair', 'finance_approver', 'Finance', 'JOB_APPROVAL_TRANSITION', 'job', 'job-data-analyst-01', '{"fromState":"pending_finance","toState":"pending_tech_lead","tokenBudget":65000,"notes":"Approved within talent acquisition infrastructure envelope"}'::jsonb, '10.0.4.12'),
        ('audit-03', 'org-ravengard', 'admin-root', 'admin@ravengard.com', 'Ravengard Lead Auditor', 'super_admin', 'Executive Oversight', 'EEOC_BIAS_AUDIT_GENERATED', 'eeo_audit', 'eeo-2026-q3', '{"standard":"EEOC Title VII & EU AI Act Annex IV","cohortImpactRatio":"0.94","status":"PASSED_FOUR_FIFTHS_RULE"}'::jsonb, '172.16.0.1')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 10. Seed Shadow Mode Calibration Benchmarks (Karat Killer Engine)
    await client.query(`
      INSERT INTO shadow_calibrations (id, organization_id, job_id, candidate_id, candidate_name, human_score, human_recommendation, ai_score, ai_recommendation, interviewer_id, interviewer_name, variance, notes, calibrated_weights_snapshot)
      VALUES
        ('calib-01', 'org-ravengard', 'job-backend-eng-01', 'cand-001', 'Arjun Mehta', 88, 'STRONG_HIRE', 86, 'STRONG_HIRE', 'hm-eng-01', 'Marcus Chen (VP Eng)', 2, 'Candidate displayed deep mastery of Raft log compaction and atomic write semantics. Human and AI fully aligned.', '{"distributed_systems":40,"code_efficiency":35,"clarity":25}'::jsonb),
        ('calib-02', 'org-ravengard', 'job-backend-eng-01', 'cand-002', 'Elena Rostova', 74, 'HIRE', 76, 'HIRE', 'tech-int-01', 'Devon Vance (Principal)', 2, 'Solid query indexing strategy; slight hesitation on lock-free queue concurrency.', '{"distributed_systems":40,"code_efficiency":35,"clarity":25}'::jsonb),
        ('calib-03', 'org-ravengard', 'job-backend-eng-01', 'cand-003', 'Kavita Iyer', 92, 'STRONG_HIRE', 90, 'STRONG_HIRE', 'hm-eng-01', 'Marcus Chen (VP Eng)', 2, 'Flawless distributed transaction boundary handling under network partition simulation.', '{"distributed_systems":40,"code_efficiency":35,"clarity":25}'::jsonb),
        ('calib-04', 'org-ravengard', 'job-data-analyst-01', 'cand-004', 'Dmitri Volkov', 58, 'NO_HIRE', 55, 'NO_HIRE', 'tech-int-01', 'Devon Vance (Principal)', 3, 'Failed to identify quadratic Cartesian product in SQL join plan.', '{"sql_depth":45,"modeling":30,"clarity":25}'::jsonb),
        ('calib-05', 'org-ravengard', 'job-data-analyst-01', 'cand-005', 'Sarah Jenkins', 82, 'HIRE', 84, 'HIRE', 'hm-eng-01', 'Marcus Chen (VP Eng)', 2, 'Demonstrated excellent window function partitioning and pipeline metric forecasting.', '{"sql_depth":45,"modeling":30,"clarity":25}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 11. Seed EU AI Act & EEOC Bias Immunity Certificate
    await client.query(`
      INSERT INTO eeo_audits (id, organization_id, audit_period, total_assessed, impact_ratio, passes_four_fifths_rule, cohort_metrics, certificate_hash, compliance_standard, generated_by)
      VALUES (
        'eeo-2026-q3',
        'org-ravengard',
        'Q3 2026 (Rolling 90-Day Statistical Sample)',
        142,
        '0.94',
        true,
        '{"selectionRateProtected":0.46,"selectionRateBenchmark":0.49,"disparateImpactRatio":0.938,"pValue":0.78,"standardDeviation":0.42,"verbatimEvidenceRatio":1.0,"demographicProxyExclusion":true,"cohorts":[{"name":"Female Candidates","assessed":68,"selected":32,"rate":0.471,"ratioVsBenchmark":0.96},{"name":"Male Candidates","assessed":74,"selected":36,"rate":0.486,"ratioVsBenchmark":1.0},{"name":"Underrepresented Minorities","assessed":41,"selected":19,"rate":0.463,"ratioVsBenchmark":0.952}]}'::jsonb,
        '0x7f9a8b1c4e2d3f6a89b0c1d2e3f4a5b6c7d8e9f0123456789abcdef012345678',
        'EEOC Title VII Uniform Guidelines & EU AI Act Article 14 / Annex IV',
        'Ravengard Automated Bias Immunity Engine v4.2'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("[DB Sync] Funnel tables, question banks, rubrics, and published requisitions synchronized successfully.");
  } catch (err: any) {
    console.error("[DB Sync] Warning during syncFunnelTablesAndSeed:", err.message);
  } finally {
    if (client) client.release();
    try {
      await adminPool.end();
    } catch {}
  }
}
