# Ravengard AI Recruiter - API Specification (OpenAPI 3.0.3)

```yaml
openapi: 3.0.3
info:
  title: Ravengard AI Recruiter API (V2 Enterprise Specification)
  version: 2.0.0
  description: Endpoints for candidate onboarding, international registration, multi-modal assessment progression, in-browser WASM evaluation, session resilience, HR collaboration, and tenant administration.
servers:
  - url: /api
paths:
  /auth/candidate-mock-login:
    post:
      summary: Mock candidate authentication for development and testing
      description: Issues a valid candidate authentication session without third-party redirects.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                  example: candidate@ravengard.ai
                name:
                  type: string
                  example: Candidate Test User
      responses:
        '200':
          description: Mock authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  token:
                    type: string
                    example: candidate-mock-token-xyz
                  user:
                    type: object
                    properties:
                      id:
                        type: string
                      email:
                        type: string
                      name:
                        type: string

  /register:
    post:
      summary: Candidate registration and profile completion
      description: Validates and persists candidate details with international phone (E.164) and residence country.
      parameters:
        - in: header
          name: Authorization
          required: true
          schema:
            type: string
            example: Bearer <candidate_token>
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - email
                - mobile
                - country
                - college
                - degree
                - gradYear
              properties:
                name:
                  type: string
                  example: Elena Rostova
                email:
                  type: string
                  format: email
                  example: elena.rostova@example.com
                mobile:
                  type: string
                  description: International E.164 phone number including dialing code prefix (e.g. +91, +1, +44)
                  example: "+917875693285"
                country:
                  type: string
                  description: Candidate Country or Region of Residence
                  example: India
                college:
                  type: string
                  example: Stanford University
                degree:
                  type: string
                  example: M.S. Machine Learning & AI
                gradYear:
                  type: integer
                  example: 2024
      responses:
        '200':
          description: Candidate successfully registered
        '400':
          description: Validation error or missing required fields

  /candidate/heartbeat:
    post:
      summary: Candidate Session Heartbeat Ping
      description: Dispatched every 15 seconds by the Candidate Portal client to maintain active session lock.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sessionId]
              properties:
                sessionId:
                  type: string
                  format: uuid
                  example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
      responses:
        '200':
          description: Heartbeat acknowledged; last_active_at timestamp updated.
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "acknowledged"
                  timestamp:
                    type: string
                    format: date-time
        '401':
          description: Unauthorized - Invalid or expired candidate session token.

  /interview/{id}/signal:
    post:
      summary: Silent Integrity Telemetry Collector
      description: Asynchronously records non-blocking integrity signals (tab blur, window switches, gaze anomalies).
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [type]
              properties:
                type:
                  type: string
                  enum: [tab_blur, gaze_off, window_switch, long_pause_before_answer, sudden_text_appearance]
                  example: "tab_blur"
                metadata:
                  type: object
      responses:
        '200':
          description: Telemetry signal recorded successfully.

  /hr/rubric/generate:
    post:
      summary: AI-Assisted Rubric Builder from Job Description
      description: Parses raw job text and returns structured, weighted evaluation criteria summing to 100%.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [jobTitle, jobDescription]
              properties:
                jobTitle:
                  type: string
                  example: "Senior Distributed Systems Engineer"
                jobDescription:
                  type: string
                  example: "We are seeking an engineer proficient in Go, Raft consensus, gRPC, and high-throughput event processing..."
      responses:
        '200':
          description: Structured rubric generated successfully.
          content:
            application/json:
              schema:
                type: object
                properties:
                  criteria:
                    type: array
                    items:
                      type: object
                      properties:
                        dimension:
                          type: string
                          example: "Consensus Algorithms & Raft"
                        weight:
                          type: integer
                          example: 35
                        description:
                          type: string
                          example: "Evaluates understanding of leader election, log replication, and split-brain recovery."

  /hr/candidates/bulk-invite:
    post:
      summary: Bulk Candidate CSV Import & Magic Token Generation
      description: Batch registers candidates, generates secure magic access tokens, and triggers invitation dispatch.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [jobId, candidates]
              properties:
                jobId:
                  type: string
                  format: uuid
                candidates:
                  type: array
                  items:
                    type: object
                    required: [email, fullName]
                    properties:
                      email:
                        type: string
                        format: email
                        example: "alex.chen@example.com"
                      fullName:
                        type: string
                        example: "Alex Chen"
                      githubHandle:
                        type: string
                        example: "alexchen-dev"
      responses:
        '201':
          description: Candidates invited successfully.
          content:
            application/json:
              schema:
                type: object
                properties:
                  processedCount:
                    type: integer
                    example: 50
                  failedCount:
                    type: integer
                    example: 0
                  invitations:
                    type: array
                    items:
                      type: object
                      properties:
                        email:
                          type: string
                        inviteUrl:
                          type: string
                          example: "https://app.ravengard.ai/candidate/portal?token=eyJhbGciOi..."

  /hr/applications/{id}/generate-feedback-summary:
    post:
      summary: Constructive Candidate Feedback Generator
      description: Synthesizes candidate performance into constructive feedback for rejected applicants to protect brand goodwill.
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Feedback summary generated successfully.
          content:
            application/json:
              schema:
                type: object
                properties:
                  applicationId:
                    type: string
                    format: uuid
                  strengths:
                    type: array
                    items:
                      type: string
                    example: ["Strong understanding of PostgreSQL indexing strategies", "Clear verbal communication on API design"]
                  growthAreas:
                    type: array
                    items:
                      type: string
                    example: ["Further review of distributed locking mechanisms under high network partition scenarios is recommended"]
                  feedbackEmailBody:
                    type: string
                    example: "Dear Alex, Thank you for taking the time to complete the assessment..."

  /hr/notifications:
    get:
      summary: Fetch HR Workspace Alerts
      description: Returns internal notifications (high scores, integrity flags, SLAs, partial submissions) for the tenant.
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Notifications retrieved successfully.
          content:
            application/json:
              schema:
                type: object
                properties:
                  unreadCount:
                    type: integer
                    example: 3
                  notifications:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          format: uuid
                        type:
                          type: string
                          enum: [HIGH_SCORE, INTEGRITY_FLAG, SLA_EXPIRED, PARTIAL_SUBMISSION]
                        message:
                          type: string
                        isRead:
                          type: boolean
                        createdAt:
                          type: string
                          format: date-time

  /candidate/scheduling/slots:
    get:
      summary: Query Available Calendar Slots
      description: Returns available 45-minute enterprise interview slots across upcoming weekdays, filtering out booked slots.
      parameters:
        - in: query
          name: days
          schema:
            type: integer
            default: 14
        - in: query
          name: timezone
          schema:
            type: string
            default: UTC
        - in: query
          name: roundType
          schema:
            type: string
            default: ai_technical
      responses:
        '200':
          description: Slots retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  timezone:
                    type: string
                    example: America/New_York
                  days:
                    type: array
                    items:
                      type: object
                  slots:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        date:
                          type: string
                        startTime:
                          type: string
                        endTime:
                          type: string
                        isAvailable:
                          type: boolean

  /candidate/scheduling/book:
    post:
      summary: Reserve and Persist Interview Slot
      description: Reserves a selected calendar slot for the candidate and saves it to the database with conflict detection and iCal generation.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - scheduledAt
              properties:
                candidateId:
                  type: string
                sessionId:
                  type: string
                scheduledAt:
                  type: string
                  format: date-time
                endTime:
                  type: string
                  format: date-time
                timezone:
                  type: string
                  example: America/New_York
                roundType:
                  type: string
                  example: ai_technical
                notes:
                  type: string
      responses:
        '201':
          description: Slot reserved and persisted successfully
        '409':
          description: Slot conflict - slot is already reserved

  /candidate/scheduling/my-schedule:
    get:
      summary: Get Candidate Scheduled Appointments
      description: Returns active and past interview reservations for the authenticated candidate.
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Scheduled appointments retrieved successfully

  /candidate/scheduling/cancel:
    post:
      summary: Cancel Scheduled Interview Appointment
      description: Releases a reserved slot and marks the schedule record as cancelled.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - scheduleId
              properties:
                scheduleId:
                  type: string
                reason:
                  type: string
      responses:
        '200':
          description: Appointment successfully cancelled
```

