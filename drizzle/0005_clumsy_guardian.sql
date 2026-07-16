CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employers" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "talents" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talents" ADD CONSTRAINT "talents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill (hand-written, not generated): attribute pre-existing leads to the
-- account that shares their email. Case-insensitive because the public forms
-- never normalized casing. Leads with no matching account stay null.
UPDATE "talents" SET "user_id" = "users"."id" FROM "users" WHERE "talents"."user_id" IS NULL AND lower("talents"."email") = lower("users"."email");--> statement-breakpoint
UPDATE "employers" SET "user_id" = "users"."id" FROM "users" WHERE "employers"."user_id" IS NULL AND lower("employers"."email") = lower("users"."email");