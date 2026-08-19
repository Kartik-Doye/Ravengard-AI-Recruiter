import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export const phaseEnum = pgEnum('phase', [
  'registration', 
  'intelligence', 
  'pre_flight',
  'interview_round_1', 
  'interview_round_2', 
  'interview_round_3', 
  'interview_round_4',
  'interview_round_5', 
  'interview_round_6', 
  'interview_round_7', 
  'interview_round_8',
  'assessment', 
  'completed', 
  'failed'
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'active', 
  'paused', 
  'completed', 
  'failed'
]);

export const violationTypeEnum = pgEnum('violation_type', [
  'visibility_change', 
  'devtools_resize', 
  'audio_loss',
  'other'
]);

export const violationSeverityEnum = pgEnum('violation_severity', [
  'warning',
  'escalation',
  'hard_fail'
]);

// -----------------------------------------------------------------------------
// TABLES
// -----------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  gradYear: integer('grad_year'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // State Machine Authority
  currentPhase: phaseEnum('current_phase').default('registration').notNull(),
  status: sessionStatusEnum('status').default('active').notNull(),
  locked: boolean('locked').default(false).notNull(),
  currentRoundIndex: integer('current_round_index').default(1).notNull(),
  thinkAgainUsesLeft: integer('think_again_uses_left').default(2).notNull(),
  
  // O(1) Anti-Cheat Counters
  visibilityStrikes: integer('visibility_strikes').default(0).notNull(),
  devtoolsStrikes: integer('devtools_strikes').default(0).notNull(),
  lastViolationAt: timestamp('last_violation_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeParses = pgTable('resume_parses', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  atsScore: integer('ats_score'),
  skills: jsonb('skills'), // Structured array of extracted skills
  experience: jsonb('experience'), // Structured array of experiences
  education: jsonb('education'), // Structured array of education
  rawText: text('raw_text'), // Backup of extracted text from PDF
  status: text('status').default('pending').notNull(), // pending, success, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionViolations = pgTable('session_violations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  violationType: violationTypeEnum('violation_type').notNull(),
  severity: violationSeverityEnum('severity').notNull(),
  context: jsonb('context'), // e.g., timestamp delta, browser agent
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roundOutputs = pgTable('round_outputs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  roundIndex: integer('round_index').notNull(),
  aiPrompt: text('ai_prompt').notNull(),
  candidateResponseSummary: text('candidate_response_summary').notNull(),
  score: integer('score'), // Evaluated score for this specific round
  validationStatus: text('validation_status').default('validated').notNull(), // schema validation status
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  holisticScore: integer('holistic_score').notNull(),
  reportSnapshot: jsonb('report_snapshot'), // Flexible display blob for UI rendering
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assessmentRecommendations = pgTable('assessment_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
