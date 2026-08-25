import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('candidate')
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  candidateId: text('candidate_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  currentPhase: text('current_phase').default('welcome'),
  status: text('status').default('active'),
  locked: boolean('locked').default(false),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  policyVersion: text('policy_version'),
  thinkAgainUsesLeft: integer('think_again_uses_left')
});

export const resumeParses = pgTable('resume_parses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  rawResumeText: text('raw_resume_text'),
  skills: jsonb('skills'),
  strengths: jsonb('strengths'),
  missingKeywords: jsonb('missing_keywords')
});

export const sessionViolations = pgTable('session_violations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  type: text('type'),
  severity: text('severity'),
  evidenceRef: text('evidence_ref')
});

export const roundOutputs = pgTable('round_outputs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
});

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
});

export const assessmentRecommendations = pgTable('assessment_recommendations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
