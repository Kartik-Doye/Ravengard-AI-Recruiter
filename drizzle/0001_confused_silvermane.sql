CREATE TABLE "admin_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"organization_id" text,
	"action" text NOT NULL,
	"target" text,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"organization_id" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_screening_results" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"match_score" integer NOT NULL,
	"strengths_summary" jsonb,
	"gaps_summary" jsonb,
	"full_rationale_json" jsonb,
	"screening_version" text DEFAULT 'v1.0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '["candidates:read","candidates:write"]'::jsonb NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"status" text DEFAULT 'applied' NOT NULL,
	"session_id" text,
	"magic_token_hash" text,
	"magic_token_expires_at" timestamp,
	"magic_token_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"template_type" text NOT NULL,
	"subject" text NOT NULL,
	"body_text" text NOT NULL,
	"body_html" text,
	"application_id" text,
	"organization_id" text,
	"idempotency_key" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "integration_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"api_endpoint" text,
	"encrypted_credentials" jsonb NOT NULL,
	"webhook_secret" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrity_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"interview_session_id" text,
	"signal_type" text,
	"timestamp" timestamp DEFAULT now(),
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"interview_session_id" text,
	"question_index" integer,
	"question_text" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"overall_score" integer,
	"breakdown" jsonb,
	"strengths" jsonb,
	"weaknesses" jsonb,
	"recommendation" text,
	"rubric_version" text DEFAULT 'v1.0' NOT NULL,
	"scoring_status" text DEFAULT 'completed' NOT NULL,
	"evidence" jsonb,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text,
	"response_text" text,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"round_type" text DEFAULT 'hr',
	"status" text DEFAULT 'in_progress',
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"description" text NOT NULL,
	"requirements_json" jsonb,
	"screening_threshold" integer DEFAULT 70 NOT NULL,
	"require_human_rejection_approval" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"criterion_id" text NOT NULL,
	"score" integer NOT NULL,
	"rubric_version" text DEFAULT 'v1.0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "question_score_range_check" CHECK ("question_scores"."score" >= 0 AND "question_scores"."score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "rubric_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"rubric_id" text,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text,
	"version" text DEFAULT 'v1.0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "screening_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "device_check_status" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "camera_permission" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "microphone_permission" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "speaker_test_passed" boolean;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "browser_supported" boolean;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "device_check_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "device_check_meta" jsonb;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "flagged" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "flag_reason" text;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_screening_results" ADD CONSTRAINT "ai_screening_results_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrity_signals" ADD CONSTRAINT "integrity_signals_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrity_signals" ADD CONSTRAINT "integrity_signals_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interview_session_id_interview_sessions_id_fk" FOREIGN KEY ("interview_session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_reports" ADD CONSTRAINT "interview_reports_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_responses" ADD CONSTRAINT "interview_responses_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_scores" ADD CONSTRAINT "question_scores_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_scores" ADD CONSTRAINT "question_scores_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_scores" ADD CONSTRAINT "question_scores_criterion_id_rubric_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."rubric_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_queue" ADD CONSTRAINT "screening_queue_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_screening_app_version_idx" ON "ai_screening_results" USING btree ("application_id","screening_version");--> statement-breakpoint
CREATE INDEX "idx_api_keys_org_hash" ON "api_keys" USING btree ("organization_id","key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_candidate_job_unique_idx" ON "applications" USING btree ("candidate_id","job_id");--> statement-breakpoint
CREATE INDEX "applications_org_status_idx" ON "applications" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "applications_magic_token_hash_idx" ON "applications" USING btree ("magic_token_hash");--> statement-breakpoint
CREATE INDEX "email_outbox_status_idx" ON "email_outbox" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_configs_org_provider_idx" ON "integration_configs" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_reports_session_rubric_idx" ON "interview_reports" USING btree ("session_id","rubric_version");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_id_org_unique_idx" ON "jobs" USING btree ("id","organization_id");--> statement-breakpoint
CREATE INDEX "jobs_org_created_idx" ON "jobs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_outbox_events_processing" ON "outbox_events" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE UNIQUE INDEX "question_scores_identity_idx" ON "question_scores" USING btree ("session_id","question_id","criterion_id","rubric_version");--> statement-breakpoint
CREATE INDEX "screening_queue_status_idx" ON "screening_queue" USING btree ("status");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;