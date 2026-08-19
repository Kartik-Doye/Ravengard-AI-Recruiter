# Ravengard AI Recruiter - Wireframe Specifications

## Screen 1: Landing / Registration
### Phase: 0
### Purpose: Clear value proposition, capture basic user info, and secure policy consent.
### Entry condition: User visits the root URL unauthenticated.
### Exit condition: Valid data submitted, policy accepted, session locked. Proceeds to Phase 1.

#### Layout
- **Top area**: Simple branding/logo (top left), minimalist nav.
- **Primary content area**: Centered registration card containing value prop heading and a form.
- **Secondary content area**: Policy consent text and checkbox below the form.
- **Footer / action area**: Primary CTA button ("Start Simulation").

#### Components
- **Hero Text**: States product goal. Static.
- **Form Inputs**: Email, Phone, Graduation Year. Interactive.
- **Checkbox**: Privacy policy consent. Interactive.
- **Primary Button**: Submits form. Interactive.

#### States
- **Default**: Empty form fields, CTA disabled until consent checked.
- **Loading**: CTA shows spinner, inputs disabled during backend validation.
- **Error**: Inline text below invalid fields (e.g., "Invalid email", "Year > 4 years").
- **Success**: Brief success checkmark, then route transition.

#### Interaction logic
- If user types invalid data, then show inline error on blur.
- If consent is unchecked, then disable submit button.
- If user clicks submit and data is valid, then show loading state, lock session, and transition to Resume Upload.

#### Content rules
- **Required content**: Form labels, policy link, clear CTA text.
- **Placeholder content**: Standard input placeholders (e.g., "jane@example.com").

#### Accessibility notes
- **Focus order**: Email -> Phone -> Grad Year -> Consent -> Submit.
- **Labels**: All inputs must have explicit `<label>` elements.
- **Keyboard behavior**: Enter key triggers submit if focus is in form.

#### Responsive notes
- **Desktop**: Centered card layout with generous whitespace. Form container max-width ~480px.
- **Tablet**: Card width expands slightly relative to screen.
- **Mobile**: Card takes up 90% width. Inputs stack vertically with larger touch targets.

#### Open questions
- Are we using a magic link for auth or just capturing data for this immediate session? (Assuming session-based for v1).

#### Acceptance criteria
- Form cannot be submitted without explicit policy consent.
- Invalid graduation years are blocked.
- Successful submission strictly routes to Phase 1.

---

## Screen 2: Intelligence / Resume Upload
### Phase: 1
### Purpose: Collect candidate resume, parse skills, and show ATS score.
### Entry condition: Completed Registration (Phase 0).
### Exit condition: Resume parsed successfully, ATS score generated, user clicks "Continue".

#### Layout
- **Top area**: Global stepper indicator (Phase 1 active).
- **Primary content area**: Large, dashed-border dropzone for file upload.
- **Secondary content area**: Parsed results container (ATS Score dial, extracted skills tags) - hidden until success.
- **Footer / action area**: "Continue to Device Check" button.

#### Components
- **Stepper**: Shows progression. Static.
- **Upload Dropzone**: Accepts file drag or click. Interactive.
- **ATS Score Visual**: Number out of 100 with a circular progress indicator. Static (renders on success).
- **Skill Tags**: List of identified keywords. Static.
- **Primary Button**: Moves to next phase. Interactive.

#### States
- **Default**: Empty dropzone, results container hidden, continue button disabled.
- **Loading**: Dropzone replaced by a parsing skeleton/loader.
- **Error**: "File too large" or "Invalid format" banner above dropzone.
- **Success**: Dropzone shrinks, results container expands showing Score and Skills, continue button enabled.

#### Interaction logic
- If user drops a non-PDF/DOCX file, then show error state.
- If file upload succeeds, then trigger AI parsing loader.
- If parsing succeeds, then reveal ATS score and skills, enable continue button.
- If user clicks continue, then transition to Pre-Flight.

#### Content rules
- **Required content**: Upload instructions ("Drag & Drop PDF/DOCX, max 5MB").
- **Reveal content**: ATS Score, Extracted Skills list.

#### Accessibility notes
- **Focus order**: Dropzone -> (Results read by screen reader on reveal) -> Continue Button.
- **Keyboard behavior**: Dropzone triggerable via Space/Enter.

#### Responsive notes
- **Desktop**: Split view or wide centered container for dropzone.
- **Tablet/Mobile**: Stacked layout. Dropzone becomes taller for easier touch targets.

#### Open questions
- Should the user be allowed to manually edit parsed skills if the AI misses something? (Assuming no for MVP to maintain strict flow).

#### Acceptance criteria
- Accepts only PDF/DOCX up to 5MB.
- Successfully extracts text and renders an ATS score > 0 before allowing progression.

---

## Screen 3: Pre-Flight / Device Check
### Phase: 2
### Purpose: Ensure hardware (mic/camera) works and candidate understands rules.
### Entry condition: Completed Resume Upload (Phase 1).
### Exit condition: Camera/Mic permissions granted, user types confirmation.

#### Layout
- **Top area**: Stepper indicator (Phase 2 active), brief instruction text.
- **Primary content area**: Two-column layout (or stacked). Left: Video feed box. Right: Audio level visualizer and rules list.
- **Footer / action area**: Text input field requiring "I'm Ready", and "Enter Waiting Room" button.

#### Components
- **Video Element**: Streams local webcam feed.
- **Audio Visualizer**: Simple bar/wave reacting to mic input volume.
- **Instruction List**: Bulleted rules (e.g., "Do not switch tabs").
- **Confirmation Input**: Text field. Interactive.
- **Primary Button**: Proceeds to interview. Interactive.

