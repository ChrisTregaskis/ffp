---
paths:
  - '**/*.repository.ts'
---

# Contract: Row-Level Security (RLS)

Loads when editing any `*.repository.ts`. This is the non-negotiable tenant-isolation contract; the `database` and `backend` skills carry the fuller guidance.

## Must hold

- Set RLS context **inside the transaction**, scoped per request — never query outside one:

  ```typescript
  await db.transaction(async (tx) => {
    await setRLSContext(tx, context.organisationId); // SET LOCAL — transaction-scoped
    return await tx.query.users.findMany();
  });
  ```

- `setRLSContext` uses `SET LOCAL` so the GUC cannot leak across pooled connections.
- Belt-and-braces: also filter by `organisation_id` in the query where practical.
- **Never trust client-provided `organisationId`** — always from the actor context. JWT claims: `custom:tenantId` → organisationId, `custom:customerId` → locationId.
- Parameterised queries only (Drizzle) — no SQL string concatenation.

## System-managed (RLS-excluded) tables

Some catalogue tables are cross-organisation by design — do **not** add an organisation filter or RLS context for them. Current set (verify against the `@ffp/database` schema, which is the source of truth): `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions`, `programme_templates`, `template_phases`, `template_sessions`, `session_exercises`, `videos`. User-layer tables (users, organisations, locations, user_sessions, exercise_completions, programme_phases, …) are RLS-enforced.

## Don't

- Don't call `db.query.*` directly outside a transaction with RLS context (leaks all organisations).
- Don't pass `organisationId` from a request body/query param into a query.
