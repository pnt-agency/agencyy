CREATE TYPE "public"."interest_status" AS ENUM('Pending', 'Intro Made', 'Closed');--> statement-breakpoint
CREATE TABLE "talent_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"talent_id" uuid NOT NULL,
	"message" text,
	"status" "interest_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "talent_profiles" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "talent_profiles" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "talent_interests" ADD CONSTRAINT "talent_interests_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_interests" ADD CONSTRAINT "talent_interests_talent_id_users_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;