#### States
- **Default**: Requesting permissions overlay on video box.
- **Loading**: Initializing media devices.
- **Error**: "Camera blocked" or "Mic not found" alert.
- **Success**: Video playing, audio bar moving, confirmation input enabled.

#### Interaction logic
- If permissions denied, then show permanent error state with instructions to unblock.
- If user types exactly "I'm Ready" (case-insensitive), then enable proceed button.
- If user clicks proceed, then transition to Waiting Room / Interview Engine.

#### Content rules
- **Required content**: Strict interview rules, privacy notice regarding recording (audio/text only).

#### Accessibility notes
- **Labels**: Clear labels for the confirmation text input.
- **Keyboard behavior**: Tab order directly to confirmation input once hardware succeeds.

#### Responsive notes
- **Desktop**: Side-by-side video and rules.
- **Mobile**: Stacked (Video on top, rules below). Video aspect ratio adapts.

#### Open questions
- Is typing "I'm Ready" strictly required, or is a checkbox acceptable? (Sticking to typed input as requested in PRD).

#### Acceptance criteria
- `getUserMedia` must successfully stream before progression is allowed.
- Button remains disabled until exact string "I'm Ready" is typed.

---

## Screen 4: Live Interview Engine
### Phase: 3 & 4
### Purpose: Immersive, distraction-free conversational AI interview.
### Entry condition: Completed Device Check (Phase 2).
### Exit condition: 8 rounds completed.

#### Layout
- **Top area**: Minimal header. Current Round indicator (e.g., "Round 3/8: Technical"), Anti-cheat status indicator (subtle).
- **Primary content area**: Scrolling transcript log (AI text and user text bubbles).
- **Secondary content area**: Live video thumbnail (corner, picture-in-picture style).
- **Footer / action area**: Chat input box, Push-to-Talk mic button, "Think Again" lifeline button.

#### Components
- **Transcript List**: Chronological message history.
- **Input Field**: Text entry.
- **Mic Button**: Toggles voice recording/streaming.
- **Think Again Button**: Shows remaining count (e.g., "Hints: 2").
- **System Alerts**: Temporary banners for anti-cheat warnings (e.g., "Tab switch detected").

#### States
- **Default**: AI asks first question. Mic button idle.
- **Loading**: "AI is thinking..." indicator in transcript.
- **Active Recording**: Mic button pulses red, visualizer active.
- **Warning**: Red banner flashes if `visibilitychange` detected.
- **Disabled**: Input disabled while AI is "speaking".

#### Interaction logic
- If user clicks Mic, then start recording audio; click again to send.
- If user clicks "Think Again", then deduct 1 from count, disable button temporarily, append hint to transcript.
- If user switches tabs, then log violation and flash warning banner.
- If 8 rounds complete, then auto-transition to Assessment.

#### Content rules
- **Required content**: AI prompts, Candidate responses, round headers.

#### Accessibility notes
- **Focus order**: Read AI message -> Input Field -> Submit.
- **Keyboard behavior**: Enter to send text. Spacebar hold for push-to-talk (optional enhancement).

#### Responsive notes
- **Desktop**: Centered chat container (max-width 800px). PiP video in bottom right.
- **Mobile**: Full width chat. PiP video shrinks or hides to save space.

#### Open questions
- How are we handling transcript scrolling? (Should auto-scroll to bottom on new message).

#### Acceptance criteria
- 8 sequential rounds must execute.
- "Think Again" strictly limited to 2 uses.
- Tab switching must trigger a logged violation.

---

## Screen 5: Assessment & Reporting
### Phase: 5 - 8
### Purpose: Capture self-reflection, display holistic score, and provide roadmap.
### Entry condition: Completed 8 Interview Rounds (Phase 4).
### Exit condition: User downloads report or exits platform.

#### Layout
- **Top area**: "Interview Complete" header.
- **Primary content area (Reflection - overlays first)**: 3-question self-reflection form.
- **Primary content area (Dashboard)**: Holistic Score ring chart (left) + 30-Day Roadmap timeline (right).
- **Footer / action area**: "Download Full Report (PDF)" button.

#### Components
- **Reflection Form**: Textareas for candidate thoughts.
- **Score Ring**: Large circular gauge showing 0-100 score.
- **Roadmap List**: Vertical timeline of action items.
- **Download Button**: Triggers PDF generation.
- **Status Banner**: "Report emailed to [email]".

#### States
- **Default (Reflection)**: Form visible, dashboard hidden.
- **Loading**: Generating AI score and roadmap.
- **Default (Dashboard)**: Score and Roadmap visible.
- **Processing**: "Generating PDF..." spinner on button.

#### Interaction logic
- If reflection form is submitted, then reveal the Assessment Dashboard.
- If dashboard mounts, then trigger n8n webhook to email report in background.
- If user clicks Download, then generate and save PDF locally.

#### Content rules
- **Required content**: Final score, 4-week breakdown (Week 1, Week 2, etc.).

#### Accessibility notes
- **Focus order**: Score -> Roadmap items -> Download Button.
- **Labels**: Charts must have standard text fallbacks/aria-labels for screen readers.

#### Responsive notes
- **Desktop**: Two-column layout (Score on left, Roadmap on right).
- **Mobile**: Single column. Score ring at top, Roadmap stacked below.

#### Open questions
- Does the reflection form affect the final AI score? (Assuming no, purely for the candidate's report).

#### Acceptance criteria
- Holistic score and 4-week roadmap are rendered.
- PDF download is functional.
- Webhook to n8n is triggered upon dashboard load.
