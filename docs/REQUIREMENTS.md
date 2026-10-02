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
- **Core Entities**:
  - `organizations` (with `billing_tier`, `is_active`)
  - `organization_admins` (RBAC roles: `admin`, `reviewer`, `viewer`)
  - `candidates`, `sessions`, `resume_analyses`
  - `interview_sessions`, `interview_questions`, `interview_responses`, `scorecards`
  - `rubrics`, `rubric_criteria`
  - `admin_users`, `admin_audit_logs`
  - `integrity_signals` (telemetry collection)
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
| `DATABASE_URL` | Yes | PostgreSQL connection string. | `postgresql://postgres:password@localhost:5432/ravengard` |

### AI Model Providers & Quotas
| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Yes | Primary LLM engine for resume intelligence, question generation, and final scoring (`@google/genai`). |
| `GROQ_API_KEY` | Optional | Low-latency conversational TTS/STT and conversational voice streaming. |

### Quota Guard Thresholds
- **Soft Warning Threshold**: 100,000 tokens/tenant (Surfaces `X-Tenant-Quota-Warning` header).
- **Hard Quota Limit**: 500,000 tokens/tenant (Enforces HTTP `429 Too Many Requests`).

---

## 4. Client & Hardware Requirements

### Candidate Assessment Hardware
- **Webcam**: Standard 720p or 1080p camera with active browser permissions.
- **Microphone**: Built-in or external microphone supporting WebRTC MediaStream.
- **Speakers/Headphones**: Audio output capable of passing the pre-interview frequency test.
- **Browser**: Modern Chromium-based browser (Chrome, Edge, Brave 90+), Firefox 90+, or Safari 15+.
