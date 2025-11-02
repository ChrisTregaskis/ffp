# FFP-9 Implementation Guide

## Architecture Layer Requirements

This document analyses each FFP-9 subtask to determine which architectural layers are needed based on the domain-organised architecture decision tree.

---

## Phase 1: Prerequisites (9.5h)

### FFP-43: Error Handling Classes (3h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? No
- ✅ Is this shared infrastructure/utilities? Yes

**Required Layers:**

- **Core utilities only** (`packages/core/lib/errors.ts`)

**Components:**

```
packages/core/lib/
└── errors.ts
    ├── BaseError
    ├── NotFoundError
    ├── ValidationError
    ├── UnauthorisedError
    ├── ForbiddenError
    ├── ConflictError
    └── withErrorHandling()
```

**Key Patterns:**

- Base error class with HTTP status codes
- Typed error hierarchy
- Error handler middleware for Lambda

---

### FFP-44: Structured Logging (2h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? No
- ✅ Is this shared infrastructure/utilities? Yes

**Required Layers:**

- **Core utilities only** (`packages/core/lib/logger.ts`)

**Components:**

```
packages/core/lib/
└── logger.ts
    ├── Logger class
    ├── log(level, message, context)
    ├── info(), warn(), error(), debug()
    └── withRequestLogging()
```

**Key Patterns:**

- Actor-aware logging (uses `getActorDisplayName()`)
- Structured JSON output for CloudWatch
- Request ID tracking
- Tenant ID context
- Performance timing

**Enhanced Requirements:**

- Must include actor information (user vs system)
- Must log `triggeredBy` for system jobs
- Must use `context.actor` field

---

### FFP-36: Tenant Context Extraction (2h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? No
- ✅ Is this shared infrastructure/utilities? Yes

**Required Layers:**

- **Core utilities only** (`packages/core/lib/context.ts`)

**Components:**

```
packages/core/lib/
└── context.ts
    ├── UserActor interface
    ├── SystemActor interface
    ├── Actor type
    ├── TenantContext interface
    ├── extractUserContext()
    ├── createSystemContext()
    ├── extractJobContext()
    ├── isUserActor()
    ├── isSystemActor()
    ├── getActorDisplayName()
    └── hasPermission() (future)
```

**Key Patterns:**

- Actor-based context (User vs System)
- JWT claim extraction for user requests
- System context creation for jobs/scheduled tasks
- Helper functions for type guards
- Enhanced TenantContext with actor, settings, enabledModules

**Enhanced Requirements:**

- Support both user and system actors
- Include requestId and timestamp
- Provide factory functions for different context types

---

### FFP-32: Secrets Manager - JWT Only (2.5h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? No
- ✅ Is this shared infrastructure/utilities? Yes

**Required Layers:**

- **Core utilities only** (`packages/core/lib/secrets.ts`)
- **Infrastructure** (SST SecretStack if needed)

**Components:**

```
packages/core/lib/
└── secrets.ts
    ├── getSecret(secretName)
    ├── getCognitoClientSecret() (future)
    └── getJwtSecret()

stacks/ (if needed)
└── SecretStack.ts
```

**Key Patterns:**

- AWS Secrets Manager integration
- Caching for performance
- Type-safe secret accessors

---

## Phase 2: Bootstrap + Core Auth (8.5h)

### Manual: Super User Setup - Bootstrap Super Admin (0.5h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? Minimal
- ✅ Is this a one-time script? Yes

**Required Layers:**

- **Script only** (`scripts/bootstrap-super-admin.ts`)
- **Direct Cognito + DB access** (no layered architecture needed)

**Components:**

```
scripts/
└── bootstrap-super-admin.ts
    ├── Create super_admin Cognito user
    ├── Create tenant with type='platform'
    └── Create user record with role='super_admin'
```

**Key Patterns:**

- One-time manual execution
- Direct AWS SDK usage
- Hardcoded super admin email
- No Lambda handler needed

---

### FFP-112: Admin CLI Script (1h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? Yes (authenticated API call)
- ✅ Does this involve business logic? Yes (tenant/customer creation)
- ✅ Does it need entities? No (simple CRUD)

**Required Layers:**

