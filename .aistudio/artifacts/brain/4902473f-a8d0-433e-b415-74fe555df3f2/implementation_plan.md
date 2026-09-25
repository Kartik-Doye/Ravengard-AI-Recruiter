# Implementation Plan: Internal Shadow-Calibration Run & High-Fidelity Telemetry

Configure Ravengard for an internal engineering team shadow-calibration trial with high-fidelity telemetry, real-time signal diagnostics, and audit logging to establish baseline scoring accuracy and anti-cheat fidelity before the public domain cutover.

---

## User Review Required

> [!IMPORTANT]
> **Calibration Scope & Data Isolation**: All internal calibration interview runs will be tagged with a distinct `is_calibration: true` metadata flag. This ensures calibration sessions are analyzed separately from live candidates and can be reviewed side-by-side with human interviewer scorecards without corrupting production baseline metrics.

- **Internal Reviewer Cohort**: Verify that engineering tech leads and hiring managers have reviewer permissions in the admin console.
- **Scoring Rubric Alignment**: Calibrate AI rubric weights (Technical 50%, Communication 30%, Behavioral 20%) against human scorecard ratings.
- **Telemetry Retention**: Confirm high-fidelity audit trail retention parameters for calibration sessions.

---

## Proposed Changes

### 1. Calibration Session Tagging & Cohort Management
- Add support for a `calibration` run mode when generating candidate assessment invites from the Admin Requisitions panel.
- Ensure calibration sessions track full dual-plane evaluations:
  - Automated AI scoring breakdown.
  - Human panel shadow scoring form for side-by-side variance analysis.
  - Inter-rater reliability (IRR) / delta scoring calculator.

### 2. High-Fidelity Telemetry & Diagnostic Inspector
- Enhance Admin / Reviewer session detail views with a real-time Telemetry Trace stream:
  - **Latency Traces**: Measure AI SSE response time, voice stream latency, and candidate turn-taking pauses (>1.8s flag).
  - **Anti-Cheat Signal Feed**: Visualize tab blurs, window switches, prosody consistency, and cross-modal discrepancies with millisecond timestamps.
  - **State Machine Event Log**: Detailed records of stage gate transitions (Device Check -> Waiting Room -> Interview Rounds -> Final Report).

### 3. Comprehensive Audit Trail & Calibration Export Package
- Build an exportable **Calibration & Audit Summary Package** (JSON / CSV / Structured Report) containing:
  - AI score breakdown vs human interviewer ground truth.
  - Anti-cheat signal breakdown with false-positive / true-positive analysis.
  - Complete immutable audit logs for compliance review.

---

## Verification Plan

### Automated & Integration Tests
- Run backend and schema checks (`compile_applet` & `lint_applet`).
- Verify calibration session isolation: ensure calibration data does not pollute production requisition candidate pipelines.
- Verify audit log event emission across all session stages.

### Manual Walkthrough & UI Verification
- Generate an internal calibration invite from the Admin Dashboard.
- Complete a simulated interview session with triggered telemetry signals.
- Inspect the Admin Telemetry & Calibration view to verify side-by-side scorecard comparison and high-fidelity event timeline.
