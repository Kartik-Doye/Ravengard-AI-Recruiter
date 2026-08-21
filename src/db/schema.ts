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
  'completed', 
  'failed',
  'cancelled'
]);

export const failedReasonCodeEnum = pgEnum('failed_reason_code', [
  'hardware_denied',
  'cheat_detected',
  'schema_validation_failed',
  'candidate_cancelled',
  'parse_failed'
]);

export const violationTypeEnum = pgEnum('violation_type', [
  'visibility_change', 
  'devtools_opened', 
  'permission_denied',
  'window_blur',
  'audio_loss',
  'other'
]);

export const violationSeverityEnum = pgEnum('violation_severity', [
  'warning',
  'escalation',
  'critical'
]);

export const roundStatusEnum = pgEnum('round_status', [
  'processing',
  'completed',
  'failed_validation',
  'failed_provider',
  'cancelled'
]);

export const resumeParseStatusEnum = pgEnum('resume_parse_status', [
  'pending',
  'processing',
  'completed',
  'failed'
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
  antiCheatState: text('anti_cheat_state').default('nominal').notNull(),
  visibilityStrikes: integer('visibility_strikes').default(0).notNull(),
  devtoolsStrikes: integer('devtools_strikes').default(0).notNull(),
  lastViolationAt: timestamp('last_violation_at'),
  lastVisibilityAt: timestamp('last_visibility_at'),
  
  // Cancellations & Failures
  cancelledAt: timestamp('cancelled_at'),
  failedReasonCode: failedReasonCodeEnum('failed_reason_code'),
  failedReasonText: text('failed_reason_text'),
  
  // Others
  resumeUrl: text('resume_url'), // Kept for compat
  companyId: integer('company_id'),
  configSnapshot: jsonb('config_snapshot'),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  policyVersion: text('policy_version'),
  
  version: integer('version').default(1).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumeParses = pgTable('resume_parses', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  
  status: resumeParseStatusEnum('status').default('pending').notNull(),
  sourceFilename: text('source_filename'),
  sourceFileUrl: text('source_file_url'),
  sourceFileHash: text('source_file_hash'),
  
  rawResumeText: text('raw_resume_text'),
  parsedJsonb: jsonb('parsed_jsonb'),
  skillsJsonb: jsonb('skills_jsonb'),
  experienceJsonb: jsonb('experience_jsonb'),
  educationJsonb: jsonb('education_jsonb'),
  
  atsScore: integer('ats_score'),
  parserVersion: text('parser_version'),
  parseErrorText: text('parse_error_text'),
  
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessionViolations = pgTable('session_violations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  violationType: violationTypeEnum('violation_type').notNull(),
  severity: violationSeverityEnum('severity').notNull(),
  phase: text('phase'),
  detailsJsonb: jsonb('details_jsonb'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roundOutputs = pgTable('round_outputs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  
  roundIndex: integer('round_index').notNull(),
  roundType: text('round_type'),
  status: roundStatusEnum('status').default('processing').notNull(),
  
  promptVersion: text('prompt_version'),
  modelName: text('model_name'),
  
  rawInputContextJsonb: jsonb('raw_input_context_jsonb'),
  rawValidOutputJsonb: jsonb('raw_valid_output_jsonb'),
  rawInvalidOutputText: text('raw_invalid_output_text'),
  validationErrorText: text('validation_error_text'),
  
  retryCount: integer('retry_count').default(0).notNull(),
  
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  
  overallScore: integer('overall_score'),
  confidenceScore: integer('confidence_score'),
  communicationScore: integer('communication_score'),
  technicalScore: integer('technical_score'),
  reasoningScore: integer('reasoning_score'),
  
  strengthsJsonb: jsonb('strengths_jsonb'),
  gapsJsonb: jsonb('gaps_jsonb'),
  summaryText: text('summary_text'),
  reportSnapshotJsonb: jsonb('report_snapshot_jsonb'),
  
  generatedAt: timestamp('generated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assessmentRecommendations = pgTable('assessment_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority'),
  category: text('category'),
  estimatedDays: integer('estimated_days'),
  resourceLinksJsonb: jsonb('resource_links_jsonb'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
