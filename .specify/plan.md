## `tasks/plan.md` — Phase 7 Step 4: Admin Dashboard UI

### 1. Objective

Build a secure, role-based Admin Dashboard UI for Ravengard AI Recruiter that allows admins, reviewers, and viewers to:
- log in,
- browse candidates, sessions, and reports,
- manage flags and session status,
- and view detailed candidate/interview data.

This UI will consume the existing Phase 7 admin endpoints and respect the RBAC and rate-limiting already implemented. Audit log viewer functionality is explicitly out of scope for this phase.

### 2. Scope

**In scope:**
- Admin login screen.
- Admin shell layout (sidebar, header, content area).
- Role-aware navigation.
- Dashboard pages:
  - Overview dashboard.
  - Candidates list and detail.
  - Sessions list and detail.
  - Reports list and detail.
  - Flags/review queue.
- Shared UI components:
  - Data tables with sorting/filtering/pagination.
  - Status badges (stage, score range, flag status).
  - Report viewer (reuse `FinalReport` read-only).
- RBAC guards around routes and UI actions.
- Error states for forbidden actions.

**Out of scope:**
- Audit log viewer.
- Advanced analytics or charts beyond basic metrics.
- Bulk export features (can be added later).

### 3. Architecture

**Frontend stack:**
- React + Vite (existing).
- Existing design system (Tailwind + shadcn-like components).
- React Router for navigation.
- Centralized auth state (admin JWT stored in memory or secure cookie).

**Data flow:**
- Admin login → store JWT → attach to requests via `Authorization: Bearer <token>`.
- Admin pages fetch data from `/api/admin/*` endpoints.
- RBAC enforced both in backend middleware and frontend route guards.

**Key components:**
- `AdminShell` — layout wrapper with sidebar and header.
- `AdminLogin` — login screen.
- `AdminDashboard` — overview metrics.
- `CandidatesPage`, `CandidateDetailPage`.
- `SessionsPage`, `SessionDetailPage`.
- `ReportsPage`, `ReportDetailPage`.
- `FlagsQueuePage`.
- Shared: `DataTable`, `StatusBadge`, `ReportViewer` (read-only).

### 4. Dependencies

- Phase 7 Steps 2–3 (admin auth, endpoints, audit logging, rate limiting) must be complete.
- Existing `FinalReport` component must be reusable in read-only mode.
- Existing design system and layout primitives should be reused where possible.

### 5. Implementation Order

1. **Admin login and auth state**
   - Build `AdminLogin` screen.
   - Integrate with `/api/admin/auth/login`.
   - Store JWT and admin role in app state.
   - Redirect to dashboard on success.

2. **Admin shell and navigation**
   - Create `AdminShell` layout.
   - Implement role-aware sidebar navigation.
   - Add logout functionality.

3. **Overview dashboard**
   - Build `AdminDashboard` with basic metrics:
     - total candidates,
     - sessions by stage,
     - flagged sessions count.

4. **Candidates module**
   - `CandidatesPage` with data table.
   - `CandidateDetailPage` with profile and session history.

5. **Sessions module**
   - `SessionsPage` with filters (stage, status, score).
   - `SessionDetailPage` with transcript, scorecard, and integrity summary.

6. **Reports module**
   - `ReportsPage` with list of scorecards.
   - `ReportDetailPage` reusing `FinalReport` read-only.

7. **Flags/review queue**
   - `FlagsQueuePage` with list of flagged sessions.
   - Actions to update status and add notes.

8. **RBAC and error states**
   - Wrap admin routes with role guards.
   - Show clear forbidden/error states when access is denied.

### 6. Risks and Mitigations

- **Risk:** Overbuilding the dashboard with unused features.
  - **Mitigation:** Stick to the defined scope; defer advanced analytics and exports.
- **Risk:** Inconsistent RBAC between frontend and backend.
  - **Mitigation:** Mirror backend roles in frontend guards; test as non-admin to verify.
- **Risk:** Data tables become slow with large datasets.
  - **Mitigation:** Implement pagination and server-side filtering from the start.

### 7. Verification Checkpoints

- Admin login works and stores JWT correctly.
- Navigation respects roles (reviewer/viewer see fewer options).
- All pages load and display data from admin endpoints.
- RBAC prevents unauthorized access at the route level.
- Error states render correctly for forbidden actions.
