# Workday-Grade Governance, Secondary-Device Anti-Cheat & LLM Zero-Delete Safety Architecture

Ravengard expands into an enterprise-defensible talent acquisition platform equipped with four-signal secondary-device anti-cheat detection, multi-stage requisition approval governance, strict LLM zero-delete database safety guardrails, `madhunand@gmail.com` super-admin provisioning, and admin portal data purge controls.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification and will govern the system architecture:

- **Confirmed Decision 1 (Data Purge Execution)**: An explicit "Purge Demo & Dummy Candidate Data" trigger located in the Admin Portal with two-step modal confirmation, wiping mock candidates, transcripts, resume files, and test notifications while preserving the immutable system audit trail and super-admin configuration.
- **Confirmed Decision 2 (Super-Admin Initialization)**: Primary account `madhunand@gmail.com` seeded as `super_admin` organization head. If `SUPER_ADMIN_INIT_PASSWORD` is omitted in `.env`, the server automatically generates a cryptographically secure temporary setup token on startup and provides an instant password-creation link.
- **Confirmed Decision 3 (Zero-Delete LLM Security Guardrail)**: LLM/AI layers have zero capability to execute raw `DELETE` SQL. All AI queries pass through Drizzle ORM validation with a hard middleware block against destructive SQL statements. Enterprise entities utilize soft deletion (`deleted_at: timestamp`) to ensure regulatory audit trail retention.
- **Confirmed Decision 4 (Secondary-Device Anti-Cheat Engine)**: Telemetry captures conversational response latency ($\Delta\text{TTFT}$), triggers adaptive rapid-probing loops when latency exceeds $1.8\text{s}$, profiles speech prosody/cadence for robotic second-screen reading, and flags cross-modal code-speech divergence.
- **Confirmed Decision 5 (Requisition Approval Pipeline)**: Sequential multi-stage governance (`draft` $\rightarrow$ `pending_finance` $\rightarrow$ `pending_tech_lead` $\rightarrow$ `published`), where any stage rejection reverts to `draft` with mandatory reviewer feedback.

---

### 1. Overview & Core Concept

- **What It Does**: Unifies enterprise compliance, multi-role department sandboxing, and non-invasive proctoring into a single platform:
  1. **Secondary-Device Anti-Cheat Engine**: Identifies unmonitored second-device LLM relay attacks (e.g., candidate reading ChatGPT/Claude answers off a phone or second monitor) without invasive client binaries.
  2. **Workday-Grade Governance & RBAC**: Sandboxes departmental requisitions, isolates candidate compensation/demographics from technical interviewers, enforces multi-stage approvals, and generates formal offer letters.
  3. **LLM Zero-Delete & Database Safety**: Intercepts AI tool operations, enforces soft deletes, and shields the PostgreSQL database from destructive queries.
  4. **Primary Admin & Lifecycle Controls**: Grants `madhunand@gmail.com` full administrative tenant authority and provides in-portal data purge capabilities.
- **Target Audience / Personas**:
  - *Super Admin (`madhunand@gmail.com`)*: Organization owner with root tenant control, role assignment, data purge privileges, and global audit log inspection.
  - *Recruiter & HR Admin*: Candidate pipeline coordination, requisition drafting, offer letter issuance, and blind review management.
  - *Engineering Hiring Manager*: Department-scoped requisition review, candidate dossier analysis, and hiring sign-off.
  - *Technical Interviewer*: Blinded candidate evaluation, code execution playback, and Q&A rubric scoring (salary/demographics stripped).
  - *Finance Approver*: Token budget allocation and compensation band approval.
- **Key Value**: Delivers defensible, compliance-ready enterprise hiring with active defense against AI-assisted candidate cheating and zero risk of automated data corruption.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Interactive Persona Switcher**:
   - The top navigation bar includes an enterprise role switcher (`Super Admin (Madhunand)`, `Recruiter`, `Engineering Hiring Manager`, `Technical Interviewer`, `Finance Approver`) for instant verification of department isolation and field redaction rules.
   - Selecting `Technical Interviewer` instantly hides compensation expectations, EEO demographics, and token consumption metrics from all views.
   - Selecting `Hiring Manager (Product)` scopes requisition and candidate lists exclusively to the Product department.

