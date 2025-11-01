CREATE TYPE "public"."customer_status" AS ENUM('active', 'suspended', 'inactive');

CREATE TYPE "public"."tenant_type" AS ENUM('individual', 'business');

CREATE TYPE "public"."user_role" AS ENUM(
	'system_admin',
	'customer_owner',
	'customer_admin',
	'customer_user',
	'individual_user'
);

CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_code" varchar(50) NOT NULL,
	"address" jsonb,
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_account_code_unique" UNIQUE("account_code")
);

CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "tenant_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"settings" jsonb DEFAULT '{}' :: jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"cognito_sub" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"customer_id" uuid,
	"profile_image_url" text,
	"phone" varchar(20),
	"date_of_birth" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cognito_sub_unique" UNIQUE("cognito_sub")
);

ALTER TABLE
	"customers"
ADD
	CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE
	"users"
ADD
	CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE
	"users"
ADD
	CONSTRAINT "users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_customers_tenant_id" ON "customers" USING btree ("tenant_id");

CREATE INDEX "idx_customers_account_code" ON "customers" USING btree ("account_code");

CREATE INDEX "idx_customers_status" ON "customers" USING btree ("status");

CREATE INDEX "idx_users_tenant_id" ON "users" USING btree ("tenant_id");

CREATE INDEX "idx_users_email" ON "users" USING btree ("email");

CREATE INDEX "idx_users_customer_id" ON "users" USING btree ("customer_id");