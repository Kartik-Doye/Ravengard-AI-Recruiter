🧩 Ravengard AI Recruiter — Full Phase Breakdown (Segments + Chunks)
Each Phase is divided into Segments (logical units), and each Segment is split into Chunks (implementable tasks with clear inputs/outputs).

🔹 PHASE 0 — BEFORE RAVENGARD (Registration + Policy)
Segment 0.1 — Registration & Validation
Chunk	Description	Input	Output	Owner
0.1.1	Frontend Registration Form	User fills form	JSON payload	Frontend
0.1.2	Backend Validation Endpoint	JSON payload	Validation errors or success	Backend
0.1.3	AI Registration Validation Prompt	JSON payload	{ valid: bool, errors[], welcomeMessage }	AI Engine
0.1.4	DB Candidate Insert	Validated data	candidateId	Backend
0.1.5	Frontend Error Display	Validation errors	Error messages on form	Frontend
Segment 0.2 — Welcome Page
Chunk	Description	Input	Output	Owner
0.2.1	Frontend Welcome Screen	candidateId	Welcome UI	Frontend
0.2.2	AI Welcome Checklist Generation	Candidate profile	Personalized checklist text	AI Engine
0.2.3	Backend Welcome API	candidateId	Checklist string	Backend
0.2.4	Frontend Dynamic Rendering	Checklist text	Bulleted list + time estimate	Frontend
Segment 0.3 — Policy & Consent
Chunk	Description	Input	Output	Owner
0.3.1	Frontend Policy Modal	Candidate views policy	Checkbox list + chat input	Frontend
0.3.2	AI Policy Explanation Prompt	Candidate questions	Clarification text	AI Engine
0.3.3	Backend Policy Confirmation	{ candidateId, consent: "I Agree" }	{ sessionLocked: true, sessionId }	Backend
0.3.4	DB Session Lock	sessionId	session.locked = true	Backend
0.3.5	Frontend Lock Confirmation	Session locked	Redirect to Phase 1	Frontend
🔹 PHASE 1 — RESUME UPLOAD + AI INTELLIGENCE
Segment 1.1 — Resume Upload
Chunk	Description	Input	Output	Owner
1.1.1	Frontend Drag-and-Drop	File (PDF/DOCX)	File upload	Frontend
1.1.2	Backend File Validation	File metadata	{ valid: bool, errors[] }	Backend
1.1.3	AI File Validation Prompt	File metadata	Validation result	AI Engine
1.1.4	Cloud Storage Upload	File binary	resumeUrl	Backend
1.1.5	Frontend Progress Bar	Upload progress	Visual feedback	Frontend
Segment 1.2 — Resume Parsing
Chunk	Description	Input	Output	Owner
1.2.1	Text Extraction (unpdf/mammoth)	PDF/DOCX	Raw text	Backend
1.2.2	AI Resume Parsing Prompt	Raw text	Structured JSON (skills, projects, etc.)	AI Engine
1.2.3	DB Resume Analysis Insert	Parsed JSON	resumeAnalysisId	Backend
1.2.4	Frontend Parsing Loader	—	“Analyzing resume…” UI	Frontend
Segment 1.3 — ATS Scoring & Gap Analysis
Chunk	Description	Input	Output	Owner
1.3.1	AI ATS Scoring Prompt	Parsed resume + target role	{ atsScore, strengths[], weaknesses[], missingKeywords[] }	AI Engine
1.3.2	DB ATS Score Storage	ATS score + gaps	atsScoreId	Backend
1.3.3	Frontend ATS Dashboard	ATS score + gaps	Score cards + keyword list	Frontend
Segment 1.4 — Recruiter Review Summary
Chunk	Description	Input	Output	Owner
1.4.1	AI Recruiter Summary Prompt	ATS analysis	3–4 sentence summary	AI Engine
1.4.2	DB Summary Storage	Summary text	recruiterSummaryId	Backend
1.4.3	Frontend Summary Display	Summary text	Recruiter-style card	Frontend
🔹 PHASE 2 — INTERVIEW INSTRUCTIONS + DEVICE CHECK
Segment 2.1 — Interview Instructions
Chunk	Description	Input	Output	Owner
2.1.1	Frontend Instructions Page	sessionId	Rules + process overview	Frontend
2.1.2	AI Instructions Summary Prompt	Candidate profile	4–6 bullet summary	AI Engine
2.1.3	Backend Instructions API	sessionId	Summary text	Backend
2.1.4	Frontend Chat Confirmation	User types “I Understand”	Confirmation sent	Frontend
2.1.5	Backend Confirmation Logging	“I Understand”	instructionsConfirmed = true	Backend
Segment 2.2 — Device Check
Chunk	Description	Input	Output	Owner
2.2.1	Frontend Camera Test	getUserMedia({ video })	Stream or error	Frontend
2.2.2	Frontend Mic Test	getUserMedia({ audio })	Stream or error	Frontend
2.2.3	Frontend Speaker Test	Play tone + user confirmation	Pass/fail	Frontend
2.2.4	Frontend Browser/Internet Check	Browser version + speed test	Metadata	Frontend
2.2.5	AI Device Validation Prompt	Device results	Troubleshooting or success	AI Engine
2.2.6	Backend Device Check API	Device results	{ allPassed, message }	Backend
2.2.7	Frontend Troubleshooting UI	AI message	Bullet list of fixes	Frontend
Segment 2.3 — Readiness Confirmation
Chunk	Description	Input	Output	Owner
2.3.1	Frontend Readiness Modal	All checks passed	“I’m Ready” chat input	Frontend
2.3.2	AI Readiness Confirmation Prompt	Candidate name + sessionId	Lock message	AI Engine
2.3.3	Backend Readiness API	“I’m Ready”	{ sessionLocked, sessionId }	Backend
2.3.4	DB Session Final Lock	sessionId	session.readyForInterview = true	Backend
2.3.5	Frontend Redirect	Session locked	Navigate to Waiting Room	Frontend
🔹 PHASE 3 — WAITING ROOM + INTERVIEW START
Segment 3.1 — Waiting Room
Chunk	Description	Input	Output	Owner
3.1.1	Frontend Waiting Room UI	sessionId	Camera preview + countdown	Frontend
3.1.2	AI Welcome Message Prompt	Candidate profile	Welcome text	AI Engine
3.1.3	Backend Welcome API	sessionId	Welcome message	Backend
3.1.4	Countdown Timer Logic	60 seconds	Auto-trigger interview start	Frontend
3.1.5	AI Interviewer Avatar	—	Animated avatar + TTS	Frontend
Segment 3.2 — Anti-Cheat Initialization
Chunk	Description	Input	Output	Owner
3.2.1	Frontend Tab Switch Listener	visibilitychange event	Violation log	Frontend
3.2.2	Frontend Fullscreen Listener	fullscreenchange event	Violation log	Frontend
3.2.3	Frontend DevTools Detection	Window size heuristic	Violation log	Frontend
3.2.4	AI Anti-Cheat Reminder Prompt	Candidate name + sessionId	Reminder text	AI Engine
3.2.5	Backend Violation Logging	Violation type + timestamp	violations table entry	Backend
Segment 3.3 — Interview Start (Round 1)
Chunk	Description	Input	Output	Owner
3.3.1	AI Greeting + Icebreaker Prompt	Candidate profile	{ greeting, icebreaker, firstQuestion }	AI Engine
3.3.2	Backend Round 1 Start API	sessionId	Question JSON	Backend
3.3.3	Frontend Question Display	Question JSON	Text + TTS audio	Frontend
3.3.4	Frontend Answer Recording	User speaks/text	Audio blob + transcript	Frontend
3.3.5	Backend Answer Save	Answer data	answers table entry	Backend
🔹 PHASE 4 — MULTI-ROUND INTERVIEW FLOW (8 Rounds)
Segment 4.1 — Shared AI Memory & Context
Chunk	Description	Input	Output	Owner
4.1.1	DB Shared Memory Table	sessionId	JSON context object	Backend
4.1.2	AI Context Loader	Previous answers + resume	Context for next question	AI Engine
4.1.3	Frontend Progress Tracker	Current round + total	Progress bar	Frontend
4.1.4	Auto-Save Timer	Every 10 seconds	Save answer to DB	Frontend + Backend

