-- Organisation & Location Refactor Migration
-- Renames tenants → organisations, customers → locations
-- Renames all related columns, enums, indexes, and FK constraints
-- Hand-written to preserve data (Drizzle generates DROP+CREATE which would destroy data)

-- ============================================================================
-- STEP 1: Rename enums
-- ============================================================================

ALTER TYPE "public"."tenant_type" RENAME TO "organisation_type";--> statement-breakpoint
ALTER TYPE "public"."customer_status" RENAME TO "location_status";--> statement-breakpoint

-- Create new organisation_status enum (organisations get their own status tracking)
CREATE TYPE "public"."organisation_status" AS ENUM ('active', 'suspended', 'inactive');--> statement-breakpoint

-- ============================================================================
-- STEP 2: Rename tables
-- ============================================================================

ALTER TABLE "tenants" RENAME TO "organisations";--> statement-breakpoint
ALTER TABLE "customers" RENAME TO "locations";--> statement-breakpoint

-- ============================================================================
-- STEP 3: Add status column to organisations
-- ============================================================================

ALTER TABLE "organisations" ADD COLUMN "status" "organisation_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint

-- ============================================================================
-- STEP 4: Rename columns
-- ============================================================================

-- locations (formerly customers): tenant_id → organisation_id
ALTER TABLE "locations" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- users: tenant_id → organisation_id, customer_id → location_id
ALTER TABLE "users" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "customer_id" TO "location_id";--> statement-breakpoint

-- programmes: tenant_id → organisation_id
ALTER TABLE "programmes" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- programme_phases: tenant_id → organisation_id
ALTER TABLE "programme_phases" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- process_jobs: tenant_id → organisation_id
ALTER TABLE "process_jobs" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- user_assessments: tenant_id → organisation_id
ALTER TABLE "user_assessments" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- user_assessment_answers: tenant_id → organisation_id
ALTER TABLE "user_assessment_answers" RENAME COLUMN "tenant_id" TO "organisation_id";--> statement-breakpoint

-- ============================================================================
-- STEP 5: Rename FK constraints to match Drizzle's expected names
-- ============================================================================

-- locations FK: tenant_id ref → organisation_id ref
ALTER TABLE "locations" RENAME CONSTRAINT "customers_tenant_id_tenants_id_fk" TO "locations_organisation_id_organisations_id_fk";--> statement-breakpoint

-- users FKs
ALTER TABLE "users" RENAME CONSTRAINT "users_tenant_id_tenants_id_fk" TO "users_organisation_id_organisations_id_fk";--> statement-breakpoint
ALTER TABLE "users" RENAME CONSTRAINT "users_customer_id_customers_id_fk" TO "users_location_id_locations_id_fk";--> statement-breakpoint

-- programmes FK
ALTER TABLE "programmes" RENAME CONSTRAINT "programmes_tenant_id_tenants_id_fk" TO "programmes_organisation_id_organisations_id_fk";--> statement-breakpoint

-- programme_phases FK
ALTER TABLE "programme_phases" RENAME CONSTRAINT "programme_phases_tenant_id_tenants_id_fk" TO "programme_phases_organisation_id_organisations_id_fk";--> statement-breakpoint

-- process_jobs FK
ALTER TABLE "process_jobs" RENAME CONSTRAINT "process_jobs_tenant_id_tenants_id_fk" TO "process_jobs_organisation_id_organisations_id_fk";--> statement-breakpoint

-- user_assessments FK
ALTER TABLE "user_assessments" RENAME CONSTRAINT "user_assessments_tenant_id_tenants_id_fk" TO "user_assessments_organisation_id_organisations_id_fk";--> statement-breakpoint

-- user_assessment_answers FK
ALTER TABLE "user_assessment_answers" RENAME CONSTRAINT "user_assessment_answers_tenant_id_tenants_id_fk" TO "user_assessment_answers_organisation_id_organisations_id_fk";--> statement-breakpoint

-- ============================================================================
-- STEP 6: Rename indexes
-- ============================================================================

-- locations indexes (formerly customers)
ALTER INDEX "idx_customers_tenant_id" RENAME TO "idx_locations_organisation_id";--> statement-breakpoint
ALTER INDEX "idx_customers_account_code" RENAME TO "idx_locations_account_code";--> statement-breakpoint
ALTER INDEX "idx_customers_status" RENAME TO "idx_locations_status";--> statement-breakpoint

-- users indexes
ALTER INDEX "idx_users_tenant_id" RENAME TO "idx_users_organisation_id";--> statement-breakpoint
ALTER INDEX "idx_users_customer_id" RENAME TO "idx_users_location_id";--> statement-breakpoint

-- programmes indexes
ALTER INDEX "idx_programmes_tenant_user" RENAME TO "idx_programmes_organisation_user";--> statement-breakpoint

-- programme_phases indexes
ALTER INDEX "idx_programme_phases_tenant" RENAME TO "idx_programme_phases_organisation";--> statement-breakpoint

-- process_jobs indexes
ALTER INDEX "idx_process_jobs_tenant" RENAME TO "idx_process_jobs_organisation";--> statement-breakpoint

-- user_assessments indexes
ALTER INDEX "idx_user_assessments_tenant_user" RENAME TO "idx_user_assessments_organisation_user";--> statement-breakpoint

-- user_assessment_answers indexes
ALTER INDEX "idx_user_assessment_answers_tenant" RENAME TO "idx_user_assessment_answers_organisation";--> statement-breakpoint

-- Also rename the unique constraint on locations (formerly customers)
ALTER INDEX "customers_account_code_unique" RENAME TO "locations_account_code_unique";