2. **Secondary-Device Anti-Cheat & Live Proctoring Dashboard**:
   - During candidate interviews, telemetry tracks Time-To-First-Token-Spoken ($\Delta\text{TTFT}$) per question turn.
   - If response onset consistently exceeds $1.8\text{s}$ (the physical latency floor for listening $\rightarrow$ prompting second device $\rightarrow$ reading output), the AI interviewer ("Sarah") seamlessly triggers an adaptive rapid-probing interrupt.
   - The Admin Dossier provides an **Integrity Telemetry Panel** detailing:
     - $\Delta\text{TTFT}$ response latency distribution histogram.
     - Prosody & cadence variance (reading monotony vs. spontaneous thought).
     - Cross-modal code-speech divergence logs (e.g., candidate explaining algorithms while editor DOM is idle).
     - Composite `SECONDARY_DEVICE_RISK_SCORE` (Low / Moderate / High Risk).

3. **Multi-Stage Requisition Approval Pipeline**:
   - Requisition creation starts in `draft`.
   - Recruiter submits $\rightarrow$ advances to `pending_finance`.
   - Finance Approver validates token budget & salary bands $\rightarrow$ advances to `pending_tech_lead`.
   - Tech Lead verifies assessment dimensions and questions $\rightarrow$ advances to `published`.
   - Rejections return requisition to `draft` with mandatory audit notes.

4. **Blind Review Mode (EEO & Bias Prevention)**:
   - In comparison matrices and dossiers, an EEO Blind Review toggle redacts candidate names to `"Candidate Alpha"`, `"Candidate Beta"`, while masking college names, email addresses, and photos. Only objective AI competencies, radar scores, and code telemetry remain visible.

5. **Automated Offer Document Generator**:
   - Clicking `"Generate Offer"` opens an executive compensation builder with base salary, equity, bonus, start date, and reporting manager.
   - Clicking `"Preview Offer Letter"` renders an in-app printable document with corporate letterhead, terms, signature lines, and one-click PDF export.

6. **Admin Portal Data Purge & Super-Admin Setup**:
   - Dedicated Admin Settings view displaying super-admin status for `madhunand@gmail.com`.
   - If setup token was generated, provides instant copyable token/link for setup.
   - "Purge Candidate & Demo Data" button with double-confirmation modal (`Type "PURGE-DEMO-DATA" to confirm`). Purges all demo candidates, test sessions, transcripts, and mock resumes while preserving audit logs, jobs, and admin accounts.

#### B. Visual Identity & Theme (SaaS Dashboard Domain)
- **Palette**: Deep slate canvas (`bg-slate-950`), elevated container cards (`bg-slate-900/70`), crisp hairline borders (`border-slate-800`), with neutral typography (`text-slate-100`, `text-slate-400`).
- **Telemetry Indicators**: High-contrast, tabular numeric typography (`font-mono`, `tabular-nums`) for latency metrics, audit timestamps, and financial figures.
- **Zero-Pill Discipline**: Clean typographic status labels with subtle dot indicators (`·`) rather than nested badges.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Zero-Delete LLM Guardrail via ORM-Boundary Interceptor**
  - *Chosen Approach*: Enforce database safety in the application backend layer using Drizzle ORM. AI agent tools cannot execute arbitrary SQL. Any tool payload attempting `DELETE` or `DROP` is intercepted and rejected with a `403 Forbidden` error. Entity deletions use soft deletes (`deleted_at = now()`).
  - *Why*: Eliminates the risk of catastrophic data loss or compliance violations from hallucinated or malicious AI tool outputs.
  - *Alternatives Considered*: PostgreSQL database user permission restrictions only (rejected as insufficient alone; application-level interceptor provides actionable error logging and audit tracking).

- **Decision 2: Non-Invasive 4-Signal Secondary-Device Detection**
  - *Chosen Approach*: Combine $\Delta\text{TTFT}$ response latency tracking, adaptive AI rapid-probing interrupts, prosody reading analysis, and cross-modal code-speech divergence without requiring candidates to install invasive surveillance software.
  - *Why*: Solves modern secondary-device LLM cheating while maintaining candidate privacy and frictionless web-only browser access.
  - *Alternatives Considered*: Invasive webcam eye-tracking kernel drivers (rejected due to high candidate drop-off, privacy backlash, and false positives from external monitors).

