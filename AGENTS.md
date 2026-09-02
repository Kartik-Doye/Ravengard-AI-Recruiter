# Developer Iron Rules

These rules are mandatory for all development on this project. The agent must strictly adhere to them.

## Definitions
* **Shall** = mandatory requirement.
* **Shall not** = forbidden behavior.
* **Should** = recommended, non-binding guidance.
* **Will** = statement of fact or external dependency.

## Brutal Enforcement Version
* Do not guess.
* Do not freestyle.
* Do not improvise flows.
* Do not skip validation.
* Do not hide failures.
* Do not change contracts without updating docs.
* Do not let the frontend become the source of truth.
* Do not let AI invent facts.
* Do not merge unfinished critical flows.
* Do not treat unclear requirements as “developer judgment.”

## Developer Rules
* Do not change the product flow unless the document explicitly allows it.
* Do not invent screens, fields, API endpoints, or database columns.
* Do not skip a phase, merge phases, or reorder the user journey.
* Do not make assumptions when requirements are unclear; stop and ask.
* Do not add extra logic that changes the candidate experience without approval.
* Do not allow manual phase selection once the session is locked.
* Do not bypass policy consent, device checks, or session locking.
* Do not store AI output unless it matches the agreed schema.
* Do not accept partial success for a critical flow.
* Do not mark a phase complete unless every required chunk passes.
* Do not use vague terms like “fast,” “optimized,” or “user-friendly” unless measured.
* Do not write code that cannot be traced to a requirement.
* Do not ship a feature without tests for success and failure paths.
* Do not hardcode prompt text inside random components; centralize it.
* Do not use different names for the same thing across files. Use one term only.
* Do not ignore edge cases such as browser crash, refresh, timeout, or network loss.
* Do not silently fail. Every failure must produce a visible error and a logged event.
* Do not create UI only. Every UI action must map to backend state.
* Do not create backend logic without frontend handling for loading, error, and retry states.
* Do not merge code without updating documentation if behavior changed.

## Hard Engineering Rules
* One requirement = one behavior.
* One API endpoint = one responsibility.
* One prompt = one output schema.
* One screen = one user goal.
* One phase = one locked state transition.
* Every output must be verifiable by test.
* Every critical action must be persisted.
* Every persisted state must be recoverable.
* Every AI response must be schema-validated.
* Every phase transition must be server-authorized.

## Quality Gates
* No code gets merged without passing lint, type check, and tests.
* No AI prompt gets approved without sample input/output validation.
* No endpoint gets merged without request/response examples.
* No phase gets marked done unless the happy path and failure path both work.
* No document gets finalized unless it matches implementation reality.

## Failure Handling Rules
* If a requirement is unclear, stop and ask before coding.
* If an AI response is malformed, reject it and retry with a fallback.
* If a browser permission fails, show the reason and recovery steps.
* If a session is locked, it stays locked unless an admin override is explicitly defined.
* If data is missing, do not guess; return an error.

## Change Control Rules
* No scope change without written approval.
* No prompt change without versioning.
* No schema change without migration.
* No API change without contract update.
* No behavioral change without release notes.

## Non-negotiables
* Security comes before convenience.
* Deterministic flows come before clever flows.
* Validation comes before persistence.
* Persistence comes before reporting.
* Documentation comes before scale.

## Trainee Developer Rules
### Scope control
* The developer shall not change the candidate journey, phase order, or lock behavior without written approval.
* The developer shall not add, remove, or rename any screen, API, field, or database table unless the specification is updated first.
* The developer shall not create shortcuts, alternate flows, or hidden admin behavior unless the document explicitly defines them.
* The developer shall not assume missing behavior; any unclear requirement shall be raised before implementation.
* The developer shall not merge partial implementations for critical flows such as registration, consent, resume upload, interview start, or final report.

