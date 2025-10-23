# FFP - Coding Standards Documentation

## Overview

Consistent coding standards ensure maintainability, readability, and collaboration across the FFP codebase. These standards apply to all TypeScript/JavaScript code in both frontend and backend, with specific patterns for Drizzle ORM usage.

## General Principles

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Line length**: Maximum 100 characters
- **Quotes**: Single quotes for strings, double quotes in JSX
- **Semicolons**: Always use semicolons
- **Trailing commas**: Use in multi-line structures

### File Organization

- **File naming**: `kebab-case.ts` for files, `PascalCase.tsx` for React components
- **One export per file**: Except for utility/helper modules
- **Import order**: External → Internal → Types → Styles
- **File structure**: Imports → Types → Constants → Main code → Exports

## TypeScript Standards

### Strict Mode Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Definitions

```typescript
// ✅ Good: Explicit interface definitions
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ✅ Good: Use enums for fixed sets
enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  BUSINESS_OWNER = 'business_owner',
  INDIVIDUAL_USER = 'individual_user',
}

// ✅ Good: Use union types for simple sets
type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

// ❌ Bad: Using any type
function processData(data: any) {
  /* ... */
}

// ✅ Good: Use unknown with type guards
function processData(data: unknown) {
  if (isValidData(data)) {
    // TypeScript knows data is ValidData here
  }
}
```

### Type Guards

```typescript
// Type guard functions
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

// Usage
function processInput(input: unknown) {
  if (isString(input)) {
    console.log(input.toUpperCase()); // TypeScript knows input is string
  }
}
```

### Null Safety

```typescript
// ✅ Good: Explicit null checks
function getUserName(user: User | null): string {
  if (!user) {
    return 'Guest';
  }
  return `${user.firstName} ${user.lastName}`;
}

// ✅ Good: Optional chaining
const userName = user?.profile?.displayName ?? 'Guest';

// ✅ Good: Nullish coalescing
const pageSize = config.pageSize ?? 10;

// ❌ Bad: Non-null assertion (avoid unless absolutely necessary)
const name = user!.firstName;
```

## Drizzle ORM Standards

### Schema Definition Standards

```typescript
// ✅ Good: Use Drizzle's pgEnum for enums
export const userRoleEnum = pgEnum('user_role', [
  'system_admin',
  'business_owner',
  'individual_user',
]);

// ✅ Good: Define relations for type-safe joins
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  assessments: many(userAssessments),
}));

// ✅ Good: Auto-generate Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// ✅ Good: Export TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ✅ Good: Add indexes in schema definition
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    // ... other fields
  },
  (table) => ({
    tenantIdIdx: index('idx_users_tenant_id').on(table.tenantId),
    emailIdx: index('idx_users_email').on(table.email),
  })
);
```

### Query Patterns

```typescript
// ✅ Good: Use Drizzle query builder with type safety
import { eq, and, desc } from 'drizzle-orm';
import { users } from '../schema/users';

const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// ✅ Good: Complex conditions with and/or
const assessments = await db
  .select()
  .from(userAssessments)
  .where(and(eq(userAssessments.userId, userId), eq(userAssessments.status, 'completed')));

// ✅ Good: Joins with proper typing
const assessmentsWithUsers = await db
  .select({
    assessment: userAssessments,
    user: users,
  })
  .from(userAssessments)
  .leftJoin(users, eq(userAssessments.userId, users.id));

// ✅ Good: Use relational queries for nested data
const program = await db.query.programs.findFirst({
  where: (programs, { eq }) => eq(programs.id, programId),
  with: {
    sessions: {
      with: {
        exercises: {
          with: {
            video: true,
          },
        },
      },
    },
  },
});

// ✅ Good: Use prepared statements for repeated queries
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('userId')))
  .prepare('get_user_by_id');

const user = await getUserById.execute({ userId: '123' });

// ❌ Bad: String concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

### RLS Context Pattern

```typescript
// ✅ Good: Always use withRLS wrapper for tenant-scoped queries
import { withRLS } from '../lib/database';

const assessments = await withRLS(tenantId, userId, async (tx) => {
  return await tx.select().from(userAssessments).where(eq(userAssessments.userId, userId));
});

// ✅ Good: Set RLS context for raw SQL
import { sql } from 'drizzle-orm';

await db.execute(sql`SET app.tenant_id = ${tenantId}`);
await db.execute(sql`SET app.user_id = ${userId}`);

