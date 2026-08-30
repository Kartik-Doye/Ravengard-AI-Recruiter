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
