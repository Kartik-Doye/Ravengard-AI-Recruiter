# Ravengard AI Recruiter Documentation Suite

Welcome to the official documentation for **Ravengard AI Recruiter**, an enterprise-grade AI-conducted assessment and interview platform.

## Documentation Index

### Core Specifications & Architecture
1. **[Product Requirements Document (PRD)](./PRD.md)** & **[PRD v1.1](./PRD_v1.1.md)**
   - Executive summary, personas, user journeys, functional & non-functional requirements.
2. **[System Architecture Document (SAD)](./SAD.md)**
   - High-level design, component breakdown, infrastructure, security, and scalability.
3. **[API Specification](./API.md)**
   - Complete endpoint contracts for candidate onboarding, sessions, SSE interview streaming, and admin APIs.
4. **[Database Schema](./Schema.md)**
   - Cloud SQL (PostgreSQL) schema definitions, relations, and Drizzle models.
5. **[State Machine Specification](./State_Machine_Spec.md)**
   - Formal transition rules across Phases 1 through 7, lock behaviors, and session resumption.
6. **[Phase Chunks & Roadmap](./Phase_Chunks_and_Segment_Doc.md)**
   - Modular implementation breakdown from Phase 1 (Foundation) through Phase 7 (Admin Access).
7. **[Project Specification](./PROJECT_SPEC.md)** & **[Requirements](./REQUIREMENTS.md)**
   - Comprehensive project goals, constraints, and candidate experience requirements.

### AI Engine & Hiring Capabilities
8. **[AI Prompt Library](./Prompts.md)**
   - Catalog of system prompts, JSON output schemas, and fallback recovery strategies.
9. **[Hiring Process Capability](./HIRING_PROCESS_CAPABILITY.md)**
   - End-to-end recruitment funnel capabilities, SLA timelines, and scoring rubrics.
10. **[Wireframes & UX Specifications](./Wireframes.md)**
    - Component layouts, responsive geometry, and theme tokens.

### Operations, Local Runtime & QA
11. **[Runbook](./Runbook.md)**
    - Deployment guides, monitoring, incident response, and disaster recovery.
12. **[Execution Quickstart (RUN)](./RUN.md)** & **[Detailed How-To-Run](./HOW_TO_RUN.md)**
    - Development server execution, environment variables, and Docker workflows.
13. **[Testing & QA Guide](./TESTING_GUIDE.md)**
    - Unit, integration, and security verification procedures.
14. **[Developer Workflow](./workflow.md)**
    - Git branching, commit conventions, and release gates.

---

## Implementation Plans (`docs/plans/`)

All historical and active feature implementation blueprints are consolidated in [`docs/plans/`](./plans/):
- **[Candidate Portal Login Plan](./plans/candidate-portal-login.md)**: Viewport restoration, immediate rendering, and high-contrast card styling.
- **[Scoring Engine Plan](./plans/scoring-engine-plan.md)**: Async scoring engine, rubrics, and scorecard persistence.
- **[Phase 7 Admin Dashboard Plan](./plans/phase7-admin-dashboard-plan.md)**: Admin console layout, RBAC security, and candidate audit views.
- **[Monkeyscode Plan Archive](./plans/monkeyscode-plan.md)**: Foundation architecture and initial session engine blueprint.
