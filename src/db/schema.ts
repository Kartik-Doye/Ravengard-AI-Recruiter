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
  billingTier: text('billing_tier').notNull().default('enterprise'),
  isActive: boolean('is_active').default(true),
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
  passwordHash: text('password_hash'),
  mobile: text('mobile'),
  college: text('college'),
  degree: text('degree'),
  gradYear: integer('grad_year'),
  preferredLanguage: text('preferred_language'),
  emailVerified: boolean('email_verified').default(false),
  organizationId: text('organization_id').references(() => organizations.id),
  resumeUrl: text('resume_url'),
  resumeText: text('resume_text'),
  githubUsername: text('github_username'),
  githubData: jsonb('github_data'),
  timezone: text('timezone'),
  country: text('country'),
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
  flagReason: text('flag_reason'),
  lastActiveAt: timestamp('last_active_at').defaultNow()
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
  organizationId: text('organization_id').references(() => organizations.id),
  title: text('title'),
  department: text('department'),
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
  rubricId: text('rubric_id').references(() => rubrics.id),
  title: text('title').notNull(),
  department: text('department'),
  location: text('location').default('Remote'),
  employmentType: text('employment_type').default('Full-time'),
  salaryRange: text('salary_range').default('$120k - $160k'),
  description: text('description').notNull(),
  requirementsJson: jsonb('requirements_json'), // target competencies, target skills, rubric criteria
  screeningThreshold: integer('screening_threshold').notNull().default(70),
  requireHumanRejectionApproval: boolean('require_human_rejection_approval').notNull().default(true),
  status: text('status').notNull().default('published'), // 'pending_approval' | 'published' | 'active' | 'closed' | 'draft' | 'archived'
  approvalFeedback: text('approval_feedback'),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  uniqueIndex('jobs_id_org_unique_idx').on(table.id, table.organizationId),
  index('jobs_org_created_idx').on(table.organizationId, table.createdAt),
  index('jobs_org_status_idx').on(table.organizationId, table.status)
]);

export const systemTelemetry = pgTable('system_telemetry', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  module: text('module').notNull(), // 'voice_interview' | 'mcq_battery' | 'resume_screening' | 'dossier_synthesis'
  llmTokensUsed: integer('llm_tokens_used').notNull().default(0),
  latencyMs: integer('latency_ms').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull()
}, (table) => [
  index('system_telemetry_org_rec_idx').on(table.organizationId, table.recordedAt),
  index('system_telemetry_mod_rec_idx').on(table.module, table.recordedAt)
]);

export const rubricDimensions = pgTable('rubric_dimensions', {
  id: text('id').primaryKey(),
  rubricId: text('rubric_id').references(() => rubrics.id, { onDelete: 'cascade' }),
  dimensionName: text('dimension_name').notNull(),
  weight: integer('weight').notNull().default(20),
  evalInstruction: text('eval_instruction').notNull(),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  status: text('status').notNull().default('applied'),
  // Possible values:
  // 'applied' | 'shortlisted' | 'assessment_pending' | 'mcq_in_progress' | 'interview_pending' |
  // 'pending_hr_review' | 'assessment_completed' | 'recommended' | 'offered' | 'rejected' | 'rejected_timeout'
  sessionId: text('session_id').references(() => sessions.id),
  assessmentExpiresAt: timestamp('assessment_expires_at'), // Strict 24-hour SLA TTL
  slaExpiresAt: timestamp('sla_expires_at'),
  mcqScore: integer('mcq_score'),
  interviewScore: integer('interview_score'),
  offerDetailsJson: jsonb('offer_details_json'),
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

export const mcqQuestions = pgTable('mcq_questions', {
  id: text('id').primaryKey(),
  skillTag: text('skill_tag').notNull(), // e.g., 'SQL', 'Data Modeling', 'Algorithms', 'Behavioral', 'Aptitude'
  category: text('category').notNull(), // 'Behavioral' | 'Aptitude' | 'Technical Aptitude'
  difficulty: text('difficulty').notNull().default('medium'), // 'easy' | 'medium' | 'hard' | 'brutal'
  questionText: text('question_text').notNull(),
  options: jsonb('options').notNull().$type<string[]>(),
  correctOption: text('correct_option').notNull(),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow()
});

export const assessmentSessions = pgTable('assessment_sessions', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  candidateId: text('candidate_id').references(() => candidates.id),
  type: text('type').notNull().default('mcq_battery'), // 'mcq_battery' | 'voice_interview'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Strict server countdown cutoff (startedAt + 60m)
  completedAt: timestamp('completed_at'),
  score: integer('score'),
  questionSnapshot: jsonb('question_snapshot'),
  answersSnapshot: jsonb('answers_snapshot'),
  radarData: jsonb('radar_data'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

export const aiEvaluations = pgTable('ai_evaluations', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  candidateId: text('candidate_id').references(() => candidates.id),
  overallRecommendation: text('overall_recommendation').notNull().default('HIRE'), // 'STRONG_HIRE' | 'HIRE' | 'WEAK_HIRE' | 'NO_HIRE'
  overallScore: integer('overall_score').notNull().default(85),
  durationMinutes: integer('duration_minutes').default(12),
  executiveSummary: text('executive_summary').notNull(),
  strengths: jsonb('strengths').$type<string[]>(),
  weaknesses: jsonb('weaknesses').$type<string[]>(),
  rubricBreakdown: jsonb('rubric_breakdown'),
  transcript: jsonb('transcript'),
  mediaUrls: jsonb('media_urls'),
  createdAt: timestamp('created_at').defaultNow()
});

export const candidateTasks = pgTable('candidate_tasks', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  applicationId: text('application_id').notNull().references(() => applications.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'mcq_assessment' | 'live_interview' | 'offer_signature'
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'expired'
  actionUrl: text('action_url'),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

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

export const hrNotifications = pgTable('hr_notifications', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  type: text('type').notNull(), // 'HIGH_SCORE' | 'INTEGRITY_FLAG' | 'SLA_EXPIRED' | 'PARTIAL_SUBMISSION'
  title: text('title').notNull(),
  message: text('message').notNull(),
  applicationId: text('application_id').references(() => applications.id),
  candidateId: text('candidate_id').references(() => candidates.id),
  metadata: jsonb('metadata'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  index('idx_hr_notifications_org_read').on(table.organizationId, table.isRead, table.createdAt)
]);

export const dossierComments = pgTable('dossier_comments', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').default('hr_user'),
  commentText: text('comment_text').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  index('idx_dossier_comments_app').on(table.applicationId, table.createdAt)
]);

export const candidateFeedbackSummaries = pgTable('candidate_feedback_summaries', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  candidateId: text('candidate_id').notNull().references(() => candidates.id),
  strengths: jsonb('strengths').$type<string[]>(),
  areasToImprove: jsonb('areas_to_improve').$type<string[]>(),
  learningResources: jsonb('learning_resources').$type<string[]>(),
  constructiveSummary: text('constructive_summary').notNull(),
  status: text('status').default('ready'), // 'ready' | 'emailed'
  generatedAt: timestamp('generated_at').defaultNow().notNull()
}, (table) => [
  uniqueIndex('idx_candidate_feedback_app_unique').on(table.applicationId)
]);

