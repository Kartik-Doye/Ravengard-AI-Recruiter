# How to Run Ravengard AI Recruiter

This guide covers setting up, configuring, running, and testing the **Ravengard AI Recruiter** platform.

---

## 1. Prerequisites

Ensure your environment meets the baseline requirements:
- **Node.js**: `v18.18+` or `v20+` (`node -v`)
- **npm**: `v9+` (`npm -v`)
- **PostgreSQL**: Local or Cloud SQL instance (`5432`)

---

## 2. Installation

1. Navigate to the project root directory:
   ```bash
   npm install
   ```

---

## 3. Environment Configuration

1. Copy `.env.example` to create your active `.env`:
   ```bash
   cp .env.example .env
   ```

2. Verify or update the following configuration variables:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ravengard"
   JWT_SECRET="ravengard_dev_jwt_secret_change_in_production"
   GEMINI_API_KEY="your_gemini_api_key_here"
   APP_URL="http://localhost:3000"
   PORT=3000
   NODE_ENV="development"
   ```

---

## 4. Database Setup & Migrations

The server automatically runs `syncFunnelTables.ts` on startup to ensure all tables, billing tiers, and organizational schemas exist. To manually apply schema migrations:

```bash
npm run db:push
```

To seed initial demonstration data (completed candidates, rubrics, and sample job requisitions):

```bash
npm run seed
```

---

## 5. Development Server

Start the full-stack server (Express backend + React Vite client):

```bash
npm run dev
```

The application will be live at **http://localhost:3000**.

---

## 6. Portals & Key Routes

| Portal | Route | Description |
|---|---|---|
| **Public Landing** | `/` | Editorial dark theme landing page with system architecture. |
| **Candidate Gateway** | `/gateway` | Interactive assessment intake (Registration → Consent → Resume → Interview). |
| **Assessment Guide** | `/assessment-guide` | Dimension criteria, scoring weights, and candidate evaluation standards. |
| **Careers & Jobs** | `/careers` | Public job listings with instant application intake. |
| **HR Workspace** | `/hr` | Requisition draft builder (`/hr/jobs`) and ATS pipeline review (`/hr/ats`). |
| **Admin Workspace** | `/admin` | Job Approval Gate (`/admin/jobs`), Live Telemetry Quotas, and System Health. |
| **Enterprise Demo** | `/contact` | Enterprise consultation and scheduler. |

---

## 7. Testing & Quality Checks

Run TypeScript type-checking and automated tests:

```bash
# Type check & lint
npm run lint

# Production build test
npm run build

# Unit and integration test suite
npm test
```
