# Ravengard AI Recruiter — Project Specification (PROJECT_SPEC.md)

## 1. Project Overview
Ravengard AI Recruiter is an enterprise-grade AI-powered candidate assessment platform designed to act as a defensible, auditable first-pass filter for engineering hiring teams. The system conducts automated prescreening, real-time multi-modal conversational assessments (Voice + WASM Code Sandbox + Architecture Canvas), silent integrity monitoring, and rubric-aligned scorecard generation.

---

## 2. Product Architecture & Phases

### Phase 1 — Foundation (COMPLETED)
- **Candidate Onboarding**: Registration with auto-detected country, ISO search, and E.164 phone formatting.
- **Account Security**: Real-time password entropy meter with sequence/dictionary detection.
- **Session Locking**: Immutable session creation on policy consent ("I Agree").
- **Resume Intelligence**: Multi-format parsing (`unpdf` for PDF, `mammoth` for DOCX) extracting technical proficiencies.

### Phase 2 — Hardware Readiness & Calibration (COMPLETED)
- **Device Checks**: Real-time camera & microphone permissions validation.
- **Audio Feedback**: Frequency ping test for speaker verification.
- **Browser Compatibility**: Strict WebRTC & MediaDevices API capability checks.
- **Pre-Flight Practice Sandbox (`PracticeRoom.tsx`)**: 2-minute zero-stakes sandbox allowing candidates to test mic levels, hear Sarah's voice pacing, and verify network latency before official interview start.

### Phase 3 — Waiting Room (COMPLETED)
- **Holding Gate**: Pre-interview readiness checkpoint with integrated practice room.
- **Explicit Trigger**: "I'm Ready" confirmation button guarding the transition to Phase 4.

### Phase 4 — Multi-Modal Interview Engine (COMPLETED)
- **Conversational Voice Loop**: Asynchronous and real-time dialogue loop powered by Sarah Voice Engine.
- **Low-Latency Streaming**: Token-by-token Server-Sent Events (SSE).
- **In-Browser WASM Code Sandbox (`CodeSandbox.tsx` & `codeRunner.ts`)**:
  - Multi-language execution in Python 3 (Pyodide WebAssembly), JavaScript/TypeScript (sandboxed V8), and SQL.
  - Automated unit test runner with real-time pass/fail matrix, trapped console stdout/stderr, and runtime benchmarking (ms).
  - Test execution results automatically hydrated into the LLM context for adaptive technical follow-up questions.
- **Vector Architecture Whiteboard (`WhiteboardCanvas.tsx`)**: Interactive canvas for system design rounds with shapes, data flow lines, and base64 diagram snapshot sync.
- **Linear Progress Stepper & Connection Monitor**: Live visual tracking of 4 interview stages (Introduction $\rightarrow$ Core Technical $\rightarrow$ System Architecture $\rightarrow$ Conclusion) with 15s connection health indicator.

### Phase 5 — Anti-Cheat / Integrity Layer & Resilience (COMPLETED)
- **Silent Telemetry**: Non-blocking background signal collector (`/api/interview/:id/signal`).
- **Signal Types**: `tab_blur`, `gaze_off`, `window_switch`, `long_pause_before_answer`, `sudden_text_appearance`.
- **Heartbeat & Disconnect Failover (`/api/candidate/heartbeat`)**: Client sends 15s pings updating `last_active_at`.
- **Abandoned Session Auto-Submit (`autoSubmitWorker.ts`)**: Background worker sweeps for inactive sessions (>5 mins), transitions them to `partial_submission`, and triggers partial Q&A evaluation.
- **Risk Score Aggregation**: Telemetry events computed into an integrity risk score persisted for review panels.

### Phase 6 — Final Report & Executive Dossier (COMPLETED)
- **Deterministic Rubrics**: Zero-shot extraction evaluating Technical Execution, System Design, Problem Solving, Communication, and Behavioral Alignment.
- **Evidence Extraction**: Direct quotes and question-by-question scoring breakdown.
- **Executive 2-Page PDF Dossier (`pdfGenerator.ts`)**:
  - **Page 1**: Executive Summary, Scorecards, Proctoring & Telemetry Audit, Strengths & Gaps.
  - **Page 2**: Verbatim Transcript Highlights with Quotes, In-Browser WASM Code Snapshot, and Hiring Committee Calibration & Sign-Off.
