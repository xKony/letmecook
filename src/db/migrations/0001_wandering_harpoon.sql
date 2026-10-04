ALTER TABLE "flashcards" ADD COLUMN "fsrs_due" bigint;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_stability" real;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_difficulty" real;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_reps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_lapses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_state" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_last_review" bigint;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "fsrs_scheduled_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ntfy_topic" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ntfy_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ntfy_topic_unique" UNIQUE("ntfy_topic");