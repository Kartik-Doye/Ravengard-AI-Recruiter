# Phase State Machine & Backend Authority Specification

## 1. Core Principle
The backend is the absolute state machine. The frontend is strictly a rendering layer that asks the backend "What am I allowed to show?" and "What is the result of my action?". Client-side route manipulation shall have zero impact on the actual session progression.

## 2. API Contract

### A. State Query Endpoint
**`GET /api/session/:id/state`**
Returns the source-of-truth state. The frontend router must react to this payload.
```json
{
  "current_phase": "interview_round_2",
  "status": "active",
  "locked": true,
  "allowed_actions": ["submit_round_audio", "use_think_again", "trigger_anti_cheat_violation"],
  "next_step_available": false
}
```

### B. Transition Endpoint
**`POST /api/session/:id/advance`**
Requests a phase progression.
- **Request:** `{ "target_phase": "interview_round_3", "payload": { ... } }`
- **Validation:** 
  1. Does `target_phase` legally follow `current_phase`?
  2. Are all required artifacts for `current_phase` successfully persisted?
- **Response:** `200 OK` (with new state) or `403 Forbidden` (if illegal or incomplete).

## 3. Strict 403 Forbidden Scenarios
The backend MUST block requests and return a 403 in the following out-of-order scenarios:

| Current Phase | Attempted Action | Backend Response | Reason |
| :--- | :--- | :--- | :--- |
| `registration` | `POST /api/resume/upload` | 403 Forbidden | Policy not consented, session not locked. |
| `intelligence` | `POST /api/session/advance` (to pre-flight) | 403 Forbidden | Resume parsing is not yet complete/persisted. |
| `pre_flight` | `POST /api/round/submit` | 403 Forbidden | Hardware not checked; interview hasn't started. |
| `interview_round_X` | `POST /api/session/advance` (to X+2) | 403 Forbidden | Cannot skip rounds. Sequence is strictly enforced. |
| *Any* | *Any normal action* | 403 Forbidden (if `status == 'failed'`) | Session was terminated due to anti-cheat. |
| `completed` | `POST /api/round/submit` | 403 Forbidden | Session is closed and finalized. |

## 4. Lock Enforcement
When `locked = true` (triggered upon policy consent in `registration`):
- The session cannot be deleted by the candidate.
- The session cannot revert back to `registration`.
- The `current_phase` can only step forward sequentially (or halt if `status = failed`).
