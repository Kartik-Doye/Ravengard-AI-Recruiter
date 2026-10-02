# CandidatePortal Direct Form Handling & High-Contrast Authentication Card

Build a self-contained, high-contrast authentication card inside `CandidatePortal.tsx` featuring luminous cyan accents, direct form handling for `candidate@ravengard.com` / `demo123`, immediate loader bypass, and seamless mock session fallback loading multiple applications.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during interactive clarification:
> - **Authentication Flow**: Attempt real backend API login (`/api/candidate/auth/login`) and immediately fall back to a high-fidelity mock candidate session if offline or in preview mode.
> - **Post-Login State**: Preload a clean candidate inbox with multiple selectable applications across different pipeline stages (Assessment Pending, Applied, and Offer Letter).
> - **Card Placement & Architecture**: Direct self-contained card inside `CandidatePortal.tsx` ensuring immediate centered rendering without relying on external wrapper indirection.
> - **Visual Identity**: Dark slate card (`bg-slate-900/95`, `border-2 border-cyan-500/40`) with luminous cyan accents (`#06B6D4`), crisp field boundaries, visible labels, and zero black-screen rendering traps.

---

## 1. Overview & Visual Architecture

### The Problem
When navigating directly to `/portal`, any missing token or delayed network request could cause an empty or dark viewport, or leave candidates stranded if backend services are offline.

### The Solution
1. **Self-Contained Centered Card**: Render the authentication interface directly inside `CandidatePortal.tsx` within a centered viewport container (`min-h-[calc(100vh-5rem)] flex items-center justify-center p-4`).
2. **High-Contrast Dark Slate & Cyan Aesthetics**:
   - Card: `bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-950/60 max-w-md w-full relative z-10`.
   - Luminous Accents: Cyan brand shield icon, cyan active tab highlights, luminous cyan focus rings (`focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30`), and cyan gradient action button.
   - High-Contrast Inputs: Solid dark slate background (`bg-slate-950`), solid border (`border-slate-700`), crisp labels (`text-slate-200`), and clear white input text (`text-white`).
3. **Resilient Form Handling (`candidate@ravengard.com` / `demo123`)**:
   - Default form values pre-populated with demo credentials.
   - One-click "Reset Demo Credentials" button.
   - Login handler tries `/api/candidate/auth/login`; if unavailable or returning an error, immediately provisions an offline mock session (`mock_candidate_token_${Date.now()}`), sets candidate name and email, and writes to `localStorage`.
   - Populates candidate inbox with 3 realistic applications:
     * **Senior Full-Stack AI Engineer** (Stage: MCQ Assessment Pending, 48h active countdown).
     * **Staff Infrastructure & Cloud Architect** (Stage: Under Review, 72h countdown).
     * **Lead Product Security Engineer** (Stage: Offer Letter Ready).

---

## 2. Technical Implementation Details

### File Modifications

#### `src/pages/CandidatePortal.tsx`
- **Embed Direct Auth Card Component**: Replace the unauthenticated screen branch (`if (!token)`) with an inline, robust high-contrast card rendering block.
- **Form State Management**:
  - `authEmail` (default: `'candidate@ravengard.com'`)
  - `authPassword` (default: `'demo123'`)
  - `authName` (default: `''`)
  - `authMode` (`'login' | 'register'`)
  - `authSubmitting` (`boolean`)
  - `authError` (`string | null`)
  - `authSuccess` (`string | null`)
  - `showPassword` (`boolean`)
- **Direct Submission Handler (`handlePortalAuth`)**:
  - Prevents default form event.
  - Tries `/api/candidate/auth/login` (or `/register`).
  - On failure or error, cleanly provisions mock session credentials:
    ```ts
    const mockToken = `mock_candidate_token_${Date.now()}`;
    localStorage.setItem('ravengard_candidate_token', mockToken);
    setToken(mockToken);
    setCandidateEmail(trimmedEmail);
    setCandidateName(authMode === 'register' ? (authName || 'Candidate') : 'Alex Chen');
    loadFallbackApplications();
    ```
- **Inbox Preloader (`loadFallbackApplications`)**:
  - Ensures a complete array of 3 distinct applications is populated in state so the candidate can immediately test the MCQ battery, view SLA countdown timers, and inspect offer letters without empty states.

---

## 3. Verification Plan

1. **Static Analysis & Linting**: Run `lint_applet` (`tsc --noEmit`) to verify zero type mismatches or missing properties.
2. **Build Verification**: Run `compile_applet` to confirm the Vite bundle builds cleanly.
3. **Vitest Suite**: Run `npm test` to ensure existing session persistence and auth tests pass.
4. **End-to-End Route Checks**: Run `npm run qa` to verify that full-stack routes and security gates remain intact.
