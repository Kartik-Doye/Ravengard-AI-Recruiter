import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stageEnum = pgEnum('session_stage', [
  'resume_upload',
  'resume_analysis',
  'interview_instructions',
  'device_check',
  'waiting_room',
  'interview_hr_friendly',
  'interview_technical',
  'interview_cto',
  'report_generation'
]);

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const organizationAdmins = pgTable('organization_admins', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role').default('admin')
});

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  mobile: text('mobile'),
  college: text('college'),
  degree: text('degree'),
  gradYear: integer('grad_year'),
  preferredLanguage: text('preferred_language'),
  emailVerified: boolean('email_verified').default(false),
  organizationId: text('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').references(() => candidates.id),
  organizationId: text('organization_id').references(() => organizations.id), // Added for strict isolation
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  currentStage: stageEnum('current_stage').default('resume_upload'),
  status: text('status').default('active'),
  locked: boolean('locked').default(true),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  policyVersion: text('policy_version'),
  thinkAgainUsesLeft: integer('think_again_uses_left'),
  deviceCheckStatus: text('device_check_status'),
  cameraPermission: text('camera_permission'),
  microphonePermission: text('microphone_permission'),
  speakerTestPassed: boolean('speaker_test_passed'),
  browserSupported: boolean('browser_supported'),
  deviceCheckCompletedAt: timestamp('device_check_completed_at'),
  deviceCheckMeta: jsonb('device_check_meta'),
  flagged: boolean('flagged').default(false),
  flagReason: text('flag_reason')
});

export const resumeAnalyses = pgTable('resume_analyses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  rawResumeText: text('raw_resume_text')
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const interviewSessions = pgTable('interview_sessions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  roundType: text('round_type').default('hr'),
  status: text('status').default('in_progress'), // in_progress, completed
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
});

export const interviewQuestions = pgTable('interview_questions', {
  id: text('id').primaryKey(),
  interviewSessionId: text('interview_session_id').references(() => interviewSessions.id),
  questionIndex: integer('question_index'),
  questionText: text('question_text'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

export const interviewResponses = pgTable('interview_responses', {
  id: text('id').primaryKey(),
  questionId: text('question_id').references(() => interviewQuestions.id),
  responseText: text('response_text'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const integritySignals = pgTable('integrity_signals', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  interviewSessionId: text('interview_session_id').references(() => interviewSessions.id),
  signalType: text('signal_type'), // 'tab_blur', 'window_switch', 'copy_paste', etc.
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: text('metadata'),
});

export const interviewReports = pgTable('interview_reports', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id).notNull(),
  overallScore: integer('overall_score'),
  breakdown: jsonb('breakdown'),
  strengths: jsonb('strengths'),
  weaknesses: jsonb('weaknesses'),
  recommendation: text('recommendation'),
  rubricVersion: text('rubric_version').default('v1.0').notNull(),
  scoringStatus: text('scoring_status').default('completed').notNull(), // 'completed' | 'pending_retry' | 'failed'
  evidence: jsonb('evidence'),
  generatedAt: timestamp('generated_at').defaultNow(),
}, (table) => [
  uniqueIndex('interview_reports_session_rubric_idx').on(table.sessionId, table.rubricVersion),
]);


export const rubrics = pgTable('rubrics', {
  id: text('id').primaryKey(),
  jobId: text('job_id'),
  version: text('version').default('v1.0'),
  createdAt: timestamp('created_at').defaultNow()
});

export const rubricCriteria = pgTable('rubric_criteria', {
  id: text('id').primaryKey(),
  rubricId: text('rubric_id').references(() => rubrics.id),
  name: text('name').notNull(),
  weight: integer('weight').notNull(),
  description: text('description')
});

export const questionScores = pgTable('question_scores', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id).notNull(),
  questionId: text('question_id').references(() => interviewQuestions.id).notNull(),
  criterionId: text('criterion_id').references(() => rubricCriteria.id).notNull(),
  score: integer('score').notNull(),
  rubricVersion: text('rubric_version').default('v1.0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  uniqueIndex('question_scores_identity_idx').on(
    table.sessionId,
    table.questionId,
    table.criterionId,
    table.rubricVersion
  ),
  check('question_score_range_check', sql`${table.score} >= 0 AND ${table.score} <= 100`)
]);


export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('viewer'), // 'super_admin' | 'admin' | 'hr_admin' | 'hr_user' | 'recruiter' | 'reviewer' | 'viewer'
  organizationId: text('organization_id').references(() => organizations.id),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow()
});

