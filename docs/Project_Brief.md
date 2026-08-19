# Project Brief: Ravengard AI Recruiter

## 1. Product Goal
To provide candidates with a safe, dynamic, AI-driven interview simulation platform that adapts to their resumes and provides actionable feedback to build confidence before high-stakes real-world interviews.

## 2. Primary Audience
Fresh graduates seeking their first technical roles and career switchers looking to translate past experience into tech-friendly terminology.

## 3. Key Emotional Effect
Confidence, reassurance, and clarity. Candidates should transition from feeling anxious and unprepared to feeling guided, objectively evaluated, and equipped with a clear learning roadmap.

## 4. Main Sections of the Site
- **Landing / Registration:** Clear value proposition, simple sign-up, and policy consent.
- **Intelligence (Resume Upload):** Drag-and-drop resume parser displaying ATS scores and extracted skills.
- **Pre-Flight (Device Check):** Hardware testing (mic/camera) and instructions.
- **Live Interview Engine:** The core immersive interface for 8 adaptive AI rounds (using text/audio) featuring a "Think Again" helper and anti-cheat monitors.
- **Assessment & Reporting:** Self-reflection prompt, holistic scoring dashboard, and actionable 30-day learning roadmap delivery.

## 5. Must-Have Interactions
- **Drag-and-Drop Upload:** Seamless resume file selection and visual parsing feedback.
- **Hardware Verification:** Real-time microphone audio levels and camera preview rendering.
- **Real-Time Conversational UI:** Streaming AI interactions with voice/text modalities.
- **"Think Again" Lifeline:** A clickable hint button limited to 2 uses per session.
- **Anti-Cheat Monitoring:** Silent logging of tab switches (`visibilitychange`) and window resizing.

## 6. Non-Goals (Scope Protection)
- This project shall not include a blog or CMS editing.
- This project shall not include a job board, e-commerce, or placement matching system.
- This project shall not include multi-language support (English only for v1).
- This project shall not include native mobile applications.
- This project shall not include unapproved animation experiments outside of standard UI transitions.
- This project shall not include live video recording storage (only audio/text transcripts will be retained).
- This project shall not include a complex B2B admin panel or instructor dashboard in v1.0.

## 7. Initial Tech Stack
- **Frontend:** React (TypeScript), Vite, Tailwind CSS, UI components (lucide-react).
- **Backend/API:** Node.js, Express, Gemini Live API (for real-time streaming), WebSockets.
- **Database:** PostgreSQL (via Drizzle ORM) for persisting candidate states and reports.
- **Integrations:** n8n webhooks for email delivery, WebRTC/getUserMedia for device checks.

## 8. Design Inspiration References
- **Aesthetic:** Premium dark, focused, and high-trust. Avoid generic SaaS minimalism. The environment should feel secure, immersive, and professional to reduce cognitive load and focus entirely on the interview content.
- **Layout:** High-contrast neutral theme with clear typography, structured borders, and subtle state transitions.
- **Workflow:** Step-by-step wizard style progression for onboarding, shifting into a focused, distraction-free "theater mode" for the actual interview phase.
