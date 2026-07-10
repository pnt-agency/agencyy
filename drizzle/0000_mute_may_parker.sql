CREATE TYPE "public"."employer_status" AS ENUM('New Inquiry', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost');--> statement-breakpoint
CREATE TYPE "public"."talent_status" AS ENUM('Applicant', 'Screened', 'Trained', 'Verified', 'Premium Verified');--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"role_needed" text NOT NULL,
	"number_needed" integer NOT NULL,
	"budget" text NOT NULL,
	"start_date" text NOT NULL,
	"requirements" text,
	"status" "employer_status" DEFAULT 'New Inquiry' NOT NULL,
	"follow_up_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"role" text NOT NULL,
	"experience" text NOT NULL,
	"portfolio" text,
	"bio" text NOT NULL,
	"why_join" text NOT NULL,
	"cv_link" text,
	"status" "talent_status" DEFAULT 'Applicant' NOT NULL,
	"follow_up_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
