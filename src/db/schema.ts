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
