# Candidate Portal Login Viewport & High-Contrast Rendering

Restore immediate visual rendering and sharp contrast to the RavenGard Candidate Portal login screen, eliminating the black-screen overlay caused by the global blocking loader and animation opacity traps.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions were confirmed during interactive clarification:
> - **Portal View Presentation**: Dedicated centered high-contrast card with immediate rendering (no full-page blocking loaders or nested viewport traps).
> - **Loader Behavior**: Bypass the 1.5-second `SmoothLoader` overlay when accessing direct portal routes (`/portal`, `/candidate/login`, `/candidate`, `/candidate-login`).
> - **Theme & Contrast**: Dark slate card (`bg-slate-900/95`, `border-cyan-500/30`) with luminous cyan accents (`#06B6D4`), crisp field boundaries, and clear demo credential indicators (`candidate@ravengard.com` / `demo123`).

---

## 1. Overview & Core Concept

- **What It Does**: Resolves the blank black screen when navigating to `/portal` or `/candidate/login` by immediately rendering a sharp, high-contrast authentication form. Candidates can seamlessly log in using pre-populated demo credentials or register an account.
- **Target Audience**: Applicants and candidates accessing their assessment hub across desktop and mobile devices.
- **Key Value**: Guarantees zero-latency visual availability on portal arrival, removes obscuring backdrop overlays, and ensures WCAG AA compliance with high-contrast text and input fields.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Direct Arrival (`/portal` or `/candidate/login`)**: The candidate lands immediately on the authentication view without waiting for the 1.5s global intro loader.
2. **High-Contrast Form Recognition**: A centered dark slate card (`max-w-md`) with subtle glowing cyan ambient lighting and crisp 1px borders renders in view. Pre-filled demo credentials (`candidate@ravengard.com` / `demo123`) with a 1-click "Fill Demo" shortcut allow instantaneous testing.
3. **Tab Toggle (Sign In / Register)**: Segmented button controls allow instantaneous switching between candidate login and registration without page reload.
4. **Validation & State Transition**: Active input focus rings (`focus:ring-2 focus:ring-cyan-400/30`), clear error alerts, and animated loading indicators provide routine feedback under 150ms.

### Visual Identity & Theme Tokens
- **Canvas Neutral (60%)**: Deep obsidian slate (`#020617` / `bg-slate-950`).
- **Structural Surfaces (30%)**: Elevated dark slate panel (`#0B0F19` / `bg-slate-900/95`, `border-white/10` with `hover:border-cyan-500/30`).
- **Accent Budget (10%)**: High-contrast luminous cyan (`#06B6D4` / `text-cyan-300`, `bg-cyan-500`, `shadow-cyan-500/20`).
- **Typography**: `Plus Jakarta Sans` for clean, legible labels and headings; `font-mono` for credentials and tags; balanced text wrapping with no orphaned headings.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Portal Route Loader Bypass (`App.tsx`)**
  - *Chosen Approach*: Detect whether `window.location.pathname` matches candidate portal paths (`/portal`, `/candidate`, `/candidate/login`) and bypass the 1.5s `SmoothLoader` timer immediately.
  - *Why*: Immediate viewport presence is critical for authentication funnels; blocking overlays degrade perceived performance and cause test automation timeouts.
  - *Alternatives Considered*: Decreasing timeout for all routes (rejected because marketing home page benefits from smooth intro animation).

- **Decision 2: Elimination of Motion Opacity Traps (`RootLayout.tsx`)**
  - *Chosen Approach*: Ensure `RootLayout` wraps child routes in an immediate-display container with fallback opacities (`opacity: 1`), preventing `framer-motion` / `motion` from getting stuck at `opacity: 0` when `ReducedMotionProvider` or headless browsers disable animations.
  - *Why*: Guarantees that even if CSS transitions or JS animations are interrupted, DOM elements remain 100% visible and interactive.

- **Decision 3: Dedicated Container Geometry (`CandidateAuth.tsx`)**
  - *Chosen Approach*: Replace conflicting `min-h-screen` styling inside `CandidateAuth.tsx` with a responsive flex container (`py-12 px-4 w-full flex items-center justify-center`) that harmonizes with `RootLayout`'s `main` container.
  - *Why*: Prevents double viewport scrollbars and viewport displacement where form controls get pushed below the visible fold.

---

## 4. Technical Architecture & Component Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ App.tsx (Root Entry Point)                                             │
│ ├─ Route Check: Path starts with /portal or /candidate?                 │
│ │  ├─ YES: Bypass SmoothLoader -> Render App immediately               │
│ │  └─ NO:  Run standard 1.5s intro animation for home/marketing        │
│ └─ BrowserRouter                                                       │
│    └─ RootLayout                                                       │
│       ├─ SiteHeader (Nav & "Candidate Login" CTA)                     │
│       ├─ Main Viewport Container (Robust opacity & padding)           │
│       │  └─ CandidatePortal.tsx                                        │
│       │     └─ CandidateAuth.tsx (Centered High-Contrast Card)         │
│       │        ├─ Shield Icon & Brand Header                           │
│       │        ├─ Segmented Tabs: Sign In / Register                   │
│       │        ├─ High-Contrast Inputs (Email & Password)              │
│       │        ├─ "Demo Candidate" 1-Click Pill Button                 │
│       │        └─ Submit Action & Magic Link Alternatives              │
│       └─ SiteFooter                                                    │
└────────────────────────────────────────────────────────────────────────┘
```
