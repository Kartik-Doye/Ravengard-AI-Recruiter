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
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rubric_id TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approval_feedback TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_by TEXT`,
      `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS title TEXT`,
      `ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS department TEXT`
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

    // 7b. Seed HR Director & Admin accounts in admin_users if missing
    await client.query(`
      INSERT INTO admin_users (id, email, name, role, organization_id, password_hash)
      VALUES 
        ('admin-root', 'admin@ravengard.com', 'Ravengard Lead Auditor', 'admin', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G'),
        ('hr-root', 'hr@ravengard.com', 'Ravengard HR Director', 'hr_admin', 'org-ravengard', '$2a$10$iKzHskGj9wz1WdJ2L2hH8eF5hSfZLskbLzQ.C2m8GjG9Gf2dM/G6G')
      ON CONFLICT (email) DO UPDATE SET 
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id;
    `);

    // 8. Ensure Published Jobs for Public Careers Portal
    await client.query(`
      INSERT INTO jobs (id, organization_id, title, department, description, requirements_json, screening_threshold, status, location, employment_type, salary_range)
      VALUES 
        ('job-data-analyst-01', 'org-ravengard', 'Senior Data Analyst (High-Throughput)', 'Analytics & Business Intelligence', 'Lead analytical architecture, data modeling, SQL query optimization, and real-time dashboard analytics across high-throughput distributed pipelines.', '["Advanced SQL & Window Functions", "Data Modeling & Normalization", "Distributed Systems & Telemetry", "Business Metric Forecasting"]'::jsonb, 70, 'active', 'Remote / Hybrid', 'Full-time', '$135,000 - $170,000'),
        ('job-backend-eng-01', 'org-ravengard', 'Staff Backend Systems Engineer', 'Core Platform', 'Architect high-throughput transactional outboxes, real-time streaming engines, and fault-tolerant microservices using TypeScript, Node.js, and PostgreSQL.', '["Node.js & TypeScript", "PostgreSQL & Drizzle ORM", "Distributed Systems", "Server-Sent Events & Realtime Pipelines"]'::jsonb, 75, 'active', 'San Francisco, CA / Remote', 'Full-time', '$180,000 - $225,000'),
        ('job-frontend-lead-01', 'org-ravengard', 'Lead Frontend Architect', 'User Experience', 'Design ultra-responsive, accessible candidate evaluation workflows, voice-orb visualizers, and real-time HR pipeline dashboards with Tailwind CSS and React.', '["React 19 & TypeScript", "Tailwind CSS & Design Systems", "Web Speech & Audio Visualizers", "Performance Optimization"]'::jsonb, 70, 'active', 'New York, NY / Remote', 'Full-time', '$160,000 - $200,000')
      ON CONFLICT (id) DO UPDATE SET status = 'active';
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