- **Decision 3: Startup Super-Admin Provisioning for `madhunand@gmail.com`**
  - *Chosen Approach*: On backend boot, query `admin_users` for `madhunand@gmail.com`. If absent, create account with `super_admin` role. If `SUPER_ADMIN_INIT_PASSWORD` env var is present, hash and set; otherwise, generate a 32-character crypto setup token logged to server console and stored securely in `admin_users.setup_token`.
  - *Why*: Guarantees immediate zero-friction root access for the organization owner without hardcoded static credentials.

- **Decision 4: In-Portal Selective Data Purge Action**
  - *Chosen Approach*: An admin-only API endpoint (`POST /api/admin/purge-demo-data`) guarded by `super_admin` role check and explicit confirmation payload. Wipes mock candidates, test sessions, transcripts, and test files while keeping audit records and configuration.
  - *Why*: Enables seamless transition from demonstration/testing to live enterprise production.

---

### 4. Technical Architecture & Data Strategy

#### A. Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Ravengard Enterprise Gateway                    │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Persona Switcher · Super Admin (Madhunand) · Live Telemetry  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────┐   ┌────────────────────────────────────┐   │
│   │   Navigation          │   │   Active Route View                │   │
│   │   · Job Requisitions  │───┤   [ HrJobsPage ]                   │   │
│   │   · Candidate Dossier │   │   · 4-Stage Approval Stepper       │   │
│   │   · Comparison Matrix │   │                                    │   │
│   │   · Anti-Cheat Monitor│   │   [ HrCandidateDossier ]           │   │
│   │   · Audit Trail       │   │   · Latency & Prosody Telemetry    │   │
│   │   · Admin Settings    │   │   · Printable Offer Letter (PDF)   │   │
│   │                       │   │                                    │   │
│   │                       │   │   [ HrComparisonMatrix ]           │   │
│   │                       │   │   · Blind Review Mode (EEO)        │   │
│   │                       │   │                                    │   │
│   │                       │   │   [ AdminSettingsPage ]            │   │
│   │                       │   │   · Super Admin Setup Token View   │   │
│   │                       │   │   · "Purge Demo Data" Action       │   │
│   └───────────────────────┘   └────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Bearer Auth
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Express Backend & API Guard                    │
├────────────────────────────────────────────────────────────────────────┤
│   Middlewares & Guardrails:                                            │
│   · requireHrAuth (Super Admin / RBAC verification)                    │
│   · rbacDepartmentSandbox (Department isolation & field redaction)     │
│   · llmDatabaseSafetyGuard (Zero-Delete block & ORM validation)        │
│   · auditLogInterceptor (Immutable event recording to audit_logs)      │
├────────────────────────────────────────────────────────────────────────┤
│   Specialized Subsystems:                                              │
│   · Anti-Cheat Telemetry Engine (Delta TTFT, Prosody, Code-Speech)     │
│   · Super Admin Bootstrapper (madhunand@gmail.com setup token)         │
│   · Purge Controller (Selective candidate data wiper)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Drizzle ORM (Parameterized Queries)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database (Cloud SQL)                  │
├────────────────────────────────────────────────────────────────────────┤
│   Tables:                                                              │
│   · admin_users (id, email, role, department, setup_token, deleted_at) │
│   · audit_logs (id, org_id, user_id, action, resource, details, time)  │
│   · jobs (id, status, approval_history, token_budget, salary_range)    │
│   · applications (id, salary_expectation, offer_details_json, ...)     │
│   · integrity_signals (id, session_id, signal_type, latency_ms, diff)  │
│   · anti_cheat_profiles (id, session_id, delta_ttft_avg, risk_score)   │
└────────────────────────────────────────────────────────────────────────┘
```

#### B. Data Model & Schema Enhancements

1. **`admin_users` Expansion**:
   - `department`: `text` (`'Engineering'`, `'Product'`, `'Design'`, `'Marketing'`, `'Finance'`, `'HR'`, `'Executive'`).
   - `role`: `'super_admin'` | `'admin'` | `'hr_admin'` | `'recruiter'` | `'hiring_manager'` | `'technical_interviewer'` | `'finance_approver'`.
   - `setupToken`: `text` (secure temporary initialization token).
   - `deletedAt`: `timestamp` (soft delete support).

2. **`audit_logs` Table**:
   - `id`: `text` Primary Key.
   - `organizationId`: `text`.
   - `userId`: `text`.
   - `userEmail`: `text`.
   - `userRole`: `text`.
   - `action`: `text` (`'JOB_APPROVAL_TRANSITION'`, `'PURGE_DEMO_DATA'`, `'SUPER_ADMIN_INIT'`, `'OFFER_GENERATED'`, `'LLM_DELETE_BLOCKED'`).
   - `resourceType`: `text`.
   - `resourceId`: `text`.
   - `details`: `jsonb` (storing diffs, rejection notes, purge counts).
   - `ipAddress`: `text`.
   - `createdAt`: `timestamp`.

3. **`jobs` Table Extension**:
   - `status`: `'draft'` | `'pending_finance'` | `'pending_tech_lead'` | `'published'` | `'active'` | `'closed'` | `'archived'`.
   - `approvalFeedback`: `text`.
   - `approvalHistory`: `jsonb` array of previous approval transitions.
   - `tokenBudget`: `integer`.
   - `salaryRange`: `text`.
   - `deletedAt`: `timestamp`.

4. **`integrity_signals` & `anti_cheat_profiles`**:
   - `signalType`: `'delta_ttft_exceeded'` | `'rapid_probe_triggered'` | `'prosody_monotone_reading'` | `'cross_modal_divergence'` | `'tab_blur'`.
   - `deltaTtftMs`: `integer`.
   - `secondaryDeviceRiskScore`: `integer` (0–100).
   - `riskFlags`: `jsonb` array of flag keys.

#### C. Interactive Component & State Mapping

| Component | User Interaction | State Transition & Handler | Backend Security & Verification |
|---|---|---|---|
| **Role Switcher** | Selects persona (`Super Admin`, `Recruiter`, `Tech Interviewer`) | Switches active auth token in state; updates UI scoping | `/api/hr/me` scopes permissions; tech interviewer receives redacted payloads |
| **Purge Action** | Clicks `"Purge Demo Data"` and types `"PURGE-DEMO-DATA"` | Displays loading spinner; refreshes pipeline view | `POST /api/admin/purge-demo-data` (Super Admin only, logged in `audit_logs`) |
| **Requisition Approval** | Finance Approver clicks `"Approve Token Budget"` | Requisition advances `pending_finance` $\rightarrow$ `pending_tech_lead` | `POST /api/hr/jobs/:id/approval` with `stage: 'finance'` |
| **Rejection Action** | Tech Lead clicks `"Reject to Draft"` with feedback | Requisition reverts to `draft` with feedback notes | `POST /api/hr/jobs/:id/approval` with `action: 'reject'`, logged to audit trail |
| **Anti-Cheat Panel** | Reviewer views candidate anti-cheat telemetry | Renders $\Delta\text{TTFT}$ distribution and divergence flags | Telemetry fetched from `GET /api/hr/applications/:id/integrity` |
| **Blind Review Toggle** | Reviewer toggles `"Blind Review Mode"` | Masks candidate names to `"Candidate A"`, hides college/photo | Client toggle for instant review; server enforces redaction for interviewers |
| **Offer Generator** | HR inputs salary, equity, bonus and clicks `"Preview"` | Renders printable offer letter with instant PDF download | `POST /api/hr/applications/:id/offer`, logs `OFFER_GENERATED` |
| **Admin Setup Token** | Admin checks setup status for `madhunand@gmail.com` | Renders active token / initial password setup modal | Token verified via secure endpoint; invalidated on password set |

---

### Implementation Milestones (Ready Upon Approval)

1. **Schema & Super-Admin Bootstrapper**: Expand `admin_users`, `jobs`, `audit_logs`, `integrity_signals`, and bootstrap `madhunand@gmail.com` with auto-generated setup token.
2. **LLM Zero-Delete Guardrail & Audit Middleware**: Enforce ORM validation, block raw destructive queries, and activate automatic audit log interception.
3. **Secondary-Device Anti-Cheat Engine**: Build telemetry collectors for $\Delta\text{TTFT}$, rapid-probe triggering, cadence profiling, and cross-modal divergence.
4. **Multi-Stage Approval State Machine**: Implement the 4-stage sequential approval pipeline with rejection-to-draft and mandatory critique.
5. **Admin Portal Settings & Purge Controller**: Build the Admin Settings UI with super-admin token viewer and the candidate data purge modal.
6. **Executive Offer Document & Blind Review**: Deliver the in-app printable offer generator (PDF export) and EEO blind review mode.
7. **Frontend Persona Switcher Toolbar**: Embed the interactive persona switcher in the header for real-time testing of sandboxed personas.
