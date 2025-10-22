# @ffp/functions

Lambda function handlers for FFP API endpoints.

---

## 📋 Contents

- [Overview](#overview)
- [Structure](#structure)
- [Development](#development)
- [Path Aliases](#path-aliases)
- [Handler Pattern](#handler-pattern)
- [Building](#building)
- [Testing](#testing)
- [Current Status](#current-status)

---

## 🎯 Overview

This package contains AWS Lambda function handlers for the FFP API. Each handler:

- Processes HTTP requests from API Gateway
- Validates input using Zod schemas
- Uses business logic from `@ffp/core`
- Enforces multi-tenant security
- Returns JSON responses

**Tech Stack:**

- TypeScript (strict mode)
- AWS Lambda runtime
- AWS SDK v3 (Cognito, S3)
- `@ffp/core` for shared business logic

---

## 📁 Structure

```
packages/functions/
├── src/
│   ├── auth/                      # Authentication endpoints (FFP-9)
│   │   ├── register.ts           # POST /auth/register
│   │   ├── login.ts              # POST /auth/login
│   │   ├── refresh.ts            # POST /auth/refresh
│   │   ├── logout.ts             # POST /auth/logout
│   │   └── README.md
│   │
│   ├── assessments/              # Assessment CRUD (Future)
│   │   ├── create.ts
│   │   ├── list.ts
│   │   ├── get.ts
│   │   ├── update.ts
│   │   └── README.md
│   │
│   ├── programs/                 # Program generation (Future)
│   │   ├── generate.ts
│   │   ├── list.ts
│   │   └── README.md
│   │
│   ├── videos/                   # Video metadata (Future)
│   │   ├── upload.ts
│   │   ├── list.ts
│   │   └── README.md
│   │
│   ├── business/                 # Business portal logic (Future)
│   │   ├── users/
│   │   ├── assessments/
│   │   └── README.md
│   │
│   ├── middleware/               # Lambda middleware
│   │   ├── auth.ts              # JWT verification
│   │   ├── tenantContext.ts     # RLS setup
│   │   ├── errorHandler.ts
│   │   └── index.ts
│   │
│   └── utils/                    # Lambda utilities
│       ├── response.ts          # API response helpers
│       ├── validation.ts
│       └── index.ts
│
├── dist/                         # Compiled output (gitignored)
├── package.json
├── tsconfig.json                 # TypeScript config
└── README.md
```

---

## 💻 Development

### Watch Mode

```bash
# From root (recommended)
pnpm dev

# Or run functions package only
pnpm dev:functions

# Or from this package
cd packages/functions
pnpm dev
```

This watches for changes and rebuilds automatically.

**Note**: Lambda functions need SST infrastructure to run locally. Development workflow will be:

1. Watch mode compiles TypeScript
2. SST deploys to AWS dev environment
3. Test via API Gateway endpoints

---

## 🔗 Path Aliases

### Cross-Package Imports (from @ffp/core)

Use workspace dependencies for shared business logic:

```typescript
// ✅ Import types from @ffp/core
import type { User, Assessment } from '@ffp/core';

// ✅ Import schemas for validation
import { UserSchema, AssessmentSchema } from '@ffp/core';

// ✅ Import services for business logic
import { UserService, AssessmentService } from '@ffp/core';

// ✅ Import repositories for data access
import { UserRepository } from '@ffp/core/repositories';

// ✅ Import utilities
import { validateEmail } from '@ffp/core/utils';
```

### Intra-Package Imports (within @ffp/functions)

Use `@functions/*` aliases for imports within the functions package:

```typescript
// ✅ Import middleware
import { authenticateJWT } from '@functions/middleware/auth';
import { setTenantContext } from '@functions/middleware/tenantContext';

// ✅ Import utilities
import { successResponse, errorResponse } from '@functions/utils/response';
import { validateInput } from '@functions/utils/validation';

// ✅ Import other handlers (if needed)
import { registerHandler } from '@functions/auth/register';
```

**Configuration in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@functions/*": ["./src/*"]
    }
  }
}
```

### Path Alias Rules

1. **Cross-package**: Use `@ffp/core` for shared business logic
2. **Intra-package**: Use `@functions/*` for local utilities/middleware
3. **Never**: Don't use `@ffp/functions` within the functions package

---

## 🏗 Handler Pattern

All Lambda handlers follow this pattern:

```typescript
// src/auth/register.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserSchema } from '@ffp/core';
import { UserService } from '@ffp/core';
import { successResponse, errorResponse } from '@functions/utils/response';
import { validateInput } from '@functions/utils/validation';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Parse and validate input
    const body = JSON.parse(event.body || '{}');
    const input = validateInput(UserSchema, body);

    // 2. Extract tenant context from JWT (if authenticated)
    const tenantId = event.requestContext.authorizer?.claims['custom:tenantId'];

    // 3. Execute business logic via service
    const userService = new UserService(userRepository);
    const user = await userService.createUser({
      ...input,
      tenantId,
    });

    // 4. Return success response
    return successResponse(user, 201);
  } catch (error) {
    // 5. Handle errors
    return errorResponse(error);
  }
}
```

### Response Utilities

```typescript
// utils/response.ts
export function successResponse(data: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

export function errorResponse(error: unknown, statusCode = 500) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }),
  };
}
```

---

## 🏗 Building

### Compile TypeScript

```bash
# From root (recommended)
pnpm build

# Or build functions package only
pnpm turbo build --filter=@ffp/functions

# Or from this package
cd packages/functions
pnpm build
```

**Output**: `dist/` directory with compiled JavaScript

---

## 🧪 Testing

### Run Tests

```bash
# From root
pnpm turbo test --filter=@ffp/functions

# Or from this package
cd packages/functions
pnpm test           # Run once
pnpm test:watch     # Watch mode
pnpm test:ui        # Vitest UI
```

### Writing Handler Tests

```typescript
// __tests__/auth/register.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handler } from '@functions/auth/register';
import type { APIGatewayProxyEvent } from 'aws-lambda';

describe('Register Handler', () => {
  it('creates new user', async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
      // ... other required event properties
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toHaveProperty('id');
  });

  it('validates required fields', async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        email: 'invalid-email',
      }),
      // ... other required event properties
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });
});
```

---

## 🎯 Current Status

### ✅ Complete

- Package structure created
- TypeScript configuration with strict mode
- Workspace dependency on `@ffp/core`
- Intra-package path aliases (`@functions/*`)
- Testing framework configured

### ⏸️ Awaiting Future Sprints

- **FFP-8**: SST Infrastructure setup
- **FFP-9**: Cognito authentication handlers
- **Future**: Assessment CRUD endpoints
- **Future**: Program generation endpoints
- **Future**: Video management endpoints
- **Future**: Business portal endpoints

---

## 📚 Further Reading

- **Root README**: `../../README.md` - Monorepo commands and structure
- **Core Package**: `../core/README.md` - Shared business logic
- **Architecture**: `../../project-documentation/architecture.md`
- **Authentication**: `../../project-documentation/authentication.md`
- **Database Schema**: `../../project-documentation/database-schema.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`

---

## 🔄 Common Workflows

### Adding a New Endpoint

```bash
# 1. Create handler file
touch src/assessments/create.ts

# 2. Implement handler following the pattern
# - Import types from @ffp/core
# - Validate input with Zod
# - Use services from @ffp/core
# - Return proper responses

# 3. Write tests
touch src/__tests__/assessments/create.test.ts

# 4. Test and build
pnpm test
pnpm build

# 5. Add to SST stack configuration
# (in stacks/ directory)
```

### Using Shared Business Logic

```typescript
// In src/assessments/create.ts
import type { Assessment } from '@ffp/core';
import { AssessmentSchema, AssessmentService } from '@ffp/core';
import { successResponse, errorResponse } from '@functions/utils/response';
import { validateInput } from '@functions/utils/validation';

export async function handler(event: APIGatewayProxyEvent) {
  try {
    // Validate input using shared schema
    const input = validateInput(AssessmentSchema, JSON.parse(event.body || '{}'));

    // Use shared service for business logic
    const assessmentService = new AssessmentService(assessmentRepository);
    const assessment = await assessmentService.create(input);

    return successResponse(assessment, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Adding Middleware

```typescript
// src/middleware/logging.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export function withLogging(
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Request:', {
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
    });

    const result = await handler(event);

    console.log('Response:', {
      statusCode: result.statusCode,
      timestamp: new Date().toISOString(),
    });

    return result;
  };
}
```

---

## 🔒 Security Checklist

Every handler must:

- [ ] Validate all input with Zod schemas
- [ ] Extract and validate `tenantId` from JWT
- [ ] Set database RLS context before queries
- [ ] Never expose internal error details in production
- [ ] Log security events (failed auth, invalid tokens)
- [ ] Use prepared statements (via Drizzle ORM)
- [ ] Rate limit public endpoints
- [ ] Sanitise user input
- [ ] Return appropriate HTTP status codes
- [ ] Include CORS headers

---

**Current Sprint**: Sprint 1 - Foundation Setup  
**Last Updated**: October 22, 2025  
**Status**: ✅ Package setup complete, awaiting SST infrastructure (FFP-8)
