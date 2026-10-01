# Ravengard AI Recruiter — Complete End-to-End Testing Guide (Phases 1 to 7)

This guide provides step-by-step instructions for testing and evaluating the entire Ravengard AI Recruiter platform across all 7 architectural phases.

---

## Quick Reference: Test Portals & Demo Accounts

| Role / Portal | URL Path | Demo Email / ID | Demo Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate Portal** | `/portal` or `/candidate/login` | `candidate@ravengard.com` | `demo123` | Workday-style inbox, 60-min MCQ test, voice interview, offer letter execution |
| **Candidate Interview Flow** | `/interview` | New registration or auto-generated session | *(N/A or registered password)* | Linear 7-phase locked candidate onboarding & interview journey |
| **HR Workspace** | `/hr` or `/hr/login` | `hr@ravengard.com` | `password123` | Job requisitions, 4-stage approval workflow, blind candidate review, offer generator |
| **Enterprise Admin Console** | `/admin` or `/admin/login` | `admin@ravengard.com` | `admin123` | CISO audit logs, Token FinOps, SCIM 2.0 / SAML directory sync, candidate pipeline |

---

## Phase-by-Phase Testing Walkthrough

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Phase 1:        │ ──> │ Phase 2:         │ ──> │ Phase 3:         │ ──> │ Phase 4:          │
│ Foundation      │     │ Device Check     │     │ Waiting Room     │     │ Interview Engine  │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └───────────────────┘
                                                                                    │
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐               │
│ Phase 7:        │ <── │ Phase 6:         │ <── │ Phase 5:         │ <─────────────┘
│ Admin Access    │     │ Final Report     │     │ Anti-Cheat Layer │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

---

### Phase 1 — Foundation: Onboarding & Resume Intelligence
**Goal:** Verify locked candidate onboarding, policy consent, locked session creation, and AI resume extraction.

1. **Navigate to:** `/interview`
2. **Step 1: Registration Form**
   - Fill in:
     - **Full Name:** `Alex Chen`
     - **Email:** `alex.chen@example.com`
     - **Phone:** `+1 555-0199`
     - **College:** Select from dropdown (e.g. `Stanford University`)
     - **Degree:** `B.S. Computer Science`
     - **Graduation Year:** `2024`
     - **Age Confirmation:** Check the 18+ verification box.
   - Click **Complete Registration & Proceed**.
3. **Step 2: Welcome Screen & Instructions**
   - Review the candidate overview checklist and privacy notices.
   - Click **Proceed to Policy Consent**.
4. **Step 3: Policy Consent & Session Lock**
   - Accept the EEOC Compliance, AI Assessment, and Anti-Cheat recording policy.
   - Click **Accept & Lock Session**.
   - *Verification:* The session is now locked in PostgreSQL (`locked: true`, `status: 'active'`). Refreshing the browser automatically resumes from this exact stage.
5. **Step 4: Resume Upload & Parsing**
   - Upload any sample `.pdf`, `.docx`, or `.txt` resume (or use the sample PDF button).
   - Click **Analyze Resume**.
   - *Verification:* The resume intelligence engine parses skills, experience, education, and creates an ATS-grade profile scorecard.

---

### Phase 2 — Device Check: Hardware Readiness
**Goal:** Ensure hardware permissions and capabilities are strictly validated prior to entering the interview environment.

1. **Step:** Upon resume analysis completion, you are automatically routed to the `/interview/device-check` stage.
2. **Camera Check:**
   - Click **Test Camera** to grant permission. Verify the live video mirror appears.
3. **Microphone Check:**
   - Click **Test Microphone** and speak. Verify the real-time audio VU volume meter responds.
4. **Speaker Test:**
   - Click **Play Test Audio** to verify clear system audio playback.
5. **Browser Compatibility:**
   - Verify green checkmarks for WebRTC, MediaDevices API, and full-duplex audio support.
6. Click **Confirm Hardware Readiness & Proceed**.

---

### Phase 3 — Waiting Room: Pre-Interview Holding Stage
**Goal:** Explicit candidate readiness confirmation and holding environment.

1. **Step:** Screen displays the **Waiting Room** holding status.
2. **Verification items:**
   - Candidate details and selected job role (`Senior Distributed Systems Engineer`) are displayed.
   - Time allocation and round structure are listed.
3. Click **I Am Ready — Begin Interview**.

---

