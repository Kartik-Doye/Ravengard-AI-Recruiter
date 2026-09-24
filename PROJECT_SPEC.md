# Ravengard AI Recruiter — Project Specification (PROJECT_SPEC.md)

## 1. Project Overview
Ravengard AI Recruiter is an enterprise-grade AI-powered assessment platform designed to act as a defensible, auditable first-pass filter for engineering hiring teams. The system conducts automated prescreening, real-time conversational voice assessments, silent integrity monitoring, and rubric-aligned scorecard generation.

---

## 2. Product Architecture & Phases

### Phase 1 — Foundation (COMPLETED)
- **Candidate Onboarding**: Registration with auto-detected country, ISO search, and E.164 phone formatting.
- **Account Security**: Real-time password entropy meter with sequence/dictionary detection.
- **Session Locking**: Immutable session creation on policy consent ("I Agree").
- **Resume Intelligence**: Multi-format parsing (`unpdf` for PDF, `mammoth` for DOCX) extracting technical proficiencies.

### Phase 2 — Hardware Readiness (COMPLETED)
- **Device Checks**: Real-time camera & microphone permissions validation.
- **Audio Feedback**: Frequency ping test for speaker verification.
- **Browser Compatibility**: Strict WebRTC & MediaDevices API capability checks.

### Phase 3 — Waiting Room (COMPLETED)
- **Holding Gate**: Pre-interview readiness checkpoint.
- **Explicit Trigger**: "I'm Ready" confirmation button guarding the transition to Phase 4.

### Phase 4 — Interview Engine (COMPLETED)
- **Conversational Voice Loop**: Asynchronous and real-time dialogue loop powered by Sarah Voice Engine.
- **Low-Latency Streaming**: Token-by-token Server-Sent Events (SSE).
- **Dynamic Adaptability**: Context-aware follow-ups targeting resume competencies and candidate trade-offs.

### Phase 5 — Anti-Cheat / Integrity Layer (COMPLETED)
- **Silent Telemetry**: Non-blocking background signal collector (`/api/interview/:id/signal`).
- **Signal Types**: `tab_blur`, `gaze_off`, `window_switch`, `long_pause_before_answer`, `sudden_text_appearance`.
- **Integrity Score**: Risk aggregation persisted for review panels without interrupting the live interview.

### Phase 6 — Final Report & Scorecards (COMPLETED)
- **Deterministic Rubrics**: Zero-shot extraction evaluating Technical Architecture, Communication, and Integrity.
- **Evidence Extraction**: Direct quotes and question-by-question scoring breakdown.
- **Recommendations**: `strong_hire`, `hire`, `weak_hire`, `no_hire` synthesis.

### Phase 7 — Multi-Tenant Workspaces & Governance (COMPLETED)
- **Role-Based Isolation**:
  - **HR Portal (`/hr`)**: Requisitions draft builder (`HrJobsPage`), ATS pipeline (`HrAtsPipeline`), Candidate Dossiers, and Comparison Matrix. Status created as `pending_approval`.
  - **Admin Portal (`/admin`)**: Super Admin Requisition Approval Gate (`JobApprovalGate`), Live Telemetry Dashboard, API & Organization Configuration.
- **Tenant Quota Guard**: `requireTenantQuota.ts` enforcing a **100,000 token soft warning** (`X-Tenant-Quota-Warning`) and a **500,000 token hard block** (HTTP `429 Too Many Requests`).

---

## 3. Core Database Entities (PostgreSQL via Drizzle ORM)

- **`organizations`**: Multi-tenant workspace metadata (`id`, `name`, `billingTier`, `isActive`, `createdAt`).
- **`organization_admins`**: RBAC permissions (`id`, `organizationId`, `email`, `role`).
- **`candidates`**: User identity and profile (`id`, `email`, `name`, `mobile` in E.164, `country`, `degree`, `gradYear`, `emailVerified`).
- **`sessions`**: Locked interview states (`id`, `candidateId`, `currentStage`, `status`, `locked`, `assessmentExpiresAt`, `thinkAgainUsesLeft`).
- **`jobs`**: Requisitions with status (`draft`, `pending_approval`, `published`, `archived`) and cutoff score thresholds.
- **`integrity_signals`**: Telemetry log for suspicious events (`id`, `sessionId`, `signalType`, `metadata`, `timestamp`).
- **`scorecards`**: Final structured evaluations (`id`, `sessionId`, `overallScore`, `technicalScore`, `communicationScore`, `recommendation`, `evidence`).

---

## 4. Key Endpoints

### Candidate Flow
- `POST /api/register` — Validates onboarding details and generates verification email.
- `POST /api/candidate/parse-resume` — Parses uploaded resume into structured competencies.
- `POST /api/session/confirm-consent` — Locks session and activates 60-minute assessment window.
- `POST /api/candidate/interview/next-turn` — Evaluates candidate answer and streams next question via SSE (Quota protected).
- `POST /api/interview/:id/signal` — Logs silent integrity events.
- `GET /api/scorecard/:sessionId` — Retrieves finalized evaluation report.

### HR & Admin Workspaces
- `POST /api/hr/jobs` — Drafts new requisition with status `pending_approval`.
- `PATCH /api/admin/jobs/:id/approve` — Publishes requisition (`status: 'published'`).
- `PATCH /api/admin/jobs/:id/reject` — Reverts requisition to draft with rejection feedback.
- `GET /api/admin/telemetry` — Fetches real-time token utilization and tenant quota health.

---

## 5. Design System Standards

- **Theme**: Dark Slate palette with gold/amber accents (`var(--color-secondary)` / `#e6c687`).
- **Headings**: `Playfair Display` (`font-display font-semibold`).
- **Body**: `Plus Jakarta Sans` (`text-base md:text-lg text-white/70`).
- **Cards**: `glass-panel p-8 rounded-3xl border border-slate-800 backdrop-blur-xl`.
- **Primary CTAs**: `rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 hover:bg-slate-100`.
