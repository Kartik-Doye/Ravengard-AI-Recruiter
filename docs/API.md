# Ravengard AI Recruiter - API Specification

```yaml
openapi: 3.0.3
info:
  title: Ravengard AI Recruiter API
  version: 1.1.0
  description: Endpoints for candidate onboarding, international registration, proctored session lock, and assessment progression.
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
                  type: string
                  example: "2025"
                preferredLanguage:
                  type: string
                  enum: [English, Spanish, French, Hindi]
                  default: English
                resumeText:
                  type: string
                  description: Optional extracted plain text from uploaded resume
      responses:
        '200':
          description: Candidate registered successfully
        '400':
          description: Validation error or disposable email address detected

  /candidate/parse-resume:
    post:
      summary: Extract candidate profile fields from PDF or DOCX resume
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                resume:
                  type: string
                  format: binary
      responses:
        '200':
          description: Resume parsed cleanly into structured candidate fields
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  parsed:
                    type: object
                    properties:
                      name:
                        type: string
                      email:
                        type: string
                      mobile:
                        type: string
                      country:
                        type: string
                      college:
                        type: string
                      degree:
                        type: string
                      gradYear:
                        type: string

  /me:
    get:
      summary: Get current authenticated candidate, session state, and verification status
      parameters:
        - in: header
          name: Authorization
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Candidate profile, active locked session, and stage information

  /session/confirm-consent:
    post:
      summary: Accept assessment policy and lock the interview session
      description: Irreversible transition. Generates locked session with SLA timeout (assessment_expires_at) and think-again counters.
      parameters:
        - in: header
          name: Authorization
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                policyConsent:
                  type: string
                  example: "I Agree"
      responses:
        '200':
          description: Session created, locked, and moved to resume_upload

  /session/{id}/stage:
    post:
      summary: Authorized phase transition in the candidate journey
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                stage:
                  type: string
                version:
                  type: integer
      responses:
        '200':
          description: Stage advanced

  /session/{id}/think-again:
    post:
      summary: Trigger 'Think Again' pass during conversational interview
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Pass utilized, decrements thinkAgainUsesLeft counter

  /session/{id}/complete:
    post:
      summary: Complete interview and trigger async final report generation
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Report generated and saved to scorecards
```
*(Note: Implementation contracts are enforced within server.ts and verified via automated API test suites).*
