# Ravengard AI Recruiter — Requirements Specification

This document defines the system, runtime, database, network, API, and client requirements necessary to run, develop, and deploy the **Ravengard AI Recruiter** platform.

---

## 1. System & Runtime Requirements

| Component | Requirement | Recommended |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` (Supports ES modules and top-level await) | `v20.x LTS` or `v22.x LTS` |
| **Package Manager** | `npm >= 9.x` (or `bun >= 1.1.x`) | `npm` |
| **Operating System** | Windows 10/11, macOS (Apple Silicon/Intel), Linux (Ubuntu 20.04+) | Windows / Linux / macOS |
| **Memory (RAM)** | Minimum 4 GB RAM | 8 GB+ RAM |
| **Disk Space** | Minimum 1 GB free disk space (for `node_modules`, builds, and uploads) | 5 GB+ |

---

## 2. Database Requirements

Ravengard uses **PostgreSQL** orchestrated with **Drizzle ORM**.

- **PostgreSQL Version**: PostgreSQL 14, 15, or 16.
- **Connection Protocol**: Direct TCP (`postgresql://user:password@host:port/database`).
- **Extensions**: Standard UUID and JSONB support enabled (standard in modern PostgreSQL).
- **Schema Management**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
- **Required Tables**:
  - `organizations`, `organization_admins`
  - `candidates`, `sessions`, `resume_analyses`
  - `interview_sessions`, `interview_questions`, `interview_responses`, `interview_reports`
  - `question_scores`, `rubrics`, `rubric_criteria`
  - `admin_users`, `admin_audit_logs`
  - `integrity_signals`
  - `jobs`, `applications`
  - `email_outbox`, `screening_queue`

---

## 3. Environment Variables Specification

Create or configure a `.env` file in the project root with the following variables:

### Core Application & Server
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Environment mode (`development` or `production`). | `development` |
| `PORT` | No | HTTP port to listen on. Defaults to `3000`. | `3000` |
| `APP_URL` | Yes | Public or local base URL of the application. | `http://localhost:3000` |
| `JWT_SECRET` | Yes | 32+ byte cryptographic secret for candidate JWT signing. | `<64-character-hex-string>` |
| `ACTUAL_SECRET` | Yes | Symmetric secret key for internal token integrity. | `<64-character-hex-string>` |
| `DATABASE_URL` | Yes | PostgreSQL connection string. | `postgresql://ravengard:password@localhost:5432/ravengard` |

### AI Model Providers (LLM Engine)
| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Yes | Primary LLM engine for resume intelligence, question generation, and final scoring (`@google/genai`). |
| `GROQ_API_KEY` | Optional | Fallback high-speed inference provider (Llama-3 / Mixtral). |
| `OPENROUTER_API_KEY` | Optional | Fallback multi-model gateway. |
| `COHERE_API_KEY` | Optional | Fallback reasoning and embeddings provider. |
| `MISTRAL_API_KEY` | Optional | Fallback European open-weights model provider. |

### Security & Access Control
| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `HELMET_ENABLED` | No | Enables HTTP security headers via `helmet`. | `true` |
| `CORS_ORIGIN` | No | Allowed CORS origin. | `http://localhost:3000` |
| `ADMIN_EMAIL` | No | Default admin email seed. | `admin@ravengard.com` |
| `ADMIN_PASSWORD_HASH`| No | Default root admin password hash or dev password. | `admin123` |

---

## 4. Hardware & Client Device Requirements (Candidate Journey)

Because Phase 2 (Device Check) and Phase 4 (Interview Engine) perform hardware verification and real-time audio/video integrity telemetry:

### Browser Compatibility
- **Google Chrome**: Version 100+ (Recommended)
- **Microsoft Edge**: Version 100+
- **Mozilla Firefox**: Version 110+
- **Apple Safari**: Version 16+ (macOS / iOS)

### Hardware Permissions
- **Webcam**: Functional camera supporting minimum 720p resolution for identity verification and anti-cheat gaze tracking.
- **Microphone**: Functional input device with permissions granted (`navigator.mediaDevices.getUserMedia`).
- **Speaker / Audio Output**: Functional audio output tested via browser HTML5 Audio API.
- **Network Bandwidth**: Minimum 1.5 Mbps upload / download speed with low latency for SSE streaming.

---

## 5. File Processing Requirements

- **Resume Upload Formats**: PDF (`.pdf`) and Microsoft Word (`.docx`).
- **File Size Limit**: Configured to 5MB maximum per upload via `multer`.
- **Parsing Engines**:
  - `unpdf` for native text and metadata extraction from PDF files.
  - `mammoth` for DOCX structure and text extraction.

---

## 6. Architectural Constraints (Developer Iron Rules)

1. **State-Locked Candidate Flow**: Candidates must progress sequentially through:
   `Registration` → `Email Verification` → `Policy Consent (Locked)` → `Resume Upload` → `Device Check` → `Waiting Room` → `Interview Engine` → `Final Report`.
2. **Server-Authorized Transitions**: The frontend cannot advance phase states arbitrarily; transitions are server-gated via `/api/session/transition`.
3. **SSE Transport**: The AI Interview Engine uses Server-Sent Events (SSE) for reliable unidirectional question streaming.
4. **Anti-Cheat Isolation**: Proctoring signals (`tab_blur`, `gaze_off`) are asynchronously posted to `/api/interview/:id/signal` without interrupting the candidate's interview flow.
5. **RBAC Isolation**: Admin routes (`/admin/*` and `/api/admin/*`) are strictly guarded and completely segregated from candidate assessment routes.
