# Ravengard Admin V2: FinOps Token Budget Controller & AI Persona Rubric Studio

Delivers complete enterprise administration capabilities for Ravengard, integrating real-time departmental token metering, adaptive cost-degradation policies, and an AI-assisted persona and rubric design studio.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were aligned based on your selections:
> - **Scope Priority**: Deploying both the **FinOps & Token Budget Controller** and the **AI Persona & Rubric Studio** modules simultaneously in Admin Console V2.
> - **Budget Enforcement Mode**: When a department reaches 100% of its monthly token cap, the system executes **graceful model degradation** (e.g., auto-routing from primary flagship models to high-efficiency models like Claude 3.5 Haiku / Llama 3.3 70B / Gemini Flash) to avoid abruptly terminating active candidate interviews.

---

## 1. Overview & Core Concept

### What It Does
1. **FinOps & Token Budget Controller**:
   - Enforces departmental token envelopes (hard caps, soft warning thresholds at 80%, automated degradation routing).
   - Tracks granular cost-per-hire analytics and multimodal billing (STT minutes, LLM prompt/completion tokens, TTS characters).
   - Provides an interactive budget simulator and department cap configuration panel.
2. **AI Persona & Rubric Studio**:
   - Offers real-time persona tuning for interviewer "Sarah" (strictness 1–5, speaking cadence 130–200 WPM, interruption sensitivity).
   - Generates structured 5-dimension rubrics directly from corporate job descriptions using AI.
   - Manages immutable prompt versions with visual side-by-side diff tracking and instant rollback.

### Target Audience & Personas
- **VPs of Finance & HR Ops**: Oversee token expenditures, set department budgets, and forecast API costs per requisition.
- **Talent Acquisition Leads & Recruiters**: Fine-tune interview persona strictness and tailor evaluation rubrics to open roles.

---

## 2. User Experience & Visual Design

### Key User Flows
- **FinOps Dashboard**:
  - View real-time token burn rates, monthly department progress bars with 80% soft-warning markers, and cost-per-hire aggregations.
  - Adjust monthly token caps, soft warning percentages, and fallback actions (Degrade Model vs. Block vs. Notify) with immediate database persistence.
  - Inspect the live multimodal token ledger breaking down STT, LLM reasoning, and TTS costs per session.
- **Persona & Rubric Studio**:
  - Tune "Sarah's" conversational strictness, probing frequency, and audio cadence via interactive sliders with live behavioral descriptions.
  - Paste any Job Description to generate a tailored 5-dimension rubric (Technical Depth, System Execution, Problem Solving, Code Quality, Communication) with custom weight distributions.
  - Review prompt revision history with visual line-by-line diff highlighting additions and deletions.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density enterprise SaaS cockpit following the 60-30-10 palette discipline. Deep neutral slate (`#0B132B`, `#1C2541`), cool hairline dividers (`border-slate-800`), and crisp high-intent accents (`emerald-500` for active/normal, `amber-500` for warnings, `indigo-500` for primary actions).
- **Typography**: Clean display hierarchy (`Plus Jakarta Sans` for headers, `JetBrains Mono` with `tabular-nums` for all financial figures, token counts, and diff timestamps).
- **Interactive States**: Smooth slider transitions, skeleton placeholders during AI rubric synthesis, and confirmation toasts for budget cap updates.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: In-Flight Graceful Degradation vs. Hard Rejection**
  - *Chosen Approach*: When a department hits 100% token usage, in-flight and newly launched interviews automatically downgrade to cost-optimized models instead of terminating with a 429 error.
  - *Why*: Prevents candidate-facing failures and guarantees interview continuity while protecting enterprise financial limits.
- **Decision 2: Immutable Prompt Versioning with Diff Engine**
  - *Chosen Approach*: Every update to a requisition's system prompt or evaluation rubric creates an incremented version record with automated diff summarization.
  - *Why*: Satisfies strict EEOC and EU AI Act Annex IV requirements for auditability and algorithmic reproducibility.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                       ADMIN CONSOLE V2 (FRONTEND)                      │
│  ┌───────────────────────────────┐   ┌──────────────────────────────┐  │
│  │   FinOps Controller View      │   │  Persona & Rubric Studio     │  │
│  │  • Department Token Bars      │   │  • "Sarah" Persona Sliders   │  │
│  │  • Cost-per-Hire Ledger       │   │  • JD Rubric Generator       │  │
│  │  • Model Routing Policy Panel │   │  • Prompt Version Diff View  │  │
│  └───────────────┬───────────────┘   └──────────────┬───────────────┘  │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   │                                  │
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER & API LAYER                      │
│  ┌───────────────────────────────┐   ┌──────────────────────────────┐  │
│  │  /api/admin/finops/*          │   │  /api/admin/studio/*         │  │
│  │  • GET /overview              │   │  • POST /rubrics/generate    │  │
│  │  • PUT /budgets/:dept         │   │  • POST /prompts/version     │  │
│  │  • GET /token-ledger          │   │  • GET /prompts/:templateId  │  │
│  └───────────────┬───────────────┘   └──────────────┬───────────────┘  │
│                  │                                  │                  │
│                  ▼                                  ▼                  │
│       [ Token Budget Guard ]            [ Gemini Prompt Synthesizer ]  │
│     (Intercepts turn & routes)         (Extracts 5-dimension rubric)   │
└──────────────────┼──────────────────────────────────┼──────────────────┘
                   │                                  │
                   ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CLOUD SQL (POSTGRESQL)                          │
│  • department_budgets    • token_ledger        • model_routing_rules   │
│  • persona_configs       • rubric_templates    • prompt_versions       │
└────────────────────────────────────────────────────────────────────────┘
```

### Relational Schema Extensions
1. `department_budgets`: Department name, monthly token cap, soft warning threshold (%), hard cap action (`DEGRADE_MODEL`), current month token consumption, and estimated USD spend.
2. `token_ledger`: Session-linked cost tracking recording prompt/completion tokens, STT audio seconds, TTS characters, model name, and computed cost.
3. `model_routing_rules`: Seniority level mapping (Intern $\rightarrow$ Staff), primary model, fallback model, and token limits.
4. `persona_configs`: Organization persona configuration ("Sarah"), strictness level (1–5), interruption policy, and speech cadence (WPM).
5. `rubric_templates`: Job-linked evaluation rubrics with 5 weighted competency dimensions.
6. `prompt_versions`: Immutable prompt version ledger storing system prompt bodies, diff summaries, author, and timestamp.
