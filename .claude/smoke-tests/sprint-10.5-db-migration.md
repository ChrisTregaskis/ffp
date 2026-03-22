# Sprint 10.5 Database Migration Smoke Test (FFP-525)

**Date**: 2026-03-22
**Branch**: `feature/ffp-519-org-location-db-migration`
**Database**: `ffp_dev` (localhost)
**Migration**: 0021 (tenants -> organisations, customers -> locations)

---

## Results

### 1. Tables Renamed — PASS

- `organisations` table exists
- `locations` table exists
- `tenants` table does NOT exist
- `customers` table does NOT exist

### 2. Columns Renamed — PASS

All 7 tables have `organisation_id` (not `tenant_id`):

- `locations`, `users`, `programmes`, `programme_phases`, `process_jobs`, `user_assessments`, `user_assessment_answers`

`users` table has `location_id` (not `customer_id`).

### 3. Enums Renamed — PASS

- `organisation_type` exists with values: individual, business, platform
- `location_status` exists with values: active, suspended, inactive
- `organisation_status` exists with values: active, suspended, inactive
- `tenant_type` does NOT exist
- `customer_status` does NOT exist

### 4. Status Column on Organisations — PASS

- `organisations.status` column type: `organisation_status`
- Default value: `'active'::organisation_status`

### 5. Indexes Renamed — PASS

All 10 expected indexes exist:

- `idx_locations_organisation_id`
- `idx_locations_account_code`
- `idx_locations_status`
- `idx_users_organisation_id`
- `idx_users_location_id`
- `idx_programmes_organisation_user`
- `idx_programme_phases_organisation`
- `idx_process_jobs_organisation`
- `idx_user_assessments_organisation_user`
- `idx_user_assessment_answers_organisation`

### 6. FK Constraints Renamed — PASS

All 3 expected FK constraints exist:

- `locations_organisation_id_organisations_id_fk`
- `users_organisation_id_organisations_id_fk`
- `users_location_id_locations_id_fk`

No old `tenant`-named FK constraints found.

### 7. RLS Policies — PASS

New policies confirmed:

- `organisation_read_isolation` on `organisations`
- `organisation_write_isolation` on `organisations`
- `organisation_admin_bypass` on `organisations`
- `location_isolation` on `locations`
- `location_admin_bypass` on `locations`
- `user_isolation` on `users`
- `user_admin_bypass` on `users`
- `user_assessment_organisation_isolation` on `user_assessments`
- `user_assessment_answers_organisation_isolation` on `user_assessment_answers`
- `programme_phases_organisation_isolation` on `programme_phases`

No old policy names (`tenant_isolation`, `customer_isolation`, `tenant_read_isolation`, etc.) found.

### 8. Database Package Build — PASS

`@ffp/database` built successfully with `tsc` (no errors).

### 9. No Schema Drift — PASS

`drizzle-kit generate` output: "No schema changes, nothing to migrate"

Drizzle schema files match the database state exactly.

---

## Overall Verdict: PASS (9/9)

All checks passed. The migration from `tenants`/`customers` to `organisations`/`locations` has been applied correctly. Tables, columns, enums, indexes, FK constraints, and RLS policies are all renamed and functioning as expected. No schema drift detected.
