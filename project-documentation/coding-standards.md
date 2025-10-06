# FFP - Coding Standards Documentation

## Overview

Consistent coding standards ensure maintainability, readability, and collaboration across the FFP codebase. These standards apply to all TypeScript/JavaScript code in both frontend and backend.

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
  SYSTEM_ADMIN = "system_admin",
  BUSINESS_OWNER = "business_owner",
  INDIVIDUAL_USER = "individual_user",
}

// ✅ Good: Use union types for simple sets
type ProgressStatus = "not_started" | "in_progress" | "completed" | "skipped";

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
  return typeof value === "string";
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
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
    return "Guest";
  }
  return `${user.firstName} ${user.lastName}`;
}

// ✅ Good: Optional chaining
const userName = user?.profile?.displayName ?? "Guest";

// ✅ Good: Nullish coalescing
const pageSize = config.pageSize ?? 10;

// ❌ Bad: Non-null assertion (avoid unless absolutely necessary)
const name = user!.firstName;
```

## Service Layer Pattern

### Interface Definition

```typescript
// types/services/assessment.service.ts
export interface AssessmentService {
  create(
    userId: string,
    tenantId: string,
    templateId: string
  ): Promise<Assessment>;
  submit(
    id: string,
    answers: AnswerSet,
    context: TenantContext
  ): Promise<AssessmentResult>;
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

