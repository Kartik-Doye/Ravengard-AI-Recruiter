# Phase State Machine Specification

This document defines the strict phase progression logic enforced by the Ravengard backend.
The backend acts as the single source of truth for all phase transitions. The frontend UI simply reflects the state authorized by the backend.

## State Anatomy
The phase state is defined in the `sessions` table via the following fields:
- `current_phase` (enum): The current active step in the interview loop.
- `locked` (boolean): When true, manual out-of-order phase selection is blocked.
- `status` (enum): `active`, `paused`, `completed`, `failed`, `cancelled`.
- `version` (integer): Optimistic concurrency control (OCC) to prevent race conditions during state transitions.

## The Valid Transitions Matrix
If `locked = true`, the `/api/session/:id/stage` route MUST enforce the following directional flow graph. Any transition not explicitly defined here MUST result in a 403 Forbidden.

| Current Phase | Allowed Next Phase | Condition |
| :--- | :--- | :--- |
| `registration` | `intelligence` | User profile is created successfully. |
| `intelligence` | `pre_flight` | Resume is uploaded (parse begins asynchronously). |
| `pre_flight` | `instructions` | Device checks pass successfully. |
| `instructions` | `interview_round_1` | Candidate acknowledges instructions. |
| `interview_round_X` | `interview_round_X+1` | Round `X` completes, outputs are validated, and limit (8) is not reached. |
| `interview_round_8` | `assessment` | Final round completes, generating the final assessment report. |
| `assessment` | `completed` | Candidate views the final report. |

## 403 Forbidden Scenarios (State Conflicts)

The backend MUST reject state mutation requests under the following conditions:

1. **Out-of-Order Transition (Invalid Path)**:
   - *Example*: A candidate attempts to jump from `instructions` directly to `interview_round_2` by manipulating the client-side API call.
   - *Result*: 403 Forbidden. "Invalid phase transition. Manual phase selection is locked."

2. **Concurrency Conflict (Stale Version)**:
   - *Example*: The client attempts to transition to `pre_flight`, but a background job has already transitioned the session. The client's `version` payload does not match the database.
   - *Result*: 409 Conflict. "Session state changed."

3. **Status Conflict (Session Terminated)**:
   - *Example*: A session is marked as `failed` (e.g., due to permanent hardware denial), but the client attempts to advance the phase.
   - *Result*: 403 Forbidden. "Session is no longer active."

4. **Missing Prerequisites**:
   - *Example*: A client attempts to enter `interview_round_1`, but the database shows the device checks (pre_flight) were never completed or logged.
   - *Result*: 403 Forbidden. "Prerequisite steps incomplete."

## Asynchronous Unblocking
The `intelligence` phase (Resume Upload) transitions to `pre_flight` immediately upon successful upload. The LLM parsing job is enqueued in the background. If the candidate reaches `interview_round_1` before the parse completes, the backend will either supply a placeholder persona or briefly delay the websocket initialization—but it will *never* block the phase progression itself.