### Flow integrity
* The candidate flow shall be strictly sequential unless the spec explicitly allows a branch.
* Once policy is accepted, the session shall be locked and shall not be restartable by the candidate.
* Manual phase selection shall not be possible after session lock.
* Every phase transition shall be triggered by the backend, not by the frontend alone.
* A phase shall be marked complete only when all required chunks in that phase are complete and validated.

### Data and state
* Every candidate action that changes state shall be persisted.
* Every persisted state shall be recoverable after refresh, crash, or reconnect.
* The developer shall not guess missing data values; missing data shall return a validation error.
* AI output shall be saved only if it matches the approved schema.
* Any schema mismatch shall be treated as a failure, not silently corrected in the UI.

### AI behavior
* Every AI prompt shall have one purpose and one output schema.
* The developer shall not embed prompt text randomly inside UI components.
* The developer shall not let the AI invent data, scores, or resume facts.
* If AI output is malformed, the system shall reject it and retry using the approved fallback path.
* AI-generated content shall be versioned; prompt edits shall not be made silently.

### UI and backend contract
* Every UI action shall map to a backend event or persisted state.
* Every backend endpoint shall have a matching frontend loading state, success state, and failure state.
* The frontend shall not display completion unless the backend confirms it.
* The backend shall not trust client-side validation for critical actions.
* The developer shall not bypass permission checks, consent checks, or device checks.

### Quality and testing
* Every requirement shall be testable.
* Every feature shall have a success-path test and at least one failure-path test.
* Every API endpoint shall have request and response examples.
* Every AI prompt shall be tested with sample inputs and expected outputs.
* Every release shall pass linting, type checking, unit tests, and integration tests before merge.

### Error handling
* The system shall not fail silently.
* Every failure shall produce a visible message to the candidate and a logged event for the system.
* Network loss, browser refresh, and crash recovery shall be handled explicitly.
* If a critical service is unavailable, the session shall pause or fail safely rather than continue with partial data.
* The developer shall not hide errors behind generic success screens.

### Documentation and change control
* Any behavioral change shall be reflected in the documentation before release.
* Any API change shall require updated contract documentation.
* Any database change shall require a migration and schema update.
* Any prompt change shall require version increment and sample validation.
* Any scope change shall require explicit approval.

## Project Phase Definitions (The Roadmap)

### Phase 1 — Foundation
This phase is the locked candidate onboarding core. It covers the path from registration up to resume analysis, and nothing beyond that should leak into it.
*   **Included:** Registration, Welcome screen, Policy consent, Locked session creation, Resume upload, Resume parsing and resume intelligence, Session recovery through the candidate state endpoint, Route guarding for allowed steps only.
*   **Exit condition:** The whole locked journey works end to end. No Phase 2 logic appears in the foundation. The flow is signed off and frozen.

### Phase 2 — Device Check
This is the first expansion after Phase 1 sign-off. It validates whether the candidate device is ready before the interview journey can continue.
*   **Included:** Camera permission check, Microphone permission check, Speaker test, Browser compatibility check, Permission blocked/denied fallback handling, Session persistence for device readiness, Route protection to prevent bypass.
*   **Exit condition:** Device check passes reliably. Blocked and denied states are handled cleanly. The candidate can only continue when readiness is confirmed.

### Phase 3 — Waiting Room
This is the controlled holding stage before the interview begins.
*   **Included:** Post-device-check waiting state, Auto-transition setup, Candidate readiness confirmation, Final pre-interview holding screen.
*   **Exit condition:** Candidate is prepared and the system can safely start the interview flow.

### Phase 4 — Interview Engine
This phase contains the actual interview experience.
*   **Included:** Auto-start interview stages, Stage sequencing, Round-specific logic, Adaptive progression if used, Candidate response capture.
*   **Exit condition:** Interview stages complete and outputs are saved correctly.