- **Handler** (`packages/functions/admin/create-business.ts`)
- **Service** (`packages/core/admin/business.service.ts`)
- **Repository** (`packages/core/admin/business.repository.ts`)
- **Cognito Service** (`packages/core/lib/cognito.ts` - NEW)
- **Schemas** (`packages/core/admin/business.schema.ts`)

**Components:**

```
packages/functions/admin/
└── create-business.ts (Handler)

packages/core/admin/
├── business.service.ts (Service)
├── business.repository.ts (Repository)
└── business.schema.ts (Zod)

packages/core/lib/
└── cognito.ts (NEW - Service wrapper)
    ├── CognitoService.inviteUser()
    └── CognitoService.createUser()
```

**Key Patterns:**

- Authenticated endpoint (super admin only)
- Transaction: Tenant → Customer → User → Cognito
- Service coordinates Cognito + database
- Repository handles multi-table inserts

**Enhanced Requirements:**

- FFP-43 must include Cognito service wrapper (+0.5h)
- Service should use `CognitoService.createUser()` instead of direct SDK

---

### FFP-35: Zod Schemas (3h)

**Decision Tree Analysis:**

- ❌ Does this involve HTTP requests? No
- ❌ Does this involve business logic? No
- ✅ Is this shared data validation? Yes

**Required Layers:**

- **Core schemas only** (domain-organised)

**Components:**

```
packages/core/users/
└── user.schema.ts
    ├── inviteUserSchema
    └── InviteUserInput type

packages/core/admin/
└── business.schema.ts
    ├── createBusinessSchema
    └── CreateBusinessInput type

packages/core/auth/
└── auth.schema.ts
    ├── loginSchema
    ├── refreshTokenSchema
    └── LoginInput, RefreshTokenInput types
```

**Key Patterns:**

- Domain-organised (users/, admin/, auth/)
- Co-located with domain logic
- Export both schema and inferred types

**Enhanced Requirements:**

- `inviteUserSchema` must support `super_admin` role
- All schemas use British English in error messages

---

### FFP-37: Invite User Lambda (4h)

**Decision Tree Analysis:**

- ✅ Does this involve HTTP requests? Yes
- ✅ Does this involve business logic? Yes (role validation, email uniqueness)
- ✅ Does it need entities? No (simple user creation)

**Required Layers:**

- **Handler** (`packages/functions/users/invite-user.ts`)
- **Service** (`packages/core/users/user.service.ts`)
- **Repository** (`packages/core/users/user.repository.ts`)
- **Cognito Service** (`packages/core/lib/cognito.ts`)
- **Schemas** (`packages/core/users/user.schema.ts`)

**Components:**

```
packages/functions/users/
└── invite-user.ts (Handler)
    ├── Extract user context
    ├── Check role (customer_owner or super_admin)
    └── Call service

packages/core/users/
├── user.service.ts (Service)
│   ├── inviteUserService()
│   ├── Validate input
│   ├── Check email uniqueness
│   ├── Create Cognito user
│   └── Persist to database
├── user.repository.ts (Repository)
│   ├── create()
│   └── findByEmail()
└── user.schema.ts (Zod)
    └── inviteUserSchema
```

**Key Patterns:**

- Full layered architecture (H → S → R)
- Service coordinates Cognito + database
- Repository enforces RLS
- Permission check in handler (customer_owner or super_admin)

**Enhanced Requirements:**

- Must use `extractUserContext()` with actor support
- Must check `isUserActor()` and validate role
- Super admin can invite to ANY tenant/customer
- Customer owner can only invite to THEIR tenant/customer

---

## Phase 3: Authentication Endpoints (7h)

### FFP-38: Login Lambda (3h)

**Decision Tree Analysis:**

- ✅ Does this involve HTTP requests? Yes
- ❌ Does this involve business logic? Minimal (credential validation delegated to Cognito)
- ✅ Is this mostly external service interaction? Yes

**Required Layers:**

- **Handler** (`packages/functions/auth/login.ts`)
- **Cognito Service** (`packages/core/lib/cognito.ts`)
- **Schemas** (`packages/core/auth/auth.schema.ts`)
- **No Service/Repository needed** (thin handler pattern)

**Components:**

```
packages/functions/auth/
└── login.ts (Handler)
    ├── Validate input (Zod)
    ├── Call Cognito (InitiateAuthCommand)
    └── Return tokens

packages/core/lib/
└── cognito.ts
    └── CognitoService.login()

packages/core/auth/
└── auth.schema.ts
    └── loginSchema
```

