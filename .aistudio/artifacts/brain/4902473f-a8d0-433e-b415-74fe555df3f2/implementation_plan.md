# Multi-Port Architecture Isolation & Day-One Database Clean Slate

Comprehensive architectural plan to execute an absolute database hard reset (preserving solely the root `madhunand@gmail.com` super administrator) and isolate the Candidate Portal (Port 3000), HR Workspace (Port 3001), and Enterprise Admin Console (Port 3002) with dual-mode port and Host header routing.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architectural Choices**:
> 1. **Routing Mode**: Dual mode configured. The application operates 3 dedicated Express/Vite listeners on ports **3000** (Candidate Portal), **3001** (HR Workspace), and **3002** (Enterprise Admin Console), while simultaneously providing Host header and path-aware dispatching (`careers.*` / `/`, `hr.*` / `/hr`, `admin.*` / `/admin`) on Port 3000 to maintain seamless compatibility within single-port container previews.
> 2. **Database Reset Baseline**: Absolute Day-One clean slate. Truncates all mock candidate profiles, job requisitions, rubric criteria templates, interview transcripts, anti-cheat signals, and telemetry logs. Provisions solely the verified root super_admin account (`madhunand@gmail.com`) with full administrative bootstrap rights.
> 3. **Process Topology**: Orchestrated multi-listener server with dedicated modular sub-routers and standalone script entry points (`npm run dev:candidate`, `npm run dev:hr`, `npm run dev:admin`, and `npm run dev:all`).

---

## 1. Overview & Core Concept

- **What It Delivers**:
  - **Clean Slate Day-One Database**: A complete database hard reset script and API endpoint that wipes all mock data across every transactional table and initializes the single root super_admin (`madhunand@gmail.com`).
  - **Process & Port Isolation**: Strict architectural separation into 3 distinct operational zones:
    1. **Candidate Portal (Port 3000 / `careers.domain.com`)**: Public, whitelabel-ready candidate intake, custom legal terms, device readiness check, waiting room, and live AI proctored interview room.
    2. **HR & Hiring Manager Workspace (Port 3001 / `hr.domain.com`)**: Internal recruiter/manager workflow for job drafting, 4-stage approval state machine (Draft -> Pending Finance -> Pending Tech Lead -> Published), blind dossier review, and offer generation.
    3. **Enterprise Admin Console (Port 3002 / `admin.domain.com`)**: Restricted corporate control center for FinOps token caps, AI Studio persona tuning, SAML/SCIM identity synchronization, threat intelligence map, and data purge governance.
  - **Docker & Deployment Multi-Port Expose**: Configured `Dockerfile` and `docker-compose.yml` topologies mapping external VPN boundaries to ports 3001 and 3002 while exposing port 3000 to the public gateway.

---

## 2. User Experience & Visual Design

### Key User Flows Across Isolated Portals

1. **Candidate Portal (Port 3000 / `careers.*` / `/`)**:
   - **Zero State**: Candidate browses active published requisitions on clean, whitelabeled careers portal.
   - **Application & Consent**: Registers profile, accepts institutional device/privacy terms (triggering locked session state).
   - **Hardware Check & Waiting Room**: Passes webcam/mic/speaker diagnostic gate and awaits interview room admission.
   - **Live Interview Room**: Real-time conversational interview with AI proctor "Sarah" and background 4-signal anti-cheat telemetry.

2. **HR Workspace (Port 3001 / `hr.*` / `/hr`)**:
   - **Requisition Pipeline**: Recruiter drafts job with auto-generated 5-point rubric criteria.
   - **Multi-Role Approval**: Finance approves token envelope; Tech Lead verifies rubric bar and publishes requisition.
   - **Blind Review Hub**: Candidate dossiers evaluated with demographic PII scrubbed.
   - **Offer Document Studio**: Generates legally binding offer documents with custom compensation parameters.

3. **Enterprise Admin Console (Port 3002 / `admin.*` / `/admin`)**:
   - **Console Bootstrap**: Root `madhunand@gmail.com` logs in via setup token or credentials.
   - **FinOps & Identity**: Departmental monthly token budgets, SAML 2.0 / SCIM 2.0 directory sync logs, and D3.js security threat telemetry map.
   - **Data Governance**: In-portal Purge Demo Data and Hard Reset controls with cryptographic audit confirmation.

### Visual Identity & Layout System
- **Typography**: `Plus Jakarta Sans` for crisp display titles and navigation, paired with `Satoshi` for body density and `JetBrains Mono` / `tabular-nums` for all telemetry counters, compensation figures, and timestamps.
- **Color Palette & Theme Tokens**:
  - *Candidate Canvas*: Warm neutral slate canvas (`#0F172A` dark, `#F8FAFC` light) with high-legibility royal accent (`#2563EB`).
  - *HR Workspace*: Crisp professional slate with emerald approved markers (`#16A34A`) and amber pending indicators (`#D97706`).
  - *Admin Command Center*: High-contrast deep obsidian theme (`#020617` / `#090D16`) with cyan/indigo telemetry vectors.
