CREATE TABLE "deck_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"deck_id" uuid,
	"hash" text NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "occlusion" text;--> statement-breakpoint
ALTER TABLE "deck_images" ADD CONSTRAINT "deck_images_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_images" ADD CONSTRAINT "deck_images_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_images_owner_id_idx" ON "deck_images" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "deck_images_deck_id_idx" ON "deck_images" USING btree ("deck_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deck_images_owner_hash_uidx" ON "deck_images" USING btree ("owner_id","hash");