- **Recommendations**: `strong_hire`, `hire`, `weak_hire`, `no_hire` synthesis.

### Phase 7 — Multi-Tenant Workspaces & Governance (COMPLETED)
- **Role-Based Isolation**:
  - **HR Portal (`/hr`)**: Requisitions draft builder (`HrJobsPage`), ATS pipeline (`HrAtsPipeline`), Candidate Dossiers (`HrCandidateDossier`), Comparison Matrix, AI Rubric Builder (`POST /api/hr/rubric/generate`), Bulk CSV Import (`POST /api/hr/candidates/bulk-invite`), Constructive Feedback Generator (`POST /api/hr/applications/:id/generate-feedback-summary`), and Notification Center (`HrNotificationDrawer.tsx`).
  - **Admin Portal (`/admin`)**: Super Admin Requisition Approval Gate (`JobApprovalGate`), Live Telemetry Dashboard, API & Organization Configuration.
- **Tenant Quota Guard**: `requireTenantQuota.ts` enforcing a **100,000 token soft warning** (`X-Tenant-Quota-Warning`) and a **500,000 token hard block** (HTTP `429 Too Many Requests`).

---

## 3. Core Database Entities (PostgreSQL via Drizzle ORM)

- **`organizations`**: Multi-tenant workspace metadata (`id`, `name`, `billingTier`, `isActive`, `createdAt`).
- **`organization_admins`**: RBAC permissions (`id`, `organizationId`, `email`, `role`).
- **`candidates`**: User identity and profile (`id`, `email`, `name`, `mobile` in E.164, `country`, `degree`, `gradYear`, `emailVerified`).
- **`sessions`**: Locked interview states (`id`, `candidateId`, `currentStage`, `status`, `locked`, `assessmentExpiresAt`, `lastActiveAt`, `thinkAgainUsesLeft`).
- **`jobs`**: Requisitions with status (`draft`, `pending_approval`, `published`, `archived`) and cutoff score thresholds.
- **`integrity_signals`**: Telemetry log for suspicious events (`id`, `sessionId`, `signalType`, `metadata`, `timestamp`).
- **`scorecards`**: Final structured evaluations (`id`, `sessionId`, `overallScore`, `breakdown`, `strengths`, `weaknesses`, `recommendation`, `evidence`).
- **`hr_notifications`**: Real-time alerts (`id`, `type`, `message`, `isRead`, `createdAt`).

---

## 4. Key Endpoints

### Candidate Flow
- `POST /api/register` — Validates onboarding details and generates verification email.
- `POST /api/candidate/parse-resume` — Parses uploaded resume into structured competencies.
- `POST /api/session/confirm-consent` — Locks session and activates assessment window.
- `POST /api/candidate/heartbeat` — Dispatched every 15s to maintain active session lock.
- `POST /api/candidate/interview/next-turn` — Evaluates candidate answer/code and streams next question via SSE.
- `POST /api/interview/:id/signal` — Logs silent integrity events.
- `GET /api/scorecard/:sessionId` — Retrieves finalized evaluation report.

### HR & Admin Workspaces
- `POST /api/hr/jobs` — Drafts new requisition with status `pending_approval`.
- `POST /api/hr/rubric/generate` — Generates weighted rubrics from raw job descriptions.
- `POST /api/hr/candidates/bulk-invite` — Batch imports candidates from CSV and mints magic JWT tokens.
- `POST /api/hr/applications/:id/generate-feedback-summary` — Generates constructive feedback for candidates.
- `GET /api/hr/notifications` — Retrieves real-time workspace alerts.
- `PATCH /api/admin/jobs/:id/approve` — Publishes requisition (`status: 'published'`).
- `PATCH /api/admin/jobs/:id/reject` — Reverts requisition to draft with rejection feedback.
- `GET /api/admin/telemetry` — Fetches real-time token utilization and tenant quota health.

---

## 5. Design System Standards

- **Theme**: Dark Slate palette with gold/amber accents (`var(--color-secondary)` / `#e6c687`).
- **Typography**: `Playfair Display` for headings and `Plus Jakarta Sans` for body copy.
