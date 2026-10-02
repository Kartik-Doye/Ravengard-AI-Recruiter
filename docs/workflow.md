# Ravengard AI: Platform Workflow & Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RAVENGARD AI: END-TO-END PLATFORM WORKFLOW                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ PHASE 1: ADMIN & INFRASTRUCTURE SETUP ]
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  1. Root Bootstrapping : madhunand@gmail.com authenticates via Console Setup Token   │
 │  2. Enterprise Identity: Sync recruiters/managers via SAML 2.0 / SCIM 2.0            │
 │  3. FinOps Controls   : Set departmental token caps (e.g. 5L/mo) & model fallbacks   │
 │  4. Whitelabeling     : CNAME mapping, SMTP gateway, custom CSS, & legal terms      │
 └──────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
 [ PHASE 2: JOB REQUISITION APPROVAL PIPELINE ]
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  [ Recruiter ] ──► Drafts Job ──► AI Studio Auto-Generates 5-Point Rubric            │
 │                         │                                                            │
 │                         ▼                                                            │
 │  [ Finance ]   ──► Pending Finance (Validates token budget & salary bands)           │
 │                         │                                                            │
 │                         ▼                                                            │
 │  [ Tech Lead ] ──► Pending Tech Lead (Verifies rubric & "Sarah" strictness)          │
 │                         │                                                            │
 │                         ▼                                                            │
 │  [ Published ] ──► Job goes live on white-labeled Candidate Portal                    │
 └──────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
 [ PHASE 3: CANDIDATE APPLICATION & LIVE AI INTERVIEW ]
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  Candidate Applies ──► Consents to Terms ──► Enters Interview Room with "Sarah"      │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                 INVISIBLY MONITORED BY 4-SIGNAL ANTI-CHEAT ENGINE              │  │
 │  ├────────────────────────────────────────────────────────────────────────────────┤  │
 │  │ 1. ΔTTFT Latency     : Flags conversational delays > 1.8s (2nd screen relays)  │  │
 │  │ 2. Rapid Probing     : Triggers adaptive interrupt questions on latency spikes │  │
 │  │ 3. Speech Prosody    : Detects monotone robotic script reading                 │  │
 │  │ 4. Code Divergence   : Flags audio explanations while DOM code editor is idle │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
                                            ▼
 [ PHASE 4: BLIND REVIEW, COMPLIANCE AUDIT & OFFER ]
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  1. Blind Review       : Names/demographics redacted; review AI scorecard & code     │
 │  2. Integrity Verdict  : Anti-cheat risk score assigned (Low / Moderate / High)      │
 │  3. Compliance Export  : SHA-256 sealed package generated (EEOC / EU AI Act / DPDP)  │
 │  4. Offer Generation   : Compensation builder outputs branded PDF offer letter       │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Key System State Transitions

```
[ Requisition Lifecycle ]
(Draft) ──► (Pending Finance) ──► (Pending Tech Lead) ──► (Published)
   ▲               │                     │
   └───────────────┴── [ Rejected ] ─────┘  (Reverts with mandatory feedback)

[ Candidate Session Lifecycle ]
(Applied) ──► (In-Interview) ──► (Telemetry Processing) ──► (Evaluated) ──► (Offer Extended)
```

---

### Implementation Mapping & Endpoint Traceability

#### Phase 1: Admin & Infrastructure Setup
- **Root Super Admin Bootstrapping**:
  - Endpoint: `POST /api/admin/setup-root`, `GET /api/admin/setup-status`
  - Auth: `POST /api/admin/login`
  - Seed Token: Root super administrator `madhunand@gmail.com` and `admin@ravengard.com` initialized with immutable audit rights.
