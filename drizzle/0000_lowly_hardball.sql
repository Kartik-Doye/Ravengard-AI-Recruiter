CREATE TYPE "public"."session_stage" AS ENUM('resume_upload', 'resume_analysis', 'interview_instructions', 'device_check', 'waiting_room', 'interview_hr_friendly', 'interview_technical', 'interview_cto', 'report_generation');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"mobile" text,
	"college" text,
	"degree" text,
	"grad_year" integer,
	"preferred_language" text,
	"email_verified" boolean DEFAULT false,
	"organization_id" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_admins" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin'
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resume_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"raw_resume_text" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"current_stage" "session_stage" DEFAULT 'resume_upload',
	"status" text DEFAULT 'active',
	"locked" boolean DEFAULT true,
	"consent_accepted_at" timestamp,
	"policy_version" text,
	"think_again_uses_left" integer
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_admins" ADD CONSTRAINT "organization_admins_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;