### Phase 5 — Anti-Cheat / Integrity Layer
This phase protects interview trust and evaluation quality.
*   **Included:** Suspicious behavior detection, Integrity signals, Cheat-risk tracking, Candidate monitoring rules, Fallback or alert generation when issues occur.
*   **Exit condition:** Integrity checks are active and logged with the interview flow.

### Phase 6 — Final Report
This phase turns the interview outcome into a reviewable result.
*   **Included:** Score generation, Summary report, Strengths and gaps, Candidate performance analysis, Final structured output.
*   **Exit condition:** Report is generated and stored successfully.

### Phase 7 — Admin Access
This phase is separate from the candidate journey and should stay isolated from the foundation.
*   **Included:** Admin login, Role-based access, Candidate/session/report review, Internal dashboards, Protected admin routes.
*   **Exit condition:** Admin can securely access internal views without exposing candidate flows.

### Phase Separation Rule
The important rule is that each phase should be **strictly gated** by the previous one. Candidate routes, backend session state, and database flags should enforce this order so no later phase can be entered early.

### Simple Order Map
1. Foundation
2. Device Check
3. Waiting Room
4. Interview Engine
5. Anti-Cheat / Integrity
6. Final Report
7. Admin Access

## Architectural Decisions & Tech Stack Rationale

### Authentication & Identity (Why Firebase?)
We use **Firebase Auth** exclusively for Identity and Access Management, while strictly keeping all relational interview data, candidate sessions, and anti-cheat signals in **Cloud SQL (PostgreSQL)**. 
- **Strict Identity Verification**: Firebase provides battle-tested, enterprise-grade secure JWT verification (`getAuth().verifyIdToken()`). This prevents token forgery, which is critical for Phase 5 (Anti-Cheat) where confirming the candidate's true identity is paramount.
- **Passwordless/Secure Links**: We rely on Firebase Admin SDK to natively generate secure email verification links, removing the liability of managing our own password hashes or custom auth tokens.
- **Separation of Concerns**: Firebase acts as the "Bouncer" at the door. Once authenticated, Cloud SQL handles the complex relational integrity of the interview flows (`sessions`, `interviewQuestions`, `integritySignals`), ensuring we can query and link responses to cheat signals without being restricted by a NoSQL document structure.

### Phase 4 Interview Streaming Transport (Why SSE?)
We chose **Server-Sent Events (SSE)** over WebSockets for the AI Interview Engine streaming:
- **Directional Mapping**: The text interview is inherently a one-way streaming requirement (prompt sent as standard HTTP POST, AI tokens streamed back via SSE). 
- **Resilience**: SSE leverages standard HTTP mechanics, making it much more resilient behind strict corporate firewalls, VPNs, and proxies—common environments for candidates taking enterprise assessments.
- **State Recovery**: SSE natively handles automatic reconnection, which perfectly aligns with our Phase 1 "Locked Session Recovery" mandate.

### Phase 5 Anti-Cheat Isolation
- **Silent Telemetry**: Integrity signals (`tab_blur`, `gaze_off`) are sent asynchronously via a dedicated endpoint (`/api/interview/:id/signal`).
- **Non-Blocking**: The interview engine (Phase 4) is completely unaware of the evaluation logic. It simply streams questions and captures responses, while the backend silently aggregates integrity flags to be evaluated in Phase 6.

### Phase Summary & Tech Stack Map