- **Enterprise Identity**:
  - SAML 2.0 SP Metadata: `GET /api/admin/identity/saml/metadata.xml`
  - SSO Configuration: `GET /api/admin/identity/sso-config`, `PUT /api/admin/identity/sso-config`
  - IdP Sandbox Simulator: `POST /api/admin/identity/sandbox/test`
  - SCIM 2.0 RFC 7644: `GET /scim/v2/Users`, `POST /scim/v2/Users`, `PATCH /scim/v2/Users/:id`, `DELETE /scim/v2/Users/:id`
- **FinOps Controls**:
  - Department Token Caps & Model Fallbacks: `PUT /api/admin/finops/budgets/:department`
  - Model Routing Rules (`DEGRADE_MODEL` rule): `PUT /api/admin/finops/model-routing/:seniorityLevel`
  - Real-Time Token Ledger: `GET /api/admin/finops/token-ledger`
- **Whitelabeling & DNS**:
  - Custom Domain & SMTP Gateway: `GET /api/admin/whitelabel/config`, `PUT /api/admin/whitelabel/config`
  - DNS Lookup & SSL Issuance: `POST /api/admin/whitelabel/verify-dns`
  - Public Client Theme Ingestion: `GET /api/whitelabel/public-theme`

#### Phase 2: Job Requisition Approval Pipeline
- **Draft Creation & 5-Point Rubric**:
  - Endpoints: `POST /api/jobs`, `POST /api/admin/jobs`
  - Schema: `status = 'draft'`, `rubricId` mapped to `rubrics` & `rubric_criteria`.
- **Finance Approval Gate**:
  - Endpoint: `POST /api/admin/jobs/:id/approve` (with `role: 'finance_approver'`)
  - Validates token budget allocation and compensation bands. State: `status = 'pending_tech_lead'`.
- **Tech Lead Gate**:
  - Endpoint: `POST /api/admin/jobs/:id/approve` (with `role: 'technical_interviewer' | 'tech_lead' | 'admin'`)
  - Verifies rubric strictness and prompt persona settings. State: `status = 'published'`.
- **Rejection Loop**:
  - Endpoint: `POST /api/admin/jobs/:id/reject`
  - Mandatory feedback recorded in `jobs.approvalFeedback` and `jobs.approvalHistory`; state reverts to `'draft'`.

#### Phase 3: Candidate Application & Live AI Interview
- **Application & Consent Gate**:
  - Endpoints: `POST /api/candidates/register`, `POST /api/candidates/policy-consent`
  - Route Guarding: One-way locked session transitions (`locked = true`).
- **Interview Room with "Sarah"**:
  - Engine: `POST /api/interview/:id/start`, `POST /api/interview/:id/stream` (SSE text and dynamic audio turns).
- **4-Signal Anti-Cheat Engine**:
  - Telemetry Endpoint: `POST /api/interview/:id/signal`
  - 1. **ΔTTFT Latency**: Conversational response delay > 1.8s tracked against benchmark.
  - 2. **Rapid Probing**: Adaptive interrupt probing dispatched on latency spikes.
  - 3. **Speech Prosody**: Flat pitch / synthetic cadence acoustic analysis.
  - 4. **Code Divergence**: Audio monologue detected while DOM code editor buffer is idle.

#### Phase 4: Blind Review, Compliance Audit & Offer
- **Blind Review Hub**:
  - Redaction: Demographic PII scrubbed from candidate dossiers in reviewer mode.
  - Endpoint: `GET /api/admin/sessions/:id`, `GET /api/admin/sessions/:id/summary`.
- **Integrity Verdict**:
  - Risk categorization: `Low`, `Moderate`, `High` computed from `integrity_signals` and logged to `security_threat_logs`.
- **Compliance Export**:
  - Endpoint: `GET /api/admin/compliance/eeoc-export`
  - Cryptographic Package: Four-Fifths rule impact ratio + SHA-256 certificate sealing for EEOC Title VII, EU AI Act Annex IV, and DPDP.
- **Offer Generation**:
  - Endpoint: `POST /api/admin/candidates/:id/generate-offer`
  - Outputs branded offer package and compensation structure.