export const adminLogs = pgTable('admin_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').references(() => adminUsers.id),
  organizationId: text('organization_id').references(() => organizations.id),
  action: text('action').notNull(),
  target: text('target'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata')
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  title: text('title').notNull(),
  department: text('department'),
  description: text('description').notNull(),
  requirementsJson: jsonb('requirements_json'), // target competencies, target skills, rubric criteria
  screeningThreshold: integer('screening_threshold').notNull().default(70),
  requireHumanRejectionApproval: boolean('require_human_rejection_approval').notNull().default(true),
  status: text('status').notNull().default('active'), // 'active' | 'closed' | 'draft'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  uniqueIndex('jobs_id_org_unique_idx').on(table.id, table.organizationId),
  index('jobs_org_created_idx').on(table.organizationId, table.createdAt)
]);

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  status: text('status').notNull().default('applied'),
  // Possible values:
  // 'applied' | 'shortlisted' | 'rejected_at_screening' | 'pending_rejection_review' |
  // 'assessment_pending' | 'assessment_in_progress' | 'assessment_completed' |
  // 'recommended' | 'not_recommended' | 'screening_failed_manual_review'
  sessionId: text('session_id').references(() => sessions.id),
  magicTokenHash: text('magic_token_hash'),
  magicTokenExpiresAt: timestamp('magic_token_expires_at'),
  magicTokenUsedAt: timestamp('magic_token_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  uniqueIndex('applications_candidate_job_unique_idx').on(table.candidateId, table.jobId),
  index('applications_org_status_idx').on(table.organizationId, table.status),
  index('applications_magic_token_hash_idx').on(table.magicTokenHash)
]);

export const aiScreeningResults = pgTable('ai_screening_results', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  matchScore: integer('match_score').notNull(),
  strengthsSummary: jsonb('strengths_summary'), // string[]
  gapsSummary: jsonb('gaps_summary'), // string[]
  fullRationaleJson: jsonb('full_rationale_json'),
  screeningVersion: text('screening_version').default('v1.0').notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  uniqueIndex('ai_screening_app_version_idx').on(table.applicationId, table.screeningVersion)
]);

export const screeningQueue = pgTable('screening_queue', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  organizationId: text('organization_id').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed' | 'screening_failed_manual_review'
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  index('screening_queue_status_idx').on(table.status)
]);

export const emailOutbox = pgTable('email_outbox', {
  id: text('id').primaryKey(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name'),
  templateType: text('template_type').notNull(), // 'shortlist_invitation' | 'assessment_completed' | 'non_selection_rejection'
  subject: text('subject').notNull(),
  bodyText: text('body_text').notNull(),
  bodyHtml: text('body_html'),
  applicationId: text('application_id').references(() => applications.id),
  organizationId: text('organization_id'),
  idempotencyKey: text('idempotency_key').unique(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'sent' | 'failed' | 'logged_dev'
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('email_outbox_status_idx').on(table.status)
]);

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  scopes: jsonb('scopes').default(['candidates:read', 'candidates:write']).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('idx_api_keys_org_hash').on(table.organizationId, table.keyHash)
]);

export const integrationConfigs = pgTable('integration_configs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  provider: text('provider').notNull(), // 'greenhouse' | 'lever' | 'workday'
  apiEndpoint: text('api_endpoint'),
  encryptedCredentials: jsonb('encrypted_credentials').notNull(),
  webhookSecret: text('webhook_secret'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  uniqueIndex('integration_configs_org_provider_idx').on(table.organizationId, table.provider)
]);

export const outboxEvents = pgTable('outbox_events', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  eventType: text('event_type').notNull(), // 'ATS_EXPORT_CANDIDATE_SCORECARD'
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(5).notNull(),
  nextRetryAt: timestamp('next_retry_at').defaultNow().notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  index('idx_outbox_events_processing').on(table.status, table.nextRetryAt)
]);

