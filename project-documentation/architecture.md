# FFP - Architecture Documentation

## Overview

FFP uses a serverless-first AWS architecture optimised for multi-tenant SaaS. MVP prioritises simplicity and speed while establishing scalable patterns.

**Key Principles:**

- Multi-tenant isolation via PostgreSQL Row-Level Security (RLS)
- Type-safe database access with Drizzle ORM
- Domain-organised backend with clear layer separation
- Infrastructure-as-Code with SST v3 Ion (Pulumi-based)

---

## Infrastructure Stack

### Core Services

| Category       | Service           | Purpose                                      |
| -------------- | ----------------- | -------------------------------------------- |
| **Auth**       | Cognito User Pool | JWT auth, custom attributes (tenantId, role) |
| **API**        | API Gateway       | REST API, JWT authoriser, throttling         |
| **Compute**    | Lambda            | Node.js 18+ handlers, single responsibility  |
| **Database**   | RDS PostgreSQL    | Multi-tenant via RLS, Drizzle ORM            |
| **Storage**    | S3 + CloudFront   | Videos, assets, signed URLs                  |
| **Secrets**    | Secrets Manager   | DB credentials, API keys                     |
| **Monitoring** | CloudWatch        | Logs, metrics, alarms                        |
| **DNS**        | Route53           | Domain routing                               |

### MVP VPC Strategy

MVP uses AWS default VPC for cost optimisation (~£30/month NAT Gateway savings). Production will migrate to custom VPC with private subnets (FFP-101).

**See:** `deployment.md` for environment configuration, `security.md` for network security details.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            User/Browser                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│               S3 + CloudFront (Frontend + Video CDN)                    │
│            React SPA + Static Assets + Video Streaming                  │
└───────────────────┬─────────────────────────────────────────────────────┘
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ↓                            ↓
┌──────────────┐          ┌────────────────────┐
│  Cognito     │          │  API Gateway       │
│  User Pool   │          │  (JWT Authoriser)  │
└──────┬───────┘          └─────────┬──────────┘
       │ JWT Token                  │
       └────────────────┬───────────┘
                        │
                        ↓
              ┌────────────────────┐
              │   Lambda Functions │
              │   (Security Group) │
              └─────────┬──────────┘
                        │ Drizzle ORM
                        ↓
              ┌────────────────────┐
              │   RDS PostgreSQL   │
              │   • Multi-tenant   │
              │   • RLS enforced   │
              └────────────────────┘
```

**Traffic Flow:**

1. User → CloudFront (Frontend/Videos) → S3
2. User → Cognito (Auth) → JWT Token
3. User → API Gateway (with JWT) → Lambda → RDS

---

## Monorepo Package Dependencies

FFP uses Turborepo for efficient monorepo management with smart caching and parallel execution.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD ORDER (Dependency Flow)                │
│                                                                 │
│   @ffp/database  ←── builds FIRST (no @ffp/* dependencies)      │
│         │                                                       │
│         │ imports: constants, types, Drizzle schemas            │
│         ↓                                                       │
│   @ffp/core  ←────── builds SECOND                              │
│         │                                                       │
│         │ imports: services, Zod schemas, lib utilities         │
│         ↓                                                       │
│   @ffp/functions  ←─ builds LAST                                │
│   @ffp/web                                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Critical Rule:** `@ffp/database` MUST NOT import from `@ffp/core` (prevents circular dependencies).

**Shared Constants Pattern:** When both packages need the same values (e.g., enums), define in `@ffp/database` and import into `@ffp/core`.

**See:** `REFERENCE.md` for detailed project structure and Turborepo commands.

---

## Backend Architecture: Domain-Organised Layers

FFP uses clear layer separation with domain organisation. Each domain (assessments, admin, auth, users) contains service and/or repository files as needed. Schemas are centralised in `src/schemas/` for shared access across domains.

### Layer Flow

```
Handler → Service → Entity (optional) → Repository → Drizzle Schema → PostgreSQL
```

### Layer Decision Tree

```
┌─────────────────────────────────────────┐
│ Do you need business logic?             │
└────────────┬─────────────┬──────────────┘
             │             │
          ┌──▼──┐       ┌──▼──┐
          │ YES │       │ NO  │
          └──┬──┘       └──┬──┘
             │             │
    ┌────────▼─────────┐   │
    │ Complex logic?   │   │
    │ (calculations,   │   │
    │  state mgmt)     │   │
    └──┬───────┬───────┘   │
       │       │           │
    ┌──▼──┐ ┌──▼──┐        │
    │ YES │ │ NO  │        │
    └──┬──┘ └──┬──┘        │
       │       │           │
       │       └───────────┼─────────┐
       │                   │         │
