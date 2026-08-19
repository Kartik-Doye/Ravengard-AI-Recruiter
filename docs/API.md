# Ravengard AI Recruiter - API Specification

```yaml
openapi: 3.0.3
info:
  title: Ravengard AI Recruiter API
  version: 1.0.0
servers:
  - url: /api
paths:
  /session/init:
    post:
      summary: Initialize a new interview session
      responses:
        '200':
          description: Session created
  /session/{id}/resume:
    post:
      summary: Upload and parse resume
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Resume parsed
  /session/{id}/think-again:
    post:
      summary: Trigger 'Think Again' pass
      responses:
        '200':
          description: Pass utilized and hint returned
  /session/{id}/complete:
    post:
      summary: Complete interview and generate report
      responses:
        '200':
          description: Report generated
```
*(Note: This represents a high-level API design contract. Implementations exist within the Express server).*
