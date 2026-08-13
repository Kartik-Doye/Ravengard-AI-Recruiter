# Traineer - Product Requirements Document (PRD)

## 1. Executive Summary
**Problem Statement:** 
Candidates, especially fresh graduates and career switchers, often face severe anxiety and lack realistic practice environments before high-stakes technical and behavioral interviews. Existing solutions are either too generic or lack real-time conversational adaptability.

**Product Goals:**
Build an AI-driven, multi-round interview simulation platform (Traineer) that dynamically adapts to a candidate's resume and real-time responses. It will provide a safe, proctored environment simulating real-world interviews, followed by actionable, holistic feedback.

**Non-Goals:**
- We are not building a job board or placement matching system in v1.0.
- We are not replacing human recruiters; we are providing a preparation tool.

## 2. Target Users and Personas

### Persona 1: The Fresh Graduate (Amit)
- **Background:** 22, B.Tech CSE, seeking first software engineering role.
- **Pain Points:** Highly nervous about technical rounds. Unsure if his resume will pass ATS filters. Lacks context on what a "Startup Founder" or "Tech Lead" interviewer might ask.
- **Goals:** Gain confidence through practice; get a clear roadmap of what to study.

### Persona 2: The Career Switcher (Priya)
- **Background:** 26, MBA transitioning into Product Management / Tech.
- **Pain Points:** Struggles to translate past non-tech experience into tech-friendly terminology. Needs behavioral interview practice.
- **Goals:** Refine her narrative and identify missing keywords in her resume.

### Persona 3: The B2B Admin / College Director (Dr. Sharma)
- **Background:** 45, Placement Director at an engineering college.
- **Pain Points:** Needs to track the interview readiness of 500+ students simultaneously.
- **Goals:** View aggregated dashboards to see which students need more help.

## 3. Core User Journey
1. **Phase 0 (Registration):** User signs up, profile validated, policy consent signed.
2. **Phase 1 (Intelligence):** Uploads resume (PDF/DOCX). AI parses skills and generates ATS score + recruiter summary.
3. **Phase 2 (Pre-Flight):** Reads interview instructions, completes hardware device check (camera, mic).
4. **Phase 3 (Waiting Room):** Anti-cheat listeners initialize. Avatar greets the candidate.
5. **Phase 4 (Interview):** 8 adaptive rounds (HR, Aptitude, Technical, Senior SWE, Tech Lead, Behavior, Startup, Strict). Candidate uses voice/text. 'Think Again' hints available.
6. **Phase 5 (Reflection):** Candidate answers 3 self-reflection questions.
7. **Phase 6 & 7 (Assessment & Coaching):** AI calculates a holistic score and generates a 30-day personalized learning roadmap.
8. **Phase 8 (Delivery):** PDF report generated and emailed; dashboard unlocks.

## 4. Functional Requirements

### Phase 0: Registration & Policy
- **FR-001:** System shall validate email, phone number, and graduation year (no future dates > 4 years).
- **FR-002:** AI shall generate a personalized welcome checklist upon registration.
- **FR-003:** Candidate must explicitly check "I Agree" to the privacy policy to lock the session and proceed.

### Phase 1: Resume Upload & ATS
- **FR-010:** System shall accept PDF/DOCX files up to 5MB via drag-and-drop or click.
- **FR-011:** Backend shall extract raw text and pass to AI for structured parsing (Skills, Experience, Education).
- **FR-012:** System shall display an ATS score (0-100) and highlight missing keywords based on a target role.

### Phase 2: Instructions & Device Check
- **FR-020:** System shall request and verify `getUserMedia` permissions for video and audio.
- **FR-021:** Candidate must type "I'm Ready" (or similar confirmation) to advance.

### Phase 3 & 4: Live Interview Engine
- **FR-030:** The interview shall consist of 8 sequential rounds.
- **FR-031:** The system shall use the Gemini Live API for real-time, streaming conversational interactions.
- **FR-032:** AI shall generate adaptive follow-up questions based on the candidate's previous answers and resume context.
- **FR-033:** Candidate is granted exactly 2 "Think Again" passes per session. Using one deducts from the balance and triggers an AI hint.
- **FR-034:** System shall auto-save transcript and context every 10 seconds.
- **FR-035 (Anti-Cheat):** System shall detect `visibilitychange` (tab switching) and `resize` (DevTools) and log violations.

### Phase 5 - 8: Assessment & Reporting
- **FR-040:** System shall prompt the candidate for self-reflection post-interview.
- **FR-041:** AI shall generate a holistic score (0-100) synthesizing all 8 rounds.
- **FR-042:** AI shall generate a structured 4-week learning roadmap based on identified weaknesses.
- **FR-043:** System shall generate a downloadable PDF report (via Puppeteer/PDFKit).
- **FR-044:** System shall trigger an n8n webhook to email the final report.

## 5. Non-Functional Requirements
- **NFR-001 (Performance):** UI transitions must occur in < 500ms. AI voice response latency should target < 1.5s via Live API.
- **NFR-002 (Availability):** 99.9% uptime.
- **NFR-003 (Security):** All data in transit must use TLS 1.3. Database encryption at rest (AES-256).
- **NFR-004 (Compliance):** DPDP Act 2023 / GDPR. Candidates can request full data deletion.

## 6. User Stories (Core Selection)
- **US-01:** As a candidate, I want to upload my resume so the AI can tailor my interview questions to my actual experience.
  - *Acceptance Criteria:* Upload accepts PDF. Parsing loader shows. UI displays extracted skills and ATS score upon success.
- **US-02:** As a candidate, I want to test my mic and camera before the interview starts so I don't face technical issues during the session.
  - *Acceptance Criteria:* Video preview renders. Audio level indicator shows microphone activity.
- **US-03:** As a candidate, I want to use a 'Think Again' button when I am stuck, so I can get a hint without failing the question.
  - *Acceptance Criteria:* Button visible during interview. Clicking it reduces count by 1. AI provides a hint. Button disables when count reaches 0.
- **US-04:** As an admin, I want the system to flag if a candidate switches tabs during the interview so I can assess their integrity.
  - *Acceptance Criteria:* Blur/visibilitychange events log a timestamped entry in the `violations` table.

## 7. Success Metrics
- **Completion Rate:** > 75% of users who upload a resume complete the 8-round interview.
- **Latency:** 95th percentile AI response time under 2 seconds.
- **Value Delivery:** Average ATS score improvement of +15 points for returning users.
- **Reliability:** < 1% session crash/recovery rate.

## 8. Scope Boundaries
**In Scope (v1.0):** Web-based platform, single-player candidate flow, text/audio interactions, automated PDF generation, n8n email integration.
**Out of Scope (v1.0):** Native mobile apps, B2B instructor dashboards, live video recording storage (we only store audio/text), multi-language AI (English only).

## 9. Risks and Assumptions
- **Risk:** Gemini Live API limits or latency spikes. *Mitigation:* Implement robust error handling and fallback to standard `generateContent` if WebSocket fails.
- **Assumption:** Users have modern browsers capable of WebRTC and `getUserMedia`.
- **Assumption:** 5MB is sufficient for text-based PDF/DOCX resumes.

## 10. Open Questions
1. Should the PDF report include full transcripts, or just the AI summary and scores? *(Pending product decision)*
2. How strictly should the anti-cheat system penalize the candidate's final score? *(Currently set to log-only, penalization logic TBD)*

---
**Documentation Ownership:** Product & Engineering Lead  
**Change Control:** v1.0 - Initial Draft