  async create(
    userId: string,
    tenantId: string,
    templateId: string
  ): Promise<Assessment> {
    this.logger.info("Creating assessment", { userId, tenantId, templateId });

    try {
      const assessment = await this.assessmentRepo.create({
        userId,
        tenantId,
        templateId,
        status: "in_progress",
        startedAt: new Date(),
      });

      return assessment;
    } catch (error) {
      this.logger.error("Failed to create assessment", {
        error,
        userId,
        tenantId,
      });
      throw new ApplicationError(
        "Failed to create assessment",
        "ASSESSMENT_CREATE_FAILED",
        500
      );
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
  create(data: CreateAssessmentDTO): Promise<Assessment>;
  update(
    id: string,
    data: Partial<Assessment>,
    context: TenantContext
  ): Promise<Assessment>;
  getById(id: string, context: TenantContext): Promise<Assessment | null>;
  findByUser(userId: string, context: TenantContext): Promise<Assessment[]>;
  delete(id: string, context: TenantContext): Promise<void>;
}
```

### Implementation

```typescript
// repositories/assessment.repository.impl.ts
export class AssessmentRepositoryImpl implements AssessmentRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(data: CreateAssessmentDTO): Promise<Assessment> {
    const result = await this.db.query<Assessment>(
      `INSERT INTO user_assessments (tenant_id, user_id, template_id, status, started_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.tenantId, data.userId, data.templateId, data.status, data.startedAt]
    );

    return result.rows[0];
  }

  async getById(
    id: string,
    context: TenantContext
  ): Promise<Assessment | null> {
    const result = await this.db.query<Assessment>(
      `SELECT * FROM user_assessments WHERE id = $1 AND tenant_id = $2`,
      [id, context.tenantId]
    );

    return result.rows[0] || null;
  }

  // Other methods...
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
    super(
      `${resource}${id ? ` with id ${id}` : ""} not found`,
      "NOT_FOUND",
      404
    );
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, undefined, undefined, details);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = "Access denied") {
    super(message, "FORBIDDEN", 403);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}
```

### Error Handling in Lambda

```typescript
// lib/lambda-wrapper.ts
export function withErrorHandling<T>(
  handler: (event: APIGatewayProxyEventV2) => Promise<T>
) {
  return async (
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handler(event);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          statusCode: error.statusCode,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: error.code,
            message: error.message,
            ...(error.metadata && { details: error.metadata }),
          }),
        };
      }

      // Unexpected errors
      console.error("Unexpected error:", error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        }),
      };
    }
  };
}
```

## Validation with Zod

### Schema Definition

```typescript
// schemas/assessment.schema.ts
import { z } from "zod";

export const CreateAssessmentSchema = z.object({
  templateId: z.string().uuid(),
});

export const SubmitAssessmentSchema = z.object({
  answers: z.record(z.unknown()),
});

export const UpdateProgressSchema = z.object({
  sessionId: z.string().uuid(),
  progressPercentage: z.number().min(0).max(100),
  status: z.enum(["not_started", "in_progress", "completed", "skipped"]),
});

export type CreateAssessmentDTO = z.infer<typeof CreateAssessmentSchema>;
export type SubmitAssessmentDTO = z.infer<typeof SubmitAssessmentSchema>;
export type UpdateProgressDTO = z.infer<typeof UpdateProgressSchema>;
```

### Usage in Lambda

```typescript
// functions/assessments/create.ts
import { CreateAssessmentSchema } from "../../schemas/assessment.schema";

export const handler = withErrorHandling(async (event) => {
  const context = extractTenantContext(event);

  // Validate request body
  const body = CreateAssessmentSchema.parse(JSON.parse(event.body || "{}"));

  const assessment = await assessmentService.create(
    context.userId,
    context.tenantId,
    body.templateId
  );

  return assessment;
});
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
        level: "INFO",
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
        level: "ERROR",
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
        level: "WARN",
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  debug(message: string, context?: LogContext) {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(
        JSON.stringify({
          level: "DEBUG",
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
const logger = new Logger("AssessmentService");
logger.info("Assessment created", {
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
      if (!response.ok) throw new Error("Failed to load assessment");
      const data = await response.json();
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  async function submitAssessment(answers: Record<string, unknown>) {
    const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) throw new Error("Failed to submit assessment");
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
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssessmentServiceImpl } from "../assessment.service.impl";

describe("AssessmentService", () => {
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

  describe("create", () => {
    it("creates assessment with correct parameters", async () => {
      const mockAssessment = {
        id: "assessment-123",
        userId: "user-123",
        tenantId: "tenant-123",
      };

      mockRepo.create.mockResolvedValue(mockAssessment);

      const result = await service.create(
        "user-123",
        "tenant-123",
        "template-123"
      );

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: "user-123",
        tenantId: "tenant-123",
        templateId: "template-123",
        status: "in_progress",
        startedAt: expect.any(Date),
      });
      expect(result).toEqual(mockAssessment);
    });

    it("logs error when creation fails", async () => {
      mockRepo.create.mockRejectedValue(new Error("Database error"));

      await expect(
        service.create("user-123", "tenant-123", "template-123")
      ).rejects.toThrow("Failed to create assessment");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to create assessment",
        expect.objectContaining({
          userId: "user-123",
          tenantId: "tenant-123",
        })
      );
    });
  });
});
```

### Integration Test Structure

```typescript
// __tests__/integration/assessment-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestTenant, createTestUser, cleanupDatabase } from "./helpers";

describe("Assessment Flow Integration", () => {
  let tenant: any;
  let user: any;

  beforeAll(async () => {
    tenant = await createTestTenant();
    user = await createTestUser({ tenantId: tenant.id });
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it("completes full assessment workflow", async () => {
    // Start assessment
    const assessment = await createAssessment(user.id, tenant.id);
    expect(assessment.status).toBe("in_progress");

    // Submit answers
    const result = await submitAssessment(assessment.id, {
      q1: "lose_weight",
      q4: "3-4",
    });
    expect(result.status).toBe("completed");
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
import { z } from "zod";

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
    logLevel: z.enum(["debug", "info", "warn", "error"]),
    environment: z.enum(["dev", "staging", "prod"]),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || "5432"),
      name: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      clientId: process.env.COGNITO_CLIENT_ID!,
    },
    aws: {
      region: process.env.AWS_REGION || "us-east-1",
      s3Bucket: process.env.S3_VIDEOS_BUCKET!,
      cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN!,
    },
    app: {
      logLevel: (process.env.LOG_LEVEL as any) || "info",
      environment: (process.env.ENVIRONMENT as any) || "dev",
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
- [ ] Zod schemas for all API inputs
- [ ] Error handling with custom error classes
- [ ] Tenant context validated in database queries
- [ ] Unit tests for business logic
- [ ] Integration tests for critical paths
- [ ] CloudWatch logging with structured JSON
- [ ] No sensitive data in logs (passwords, tokens, PHI)
- [ ] Security headers applied
- [ ] ESLint passes with 0 errors
- [ ] Prettier formatting applied

### During Code Review

- [ ] Code follows SOLID principles
- [ ] Service layer properly separated from infrastructure
- [ ] Repository pattern used for data access
- [ ] Multi-tenant isolation verified
- [ ] Error messages are user-friendly
- [ ] Performance considerations addressed
- [ ] Documentation updated (if needed)