### Phase 4 — Interview Engine: Conversational AI Loop
**Goal:** Live conversational interview with adaptive question generation and response streaming.

1. **Step:** You enter the live AI interview room (`/interview/engine`).
2. **AI Question Streaming:**
   - Sarah (AI Technical Recruiter) speaks and streams the opening technical question:
     > *"Could you describe a distributed systems incident you resolved involving high database lock contention?"*
3. **Candidate Response:**
   - Type or speak your answer in the response area.
   - Click **Submit Response**.
4. **Turn Loop Progression:**
   - AI evaluates your answer contextually and dynamically asks deeper technical follow-ups (e.g., connection pool exhaustion, write-ahead logs, outbox pattern).
   - Complete 3–4 questions to finish the interview session.
5. Click **Finalize & Complete Interview**.

---

### Phase 5 — Anti-Cheat & Integrity Layer
**Goal:** Invisible, non-blocking telemetry logging and anomalous behavior detection.

1. **How to test:**
   - While on the interview screen or MCQ assessment, switch tabs (`Alt + Tab` or click outside browser).
   - *Telemetry verification:* A silent signal (`tab_switch` / `tab_blur`) is dispatched to `/api/candidate/assessment/signal` and logged with timestamp in the `integrity_signals` database table without interrupting the candidate's flow.
2. **Risk Scoring:**
   - Backend aggregates signals to compute a risk score (`0` to `100`). High-risk sessions are flagged for human HR review.

---

### Phase 6 — Final Report: Structured Evaluation & Scorecard
**Goal:** Zero-shot rubric scoring and executive summary generation.

1. **Step:** Upon completing the interview, you are routed to the **Final Report** page (`/interview/report`).
2. **Verification items:**
   - **Overall Score:** (e.g. `94/100` or `4.7/5.0`).
   - **Competency Breakdown:**
     - Technical Depth (SQL & Architecture)
     - Problem Solving (STAR Methodology)
     - Communication & Team Alignment
   - **Key Strengths:** Bulleted evidence-backed achievements.
   - **Identified Gaps / Growth Areas:** Concrete actionable feedback.
   - **Final Recommendation:** `STRONG_HIRE` / `HIRE` / `WEAK_HIRE` / `NO_HIRE`.

---

### Phase 7 — Admin & HR Access: Enterprise Control Center

#### A. Enterprise Admin Console (`/admin`)
1. **Navigate to:** `/admin/login`
2. **Login Credentials:** `admin@ravengard.com` / `admin123`
3. **Core Tabs to Test:**
   - **Live Candidates Pipeline:** Filter by score, integrity flags, and stage.
   - **FinOps & Token Consumption:** Real-time token usage charts, cost-per-candidate breakdown ($0.04/assessment), and daily burn rate.
   - **CISO Security & SCIM 2.0:** Audit logs with IP tracking, single sign-on configuration, and EEOC four-fifths compliance audits.
   - **Enterprise Whitelabeling:** Real-time theme customization (Primary color, logo, company portal branding).

#### B. HR Workspace (`/hr`)
1. **Navigate to:** `/hr/login`
2. **Login Credentials:** `hr@ravengard.com` / `password123`
3. **Core Workflows to Test:**
   - **Job Requisitions:** View active listings, create new requisitions with 4-stage approval workflow.
   - **Candidate Dossiers:** Blind candidate review (PII hidden to eliminate bias), radar skill charts, and rubric evidence snippets.
   - **Offer Management:** Issue dynamic compensation offer packages.

#### C. Returning Candidate Portal (`/portal`)
1. **Navigate to:** `/portal`
2. **Login Credentials:** `candidate@ravengard.com` / `demo123`
3. **Core Features to Test:**
   - **Workday-Style Inbox:** Active applications with 24-hour SLA countdown timer.
   - **60-Minute Adaptive MCQ Battery:** Interactive technical test with countdown timer and automatic grading.
   - **Offer Letter Execution:** Real-time digital signature and downloadable employment agreement.

---

## Technical Verification & Health Checks

Run these commands from the terminal to verify backend services and database connectivity:

```bash
# 1. Check API Health
curl -s http://localhost:3000/api/health

# 2. Test Candidate Demo Login Endpoint
curl -s -X POST http://localhost:3000/api/candidate/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@ravengard.com","password":"demo123"}'

# 3. Test Admin Login Endpoint
curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ravengard.com","password":"admin123"}'
```