| Phase                      | Purpose                                                            | Key screens                                                           | Exit criteria                                                                                           | Tech stack                                                                                                              |
| -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 — Foundation             | Locked candidate onboarding and resume intelligence                | Registration, Welcome, Policy Consent, Resume Upload, Resume Analysis | Candidate journey is locked, one-way, and recoverable; no Phase 2+ logic leaks in                       | React, Vite, Node/Express, PostgreSQL, Drizzle ORM, Firebase Auth, unpdf, mammoth                                       |
| 2 — Device Check           | Validate candidate hardware and permissions before interview       | Device Check screen (camera, mic, speaker, browser)                   | Device readiness is confirmed and persisted; blocked/denied states handled cleanly                      | React, browser MediaDevices API, Permissions API, backend session state, Drizzle schema extension                       |
| 3 — Waiting Room           | Holding state and explicit readiness confirmation before interview | Waiting Room screen with “I’m Ready” trigger                          | Candidate can only enter interview after explicit readiness; route protection enforced                  | React, ProtectedRoute, session stage guard, backend transition endpoint                                                 |
| 4 — Interview Engine       | Core conversational AI interview loop                              | Interview Engine screen (one question at a time, streaming answers)   | Questions stream smoothly, responses are saved, session state is preserved; no Phase 5/6 logic mixed in | React, SSE (default) or WebSocket, Node/Express streaming endpoint, interview session model, AI LLM integration         |
| 5 — Anti-Cheat / Integrity | Monitor and flag suspicious behavior during interview              | (Invisible layer + optional proctoring UI)                            | Integrity signals are logged, risk scores computed, high-risk sessions flagged for review               | Backend signal collectors, visibility/blur events, anomaly detection rules, risk scoring logic, integrity_signals table |
| 6 — Final Report           | Generate structured score and candidate report                     | Report screen (overall score, breakdown, strengths, gaps)             | Report is generated only after interview completion; scores and data persist correctly                  | Backend scoring engine, report generation, React report UI, scorecards/reports table                                    |
| 7 — Admin Access           | Secure internal access to candidates, sessions, and reports        | Admin login, dashboard, candidate/session/report views                | Admin can securely access internal data; candidate flows remain isolated                                | React admin UI, RBAC middleware, protected routes, admin session handling                                               |

