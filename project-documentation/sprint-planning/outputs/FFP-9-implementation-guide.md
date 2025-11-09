# FFP-9 Implementation Guide

## Architecture Layer Requirements

This document analyses each FFP-9 subtask to determine which architectural layers are needed based on the domain-organised architecture decision tree.

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
    └── POST /admin/create-customer (authenticated, super_admin only)
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
└── admin/create-customer.integration.test.ts
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
└── admin-create-customer.test.ts
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