- **Top Bar Contract**: Exactly 3 zones (Brand mark, 4–5 single-line navigation links with hover underlines, and user profile avatar / action button).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Multi-Port & Subdomain Routing**:
  - *Chosen Approach*: Express server initializes HTTP listeners on ports `3000`, `3001`, and `3002`, while also inspecting incoming `Host` headers (`careers.*`, `hr.*`, `admin.*`) and path prefixes on Port 3000.
  - *Why*: Allows true multi-process port isolation behind enterprise reverse proxies (Nginx/Envoy) while maintaining 100% full functionality in single-port local dev containers and iFrame preview environments.
  - *Alternatives Considered*: Strict single-port URL pathing only (rejected because user requested physical port separation for corporate VPN firewalls).

- **Decision 2: Absolute Clean Slate Database Hard Reset**:
  - *Chosen Approach*: Database truncation script that cascades across all relational tables (`candidates`, `applications`, `sessions`, `jobs`, `rubrics`, `rubric_criteria`, `interview_sessions`, `interview_questions`, `interview_responses`, `question_scores`, `interview_reports`, `integrity_signals`, `security_threat_logs`, `admin_logs`), and seeds only the root super_admin account (`madhunand@gmail.com`).
  - *Why*: Guarantees a zero-polluted baseline for testing end-to-end user journeys from scratch.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ENTERPRISE MULTI-PORT GATEWAY & ROUTER                                │
└──────────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         │ (Public Traffic)                        │ (Corporate VPN)                         │ (Restricted CISO/IT)
         ▼                                         ▼                                         ▼
 ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
 │   PORT 3000 / careers.*       │ │   PORT 3001 / hr.*            │ │   PORT 3002 / admin.*         │
 │   CANDIDATE PORTAL            │ │   HR WORKSPACE                │ │   ENTERPRISE ADMIN CONSOLE    │
 ├───────────────────────────────┤ ├───────────────────────────────┤ ├───────────────────────────────┤
 │ • Public Job Board            │ │ • Job Requisition Drafting    │ │ • Root Setup (madhunand@...)  │
 │ • Candidate Registration      │ │ • 4-Stage Approval Machine    │ │ • SAML 2.0 / SCIM 2.0 Sync    │
 │ • Policy Consent & Session    │ │ • Rubric Verification Gate    │ │ • FinOps Department Budgets   │
 │ • Device Check & Waiting Room │ │ • Blind Candidate Evaluation  │ │ • AI Persona Studio           │
 │ • Live AI Interview Loop      │ │ • Automated Offer Generation  │ │ • D3 Threat Telemetry Map     │
 │ • 4-Signal Anti-Cheat Hook    │ │ • Application State Store     │ │ • Data Purge & Reset Controls │
 └───────────────┬───────────────┘ └───────────────┬───────────────┘ └───────────────┬───────────────┘
                 │                                 │                                 │
                 └─────────────────────────────────┼─────────────────────────────────┘
                                                   │
                                                   ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   POSTGRESQL CLOUD SQL DATABASE                                   │
 ├───────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ • admin_users (Root: madhunand@gmail.com)          • jobs & applications (Requisition Pipeline)   │
 │ • candidates & sessions (Locked Flow)              • rubrics & rubric_criteria (5-Point Rubric)   │
 │ • interview_sessions, questions, responses         • integrity_signals & security_threat_logs     │
 └───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Table Truncation Dependency Order
1. **Dependent Leaves**: `question_scores`, `interview_responses`, `interview_questions`, `integrity_signals`, `security_threat_logs`, `directory_sync_logs`.
2. **Intermediate Relations**: `interview_reports`, `interview_sessions`, `resume_analyses`, `applications`, `sessions`, `rubric_criteria`.
3. **Core Entities**: `candidates`, `jobs`, `rubrics`, `admin_logs`, `admin_users` (excluding `madhunand@gmail.com`).
4. **Root Super Admin Provisioning**: Insert/Upsert `madhunand@gmail.com` with `super_admin` role and encrypted credentials.

---

## 5. Verification & Acceptance Criteria

- **Database Hard Reset**: Zero mock candidates, zero dummy jobs, zero test transcripts remaining; single root super_admin (`madhunand@gmail.com`) active.
- **Port 3000 (Candidate)**: Clean job board zero-state; direct registration and interview loops operational.
- **Port 3001 (HR Workspace)**: Job creation and 4-stage approval machine (Draft -> Pending Finance -> Pending Tech Lead -> Published) functioning end-to-end.
- **Port 3002 (Enterprise Admin)**: Root login, FinOps controls, SAML/SCIM identity, and security command center verified.
- **Build & Compilation**: 100% clean type-check (`tsc --noEmit`) and Vite build validation.