// ❌ Bad: Forgetting to set RLS context
const assessments = await db.select().from(userAssessments); // Missing tenant context!
```

### Insert/Update Patterns

```typescript
// ✅ Good: Use .returning() to get inserted data
const [newUser] = await db
  .insert(users)
  .values({
    id: userId,
    tenantId: tenantId,
    email: email,
    firstName: firstName,
    lastName: lastName,
    role: 'individual_user',
  })
  .returning();

// ✅ Good: Partial updates with type safety
const [updated] = await db
  .update(userAssessments)
  .set({
    status: 'completed',
    completedAt: new Date(),
    updatedAt: new Date(),
  })
  .where(eq(userAssessments.id, assessmentId))
  .returning();

// ✅ Good: Upsert pattern (insert or update)
await db
  .insert(userProgress)
  .values({
    tenantId,
    userId,
    sessionId,
    videoId,
    status: 'completed',
    progressPercentage: 100,
  })
  .onConflictDoUpdate({
    target: [
      userProgress.tenantId,
      userProgress.userId,
      userProgress.sessionId,
      userProgress.videoId,
    ],
    set: {
      status: 'completed',
      progressPercentage: 100,
      updatedAt: new Date(),
    },
  });

// ✅ Good: Batch inserts
const newUsers = await db
  .insert(users)
  .values([
    { id: '1', tenantId, email: 'user1@test.com' /* ... */ },
    { id: '2', tenantId, email: 'user2@test.com' /* ... */ },
  ])
  .returning();
```

### Transaction Patterns

```typescript
// ✅ Good: Use transactions for multiple related operations
await db.transaction(async (tx) => {
  const [assessment] = await tx
    .insert(userAssessments)
    .values({ ...assessmentData })
    .returning();

  await tx.insert(programs).values({ ...programData, assessmentId: assessment.id });
});

// ✅ Good: Combine transactions with RLS
await withRLS(tenantId, userId, async (tx) => {
  // All operations in this callback are in a transaction with RLS context
  const [assessment] = await tx
    .insert(userAssessments)
    .values({ ...assessmentData })
    .returning();

  await tx.insert(programs).values({ ...programData, assessmentId: assessment.id });
});

// ✅ Good: Handle transaction errors
try {
  await db.transaction(async (tx) => {
    // Multiple operations
  });
} catch (error) {
  // Transaction automatically rolled back
  logger.error('Transaction failed', { error });
  throw new ApplicationError('Failed to complete operation', 'TRANSACTION_FAILED', 500);
}
```

### Validation with Drizzle-Zod

```typescript
// ✅ Good: Use auto-generated schemas
import { insertUserSchema } from '../schema/users';

const validatedData = insertUserSchema.parse(input);

// ✅ Good: Extend auto-generated schemas
import { z } from 'zod';

