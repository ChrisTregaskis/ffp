CREATE TYPE "public"."programme_status" AS ENUM('active', 'paused', 'completed', 'archived');

--> statement-breakpoint
CREATE TABLE "programme_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"programme_template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "programme_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	CONSTRAINT "programmes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	CONSTRAINT "programmes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	CONSTRAINT "programmes_programme_template_id_programme_templates_id_fk" FOREIGN KEY ("programme_template_id") REFERENCES "public"."programme_templates"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_programme_templates_slug" ON "programme_templates" USING btree ("slug");

--> statement-breakpoint
CREATE INDEX "idx_programmes_tenant_user" ON "programmes" USING btree ("tenant_id", "user_id");

--> statement-breakpoint
CREATE INDEX "idx_programmes_status" ON "programmes" USING btree ("status");

--> statement-breakpoint
CREATE INDEX "idx_programmes_template" ON "programmes" USING btree ("programme_template_id");

--> statement-breakpoint
ALTER TABLE
	"user_assessments"
ADD
	CONSTRAINT "user_assessments_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE
set
	null ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"assessment_flows" DROP COLUMN "steps";