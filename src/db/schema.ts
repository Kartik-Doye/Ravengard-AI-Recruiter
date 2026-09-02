import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

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
  organizationId: text('organization_id').references(() => organizations.id)
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').references(() => candidates.id),
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
  deviceCheckMeta: jsonb('device_check_meta')
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
  signalType: text('signal_type'), // 'tab_blur', 'gaze_off', 'copy_paste', etc.
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: text('metadata'),
});

export const interviewReports = pgTable('interview_reports', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  overallScore: integer('overall_score'),
  breakdown: jsonb('breakdown'),
  strengths: jsonb('strengths'),
  weaknesses: jsonb('weaknesses'),
  recommendation: text('recommendation'),
  rubricVersion: text('rubric_version').default('v1.0'),
  evidence: jsonb('evidence'),
  generatedAt: timestamp('generated_at').defaultNow(),
});


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
  sessionId: text('session_id').references(() => sessions.id),
  questionId: text('question_id').references(() => interviewQuestions.id),
  criterionId: text('criterion_id').references(() => rubricCriteria.id),
  score: integer('score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});


export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').defaultNow()
});

export const adminLogs = pgTable('admin_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').references(() => adminUsers.id),
  action: text('action').notNull(),
  target: text('target'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata')
});
