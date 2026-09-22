# How to Run Ravengard AI Recruiter

This guide covers setting up, configuring, running, and testing the **Ravengard AI Recruiter** platform.

---

## 1. Prerequisites

Ensure your system has the required software installed (see [REQUIREMENTS.md](file:///e:/STUDIO%20Project/Ravengard/REQUIREMENTS.md) for full specs):
- **Node.js**: v18.18+ or v20+ (`node -v`)
- **npm**: v9+ (`npm -v`)
- **PostgreSQL**: Running locally or accessible via network (`5432`)

---

## 2. Installation

1. Clone or navigate to the project directory:
   ```bash
   cd "e:\STUDIO Project\Ravengard"
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

---

## 3. Environment Configuration

1. If you do not have a `.env` file, copy `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Verify that `.env` contains the required keys:
   ```env
   DATABASE_URL="postgresql://ravengard:ravengard_dev_2026@localhost:5432/ravengard"
   JWT_SECRET="<your_jwt_secret_here>"
   ACTUAL_SECRET="<your_actual_secret_here>"
   GEMINI_API_KEY="<your_gemini_api_key>"
   APP_URL="http://localhost:3000"
   PORT=3000
   NODE_ENV="development"
   ```

> **Tip:** You can generate secure secrets using Node:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 4. Database Setup & Migrations

Push the Drizzle ORM schema to your PostgreSQL database:

```bash
npm run db:push
```

If you need to generate explicit SQL migration files:
```bash
npm run db:generate
```

On server startup, default rubrics, organization entities, and the root administrator account (`admin@ravengard.com`) are automatically seeded.

---

## 5. Running the Application

### A. Development Mode (Recommended)
In development, Express and Vite run together in a unified process with hot reloading:

```bash
npm run dev
```

- **Candidate & Public Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Login Portal**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **API Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

### B. Production Mode
To build and run the optimized production bundle:

```bash
# 1. Build the frontend and bundle the server
npm run build

# 2. Run the production server
npm run start
```

---

## 6. Access Portals & Default Credentials

### 1. Admin & Reviewer Dashboard
- **URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Default Email**: `admin@ravengard.com`
- **Default Password**: `admin123` (or the hash configured in `.env` / database)
- **Capabilities**: View candidates, review session stages, inspect interview transcripts, inspect anti-cheat integrity flags, and view AI scorecards.

### 2. Candidate Assessment Flow
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Sequence**:
  1. Register with candidate details.
  2. Complete email verification.
  3. Accept consent policy (locks session).
  4. Upload Resume (`.pdf` or `.docx`).
  5. Complete Device Check (camera, mic, speaker).
  6. Enter Waiting Room.
  7. Start AI-driven interview stages.
  8. View completion & final scorecard.

---

## 7. Available Scripts & Testing

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server (`tsx server.ts` with Vite middleware) |
| `npm run build` | Cleans `dist`, generates sitemap, compiles Vite SPA & esbuild server |
| `npm run start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` / `npm run typecheck` | Validates TypeScript types across frontend and backend |
| `npm test` | Runs unit and integration test suite with Vitest |
| `npm run test:ui` | Opens interactive browser UI for Vitest |
| `npm run test:public-apis` | Executes automated tests against public API endpoints |
| `npm run test:admin:stress` | Runs concurrency and stress testing on admin routes |
| `npm run qa` | Validates route configuration and phase transitions |

---

## 8. Troubleshooting & FAQ

### 1. Database Connection Refused (`ECONNREFUSED 127.0.0.1:5432`)
- Ensure PostgreSQL service is started:
  - Windows: Check `services.msc` for PostgreSQL, or run `net start postgresql-x64-16`.
  - Linux/macOS: `sudo systemctl start postgresql` or `brew services start postgresql`.
- Confirm database credentials match `.env` `DATABASE_URL`.

### 2. Missing Environment Variables on Startup
- The `src/startupValidator.ts` enforces `DATABASE_URL`, `JWT_SECRET`, `ACTUAL_SECRET`, and `GEMINI_API_KEY`.
- If starting in `NODE_ENV=production`, ensure default placeholder strings are replaced with real secrets.

### 3. Port Already in Use (`EADDRINUSE :::3000`)
- Kill the process holding port 3000 or set `PORT=3001` in your `.env`.
