# Ravengard AI Recruiter (V2 Enterprise Edition)

Ravengard AI Recruiter is an enterprise-grade, autonomous candidate assessment platform that acts as a definitive first-pass filter for engineering hiring teams. It combines asynchronous technical prescreening, low-latency conversational AI voice loops, in-browser WebAssembly (WASM) code execution, vector system design whiteboards, silent anti-cheat integrity tracking, and deterministic rubric scorecard extraction.

---

## 🚀 Quick Start

To install and run the platform locally:

```bash
# 1. Install dependencies
npm install

# 2. Start the unified development server (Express backend + React Vite on port 3000)
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🏛️ System Architecture & Phase Breakdown

The candidate experience follows a strict, locked, one-way state machine across 7 phases:

| Phase | Purpose | Key Components |
|---|---|---|
| **Phase 1 — Foundation** | Locked candidate onboarding, E.164 phone verification, country auto-detection, policy consent, and resume intelligence extraction (`unpdf` / `mammoth`). | `Registration.tsx`, `Welcome.tsx`, `Consent.tsx`, `ResumeUpload.tsx`, `ResumeAnalysis.tsx` |
| **Phase 2 — Device Check & Practice** | Camera & microphone permission validation, audio speaker ping, WebRTC check, and live audio calibration sandbox (`PracticeRoom.tsx`). | `DeviceCheck.tsx`, `PracticeRoom.tsx` |
| **Phase 3 — Waiting Room** | Pre-interview holding gate, system readiness check, practice sandbox, and explicit "I'm Ready" candidate trigger. | `WaitingRoom.tsx` |
| **Phase 4 — Multi-Modal Interview Engine** | Conversational voice assessment loop (Sarah Voice Engine), in-browser WASM code sandbox (`CodeSandbox.tsx`), and architecture whiteboard (`WhiteboardCanvas.tsx`). | `InterviewEngine.tsx`, `CodeSandbox.tsx`, `WhiteboardCanvas.tsx`, `/api/candidate/interview/next-turn` |
| **Phase 5 — Anti-Cheat Layer & Telemetry** | Silent non-blocking telemetry tracking (tab blurs, window switches, gaze anomalies, copy-paste activity, 15s heartbeats). | `/api/interview/:id/signal`, `/api/candidate/heartbeat`, `integritySignals` |
| **Phase 6 — Final Report & Dossier** | Deterministic multi-axis rubric scoring, zero-shot LLM evaluation, evidence extraction, strengths & gaps scorecard, and 2-page Executive PDF Dossier export. | `FinalReport.tsx`, `pdfGenerator.ts`, `/api/scorecard/:sessionId` |
| **Phase 7 — HR & Admin Governance Portals** | Multi-tenant governance. HR workspace (`/hr`) with ATS pipeline, candidate dossiers, notification drawer, bulk CSV invites, AI rubric builder; Admin workspace (`/admin`) with Requisition Approval Gates & Live Telemetry Quotas. | `HrGateway.tsx`, `HrJobsPage.tsx`, `HrAtsPipeline.tsx`, `HrCandidateDossier.tsx`, `AdminGateway.tsx`, `JobApprovalGate.tsx`, `requireTenantQuota.ts` |

---

## ⚡ V2 Core Capabilities

### 1. In-Browser WASM Code Execution Engine (Pyodide / JavaScript / TypeScript / SQL)
- **Local Isolated Execution**: Safely evaluates algorithms in Python 3 (Pyodide WebAssembly) and V8-sandboxed JavaScript/TypeScript without backend Remote Code Execution (RCE) risk.
- **Automated Unit Test Benchmark**: Runs test cases with real-time pass/fail matrix, runtime latency benchmarking (ms), and trapped stdout/stderr output.
- **LLM Prompt Context Hydration**: Candidate code solutions, test pass rates, and runtime metrics are automatically injected into the interviewer's prompt context for intelligent technical follow-ups.

### 2. Executive PDF Dossier Export
- **Page 1**: Executive Verdict (Score & Recommendation), Competency Rubric Scorecards, Anti-Cheat & Proctoring Integrity Audit, and Verified Strengths/Gaps.
- **Page 2**: Verbatim Transcript Highlights with Rubric Evidence, In-Browser WASM Code Sandbox Snapshot, and Hiring Committee Calibration & Sign-Off.
- Downloadable in 1-click directly from Candidate Dossiers (`HrCandidateDossier.tsx`).

### 3. Session Resilience & Heartbeat Failover
- **Client Heartbeat Monitor**: Pings `/api/candidate/heartbeat` every 15 seconds to maintain active session lock.
- **Auto-Submit Background Worker (`autoSubmitWorker.ts`)**: Automatically transitions abandoned sessions (>5 minutes without heartbeat) to `partial_submission`, triggering partial grading so candidate progress is preserved.

### 4. HR Workspace Collaboration & Notification Drawer
- **Real-Time Notification Drawer (`HrNotificationDrawer.tsx`)**: Tracks High Scores (>90%), Integrity Flags, SLA Expirations, and Partial Submissions with direct links.
- **AI Rubric Generator (`POST /api/hr/rubric/generate`)**: Extracts structured, weighted competency rubrics directly from raw Job Descriptions.
- **Bulk CSV Candidate Import (`POST /api/hr/candidates/bulk-invite`)**: Batch registers candidates and issues individual magic JWT access links.
- **Constructive Candidate Feedback Generator (`POST /api/hr/applications/:id/generate-feedback-summary`)**: Synthesizes constructive feedback for applicants.

---

## 🎨 Design System

The application uses an editorial dark theme design system:
- **Typography**: `Playfair Display` for headlines (`font-display font-semibold`) paired with `Plus Jakarta Sans` for body text.
- **Color Palette**: Deep slate background (`#020617`), frosted glass cards (`glass-panel border-slate-800`), and warm amber/gold accents (`#e6c687` / `var(--color-secondary)`).
- **Navigation CTAs**:
  - **Run Candidate Demo** (`/gateway`) → Interactive candidate screening pipeline.
  - **Book a Demo** (`/contact`) → Enterprise consultation and demo scheduler.

