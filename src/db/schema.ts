import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('starter'),
  seats: integer('seats').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const recruiterUsers = pgTable('recruiter_users', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('recruiter'), // admin, recruiter, viewer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const jobRoles = pgTable('job_roles', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  title: text('title').notNull(),
  requiredSkills: jsonb('required_skills').default([]), // array of strings
  personaToggle: jsonb('persona_toggle').default({}), 
  questionCounts: jsonb('question_counts').default({ aptitude: 20, technical: 60 }),
  thinkAgainLimit: integer('think_again_limit').default(2),
  rubricWeights: jsonb('rubric_weights').default({}),
  passThresholds: jsonb('pass_thresholds').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidateInvites = pgTable('candidate_invites', {
  id: serial('id').primaryKey(),
  jobRoleId: integer('job_role_id').references(() => jobRoles.id).notNull(),
  email: text('email').notNull(),
  mobile: text('mobile'),
  token: text('token').notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, used, expired
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').default(false),
  college: text('college').notNull(),
  degree: text('degree').notNull(),
  gradYear: integer('grad_year').notNull(),
  preferredLanguage: text('preferred_language').notNull(),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  correlationId: text('correlation_id'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id')
    .references(() => candidates.id)
    .notNull(),
  companyId: integer('company_id').references(() => companies.id),
  jobRoleId: integer('job_role_id').references(() => jobRoles.id),
  status: varchar('status', { length: 50 }).notNull().default('created'), // created, in_progress, completed, abandoned
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('welcome'), // welcome, consent, resume, etc.
  locked: boolean('locked').notNull().default(false),
  version: integer('version').notNull().default(1),
  configSnapshot: jsonb('config_snapshot').default({}),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  resumeUrl: text('resume_url'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  thinkAgainUsed: integer('think_again_used').notNull().default(0),
});

export const resumeAnalyses = pgTable('resume_analyses', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => sessions.id)
    .notNull(),
  rawText: text('raw_text'),
  atsScore: integer('ats_score'),
  skills: jsonb('skills').default([]),
  projects: jsonb('projects').default([]),
  experience: jsonb('experience').default([]),
  education: jsonb('education').default([]),
  certifications: jsonb('certifications').default([]),
  strengths: jsonb('strengths').default([]),
  weaknesses: jsonb('weaknesses').default([]),
  missingKeywords: jsonb('missing_keywords').default([]),
  recruiterReviewText: text('recruiter_review_text'),
});

export const interviewTurns = pgTable('interview_turns', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  persona: varchar('persona', { length: 50 }).notNull(),
  questionText: text('question_text').notNull(),
  answerTranscript: text('answer_transcript'),
  audioRef: text('audio_ref'),
  videoRef: text('video_ref'),
  isFollowup: boolean('is_followup').default(false),
  thinkAgainUsed: boolean('think_again_used').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const interviewerNotes = pgTable('interviewer_notes', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  persona: varchar('persona', { length: 50 }).notNull(),
  noteText: text('note_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roundScores = pgTable('round_scores', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  persona: varchar('persona', { length: 50 }).notNull(),
  score: integer('score').notNull(),
  rationaleText: text('rationale_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const integrityEvents = pgTable('integrity_events', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(), // low, medium, high
  evidenceRef: text('evidence_ref'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const finalReports = pgTable('final_reports', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  band: varchar('band', { length: 50 }),
  overallScore: integer('overall_score'),
  pdfRef: text('pdf_ref'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

export const learningRoadmaps = pgTable('learning_roadmaps', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  weeksJson: jsonb('weeks_json').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const careerCoachOutputs = pgTable('career_coach_outputs', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  adviceText: text('advice_text').notNull(),
  resources: jsonb('resources').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  recipient: text('recipient').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

export const retakeRequests = pgTable('retake_requests', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, denied
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
});

// Relations
export const candidatesRelations = relations(candidates, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [sessions.candidateId],
    references: [candidates.id],
  }),
  jobRole: one(jobRoles, {
    fields: [sessions.jobRoleId],
    references: [jobRoles.id],
  }),
  resumeAnalyses: many(resumeAnalyses),
  interviewTurns: many(interviewTurns),
  interviewerNotes: many(interviewerNotes),
  roundScores: many(roundScores),
  integrityEvents: many(integrityEvents),
  finalReports: many(finalReports),
  learningRoadmaps: many(learningRoadmaps),
  careerCoachOutputs: many(careerCoachOutputs),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  recruiterUsers: many(recruiterUsers),
  jobRoles: many(jobRoles),
}));

export const jobRolesRelations = relations(jobRoles, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobRoles.companyId],
    references: [companies.id],
  }),
  sessions: many(sessions),
  candidateInvites: many(candidateInvites),
}));