export const createUserSchema = insertUserSchema
  .extend({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ✅ Good: Use for API validation
export const handler = async (event) => {
  const body = createUserSchema.parse(JSON.parse(event.body || '{}'));
  // body is now type-safe and validated
};

// ✅ Good: Partial validation for updates
export const updateUserSchema = insertUserSchema.partial();

// ✅ Good: Omit fields not needed by client
export const userResponseSchema = selectUserSchema.omit({
  cognitoSub: true,
});
```

## Service Layer Pattern

### Interface Definition

```typescript
// types/services/assessment.service.ts
export interface AssessmentService {
  create(userId: string, tenantId: string, templateId: string): Promise<Assessment>;
  submit(id: string, answers: AnswerSet, context: TenantContext): Promise<AssessmentResult>;
  getById(id: string, context: TenantContext): Promise<Assessment>;
  list(userId: string, context: TenantContext): Promise<Assessment[]>;
}
```

### Implementation

```typescript
// services/assessment.service.impl.ts
export class AssessmentServiceImpl implements AssessmentService {
  constructor(
    private readonly assessmentRepo: AssessmentRepository,
    private readonly scoringEngine: ScoringEngine,
    private readonly logger: Logger
  ) {}

  async create(userId: string, tenantId: string, templateId: string): Promise<Assessment> {
    this.logger.info('Creating assessment', { userId, tenantId, templateId });

    try {
      const assessment = await this.assessmentRepo.create({
        userId,
        tenantId,
        templateId,
        status: 'in_progress',
        startedAt: new Date(),
      });

      return assessment;
    } catch (error) {
      this.logger.error('Failed to create assessment', {
        error,
        userId,
        tenantId,
      });
      throw new ApplicationError('Failed to create assessment', 'ASSESSMENT_CREATE_FAILED', 500);
    }
  }

  // Other methods...
}
```

## Repository Pattern

### Interface

```typescript
// types/repositories/assessment.repository.ts
export interface AssessmentRepository {
  create(data: NewAssessment, context: TenantContext): Promise<Assessment>;
  update(id: string, data: Partial<Assessment>, context: TenantContext): Promise<Assessment>;
  getById(id: string, context: TenantContext): Promise<Assessment | null>;
  findByUser(userId: string, context: TenantContext): Promise<Assessment[]>;
  delete(id: string, context: TenantContext): Promise<void>;
}
```

### Implementation with Drizzle

```typescript
// repositories/assessment.repository.impl.ts
import { eq, and } from 'drizzle-orm';
import { db, withRLS } from '../lib/database';
import { userAssessments } from '../schema/user-assessments';
import type { NewUserAssessment, UserAssessment } from '../schema/user-assessments';

export class AssessmentRepositoryImpl implements AssessmentRepository {
  async create(data: NewUserAssessment, context: TenantContext): Promise<UserAssessment> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [assessment] = await tx
        .insert(userAssessments)
        .values({
          ...data,
          tenantId: context.tenantId,
        })
        .returning();

      return assessment;
    });
  }

  async getById(id: string, context: TenantContext): Promise<UserAssessment | null> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [assessment] = await tx
        .select()
        .from(userAssessments)
        .where(and(eq(userAssessments.id, id), eq(userAssessments.tenantId, context.tenantId)))
        .limit(1);

      return assessment || null;
    });
  }

  async findByUser(userId: string, context: TenantContext): Promise<UserAssessment[]> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      return await tx
        .select()
        .from(userAssessments)
        .where(
          and(eq(userAssessments.userId, userId), eq(userAssessments.tenantId, context.tenantId))
        );
    });
  }

  async update(
    id: string,
    data: Partial<UserAssessment>,
    context: TenantContext
  ): Promise<UserAssessment> {
    return await withRLS(context.tenantId, context.userId, async (tx) => {
      const [updated] = await tx
        .update(userAssessments)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(userAssessments.id, id), eq(userAssessments.tenantId, context.tenantId)))
        .returning();

      return updated;
    });
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
// lib/errors.ts
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly tenantId?: string,
    public readonly userId?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, undefined, undefined, details);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
```

### Error Handling in Lambda

```typescript
// lib/lambda-wrapper.ts
export function withErrorHandling<T>(handler: (event: APIGatewayProxyEventV2) => Promise<T>) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handler(event);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          statusCode: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.code,
            message: error.message,
            ...(error.metadata && { details: error.metadata }),
          }),
        };
      }

      // Unexpected errors
      console.error('Unexpected error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        }),
      };
    }
  };
}
```

## Logging Standards

### Structured Logging

```typescript
// lib/logger.ts
interface LogContext {
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export class Logger {
  constructor(private readonly serviceName: string) {}

  info(message: string, context?: LogContext) {
    console.log(
      JSON.stringify({
        level: 'INFO',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  error(message: string, context?: LogContext & { error?: Error }) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...(context?.error && {
          error: {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name,
          },
        }),
        ...context,
      })
    );
  }

  warn(message: string, context?: LogContext) {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  debug(message: string, context?: LogContext) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(
        JSON.stringify({
          level: 'DEBUG',
          service: this.serviceName,
          message,
          timestamp: new Date().toISOString(),
          ...context,
        })
      );
    }
  }
}