---

## 🛡️ Security & Quota Guardrails

- **Authentication**: `Authorization: Bearer <token>` priority with Firebase Auth and fallback JWT verification.
- **Tenant Quota Guard**: `requireTenantQuota.ts` middleware enforces a **100,000 token soft warning** (`X-Tenant-Quota-Warning` header) and a **500,000 token hard block** (`429 Too Many Requests`) per tenant.
- **Memory Safety**: `multer.memoryStorage()` with 5MB upload boundaries.
- **24-Hour SLA Worker**: Background poller automatically marks expired assessments (`assessment_expires_at`).

---

## 📁 Key Files & Directories

```
.
├── server.ts                       # Express backend server with mounted Vite middleware
├── src/
│   ├── components/                 # React UI components (Gateway, Home, About, HR, Admin, Interview)
│   │   ├── interview/              # CodeSandbox, WhiteboardCanvas, VoiceInputToggle, PracticeRoom
│   │   ├── hr/                     # HrNotificationDrawer, Team calibration tools
│   │   └── admin/                  # JobApprovalGate, Telemetry charts, Candidate tables
│   ├── contexts/                   # Global Toast and State providers
│   ├── db/                         # Drizzle schema definitions and migrations
│   ├── middleware/                 # Auth, Tenant Quotas, and Error Handlers
│   ├── pages/                      # Application routes (Home, Careers, CandidatePortal, HR, Admin)
│   ├── routes/                     # Backend API routes (candidate, admin, hr, interview)
│   ├── services/                   # autoSubmitWorker, SLA timers, scoringService, streaming
│   └── utils/                      # codeRunner (WASM), pdfGenerator (2-page dossier), audio
├── docs/                           # Architectural, PRD, and schema specifications
├── PROJECT_SPEC.md                 # Detailed project specification & state machine
├── REQUIREMENTS.md                 # System requirements and environment parameters
├── HOW_TO_RUN.md                   # Operational runbook
└── RUN.md                          # Quickstart guide
```