**Key Patterns:**

- Thin handler (no service layer needed)
- Direct Cognito interaction via service wrapper
- Public endpoint (no JWT required)

---

### FFP-39: Refresh Token Lambda (2h)

**Decision Tree Analysis:**

- ✅ Does this involve HTTP requests? Yes
- ❌ Does this involve business logic? Minimal (token refresh delegated to Cognito)
- ✅ Is this mostly external service interaction? Yes

**Required Layers:**

- **Handler** (`packages/functions/auth/refresh-token.ts`)
- **Cognito Service** (`packages/core/lib/cognito.ts`)
- **Schemas** (`packages/core/auth/auth.schema.ts`)
- **No Service/Repository needed** (thin handler pattern)

**Components:**

```
packages/functions/auth/
└── refresh-token.ts (Handler)
    ├── Validate refresh token
    ├── Call Cognito (InitiateAuthCommand with REFRESH_TOKEN_AUTH)
    └── Return new tokens

packages/core/lib/
└── cognito.ts
    └── CognitoService.refreshToken()

packages/core/auth/
└── auth.schema.ts
    └── refreshTokenSchema
```

**Key Patterns:**

- Thin handler (no service layer needed)
- Direct Cognito interaction via service wrapper
- Public endpoint (no JWT required)

---

### FFP-40: API Gateway Routes (2h)

**Decision Tree Analysis:**

- ❌ Does this involve application code? No
- ✅ Is this infrastructure configuration? Yes

**Required Layers:**

- **Infrastructure only** (SST ApiStack)

**Components:**

```
stacks/
└── ApiStack.ts
    ├── JWT authorizer (Cognito)
    ├── POST /auth/login (public)
    ├── POST /auth/refresh-token (public)
    ├── POST /auth/invite-user (authenticated)
    └── POST /admin/create-business (authenticated, super_admin only)
```

**Key Patterns:**

- SST Api construct
- JWT authorizer configuration
- Public vs authenticated routes
- CORS configuration

---

## Phase 4: Testing (12h)

### FFP-41: Unit Tests (4h)

**Decision Tree Analysis:**

- ✅ Testing all layers independently

**Test Files:**

```
packages/core/lib/
├── errors.test.ts
├── logger.test.ts
├── context.test.ts
└── cognito.test.ts

packages/core/users/
├── user.service.test.ts
└── user.repository.test.ts

packages/core/admin/
├── business.service.test.ts
└── business.repository.test.ts
```

**Key Patterns:**

- Mock external services (Cognito)
- Mock database layer
- Test actor-aware context extraction
- Test permission checking

---

### FFP-42: Integration Tests (5h)

**Decision Tree Analysis:**

- ✅ Testing full request flow (Handler → Service → Repository → DB)

**Test Files:**

```
packages/functions/
├── auth/login.integration.test.ts
├── auth/refresh-token.integration.test.ts
├── users/invite-user.integration.test.ts
└── admin/create-business.integration.test.ts
```

**Key Patterns:**

- Test database with real transactions
- Mock Cognito (MSW or similar)
- Test RLS enforcement
- Test cross-tenant isolation

---

### FFP-45: Deployed Environment Tests (3h)

**Decision Tree Analysis:**

- ✅ Testing deployed infrastructure

**Test Files:**

```
tests/e2e/
├── auth-flow.test.ts
├── invite-user.test.ts
└── admin-create-business.test.ts
```

**Key Patterns:**

- Real API Gateway endpoints
- Real Cognito user pool
- Real RDS database
- Cleanup after tests

---

## Phase 5: Documentation (2h)

### FFP-46: API Documentation (2h)

**Required Deliverables:**

- API endpoint documentation
- Authentication flow diagrams
- Error code reference
- Example requests/responses

---

## Summary: Layer Usage by Task