// Usage
const logger = new Logger('AssessmentService');
logger.info('Assessment created', {
  tenantId: context.tenantId,
  userId: context.userId,
  assessmentId: assessment.id,
});
```

## React Component Standards

### Functional Components with Hooks

```typescript
// components/AssessmentCard.tsx
interface AssessmentCardProps {
  assessment: Assessment;
  onStart: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AssessmentCard({
  assessment,
  onStart,
  onDelete,
}: AssessmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(assessment.id);
    } catch (error) {
      console.error("Failed to delete assessment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{assessment.template.name}</h3>
      <p className="text-gray-600">{assessment.template.description}</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onStart(assessment.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Assessment
        </button>

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Custom Hooks

```typescript
// hooks/useAssessment.ts
export function useAssessment(assessmentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  async function loadAssessment() {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (!response.ok) throw new Error('Failed to load assessment');
      const data = await response.json();
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function submitAssessment(answers: Record<string, unknown>) {
    const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) throw new Error('Failed to submit assessment');
    return await response.json();
  }

  return {
    assessment,
    loading,
    error,
    submitAssessment,
    reload: loadAssessment,
  };
}
```

## Testing Standards

### Unit Test Structure

```typescript
// services/__tests__/assessment.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentServiceImpl } from '../assessment.service.impl';

describe('AssessmentService', () => {
  let service: AssessmentServiceImpl;
  let mockRepo: any;
  let mockScoring: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      getById: vi.fn(),
    };
    mockScoring = {
      calculate: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    service = new AssessmentServiceImpl(mockRepo, mockScoring, mockLogger);
  });

  describe('create', () => {
    it('creates assessment with correct parameters', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
      };

      mockRepo.create.mockResolvedValue(mockAssessment);

      const result = await service.create('user-123', 'tenant-123', 'template-123');

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        tenantId: 'tenant-123',
        templateId: 'template-123',
        status: 'in_progress',
        startedAt: expect.any(Date),
      });
      expect(result).toEqual(mockAssessment);
    });

    it('logs error when creation fails', async () => {
      mockRepo.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create('user-123', 'tenant-123', 'template-123')).rejects.toThrow(
        'Failed to create assessment'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create assessment',
        expect.objectContaining({
          userId: 'user-123',
          tenantId: 'tenant-123',
        })
      );
    });
  });
});
```

### Integration Test Structure

```typescript
// __tests__/integration/assessment-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestTenant, createTestUser, cleanupDatabase } from './helpers';

describe('Assessment Flow Integration', () => {
  let tenant: any;
  let user: any;

  beforeAll(async () => {
    tenant = await createTestTenant();
    user = await createTestUser({ tenantId: tenant.id });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('completes full assessment workflow', async () => {
    // Start assessment
    const assessment = await createAssessment(user.id, tenant.id);
    expect(assessment.status).toBe('in_progress');

    // Submit answers
    const result = await submitAssessment(assessment.id, {
      q1: 'lose_weight',
      q4: '3-4',
    });
    expect(result.status).toBe('completed');
    expect(result.score).toBeDefined();

    // Verify program generated
    const programs = await getPrograms(user.id, tenant.id);
    expect(programs).toHaveLength(1);
    expect(programs[0].assessmentId).toBe(assessment.id);
  });
});
```

## Configuration Management

```typescript
// lib/config.ts
import { z } from 'zod';

const ConfigSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
    name: z.string(),
    user: z.string(),
    password: z.string(),
  }),
  cognito: z.object({
    userPoolId: z.string(),
    clientId: z.string(),
  }),
  aws: z.object({
    region: z.string(),
    s3Bucket: z.string(),
    cloudFrontDomain: z.string(),
  }),
  app: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    environment: z.enum(['dev', 'staging', 'prod']),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      clientId: process.env.COGNITO_CLIENT_ID!,
    },
    aws: {
      region: process.env.AWS_REGION || 'eu-west-2',
      s3Bucket: process.env.S3_VIDEOS_BUCKET!,
      cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN!,
    },
    app: {
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      environment: (process.env.ENVIRONMENT as any) || 'dev',
    },
  });
}

export const config = loadConfig();
```

## Code Review Checklist

### Before Submitting PR

- [ ] TypeScript strict mode passes with 0 errors
- [ ] All functions have explicit return types
- [ ] No `any` types used
- [ ] Zod schemas for all API inputs (using Drizzle-Zod when possible)
- [ ] Error handling with custom error classes
- [ ] Tenant context validated in database queries (using withRLS)
- [ ] Unit tests for business logic
- [ ] Integration tests for critical paths
- [ ] CloudWatch logging with structured JSON
- [ ] No sensitive data in logs (passwords, tokens, PHI)
- [ ] Security headers applied
- [ ] ESLint passes with 0 errors
- [ ] Prettier formatting applied
- [ ] Drizzle schema changes have corresponding migrations

### During Code Review

- [ ] Code follows SOLID principles
- [ ] Service layer properly separated from infrastructure
- [ ] Repository pattern used for data access
- [ ] Drizzle ORM used correctly (no raw SQL unless necessary)
- [ ] Multi-tenant isolation verified (RLS context set)
- [ ] Error messages are user-friendly
- [ ] Performance considerations addressed
- [ ] Documentation updated (if needed)
- [ ] Schema changes reviewed and indexes added where appropriate

### Drizzle-Specific Checks

- [ ] Schema changes use proper Drizzle types
- [ ] Relations defined where appropriate
- [ ] Indexes added for foreign keys and common queries
- [ ] Auto-generated Zod schemas used for validation
- [ ] Type exports included for schema types
- [ ] Migrations generated and reviewed before applying
