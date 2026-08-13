# Traineer - Database Schema

## 1. Entity Relationship Diagram
```mermaid
erDiagram
    users ||--o{ sessions : has
    sessions ||--o{ answers : contains
    sessions ||--o{ violations : logs
    sessions {
        uuid id
        uuid user_id
        string status
        int think_again_used
        jsonb resume_data
    }
    answers {
        uuid id
        uuid session_id
        string round
        string question_text
        string candidate_answer
        int score
    }
```

## 2. Table Definitions
- **users:** Stores candidate profile, email, and college details.
- **sessions:** Tracks the lifecycle of an interview (resume upload -> waiting room -> rounds -> complete).
- **answers:** Stores the history of generated questions, candidate responses, and round evaluations.
- **violations:** Logs anti-cheat triggers (e.g., tab switching).

## 3. Migration Strategy
- Drizzle ORM is used for schema definitions and migrations (`src/db/schema.ts`).
- Migrations are run incrementally during CI/CD.
