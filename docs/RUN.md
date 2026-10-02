# How to Run the Application

This guide contains the exact commands and steps to set up, configure, and run the **Ravengard AI Recruiter** platform on your machine.

---

## ⚡ Quickstart (One-Line Run)

If you already have your dependencies and environment configured:

```bash
npm run dev
```

The unified Full-Stack Express + React Vite development server will start immediately on **http://localhost:3000**.

---

## 🛠️ Step-by-Step Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL Database**: Local or Cloud instance (Cloud SQL, Supabase, Neon, or local Postgres)

### 2. Install Project Dependencies
Run the following command in the project root directory:

```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file to create your active `.env`:

```bash
cp .env.example .env
```

Verify or update the following key variables in `.env`:
```ini
PORT=3000
DATABASE_URL="postgres://postgres:postgres@localhost:5432/ravengard"
JWT_SECRET="ravengard_dev_jwt_secret_change_in_production"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 4. Initialize Database & Run Schema Migrations
The database schema and required initial data automatically sync when the server boots up via `src/db/syncFunnelTables.ts`. To manually run the assessment SLA timeout migration, execute:

```bash
npm run db:migrate
```

### 5. Start the Application
Run the development server with hot-module reloading and backend TypeScript execution:

```bash
npm run dev
```

Once running, you will see:
```
==================================================
  Ravengard AI Recruiter Enterprise Server
  Running on: http://localhost:3000
  Mode:       development
==================================================
```

---

## 🌐 Application Portals & URLs

| Portal | URL Path | Description |
| :--- | :--- | :--- |
| **Landing & Public Gateway** | `http://localhost:3000/` | Main product landing page with header navigation and Book a Demo modal. |
| **Candidate Careers Portal** | `http://localhost:3000/jobs` | Public listing of active and published job openings. |
| **Candidate Registration** | `http://localhost:3000/interview` | Candidate onboarding with International Country & STD Dialing Code Selector and real-time password entropy meter. |
| **HR & Admin Unified Login** | `http://localhost:3000/admin/login` | Secure enterprise login with Corporate Password and Enterprise SSO (Google Workspace, Microsoft Entra, Okta). |
| **HR Talent Suite** | `http://localhost:3000/hr` | ATS Pipeline, Multi-dimensional AI Rubric Builder, and Requisition Submissions. |
| **Admin Audit Dashboard** | `http://localhost:3000/admin` | Phase 7 Auditor Control Panel, Requisition Approvals (Admin Gate), Flagged Sessions, and Telemetry. |

---

## 🔑 Default Enterprise Credentials

| Role | Corporate Email | Default Password | Initial Destination |
| :--- | :--- | :--- | :--- |
| **HR Director** | `hr@ravengard.com` | `admin123` | `/hr` |
| **System Admin / Auditor** | `admin@ravengard.com` | `admin123` | `/admin` |

*(Note: Enterprise SSO buttons for Google Workspace, Microsoft Entra, and Okta are available directly on `/admin/login` for corporate authentication.)*

---

## 🧪 Quality & Verification Commands

To check types, build integrity, and run test suites:

```bash
# Type check and lint codebase
npm run lint

# Compile and validate production bundle
npm run build

# Start production server
npm start

# Run unit and integration tests
npm test
```