### Phase 6 Final Report Generation (Why Gemini API directly?)
- **Zero-Shot Extraction**: We leverage the \`@google/genai\` SDK directly from the Node backend to process all Q&As at the end of the interview. Gemini is highly capable of parsing conversational transcripts into strict JSON objects containing rubric breakdowns, strengths, and weaknesses without requiring a complex intermediate NLP microservice.

## Phase 7 — Admin Access task list

### Goal
Build a secure admin dashboard with role-based access control (RBAC) for reviewing candidates, sessions, interviews, and reports, without exposing or modifying the candidate flow.

### Backend tasks
- [ ] Define `admin_users` and `admin_roles` tables.
- [ ] Implement RBAC middleware for admin routes.
- [ ] Create admin-only endpoints for:
  - listing candidates,
  - viewing sessions,
  - accessing interview transcripts,
  - viewing scorecards and reports,
  - flagging sessions for review.
- [ ] Log all admin actions for auditability.
- [ ] Keep admin logic completely separate from candidate routes.

### Frontend tasks
- [ ] Build an admin login screen.
- [ ] Build a dashboard with:
  - candidate list,
  - session list,
  - interview detail view,
  - report viewer,
  - flags/review queue.
- [ ] Protect admin routes with RBAC guards.
- [ ] Ensure no candidate can reach admin screens.

### Test cases
- [ ] Admin can log in and see dashboards.
- [ ] Non-admin cannot access admin routes.
- [ ] Admin can view candidate data and reports.
- [ ] Admin actions are logged.

## Scoring engine backend architecture

Use a **two-plane design**: a lightweight real-time path for the interview, and an async scoring path for deep evaluation.

### Components
- **Interview orchestrator:** manages live session state and turn loop.
- **Async scorer:** evaluates the transcript against a rubric, computes scores, and writes the scorecard.
- **Rubric service:** stores criteria, weights, and versions.
- **Scorecard store:** persists final scores and evidence.

### Data flow
1. Interview completes and transcript is stored.
2. Async scorer loads the transcript and rubric.
3. Scorer evaluates each answer against competencies.
4. Scores are aggregated and written to `scorecards`.
5. Report generation reads from `scorecards`.

## Phase 5 integrity hooks review

You already have the right foundation: an `integritySignals` table and a `/api/interview/:id/signal` endpoint. The key is to keep Phase 4 clean and only log signals, not block the flow.

### Recommended signals
- `tab_blur`
- `gaze_off`
- `window_switch`
- `long_pause_before_answer`
- `sudden_text_appearance`
- `multiple_device_indicator`

### Rules
- Log all signals with timestamps.
- Compute a risk score asynchronously.
- Flag sessions for human review when risk exceeds a threshold.
- Do not interrupt the interview in real time.

## Competency vs answer weighting

Weight the scoring engine toward **competency demonstration** rather than raw answer polish, but still reward clarity.

### Suggested weighting
- **Competency match:** 50–60%
  - Does the answer show the skill or behavior the question targets?
- **Answer quality:** 30–40%
  - Clarity, structure, relevance.
- **Other factors:** 10%
  - Examples, depth, reasoning.

Use an explicit rubric per competency and keep temperature low for scoring to reduce variance.

## FinalReport component schema

Here is a clean schema shape for the final report component.

```ts
interface FinalReport {
  candidateId: string;
  sessionId: string;
  overallScore: number;          // 0–100 or 0–5 scale
  breakdown: {
    technical: number;
    communication: number;
    behavioral: number;
    culturalFit?: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong_hire" | "hire" | "weak_hire" | "no_hire";
  rubricVersion: string;
  generatedAt: string;           // ISO timestamp
  evidence: {
    questionId: string;
    competency: string;
    score: number;
    notes: string;
  }[];
}
```

## Step-by-step implementation plan for the scoring engine backend

### Step 1 — Define the rubric model
- [ ] Create a `rubrics` table (`id`, `jobId`, `version`, `createdAt`).
- [ ] Create a `rubric_criteria` table (`id`, `rubricId`, `name`, `weight`, `description`).
- [ ] Seed an initial rubric for first role templates.

### Step 2 — Extend the interview data model
- [ ] Ensure `interviewSessions` links to a `rubricId`.
- [ ] Ensure `interviewQuestions` can be tagged with one or more `rubric_criteria`.
- [ ] Ensure `interviewResponses` are linked to `interviewQuestions` and `interviewSessions`.

### Step 3 — Build the async scorer worker
- [ ] Create a background worker or queue consumer.
- [ ] On interview completion, enqueue a scoring job with `sessionId`, `rubricId`, transcript reference.
- [ ] Worker loads transcript, rubric, question–criterion mapping.

### Step 4 — Implement the scoring logic
For each question:
- [ ] Load the associated criteria.
- [ ] Call the LLM judge with question text, candidate answer, criterion description, weight.
- [ ] Receive a per-criterion score (e.g., 0–5 or 0–100).
- [ ] Store raw scores in a `question_scores` table.
Aggregate to session level:
- [ ] Compute weighted scores per criterion.
- [ ] Compute overall score as a weighted sum of criterion scores.

### Step 5 — Persist the scorecard
- [ ] Create a `scorecards` table (or update `interview_reports`).
- [ ] Write the final scorecard after aggregation.

### Step 6 — Generate strengths and weaknesses
- [ ] Use the LLM to summarize high/low-scoring areas with short, evidence-backed phrases.
- [ ] Attach these to the scorecard record.

### Step 7 — Expose the report API
- [ ] Create `GET /api/scorecard/:sessionId`.
- [ ] Return the structured report payload matching the `FinalReport` schema.
- [ ] Ensure only authorized roles can access it.

### Step 8 — Wire the frontend report
- [ ] Build `FinalReport.tsx` to consume the scorecard API (Read-only UI).

### Step 9 — Add calibration and versioning
- [ ] Store `rubricVersion` on each scorecard.
- [ ] Allow rubric updates without breaking old reports.
- [ ] Optionally add a calibration step where humans review a sample.

### Step 10 — Observability and safety
- [ ] Log scoring job start/end and errors.
- [ ] Track average scoring latency.
- [ ] Add a retry policy for failed jobs.
- [ ] Ensure scoring failures do not block the candidate from seeing a basic report (fallback).

## Phase 7 — Admin Access: implementation plan

### Step 1 — Define admin roles and permissions

- [ ] Create `admin_users` table:
  - `id`
  - `email`
  - `name`
  - `role` (`admin`, `reviewer`, `viewer`)
  - `createdAt`
- [ ] Define permissions per role:
  - `admin`: full access to candidates, sessions, reports, flags.
  - `reviewer`: read candidates/sessions/reports, update flags and status.
  - `viewer`: read-only access to aggregated data.

### Step 2 — Secure admin authentication

- [ ] Implement admin login endpoint.
- [ ] Issue admin-specific JWTs or session tokens.
- [ ] Add middleware to verify admin role on protected routes.
- [ ] Log all admin login attempts.

### Step 3 — Build admin data endpoints

Create admin-only endpoints for:

- [ ] `GET /api/admin/candidates` — list candidates with filters.
- [ ] `GET /api/admin/sessions` — list sessions with status and stage.
- [ ] `GET /api/admin/sessions/:id` — detailed session view.
- [ ] `GET /api/admin/reports` — list scorecards and reports.
- [ ] `GET /api/admin/reports/:sessionId` — full report for a session.
- [ ] `GET /api/admin/flags` — review queue for flagged sessions.
- [ ] `POST /api/admin/sessions/:id/flag` — add or update a flag.
- [ ] `POST /api/admin/sessions/:id/status` — update session status.

### Step 4 — Design the admin dashboard UI

- [ ] Build an admin login screen.
- [ ] Build a dashboard with:
  - candidate list,
  - session list,
  - report viewer,
  - flags/review queue.
- [ ] Add filters for:
  - job role,
  - stage,
  - score range,
  - flag status.

### Step 5 — Candidate and session detail views

- [ ] Candidate detail page:
  - profile info,
  - resume summary,
  - session history.
- [ ] Session detail page:
  - stage timeline,
  - interview transcript,
  - scorecard,
  - integrity signals summary.

### Step 6 — Report viewer

- [ ] Reuse the `FinalReport` component in read-only mode.
- [ ] Show:
  - overall score,
  - breakdown,
  - strengths,
  - weaknesses,
  - evidence array.

### Step 7 — Review queue and flags

- [ ] Build a review queue screen:
  - list of flagged sessions,
  - risk score,
  - quick filters.
- [ ] Allow reviewers to:
  - mark as reviewed,
  - add notes,
  - change status.

### Step 8 — Route protection

- [ ] Gate all `/admin/*` routes behind admin auth.
- [ ] Ensure non-admin users cannot access admin screens.
- [ ] Log access attempts to admin routes.

### Step 9 — Audit logging

- [ ] Log:
  - admin logins,
  - report views,
  - status changes,
  - flag updates.

### Step 10 — Observability and safety

- [ ] Add error handling for admin endpoints.
- [ ] Monitor admin usage and latency.
- [ ] Ensure admin actions do not break candidate flows.

## Admin dashboard schema notes

### `admin_users`
```ts
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "reviewer" | "viewer";
  createdAt: string;
}
```

### `admin_logs`
```ts
interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  target: string; // e.g., "session:abc123"
  timestamp: string;
  metadata?: Record<string, any>;
}
```

## Phase 7 Security — Rate Limiting

- **Global limiter** for all routes.
- **Stricter limiter** for sensitive routes (login, password reset, admin endpoints).
- **Per-user and per-IP limits** on sensitive endpoints.

### Implementation sketch (Express + express-rate-limit)
```ts
import rateLimit from "express-rate-limit";

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // per IP
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many admin requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/admin", adminLimiter);
```


## Ponytail, lazy senior dev mode
You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:
1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:
- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `ponytail:` comment naming the ceiling and upgrade path.

Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.