Segment 4.2 — Round-Specific Prompts (Each Round)
Example: Round 2 (Aptitude)

Chunk	Description	Input	Output	Owner
4.2.1	AI Aptitude Question Generator	Candidate level + role	20 questions (MCQ/numeric)	AI Engine
4.2.2	Frontend Aptitude UI	Questions array	One question at a time	Frontend
4.2.3	Backend Answer Scoring	User answers	Score per question	Backend
4.2.4	DB Aptitude Score Storage	Total score	aptitudeScore	Backend
Repeat for Rounds 3–8 (HR, Technical, Senior SWE, Tech Lead, Behavior, Startup, Strict)

Segment 4.3 — Adaptive Follow-Up Questions
Chunk	Description	Input	Output	Owner
4.3.1	AI Follow-Up Generator	Previous answer + context	Follow-up question	AI Engine
4.3.2	Backend Follow-Up API	sessionId + answerId	Follow-up question	Backend
4.3.3	Frontend Follow-Up Display	Question	Text + TTS	Frontend
Segment 4.4 — Think Again Logic
Chunk	Description	Input	Output	Owner
4.4.1	Frontend “Think Again” Button	User click	Decrement counter	Frontend
4.4.2	Backend Think Again Validation	sessionId	{ remaining: 2 }	Backend
4.4.3	AI Hint Generator	Current question	Hint text	AI Engine
Segment 4.5 — Session Recovery
Chunk	Description	Input	Output	Owner
4.5.1	DB Session State Snapshot	Every 10 seconds	session.state	Backend
4.5.2	Frontend Re-Login Logic	sessionId	Restore last question	Frontend
4.5.3	Backend Recovery API	sessionId	Last saved state	Backend
🔹 PHASE 5 — CANDIDATE REFLECTION
Segment 5.1 — Reflection Questions
Chunk	Description	Input	Output	Owner
5.1.1	Frontend Reflection Form	—	3 questions UI	Frontend
5.1.2	Backend Reflection Save	User answers	reflections table	Backend
5.1.3	AI Reflection Analysis Prompt	Reflection answers	Insights for assessment	AI Engine
🔹 PHASE 6 — AI ASSESSMENT ENGINE
Segment 6.1 — Holistic Scoring
Chunk	Description	Input	Output	Owner
6.1.1	AI Assessment Prompt	All scores + reflection	{ overallScore, recommendation, strengths[], weaknesses[] }	AI Engine
6.1.2	DB Assessment Storage	Assessment JSON	assessments table	Backend
6.1.3	Frontend Score Display	Assessment data	Score cards	Frontend
🔹 PHASE 7 — LEARNING ROADMAP + CAREER COACH
Segment 7.1 — 30-Day Roadmap
Chunk	Description	Input	Output	Owner
7.1.1	AI Roadmap Generator	Weaknesses + goals	4-week plan	AI Engine
7.1.2	DB Roadmap Storage	Plan JSON	learning_roadmaps table	Backend
7.1.3	Frontend Roadmap Timeline	Plan	Weekly tasks view	Frontend
Segment 7.2 — Career Coach
Chunk	Description	Input	Output	Owner
7.2.1	AI Career Advice Prompt	Candidate profile + assessment	Advice + resources	AI Engine
7.2.2	DB Career Coach Storage	Advice JSON	career_coach table	Backend
7.2.3	Frontend Career Coach UI	Advice	Cards + links	Frontend
🔹 PHASE 8 — FINAL REPORT + EMAIL + DASHBOARD
Segment 8.1 — Report Generation
Chunk	Description	Input	Output	Owner
8.1.1	PDF Generation (pdfkit/puppeteer)	All assessment data	PDF buffer	Backend
8.1.2	Cloud Storage Upload	PDF buffer	reportUrl	Backend
8.1.3	Frontend Report Download	reportUrl	Download button	Frontend
Segment 8.2 — Email Automation (n8n)
Chunk	Description	Input	Output	Owner
8.2.1	n8n Webhook Trigger	sessionId	Email job queued	Backend
8.2.2	n8n Email Workflow	Candidate email + PDF	Email sent	n8n
8.2.3	DB Email Log	sessionId	reports.emailSent = true	Backend
Segment 8.3 — Candidate Dashboard
Chunk	Description	Input	Output	Owner
8.3.1	Frontend Dashboard UI	candidateId	Interview history + reports	Frontend
8.3.2	Backend Dashboard API	candidateId	JSON with history	Backend
8.3.3	DB Query Optimization	candidateId	Fast response	Backend
📊 Visual Summary: Phase → Segment → Chunk
text

Phase 0
├─ Segment 0.1 (Registration)
│  ├─ Chunk 0.1.1: Frontend Form
│  ├─ Chunk 0.1.2: Backend Validation
│  └─ …
├─ Segment 0.2 (Welcome)
└─ Segment 0.3 (Policy)

Phase 1
├─ Segment 1.1 (Upload)
├─ Segment 1.2 (Parsing)
├─ Segment 1.3 (ATS Scoring)
└─ Segment 1.4 (Recruiter Summary)

… (repeat for all phases)
