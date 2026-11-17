CREATE TYPE "public"."kyc_id_type" AS ENUM('Passport', 'National ID', 'Driver''s Licence', 'Voter''s Card');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TABLE "talent_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"country" text NOT NULL,
	"id_type" "kyc_id_type" NOT NULL,
	"id_number" text NOT NULL,
	"id_document_key" text NOT NULL,
	"id_document_filename" text NOT NULL,
	"id_document_content_type" text NOT NULL,
	"id_document_size" integer NOT NULL,
	"selfie_key" text NOT NULL,
	"selfie_filename" text NOT NULL,
	"selfie_content_type" text NOT NULL,
	"selfie_size" integer NOT NULL,
	"status" "kyc_status" DEFAULT 'Pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"review_note" text,
	"method" text DEFAULT 'manual' NOT NULL,
	"provider_reference" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "talent_kyc_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "talent_kyc" ADD CONSTRAINT "talent_kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_kyc" ADD CONSTRAINT "talent_kyc_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talent_kyc_status_idx" ON "talent_kyc" USING btree ("status","submitted_at");