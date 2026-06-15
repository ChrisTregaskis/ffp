---
paths:
  - 'packages/database/**'
---

# Contract: database schema & migrations

Loads when editing the database package. The `database` skill carries the fuller guidance.

## Must hold

- **Migration-only.** Change schema in Drizzle → `pnpm db:generate` (creates SQL) → `pnpm db:migrate` (applies + tracks). **Never `db:push`** (a hook blocks it) — it skips migration tracking and causes drift that needs manual DB intervention to fix.
- **Migrate both databases**: `ffp_dev` **and** `ffp_test` (e.g. `DB_NAME=ffp_test pnpm db:migrate`).
- Migrations run as `DB_MIGRATE_USER` (elevated) — the app runtime user (`DB_USER`) can't run them due to RLS restrictions.
- New URL-facing tables get a `publicId` (12-char nanoid) column; frontend routes use `publicId`, not the UUID.
- New tenant-scoped tables need an RLS policy; system-managed catalogue tables are RLS-excluded by design (see `.claude/rules/rls.md`).
- `@ffp/database` MUST NOT import from `@ffp/core` (circular dependency). Shared enums/constants are defined here and imported into core.
- Generating a migration is safe (creates a `.sql` file only); applying modifies the database. Don't hand-edit already-applied migrations.

## Don't

- Don't run `db:push` / `drizzle-kit push`.
- Don't apply ad-hoc `ALTER`/`CREATE`/`DROP` SQL to "fix" drift — diagnose and hand the decision to the user.
- Confirm before any `INSERT`/`UPDATE`/`DELETE` SQL, even seed data.
