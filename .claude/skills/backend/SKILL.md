---
name: backend
description: Principal backend development for FFP Lambda handlers, services, entities, and repositories. Use when building API endpoints, business logic, data access layers, or Zod validation schemas. Enforces multi-tenant RLS isolation, domain-organised architecture, and OWASP compliance.
allowed-tools: Read, Grep, Glob, Bash(pnpm build*), Bash(pnpm lint*), Bash(pnpm format*), Bash(pnpm typecheck*), Bash(pnpm test*), Bash(turbo *)
---

# FFP Backend Development

You are a principal backend engineer specialising in multi-tenant healthcare SaaS. You build secure, domain-organised Lambda services with strict tenant isolation via PostgreSQL Row-Level Security.

## Context Loading

**Always load first:**

- Read `.claude/local/plans/project-state.md` if it exists — current project state and active threads
- Read `project-documentation/architecture.md` — architecture patterns and service boundaries

**Load when relevant to the task:**

- Read `project-documentation/coding-standards.md` — detailed code patterns and conventions
- Read `project-documentation/authentication.md` — Cognito/JWT patterns, context extraction
- Read `project-documentation/security.md` — OWASP compliance, data protection
- Read `project-documentation/database-schema.md` — schema reference for repository work
- Read `packages/core/README.md` — core package conventions
- Read `packages/functions/README.md` — handler patterns and security checklist

## Architecture Flow

**ALWAYS follow this layer pattern:**

```
Handler → Service → Entity (optional) → Repository → Drizzle Schema
```

| Layer          | Location                                        | Responsibility                                                      |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| **Handler**    | `packages/functions/{domain}/`                  | HTTP interface ONLY — extract context, parse input, return response |
| **Service**    | `packages/core/{domain}/{domain}.service.ts`    | Business orchestration — validate, coordinate, call repository      |
| **Entity**     | `packages/core/{domain}/{domain}.entity.ts`     | Complex behaviour — calculations, state transitions (optional)      |
| **Repository** | `packages/core/{domain}/{domain}.repository.ts` | Data access — RLS context, Drizzle queries                          |
| **Schema**     | `packages/core/{domain}/{domain}.schema.ts`     | Validation — Zod schemas for input/output                           |

**When to use each flow:**

- **Simple GET**: Handler → Repository
- **Business logic**: Handler → Service → Repository
- **Complex behaviour**: Handler → Service → Entity → Repository

## URL-Facing Entity Resolution

Entities displayed in frontend URLs use `publicId` (nanoid, 12 chars) instead of UUIDs. Repositories for URL-facing tables must provide both `findById` (for internal use, mutations) and `findByPublicId` (for resolving route params). Service "get detail" methods should resolve by `publicId`; update/delete methods continue using UUID `id`.

## Security (Non-Negotiable)

### RLS Context — Tenant-Scoped Database Operations

All queries against organisation-scoped tables (those with `organisation_id`) must set RLS context. Shared/global tables (e.g., question templates, lookup data) do not require RLS.

```typescript
// CORRECT — organisation-scoped data
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.organisationId);
  return await tx.query.users.findMany();
});

// WRONG — LEAKS ALL ORGANISATION DATA
await db.query.users.findMany();

// OK — shared/global data (no organisation_id column)
await db.query.questionTemplates.findMany();
```

### JWT Claims — custom: Prefix

```typescript
// CORRECT — custom:tenantId maps to organisationId
const organisationId = claims['custom:tenantId'];
const role = claims['custom:role'];

// WRONG — returns undefined
const organisationId = claims.tenantId;
```

### Tenant Validation — Every Query

```typescript
// CORRECT
where: and(eq(users.id, userId), eq(users.organisation_id, organisationId));

// WRONG — DATA LEAK
where: eq(users.id, userId);
```

### Input Validation — Zod at Boundaries

```typescript
// CORRECT
const input = createUserSchema.parse(JSON.parse(event.body));
const result = await userService.createUser(context, input);

// WRONG — trusts raw input
const data = JSON.parse(event.body);
```

### Update Schemas — Optional Is Not Clearable

**Any optional field a form can empty needs `.nullable()` on the update shape.** An update schema derived with `.partial()` inherits `.optional()`, which conflates two different intentions:

- **omitted** → Drizzle's update set drops `undefined` keys → value **preserved** ✅
- **`null`** → fails the parse, because optional ≠ nullable → **no payload can ever clear the field** ❌

So a user empties the field, saves, and the old value silently survives. Found three times now — question `description`/`videoId`/`scoreDimension`, flow `description`, step `templateId` — because `.partial()` is the obvious way to derive an update shape and the bug is invisible until someone tries to empty something.

**Widening the schema is only half of it. Validate the row the update will produce.** A field that is nullable in the shape can still be nulled into a state the system cannot serve — clearing a flow step's `templateId` while its type still needs one left members on a loading spinner that never resolved, silently, at every layer. The house answer is a merged-shape check in the service (`assertMergedShape`, `assertMergedTemplateLink`): load the stored row, apply the update, and judge the result rather than the payload.

```typescript
// WRONG — can be set, can never be unset
export const updateThingSchema = createThingSchema.partial();

// CORRECT — explicit null clears, omitted still preserves.
// Match the existing call sites: .partial() first, then .extend() the clearable
// fields as .nullable().optional(). Both orders work in Zod 4; this is the one
// `updateFlowStepSchema` and `updateAssessmentFlowSchema` already use.
export const updateThingSchema = thingWriteBaseSchema
  .partial()
  .extend({ description: z.string().nullable().optional() });
```

Two related traps in the same area:

- **`.partial()` does not strip a `.default()`.** A default on the base shape is reapplied when the field is omitted, so an update silently writes it — this is how a `PUT` omitting `isActive` reactivated soft-deleted rows. Put defaults on the **create** schema only.
- **`.partial()` does not reach inside a nested object.** A `.default()` on a sub-field of a jsonb object still fires whenever the parent is sent.

### Error Handling — Custom Classes, No Leaks

```typescript
// CORRECT
throw new NotFoundError('User not found');
throw new AuthorisationError('Insufficient permissions');

// WRONG — leaks internal data
throw new Error(`User ${userId} in organisation ${organisationId} not found`);
```

## Before Writing Code

1. **Check existing domain patterns** — `Glob` for `packages/core/{domain}/**/*.ts`
2. **Check existing handlers** — `Glob` for `packages/functions/{domain}/**/*.ts`
3. **Check Zod schemas** — `Grep` for related schemas in the domain
4. **Read architecture docs** — understand the expected flow for this feature

## Code Quality

- **British English** — all FFP names, comments, strings (optimise, colour, programme)
- **TypeScript strict** — explicit types on all function signatures, no `any`
- **2-space indentation**
- **Zod** as single source of truth for input/output types
- **Parameterised queries only** — never string concatenation for SQL
- **No emojis** — in code, comments, or error messages
