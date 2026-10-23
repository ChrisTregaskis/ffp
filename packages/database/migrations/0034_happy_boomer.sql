CREATE TABLE "template_session_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"template_session_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"tag_category_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_slot_tags" (
	"slot_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_slot_tags_slot_id_tag_id_pk" PRIMARY KEY("slot_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "template_phases" ALTER COLUMN "session_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "template_session_slots" ADD CONSTRAINT "template_session_slots_template_session_id_template_sessions_id_fk" FOREIGN KEY ("template_session_id") REFERENCES "public"."template_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_session_slots" ADD CONSTRAINT "template_session_slots_tag_category_id_tag_categories_id_fk" FOREIGN KEY ("tag_category_id") REFERENCES "public"."tag_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_slot_tags" ADD CONSTRAINT "template_slot_tags_slot_id_template_session_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."template_session_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_slot_tags" ADD CONSTRAINT "template_slot_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_session_slots_public_id" ON "template_session_slots" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_session_slots_session_order" ON "template_session_slots" USING btree ("template_session_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_template_session_slots_category" ON "template_session_slots" USING btree ("tag_category_id");--> statement-breakpoint
CREATE INDEX "idx_template_slot_tags_tag" ON "template_slot_tags" USING btree ("tag_id");