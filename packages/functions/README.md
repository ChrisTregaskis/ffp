# @ffp/functions

Lambda function handlers for FFP API endpoints.

---

## Overview

This package contains AWS Lambda function handlers for the FFP API. Each handler:

- Processes HTTP requests from API Gateway
- Validates input using Zod schemas from `@ffp/core`
- Uses business logic from `@ffp/core`
- Enforces multi-tenant security
- Returns JSON responses

---

## Usage

### Importing from @ffp/core

Use workspace dependencies for shared business logic:

```typescript
// Import types
import type { User, Assessment } from '@ffp/core';

// Import schemas for validation
import { UserSchema, AssessmentSchema } from '@ffp/core';

// Import services for business logic
import { UserService, AssessmentService } from '@ffp/core';
```

### Within This Package

Use `@functions/*` aliases for imports within this package:

```typescript
// Import middleware
import { authenticateJWT } from '@functions/middleware/auth';

// Import utilities
import { successResponse, errorResponse } from '@functions/utils/response';
```

---

## Handler Pattern

All Lambda handlers follow this pattern:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserSchema } from '@ffp/core';
import { UserService } from '@ffp/core';
import { successResponse, errorResponse } from '@functions/utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // 1. Parse and validate input
    const body = JSON.parse(event.body || '{}');
    const input = UserSchema.parse(body);

    // 2. Extract tenant context from JWT
    const organisationId = event.requestContext.authorizer?.claims['custom:tenantId'];

    // 3. Execute business logic via service
    const userService = new UserService(userRepository);
    const user = await userService.createUser({ ...input, organisationId });

    // 4. Return success response
    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
};
```

### Response Utilities

```typescript
// utils/response.ts
export const successResponse = (data: unknown, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
};

export const errorResponse = (error: unknown, statusCode = 500) => {
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
};
```

---

## Dependencies

### Production Dependencies

- **@ffp/core** (workspace:\*) - Shared business logic, types, and schemas
- **AWS SDK v3** - For AWS service integrations (Cognito, S3, etc.)

### Dev Dependencies

- **@types/aws-lambda** - TypeScript types for Lambda
- **typescript** (^5.6.3) - TypeScript compiler
- **vitest** (^2.1.4) - Unit testing framework
- **@ffp/eslint-config** - Shared ESLint configuration

---

## Security Checklist

Every handler must:

- [ ] Validate all input with Zod schemas
- [ ] Extract and validate `organisationId` from JWT (via `custom:tenantId`)
- [ ] Set database RLS context before queries
- [ ] Never expose internal error details in production
- [ ] Log security events (failed auth, invalid tokens)
- [ ] Use prepared statements (via Drizzle ORM)
- [ ] Rate limit public endpoints
- [ ] Sanitise user input
- [ ] Return appropriate HTTP status codes
- [ ] Include CORS headers

---

## Current Status

Core handlers implemented across auth, assessments, programmes, videos, admin, and business domains. See `src/` for the full handler inventory.

---

## Further Reading

For detailed commands, project structure, and workflows, see:

- **Root README**: `../../README.md` - Development commands and monorepo structure
- **Core Package**: `../core/README.md` - Shared business logic
- **Architecture**: `../../project-documentation/architecture.md`
- **Authentication**: `../../project-documentation/authentication.md`
- **Database Schema**: `../../project-documentation/database-schema.md`
