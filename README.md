# Ravengard AI Recruiter

Ravengard AI Recruiter is an enterprise-grade, autonomous candidate assessment platform that acts as a definitive first-pass filter for engineering hiring teams. It combines asynchronous technical MCQ prescreening, low-latency conversational AI voice loops, silent anti-cheat integrity tracking, and deterministic rubric scorecard extraction.

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
| **Phase 2 — Device Check** | Camera & microphone permission validation, audio speaker ping, and browser capability verification. | `DeviceCheck.tsx` |
| **Phase 3 — Waiting Room** | Pre-interview holding gate, system readiness check, and explicit "I'm Ready" candidate trigger. | `WaitingRoom.tsx` |
| **Phase 4 — Interview Engine** | Conversational voice assessment loop with dynamic follow-ups, context hydration, low-latency streaming (SSE), and Markdown stripping. | `InterviewEngine.tsx`, `/api/candidate/interview/next-turn` |
| **Phase 5 — Anti-Cheat Layer** | Silent non-blocking telemetry tracking (tab blurs, window switches, gaze anomalies, copy-paste activity). | `/api/interview/:id/signal`, `integritySignals` |
| **Phase 6 — Final Report** | Deterministic multi-axis rubric scoring, zero-shot LLM evaluation, evidence extraction, strengths & gaps scorecard. | `FinalReport.tsx`, `/api/scorecard/:sessionId` |
| **Phase 7 — HR & Admin Portals** | Strict role-based isolation. HR workspace (`/hr`) for requisition drafting & ATS pipeline; Admin workspace (`/admin`) for Requisition Approval Gates & Live Telemetry Quotas. | `HrGateway.tsx`, `HrJobsPage.tsx`, `HrAtsPipeline.tsx`, `AdminGateway.tsx`, `JobApprovalGate.tsx`, `requireTenantQuota.ts` |

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
│   ├── components/                 # React UI components (Gateway, Home, About, HR, Admin)
│   ├── contexts/                   # Global Toast and State providers
│   ├── db/                         # Drizzle schema definitions and migrations
│   ├── middleware/                 # Auth, Tenant Quotas, and Error Handlers
│   ├── pages/                      # Application routes (Home, Careers, Features, CandidatePortal, HR, Admin)
│   ├── routes/                     # Backend API routes (candidate, admin, hr, interview)
│   └── services/                   # Background workers, SLA timers, and AI streaming helpers
├── docs/                           # Architectural, PRD, and schema specifications
├── PROJECT_SPEC.md                 # Detailed project specification & state machine
├── REQUIREMENTS.md                 # System requirements and environment parameters
├── HOW_TO_RUN.md                   # Operational runbook
└── RUN.md                          # Quickstart guide
```