| Task    | Handler | Service | Repository | Entity | Schema | Cognito Service | Infra | Utils | Script |
| ------- | ------- | ------- | ---------- | ------ | ------ | --------------- | ----- | ----- | ------ |
| FFP-43  | -       | -       | -          | -      | -      | -               | -     | ✅    | -      |
| FFP-44  | -       | -       | -          | -      | -      | -               | -     | ✅    | -      |
| FFP-36  | -       | -       | -          | -      | -      | -               | -     | ✅    | -      |
| FFP-32  | -       | -       | -          | -      | -      | -               | (✅)  | ✅    | -      |
| Manual  | -       | -       | -          | -      | -      | -               | -     | -     | ✅     |
| FFP-112 | ✅      | ✅      | ✅         | -      | ✅     | ✅              | -     | -     | -      |
| FFP-35  | -       | -       | -          | -      | ✅     | -               | -     | -     | -      |
| FFP-37  | ✅      | ✅      | ✅         | -      | ✅     | ✅              | -     | -     | -      |
| FFP-38  | ✅      | -       | -          | -      | ✅     | ✅              | -     | -     | -      |
| FFP-39  | ✅      | -       | -          | -      | ✅     | ✅              | -     | -     | -      |
| FFP-40  | -       | -       | -          | -      | -      | -               | ✅    | -     | -      |
| FFP-41  | Tests   | Tests   | Tests      | -      | -      | Tests           | -     | Tests | -      |
| FFP-42  | Tests   | Tests   | Tests      | -      | -      | -               | -     | -     | -      |
| FFP-45  | Tests   | -       | -          | -      | -      | -               | Tests | -     | -      |
| FFP-46  | Docs    | Docs    | Docs       | -      | -      | -               | -     | -     | -      |

**Key Observations:**

1. **No entity layer needed** - All tasks involve simple CRUD operations
2. **Cognito service wrapper required** - FFP-43 needs extension (+0.5h)
3. **Actor-aware patterns** - FFP-36 (context), FFP-44 (logging), FFP-37 (permissions)
4. **Thin handlers for auth endpoints** - FFP-38, FFP-39 (no service/repository)
5. **Full stack for business logic** - FFP-112, FFP-37 (H → S → R pattern)

---

## Updated Jira Requirements

### FFP-43: Error Handling Classes

**Time Update:** 3h → **3.5h** (+0.5h for Cognito service wrapper)

**Additional Scope:**

- Create `packages/core/lib/cognito.ts`
- Implement `CognitoService` class with:
  - `inviteUser()`
  - `createUser()`
  - `login()`
  - `refreshToken()`

### FFP-44: Structured Logging

**Additional Requirements:**

- Log actor information using `getActorDisplayName()`
- Include `triggeredBy` field for system jobs
- Support both UserActor and SystemActor

### FFP-36: Tenant Context Extraction

**Additional Requirements:**

- Implement UserActor and SystemActor interfaces
- Create `extractUserContext()`, `createSystemContext()`, `extractJobContext()`
- Add helper functions: `isUserActor()`, `isSystemActor()`, `getActorDisplayName()`
- Enhance TenantContext with actor, requestId, timestamp

### FFP-37: Invite User Lambda

**Additional Requirements:**

- Use `extractUserContext()` with actor support
- Check `isUserActor()` and validate role
- Support super_admin role (can invite to ANY tenant/customer)
- Customer owners can only invite to THEIR tenant/customer

---

## Implementation Order Recommendation

Follow the 5 phases as defined, with these key dependencies:

**Phase 1 (Prerequisites):**

1. FFP-43 (with Cognito service - 3.5h)
2. FFP-44 (actor-aware logging - 2h)
3. FFP-36 (enhanced context - 2h)
4. FFP-32 (secrets - 2.5h)

**Phase 2 (Bootstrap + Core):** 5. Manual bootstrap (0.5h) 6. FFP-35 (schemas with super_admin - 3h) 7. FFP-112 (admin CLI - 1h) - Uses Cognito service 8. FFP-37 (invite user - 4h) - Uses actor context

**Phase 3 (Auth Endpoints):** 9. FFP-38 (login - 3h) 10. FFP-39 (refresh token - 2h) 11. FFP-40 (API routes - 2h)

**Phase 4 (Testing):** 12. FFP-41 (unit tests - 4h) 13. FFP-42 (integration tests - 5h) - Can defer 14. FFP-45 (deployed tests - 3h) - Can defer

**Phase 5 (Documentation):** 15. FFP-46 (API docs - 2h)

**Total Time:** 30h (revised from 29-30h due to Cognito service addition)
