# Subtask Standards

## Purpose

Subtasks break down User Stories or Tasks into smaller chunks (<4 hours). Not estimated (parent is estimated).

**When to use:**

- Breaking down complex stories
- Tracking incremental progress
- Clarifying implementation steps

---

## Required Fields

| Field            | Value                             |
| ---------------- | --------------------------------- |
| **Issue Type**   | Subtask (10012)                   |
| **Summary**      | [Action verb]: [Specific outcome] |
| **Parent Issue** | Link to parent Story/Task         |
| **Story Points** | Not estimated                     |

---

## Template

```markdown
## Objective

[What specific piece of work?]

## Technical Details

[Implementation notes, code snippets, file paths]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

[Quick test to verify]
```

---

## Examples

### Example 1: Zod Schema

````markdown
**Summary**: Create Zod schema for registration validation
**Parent**: FFP-5 (User Registration Story)

## Objective

Define Zod schema to validate registration payloads (email, password, names).

## Technical Details

File: `packages/core/src/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[a-z]/, 'Need lowercase')
    .regex(/[0-9]/, 'Need digit')
    .regex(/[^A-Za-z0-9]/, 'Need special char'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  accountType: z.enum(['individual', 'business']),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
```
````

## Acceptance Criteria

- [ ] Schema validates correct payload
- [ ] Schema rejects invalid email
- [ ] Schema rejects weak password
- [ ] Type exported for Lambda handler

## Verification

```bash
npm run test packages/core/src/schemas/__tests__/auth.schema.test.ts
```

````

### Example 2: Lambda Function

```markdown
**Summary**: Create Lambda function for user registration
**Parent**: FFP-3 (SST Infrastructure Task)

## Objective

Create Lambda handler that calls Cognito SignUpCommand and inserts user in PostgreSQL.

## Technical Details

File: `packages/functions/auth/register.ts`

```typescript
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { RegisterRequestSchema } from '@ffp/core/schemas/auth.schema';
import { randomUUID } from 'crypto';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = RegisterRequestSchema.parse(JSON.parse(event.body || '{}'));
  const tenantId = randomUUID();

  // Cognito signup + DB insert
  // ...
};
````

## Acceptance Criteria

- [ ] Validates request with Zod
- [ ] Generates unique tenantId
- [ ] Calls Cognito SignUpCommand
- [ ] Inserts user in PostgreSQL
- [ ] Handles errors gracefully

## Verification

```bash
npm run sst dev
curl -X POST http://localhost:3000/auth/register -d '{"email":"test@example.com",...}'
```

```

---

## See Also

- **story-standards.md** - Parent story guidelines
- **task-standards.md** - Parent task guidelines
```