┌──────▼───────┐  ┌────────▼──────┐  │
│ Use Entity   │  │ Skip Entity   │  │
│ Handler →    │  │ Handler →     │  │
│ Service →    │  │ Service →     │  │
│ Entity →     │  │ Repository    │  │
│ Repository   │  │               │  │
└──────────────┘  └───────────────┘  │
                                     │
                           ┌─────────▼──────┐
                           │ Skip Service   │
                           │ Handler →      │
                           │ Repository     │
                           └────────────────┘
```

### Layer Responsibilities

| Layer          | Location                                        | Responsibility                                                               |
| -------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| **Handler**    | `packages/functions/{domain}/`                  | HTTP interface only - extract JWT context, call service, format response     |
| **Service**    | `packages/core/{domain}/{domain}.service.ts`    | Business orchestration - validate input, coordinate repos, enforce rules     |
| **Entity**     | `packages/core/{domain}/{domain}.entity.ts`     | Complex behaviour (optional) - calculations, state transitions, derived data |
| **Repository** | `packages/core/{domain}/{domain}.repository.ts` | Data access with RLS - CRUD operations, no business logic                    |
| **Schema**     | `packages/core/src/schemas/{entity}.schema.ts`  | Zod validation - single source of truth for types (centralised)              |
| **Drizzle**    | `packages/database/src/schema/`                 | Database table definitions                                                   |

**See:** `coding-standards.md` for detailed code examples of each layer.

---

## Actor-Based Context (Multi-Tenant)

FFP supports both user-triggered requests (API Gateway with JWT) and system-triggered requests (job queues, scheduled tasks).

### Context Types

| Actor Type | Source                                 | Use Case                              |
| ---------- | -------------------------------------- | ------------------------------------- |
| **User**   | JWT claims from API Gateway            | API requests from authenticated users |
| **System** | Job queue message or explicit creation | Background jobs, scheduled tasks      |

### Key Pattern

All contexts flow through layers and enforce RLS via the `withRLS()` wrapper:

```typescript
// CORRECT: Use withRLS wrapper (sets RLS context automatically)
const users = await withRLS(tenantId, userId, async (tx) => {
  return await tx.query.users.findMany();
});

// WRONG: Direct query without RLS context
await db.query.users.findMany(); // Leaks all tenants!
```

**See:** `authentication.md` for context extraction patterns and detailed examples.

---

## Environment Strategy

| Environment | Purpose                        | Database Changes                       |
| ----------- | ------------------------------ | -------------------------------------- |
| **dev**     | Personal developer environment | `drizzle-kit push` for rapid iteration |
| **staging** | Shared QA/demo environment     | `db:generate` + `db:migrate`           |
| **prod**    | Customer-facing                | Strict migration review process        |

**See:** `deployment.md` for SST configuration and CI/CD details.

---

## Related Documentation

| Topic                             | Document                   |
| --------------------------------- | -------------------------- |
| Layer code examples               | `coding-standards.md`      |
| Cost estimates                    | `REFERENCE.md`             |
| Scalability & future architecture | `future-considerations.md` |
| Security patterns                 | `security.md`              |
| Authentication details            | `authentication.md`        |
| Database schema                   | `database-schema.md`       |
| Deployment & environments         | `deployment.md`            |
