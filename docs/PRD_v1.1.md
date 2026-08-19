# RAVENGARD
## Product Requirements Document (PRD)
**AI-Powered Interview Screening Platform — B2B (Hiring & Screening)**

| | |
|---|---|
| **Version** | 1.1 (Key decisions locked — see Decision Log, §19) |
| **Status** | Pre-build — for stakeholder & engineering review |
| **Prepared** | August 2026 |
| **Audience** | Founders, Product, Engineering (Frontend/Backend/AI), QA, Compliance |

---

## 1. Product Vision & Problem Statement

**Vision:** Ravengard AI Recruiter is an AI interviewer that a company can hand a job requisition to, and get back a ranked, evidence-backed shortlist of candidates — each with a full transcript, scorecard, and integrity report — without a human recruiter sitting through first-round interviews.

**Problem it solves for the buyer (company/HR team):**
- First-round screening interviews are the highest-volume, most repetitive, most time-consuming part of hiring.
- Human screeners are inconsistent — two recruiters score the same candidate differently.
- Resume shortlisting (ATS) misses good candidates and passes bad ones because it's keyword-only.
- There's no structured, comparable, auditable record of *why* a candidate was screened in or out.

**What Ravengard AI Recruiter delivers:** a single locked, automated pipeline — resume intelligence → structured multi-persona interview → scored evaluation → ranked recommendation — that a company can trust as a defensible first-pass filter before a human ever gets involved.

**Secondary benefit to the candidate:** a real interview-practice experience, a personalized learning roadmap, and a career coach — which improves candidate experience/brand perception for the hiring company, and is the retention hook for the candidate to come back and use their dashboard again.

---

## 2. Target Users

| Persona | Role | What they need |
|---|---|---|
| **Company Admin** | Buys/owns the account | Org setup, billing, seat management, team roles |
| **Recruiter / HR** | Day-to-day operator | Create job roles, invite candidates, monitor pipeline, read reports |
| **Hiring Manager** | Reviewer, may not log in daily | Read-only report access, compare shortlist, approve/reject |
| **Candidate** | Takes the assessment | Clear instructions, fair process, transparency after completion, a reason to return (dashboard, roadmap, coach) |

> **Note:** Your original flow spec only described the **candidate** experience in deep detail. Sections 6.1, 7.1 and the Recruiter Console below are additions required to make this a functioning B2B product — the candidate flow alone has no way for a company to actually configure a role, invite someone, or see results. Flag this if it wasn't intended to be in V1.

---

## 3. Business Model

- **Model:** B2B SaaS, sold to company HR/Talent Acquisition teams.
- **Pricing axis (recommend validating with early customers):** per completed assessment (credit-based) rather than per seat, since value is delivered per candidate screened, not per recruiter login.
- **Packaging idea:** Starter (pay-as-you-go credits) → Growth (monthly credit bundle + multiple job roles + team seats) → Enterprise (SSO, custom persona weighting, API/ATS integration, dedicated data residency).
- Candidate-side dashboard/coach is **not monetized directly** in V1 — it's a retention/brand-quality feature that makes companies look good and keeps candidates coming back through the same funnel (some products later upsell candidates directly here — flagged as a V2/V3 option, not V1).

---

## 4. Scope

### In Scope — V1
- Full candidate assessment pipeline (registration → report → dashboard), exactly as specced, running as a **locked sequential state machine**.
- Recruiter Console: job role setup, candidate invites, results dashboard, PDF/report access.
- 9-persona AI interview engine with shared memory, adaptive/follow-up questioning, voice conversation.
- Resume Intelligence Engine (ATS score, extraction, gap analysis).
- Scoring engine, 4-band final recommendation.
- Learning Roadmap + Career Coach (candidate-facing).
- Anti-cheat/integrity monitoring (camera-based, browser-based).
- PDF report generation, email delivery, database persistence.

### Out of Scope — V1 (explicitly deferred)
- Photorealistic video AI avatar (see §8.3 for reasoning — V2/V3 candidate).
- ATS/HRIS integrations (Workday, Greenhouse, etc.) — API-ready architecture, but no pre-built connectors in V1.
- Native mobile apps (V1 is responsive web only).
- Multi-language interview delivery beyond candidate's selected "Preferred Language" for UI copy (AI conversation itself launches in **English only** in V1 — flag if this is wrong for your market).
- Candidate-to-candidate benchmarking/leaderboards.
- Human-in-the-loop override UI for recruiters to re-score or annotate (**confirmed**: V1 is fully AI-scored, hands-off — recruiters can read but not touch scores or add review notes. See accepted risk in §17.).

---

## 5. Core Architecture Principle: The Locked Session State Machine

This is the single rule everything else in this PRD is built around, so it's stated once, explicitly, up front:

> **The candidate never chooses what screen they see next. The server does.** Every phase transition in the pipeline is decided and enforced server-side. The frontend is a renderer of "whatever state the server says I'm in" — it is never a router the candidate can navigate freely.

**Why this matters (not just a UX preference — it's the integrity backbone of a hiring product):**
- Prevents candidates from skipping the technical round, replaying the aptitude round, or reordering personas to game the interview.
- Makes the assessment **comparable across candidates** — everyone goes through the identical sequence, which is what makes scores defensible if a rejected candidate disputes the outcome.
- Makes **auto-resume** trivial: if the browser closes, the server already knows exactly where the candidate was.

**Enforcement mechanism:**
- Each `AssessmentSession` has a single authoritative `current_phase` field in the database.
- Every "advance to next screen" action is a server call that (a) validates the current phase, (b) validates the required data for that phase was actually submitted, (c) atomically updates `current_phase`, (d) returns the *next* phase + its payload.
- The frontend has **no local state that can render a phase the server hasn't confirmed.** No `history.push()`-style free navigation. No back button that goes anywhere except "reload current state from server."
- Direct URL access to any phase route re-fetches state from the server and redirects to the *actual* current phase if it doesn't match.

**Full phase list (state machine enum):**

```
REGISTERED
CONSENT_PENDING
SESSION_LOCKED               ← point of no return, session created
RESUME_UPLOAD
RESUME_ANALYSIS
INTERVIEW_INSTRUCTIONS
DEVICE_CHECK
WAITING_ROOM
INTERVIEW_HR_FRIENDLY
INTERVIEW_HR_PROFESSIONAL
INTERVIEW_APTITUDE
INTERVIEW_TECHNICAL
INTERVIEW_SENIOR_ENGINEER
INTERVIEW_TECH_LEAD
INTERVIEW_BEHAVIOR
INTERVIEW_STARTUP_FOUNDER
INTERVIEW_STRICT
REFLECTION
ASSESSMENT_PROCESSING        ← async, candidate sees a progress screen
ROADMAP_GENERATION
CAREER_COACH
REPORT_READY
COMPLETED
```

> **⚠ Open question — persona order conflict:** your two flow diagrams disagree on order. Diagram 1: `Friendly HR → Aptitude → Professional HR → Technical...`. Diagram 2 (the branded "RAVENGARD" one, which reads as the more finalized version): `Friendly HR → Professional HR → Aptitude → Technical...`. **This PRD uses Diagram 2's order** (HR-friendly, HR-professional, then the two assessment rounds, then the four expert personas). Confirm before build.

---

## 6. End-to-End Flow

### 6.1 Recruiter / Company Flow (new — required for B2B)

```
Sign up / SSO → Create Company Profile
        │
        ▼
Create Job Role
  • Title, department, seniority level
  • Required skills / tech stack (drives Technical round question bank)
  • Which of the 9 personas are included (toggle per role — e.g. a
    non-technical role may skip Tech Lead/System Design)
  • Question counts per round (default: Aptitude 20, Technical 60 —
    see §17 Risk on this number)
  • Think-Again allowance (default 2, configurable)
  • Pass-band thresholds (override the platform default rubric, §9)
        │
        ▼
Invite Candidates
  • Bulk CSV upload or single email/mobile invite
  • Each invite generates a unique, single-use, expiring session link
        │
        ▼
Recruiter Console (ongoing)
  • Pipeline view: Invited → In Progress → Completed → Reviewed
  • Per-candidate report (identical PDF the candidate can also see,
    plus recruiter-only sections: cross-candidate rank, integrity
    flags, raw transcript search)
  • Compare view: side-by-side scorecards for shortlisting
  • Export (CSV of scores, bulk PDF download)
```

### 6.2 Candidate Flow — Before Ravengard AI Recruiter

1. **Landing Page** (branded per company, via the invite link)
2. **Candidate Registration** — Full Name, Mobile, Email, College, Degree, Graduation Year, Preferred Language. *(Since this is B2B screening, the invite link should pre-fill/lock the email the invite was sent to, to prevent one person taking the assessment on someone else's behalf — flagged as an identity-integrity gap in your original spec.)*
3. **Welcome Screen** — "Enhance your interview experience," estimated time, requirements checklist (internet/camera/mic/quiet room), **`START RAVENGARD`** button.
4. **Policy & Consent** — Privacy Policy, T&Cs, Camera/Mic permission, AI Evaluation consent, Data Storage consent, Assessment Rules. Checkbox **"I Agree"** → **`ENTER RAVENGARD`**.
   - **This is the last free exit point.** Explicit warning shown before the click, exactly as you specified: *"Before clicking: candidate may exit. After clicking: session created, assessment locked — no restart, no skip, no manual phase selection, auto-resume if browser closes."*
   - Clicking `ENTER RAVENGARD` is the exact moment `AssessmentSession` is created server-side and `current_phase` becomes `SESSION_LOCKED`.

### 6.3 Candidate Flow — Inside Ravengard AI Recruiter

| Phase | What happens | Auto-transition trigger |
|---|---|---|
| **Resume Upload** | Candidate uploads PDF/DOCX (drag-drop or file picker). Client-side validates file type/size (recommend 5MB cap) before upload. | Successful upload + server-side parse confirmation |
| **AI Resume Intelligence Engine** | Runs automatically, no candidate action. Parses resume → ATS score → extracts skills/projects/experience/education/certifications → computes strengths/weaknesses/missing keywords → generates a recruiter-facing "Recruiter Review" summary. Candidate sees a progress animation, not raw internals. | Analysis pipeline completion (target: <30s) |
| **Interview Instructions** | Static + dynamic content: rules, process overview, time estimate, explanation of AI follow-ups, explanation of the Think-Again mechanic, auto-save assurance, one more explicit agreement checkbox for "I understand this is a monitored, recorded, AI-evaluated assessment." | Candidate clicks acknowledgment button |
| **Device Check** | Automated checks: camera preview renders, mic input level detected (candidate asked to say a test phrase), speaker test (plays a tone, candidate confirms audible), browser/OS compatibility check, internet speed test (min bandwidth threshold), permission grants confirmed. | All checks pass. **If a check fails:** show specific remediation instructions (not just "failed") and allow retry — do not silently block. |
| **AI Waiting Room** | Welcome message, live camera preview, countdown timer, brief AI self-introduction (text + voice) explaining what's about to happen. | Countdown reaches zero |
| **Interview (9 personas)** | See §7 for full detail per persona. | Each persona's exit criteria met (see §7.3) |
| **Candidate Reflection** | 3 free-text/voice prompts: *How do you think you performed? What was the most difficult question? What would you improve?* Feeds the report and gives the scoring engine a self-awareness signal. | Submission (all 3 answered — allow skip on any single one, don't hard-block) |
| **AI Assessment Engine** | Async processing screen ("Analyzing your interview…"). Aggregates resume + ATS + every round's transcript/score + reflection into the final evaluation. | Processing complete (target: <60s; if longer, candidate can safely close tab — report emailed when ready) |
| **Learning Roadmap** | 30-day plan, week-by-week, generated from the *specific* gaps found (missing keywords, weak rounds, missed follow-ups) — not a generic template. | Candidate views/dismisses |
| **AI Career Coach** | Career advice, skill recommendations, learning resources, future prep — conversational or static, candidate's choice. | Candidate views/dismisses |
| **Final Report** | Full report rendered in-app + downloadable PDF (see §7.11 for exact contents). | — |
| **Email Report** | PDF + summary emailed to candidate; recruiter separately notified "Candidate X completed assessment" with a Console link (not the raw PDF, to keep recruiter-only data like integrity flags out of a forwardable email). | Automatic |
| **Database Storage** | Full persistence — see §10. | Automatic |
| **Candidate Dashboard** | Persistent home for this candidate going forward: Interview History, Progress, Reports, PDF Downloads, Learning Roadmaps, Career Coach, Profile/Settings. | `current_phase = COMPLETED` |

---

## 7. Functional Requirements — Deep Detail Per Module

### 7.1 Resume Intelligence Engine
- **Parsing:** extract raw text from PDF/DOCX (handle multi-column layouts, tables, images-as-text failures — flag low-confidence parses for the candidate to review before continuing rather than silently producing garbage).
- **ATS Score:** composite of keyword match against the job role's required-skills list, formatting parseability, section completeness. Show the score **and** the "why" (which keywords matched/missing) — a bare number with no explanation isn't actionable for the candidate or defensible to the company.
- **Extraction targets:** skills, projects (with inferred tech stack per project), work experience (title/company/duration), education, certifications.
- **Strengths / Weaknesses:** generated by comparing extracted profile against the target job role's requirements, not generic resume advice.
- **Missing Keywords:** role-specific gap list.
- **Recruiter Review:** a recruiter-only short paragraph — plain-language summary a human can skim in 10 seconds before opening the full report.

### 7.2 Interview Instructions
Must explicitly and clearly explain, in candidate-facing language: how AI follow-up questions work, what "Think Again" means and how many uses remain, that auto-save means nothing is lost on disconnect, and what happens if they simply don't answer (see §8.4).

### 7.3 The 9-Persona Interview Engine

All personas share one thing: a **Shared AI Memory** object carried through the whole session — resume data, ATS analysis, every prior transcript turn, and every prior persona's private "interviewer notes." Later personas can reference earlier answers ("You mentioned earlier you led a team of 4 — tell me about a conflict in that team") — this is what makes it feel like one continuous interview rather than 9 disconnected chatbots.

| # | Persona | Focus | Question source | Exit criteria |
|---|---|---|---|---|
| 1 | **Friendly HR** | Greeting, ice-breaking, self-intro, communication style | Scripted opener + 1 resume-grounded follow-up | Fixed ~4-6 turns |
| 2 | **Professional HR** | Career goals, teamwork, strengths/weaknesses | Semi-scripted bank + adaptive follow-up | Fixed ~5-7 turns |
| 3 | **Aptitude Assessment** | English, Maths, Logical, Scenario, Complexity | Pulled from a versioned question bank, difficulty-adaptive | **Adaptive — stops once confidence threshold reached, ceiling of 20** (confirmed, §17) |
| 4 | **Technical Assessment** | Role-specific technical knowledge | Question bank filtered by the Job Role's tech stack, dynamically generated per candidate via LLM grounded in resume + role requirements | **Adaptive — stops once confidence threshold reached, ceiling of 60** (confirmed, §17) |
| 5 | **Senior Software Engineer** | Projects, coding concepts, technologies, resume-based deep dive | 100% resume-grounded — every question must cite something from the extracted project/experience data | Adaptive, ends when project coverage threshold met |
| 6 | **Tech Lead** | System design, architecture, scalability, optimization | Scenario bank scaled to seniority level from resume | Fixed scenario count (e.g. 2-3 design problems) |
| 7 | **Behavior Assessment** | Leadership, ethics, decision-making, situational | STAR-style behavioral bank | Fixed ~5-6 questions |
| 8 | **Startup Founder** | Innovation, ownership, startup thinking, motivation, learning mindset | Semi-scripted + adaptive | Fixed ~4-5 questions |
| 9 | **Strict Interviewer** | Pressure round, final challenge, confidence, professionalism | Scripted rapid-fire + one deliberately hard follow-up | Fixed, time-boxed |

**Cross-cutting mechanics active in every persona round:**
- **Voice Conversation:** Speech-to-Text captures the candidate's spoken answer → LLM processes → Text-to-Speech delivers the next question. Candidate video is recorded/analyzed but the AI does not "see" the candidate — audio is the interview channel (see §8.3).
- **Adaptive Follow-ups:** if an answer is vague, contradicts the resume, or is unusually strong, the persona may ask exactly one grounded follow-up before moving on (cap follow-ups to avoid runaway session length).
- **Think Again (2 uses, session-wide default, configurable per Job Role):** candidate can request to re-answer their most recent response. Re-answering does **not** reveal what was "wrong," it simply lets them re-record. Counter is visible in the UI at all times; button disables at zero.
- **Auto Save:** every turn (question + answer + timestamp + audio/video reference) is persisted within ~2 seconds of capture — before the UI even advances.
- **Session Recovery:** on reconnect (refresh, crash, connection drop), the server returns the exact `current_phase` and, within a persona round, the exact turn index — candidate resumes mid-round, not from the top of that persona.
- **Timer & Progress Tracker:** visible elapsed time and "Round 4 of 9" style progress, so the candidate always has orientation (important given the earlier "no manual navigation" rule — candidates need to *feel* in control even though they can't navigate).
- **Anti-Cheat Monitoring:** see §8.5.

### 7.4 Reflection
Three prompts, candidate can answer by voice or text. Optional-but-encouraged (don't hard-block a candidate who declines).

### 7.5 AI Assessment Engine
Aggregation pipeline: Resume → ATS → Aptitude → Technical → Interview (personas 1,2,5-9) → Behavior → Reflection → Interviewer Notes (private notes each persona wrote about the candidate during their round) → Final Evaluation. See §9 for exact weighting.

### 7.6 Learning Roadmap
30-day plan, 4 weeks, each week built from the *specific* weaknesses surfaced (e.g. Week 1 might be "System design fundamentals" only if Tech Lead round scored low — not a static template every candidate gets).

### 7.7 AI Career Coach
Career advice, skill recommendations (with real, current learning resources — this should use the web-search-grounded content generation approach, not hallucinated course names), future preparation guidance.

### 7.8 Final Report — exact contents
Candidate Information · ATS Score · Resume Review · Aptitude Score · Technical Score · Interview Score · Behavior Score · Reflection · Recruiter Notes · Resume Intelligence Summary · Question-by-Question Summary · Strengths · Weaknesses · Learning Roadmap · Career Coach Summary · Session Integrity Score · Full Interview Transcript · Final Recommendation band · **Download Professional PDF**.

**Two report variants from the same data:**
- **Candidate-facing PDF:** everything except cross-candidate ranking and raw integrity event logs (show a summary integrity statement, not a forensic log, to the candidate).
- **Recruiter-facing view (in-Console, not necessarily downloadable):** everything the candidate sees **plus** rank among other candidates for that Job Role, raw integrity event timeline, and full searchable transcript.

### 7.9 Candidate Dashboard
Interview History, Progress History, Reports, PDF Downloads, Learning Roadmaps, Career Coach (persistent, revisitable), Profile Management. Since a candidate may be invited to multiple Ravengard AI Recruiter assessments by different companies over time, the dashboard should be **candidate-account-scoped**, not session-scoped.

---

## 8. AI System Architecture

### 8.1 Orchestration & Shared Memory
A single **Session Orchestrator** service owns the state machine and the shared memory object. Each persona is not a separate "agent" with its own memory — it's a **prompt configuration** (system prompt + question bank + tone rules) that the orchestrator loads and feeds the *same* running memory object into. This is what makes "Shared AI Memory" real rather than marketing language: persona #7 (Behavior) literally receives persona #3's (Aptitude) transcript and persona #1-6's interviewer notes as context.

### 8.2 Persona Prompt Framework
Every persona's system prompt is built from a shared template with persona-specific slots:
```
[Persona identity + tone]  →  fixed, versioned per persona
[Candidate context]        →  resume summary + ATS gaps + Job Role requirements
[Session memory]           →  prior personas' Q&A + interviewer notes (summarized, not full raw transcript, to manage context length)
[This round's objective]   →  what this persona must assess
[Guardrails]                →  see §15, injected identically into every persona
[Question bank / policy]   →  scripted bank, adaptive-generation rules, or hybrid
```
Prompts are **versioned and stored in the database/config, not hardcoded in application code** — this lets a non-engineer (or at least a controlled admin flow) tune interview behavior without a redeploy, and lets you A/B test or roll back a persona's behavior if it starts misbehaving in production.

### 8.3 Voice Pipeline — Recommendation

You asked for the best balance of cost vs. experience. Recommendation: **voice-only conversational AI with a lightweight animated avatar/waveform (not photorealistic lip-synced video).**

| | Voice-only + light avatar | Photorealistic video avatar |
|---|---|---|
| Cost | ~$0.05–0.15 per candidate-minute (STT+LLM+TTS) | ~$0.50–2.00+ per candidate-minute (avatar rendering APIs) |
| Latency per turn | ~1–2 seconds achievable | ~2–5+ seconds, harder to make feel natural |
| Candidate experience | Feels like a real phone/voice interview — strong enough for screening | Feels more "wow" but diminishing returns for a *screening* use case |
| Engineering complexity | Moderate | High — extra vendor, extra failure mode, extra latency budget to manage across 9 rounds |
| Where it pays off | V1 launch, all screening scenarios | Consider for V2/V3 as a premium tier once volume justifies the cost |

**Stack shape:** STT (e.g. Deepgram or Whisper-class) → LLM (persona reasoning + question generation) → TTS (e.g. ElevenLabs-class neural voice, one consistent voice per persona for continuity). Candidate's own webcam feed is recorded and analyzed **only for anti-cheat**, not for the AI to "see" the candidate — this simplifies the AI pipeline considerably and is the honest description of what a voice-based system does.

### 8.4 Adaptive Questioning, Silence & Timeout Handling
- If a candidate is silent past a timeout (recommend 15-20s), the AI prompts once ("Take your time — would you like to answer, or should I move to the next question?"), then proceeds automatically after a second timeout. **Never loop indefinitely.**
- Follow-up questions are capped per turn (recommend max 1) so a single question can't spiral into an unbounded sub-interview and blow the time budget.

### 8.5 Anti-Cheat / Integrity Monitoring
- **Face presence:** flag if no face detected for >N seconds.
- **Multi-face detection:** flag if more than one face appears in frame.
- **Gaze/attention heuristic:** flag sustained looking-away-from-screen patterns (heuristic signal, not a hard fail on its own).
- **Tab/window focus:** detect tab switches or window blur during active questions.
- **Copy-paste detection:** on any text-input fields (reflection, if candidate types instead of speaks).
- **Audio anomaly:** flag secondary voices in the background (possible answer-feeding).
- **Recording integrity:** full session audio+video retained (with clear consent, see §12) for a defined retention period for dispute review.
- **Output:** all flags roll up into a single **Session Integrity Score** + a private event timeline (recruiter-only, per §7.8). Individual flags should **never** auto-reject a candidate — they inform a human review, because false positives (bad lighting, shared housing noise, a second monitor glance) are common and an AI-only auto-reject on integrity is both unfair and a compliance risk.

---

## 9. Scoring & Recommendation Rubric

**Default weighting (configurable per Job Role in the Recruiter Console):**

| Component | Weight |
|---|---|
| Resume / ATS | 10% |
| Aptitude | 15% |
| Technical (dynamic) | 25% |
| Senior Engineer + Tech Lead (deep technical/system design) | 20% |
| Professional HR + Behavior | 15% |
| Startup Founder (mindset) | 5% |
| Strict Interviewer (composure under pressure) | 5% |
| Reflection (self-awareness modifier) | 5% |

**Default recommendation bands (configurable):**

| Score | Band |
|---|---|
| 85–100 | Selected |
| 70–84 | Selected with Recommendation |
| 50–69 | Needs Improvement |
| 0–49 | Not Selected |

**Explainability requirement:** every component score must be traceable to specific transcript excerpts and resume facts (see Dev Rule §14.10) — this is what makes the recommendation defensible to a company's legal/compliance team if a rejected candidate ever challenges the decision.

**Confirmed for V1:** scoring is **fully AI-generated with no recruiter edit/override path** — recruiters read the score and rationale but cannot change it. Because there's no human safety net behind a rejection, the explainability requirement above is not optional polish — it's the only defense if a decision is ever disputed. Treat §14.10 as a hard gate, not a nice-to-have.

---

## 10. Data Model (Core Entities)

```
Company          (id, name, plan, seats, sso_config)
RecruiterUser     (id, company_id, name, email, role[admin|recruiter|viewer])
JobRole           (id, company_id, title, required_skills[], persona_toggle{},
                   question_counts{}, think_again_limit, rubric_weights{}, pass_thresholds{})
CandidateInvite    (id, job_role_id, email, mobile, token, expires_at, status)
Candidate         (id, name, mobile, email, college, degree, grad_year, language)
AssessmentSession (id, candidate_id, job_role_id, current_phase, created_at,
                   locked_at, completed_at, think_again_used)
ResumeAnalysis     (session_id, ats_score, skills[], projects[], experience[],
                   education[], certifications[], strengths[], weaknesses[],
                   missing_keywords[], recruiter_review_text)
InterviewTurn      (id, session_id, persona, question_text, answer_transcript,
                   audio_ref, video_ref, is_followup, think_again_used, ts)
InterviewerNote     (session_id, persona, note_text)   -- private, feeds later personas
RoundScore         (session_id, persona/round, score, rationale_text)
IntegrityEvent      (session_id, type, severity, ts, evidence_ref)
FinalReport         (session_id, band, overall_score, pdf_ref, generated_at)
LearningRoadmap      (session_id, week_1..week_4 json)
CareerCoachOutput    (session_id, advice_text, resources[])
EmailLog             (session_id, recipient, type, sent_at, status)
```

---

## 11. API Surface (high-level)

```
Candidate side
  POST   /invites/:token/register
  POST   /sessions                       (created on consent accept)
  GET    /sessions/:id/state             (authoritative current phase)
  POST   /sessions/:id/resume
  GET    /sessions/:id/resume-analysis
  POST   /sessions/:id/device-check
  WS     /sessions/:id/interview         (realtime voice turn exchange)
  POST   /sessions/:id/interview/think-again
  POST   /sessions/:id/reflection
  POST   /sessions/:id/finalize
  GET    /sessions/:id/report
  GET    /candidates/:id/dashboard

Recruiter side
  POST   /companies
  POST   /job-roles
  POST   /job-roles/:id/invites
  GET    /job-roles/:id/pipeline
  GET    /job-roles/:id/candidates/:candidateId/report
  GET    /job-roles/:id/compare?candidateIds=...
  GET    /analytics
```

---

## 12. Non-Functional Requirements

- **Compliance:** **confirmed India-first for V1** — candidate PII, resume content, and biometric-adjacent audio/video data are governed by India's **Digital Personal Data Protection Act (DPDP) 2023**: explicit itemized consent (already in your flow), a defined retention period, right to deletion, and a data processing agreement between Ravengard AI Recruiter and each customer company. Since expansion beyond India is a stated future goal (not this V1), don't hardcode India-only assumptions into the schema or consent logic — keep `data_residency_region`, consent-clause versioning, and currency/locale fields on `Company`/`Candidate` generic now so GDPR (or another regime) is a config addition later, not a schema migration.
- **Fairness/bias:** because this drives real hiring decisions, scoring logic and prompts should be periodically audited for disparate outcomes across candidate groups. Log enough to support that audit (see Dev Rule §14.10).
- **Availability:** the live interview is the single point where a mid-session outage is worst — target high uptime specifically for the WS/voice pipeline, with graceful degradation (auto-save + resume, not data loss) rather than pure uptime numbers alone.
- **Performance:** target end-to-end voice turn latency (candidate stops speaking → AI starts responding) under ~2 seconds to keep the conversation feeling natural.
- **Browser support:** modern evergreen browsers (Chrome/Edge/Safari/Firefox latest 2 versions) — camera/mic APIs are inconsistent on older browsers, so the Device Check step should hard-block unsupported browsers with a clear message rather than let them fail mid-interview.
- **Accessibility:** candidates with speech or hearing impairments need an alternate path (text-based fallback for both input and output) — recommend this be a documented accommodation request flow rather than silently degrading the AI experience.

---

## 13. Recommended Tech Stack (advisory — build plan is TBD)

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | Next.js + TypeScript, Tailwind | Server-driven routing suits the locked-state-machine model well; strong WebRTC ecosystem for camera/mic |
| Backend | Node.js (NestJS) | First-class WebSocket support for the realtime voice pipeline; TypeScript shared types with frontend |
| Database | PostgreSQL | Relational integrity matters here — state machine transitions, scoring, and audit trails are inherently relational |
| Cache / Realtime pub-sub | Redis | Session state cache, WS scaling |
| Object storage | S3-compatible | Resumes, audio/video recordings |
| Queue | BullMQ (or equivalent) | Async report/PDF generation, roadmap generation |
| LLM | Claude (Anthropic) | Persona reasoning, adaptive question generation, scoring rationale generation |
| STT | Deepgram-class provider | Low-latency streaming transcription |
| TTS | ElevenLabs-class provider | Natural neural voice, consistent per-persona voice identity |
| Anti-cheat (client) | MediaPipe / face-api.js in-browser | Lightweight, no extra vendor cost for basic face/gaze signals |
| PDF generation | Headless-browser rendering (e.g. Puppeteer) | Full control over the professional report layout |
| Hosting region | India-based cloud region (e.g. AWS ap-south-1 or equivalent) for V1 | Matches the India-first decision and simplifies DPDP data-residency posture; pick a provider with other regions available so later expansion is a deploy, not a re-architecture |

---

## 14. Engineering / Developer Rules

1. **The server is the only source of truth for `current_phase`.** The client never renders a phase it hasn't fetched/confirmed from the server. No client-side routing between assessment phases.
2. **Every phase transition is atomic and idempotent** (DB transaction) — a duplicate "advance" call must not double-advance or corrupt state.
3. **Invalid transitions are rejected server-side (409), always** — even if a bug or a malicious client tries to call `/finalize` before `/reflection` is submitted.
4. **Auto-save within ~2 seconds of every candidate action**, committed before the UI is allowed to progress.
5. **Session Recovery must restore to the exact turn**, not just the phase — a refresh mid-question should not lose that question's partial state.
6. **One active session per candidate-invite, enforced server-side** (no duplicate/parallel sessions).
7. **All AI calls are logged**: prompt version, model, persona, tokens, latency, cost — this is required for both cost governance and behavior audits.
8. **No hardcoded question banks or persona prompts in application code.** They live as versioned config/DB rows so behavior can be tuned or rolled back without a redeploy.
9. **Field-level encryption** for high-sensitivity PII (mobile, email) and encryption-at-rest for resumes, audio, and video.
10. **Every AI-generated score must carry a rationale tied to specific transcript/resume evidence** — no opaque numeric-only scores. This is both a UX requirement (§7.8) and a compliance requirement (§12).
11. **Every external AI/voice provider call has a timeout + a defined fallback path** (e.g., secondary TTS provider) so a single vendor blip doesn't hard-fail a live interview session.
12. **State-machine transition tests (valid and invalid paths) are a CI gate** — this state machine is the product's integrity guarantee, so it cannot regress silently.
13. **Per-session cost governor**: token/audio-minute budget with alerting if a session's AI spend exceeds an expected threshold (protects against a stuck adaptive-follow-up loop burning cost).
14. **Feature flags at the Job-Role level**, not global — persona inclusion, question counts, and weighting are per-role config, never hardcoded per company.
15. **Keep locale assumptions out of core logic.** Region/data-residency, currency, phone-number format, and consent-clause version live as fields on `Company`/`Candidate`, not hardcoded constants — V1 ships India-only in practice, but expansion should mean adding config, not rewriting the schema.

---

## 15. AI / "Trainer" Behavior Rules

These are the rules every persona's prompt must obey, injected identically as guardrails (§8.2) regardless of which persona is speaking:

1. Each persona has a **fixed, versioned personality** and must not wander into topics outside its defined objective.
2. The AI **never reveals live scores, pass/fail status, or how the candidate compares to others** during the interview.
3. The AI **must not ask about protected characteristics** (age, religion, marital/family status, disability, caste, etc.) — hard prohibited-topics filter, both for fairness and for compliance with Indian labor-law norms and general anti-discrimination practice.
4. Follow-up questions must be **grounded only in this session's own data** (resume, ATS analysis, this candidate's prior answers) — never a fabricated claim about the candidate.
5. **Silence handling is bounded** (§8.4) — one prompt, then automatic progression. No infinite waiting.
6. **"Think Again" replays the same question only** — it never reveals the "correct" answer or hints at what was wrong with the prior attempt.
7. **Escalation path:** if the candidate expresses distress, reports a technical problem, or asks for human help, the AI must surface a "contact support" option rather than continuing the script as if nothing happened.
8. **The Strict Interviewer persona pressure-tests professionalism, not the candidate's dignity** — an explicit boundary: challenging, rapid-fire, higher-difficulty questioning is in-bounds; hostility, ridicule, or discriminatory remarks are never in-bounds, regardless of "realism."
9. **Scoring must be reasonably reproducible** — the same transcript should not produce wildly different scores on reruns; this should be regression-tested, not left to model non-determinism.
10. **Every word the AI says is logged verbatim to the transcript** — required for both the candidate-facing report and any dispute/compliance review.

---

## 16. Success Metrics (V1)

- **Completion rate:** % of candidates who start and finish the full pipeline without abandoning (this is directly at risk from the time-budget issue flagged in §17 — worth tracking from day one).
- **Time-to-shortlist:** company's time from "invite sent" to "report reviewed," vs. their pre-Ravengard AI Recruiter baseline.
- **Recruiter trust signal:** % of AI "Selected"/"Selected with Recommendation" candidates a human recruiter actually advances — a proxy for whether the scoring is trusted, not just delivered.
- **Session integrity flag rate:** % of sessions with any integrity flag, and false-positive rate on manual review (tune anti-cheat sensitivity against this).
- **Candidate dashboard return rate:** % of candidates who come back to use the roadmap/coach after their assessment — signals whether the candidate-side retention hook is actually working.

---

## 17. Risks & Assumptions to Validate Before Build

- **✅ Decided — Aptitude/Technical are adaptive-length.** Both rounds stop early once the engine reaches a confidence threshold on the candidate's level (typically ~8-15 questions in practice), with 20/60 as hard ceilings only for edge cases. This resolves the original mismatch against the "60–90 Minutes" promise on the Welcome screen, and meaningfully reduces AI cost per session (this also fully addresses what used to be a separate "60 dynamic questions = high LLM cost" risk). Engineering should treat 20/60 as *maximums to design for*, not *targets to always hit*.
- **Persona order conflict** between your two diagrams — resolved as Diagram 2's order in this PRD (§5); confirm.
- **Identity integrity:** nothing in the current flow stops someone other than the invited candidate from taking the assessment (proxy interviewing). Recommend binding the invite link to the invited email/mobile and considering an ID-verification step for high-stakes roles — flagged as a gap, not yet in scope.
- **✅ Decided — AI-only scoring, no recruiter override, accepted as a risk.** There is deliberately no human-adjustable record behind a rejection in V1. This remains a live dispute-risk if a rejected candidate ever challenges a decision, and it raises §9's explainability requirement and Dev Rule §14.10 from "good practice" to "the only line of defense." Worth revisiting post-launch once real dispute volume (if any) is known.

---

## 18. Phased Delivery (recommended, since timeline is TBD)

- **Phase 1 — MVP:** Registration → Consent → Resume Intelligence → 3-4 core personas (Friendly HR, Aptitude, Technical, Professional HR) → basic report → basic Recruiter Console (create role, invite, view report). Validates the core loop end-to-end before building all 9 personas.
- **Phase 2 — Full Interview Engine:** all 9 personas, Shared AI Memory, adaptive follow-ups, Think-Again, anti-cheat monitoring, Learning Roadmap, Career Coach.
- **Phase 3 — Scale & Compliance:** recruiter compare/analytics view, ATS integrations, compliance audit for whichever new markets are actually entered (DPDP is already the V1 baseline; GDPR etc. when expansion happens), optional premium video-avatar tier.

---

## 19. Decision Log & Remaining Open Questions

**Locked (v1.1):**
- ✅ Aptitude/Technical rounds are **adaptive-length**, ceilings of 20/60 (§7.3, §17).
- ✅ Scoring is **AI-only — no recruiter override or annotation** in V1 (§9, §17).
- ✅ V1 targets **India first** (DPDP-only compliance scope for now), architected so GDPR or other regimes are a later config addition, not a rebuild (§12, §14).

**Still open for sign-off:**
1. Confirm persona order (§5 flag — the two source diagrams disagree).
2. Confirm identity-verification requirement for the invite link (proxy-candidate risk, §17).
3. Confirm pricing model (per-credit vs. per-seat) before the Recruiter Console billing UI is designed (§3).

---

*End of PRD v1.1*
