# FFP - Coding Standards

Consistent coding standards for the FFP codebase. For architecture details, see `architecture.md`. For commands, see `REFERENCE.md`.

---

## TypeScript Standards

### Strict Mode

All code uses TypeScript strict mode. The base config is in `tsconfig.base.json` - don't modify strict settings.

### Zod as Single Source of Truth

**All entity types are defined as Zod schemas in `@ffp/core/src/schemas/`.**

```typescript
// @ffp/core/src/schemas/user.schema.ts
import { z } from 'zod';

export const userRoleSchema = z.enum([
  'system_admin',
  'customer_owner',
  'customer_admin',
  'programme_user',
]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: userRoleSchema,
  organisationId: z.string().uuid(),
});

export type User = z.infer<typeof userSchema>;
```

**Import pattern:**

```typescript
// ✅ Import types and schemas from @ffp/core
import { User, UserRole, createUserSchema } from '@ffp/core';

// ✅ Use constants for comparisons
import { USER_ROLES } from '@ffp/core';
if (user.role === USER_ROLES.SYSTEM_ADMIN) {
  /* ... */
}

// ❌ Don't use TypeScript enums
enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
}

// ❌ Don't define types separately from schemas
interface User {
  id: string;
  email: string;
}
```

### Type Safety Rules

```typescript
// ❌ Never use any
function process(data: any) {}

// ✅ Use unknown with type guards
function process(data: unknown) {
  if (isValidData(data)) {
    /* TypeScript knows the type */
  }
}

// ✅ Use optional chaining and nullish coalescing
const name = user?.profile?.displayName ?? 'Guest';

// ❌ Avoid non-null assertions
const name = user!.firstName;
```

---

## Drizzle ORM Standards

### Schema Definition

PostgreSQL enums must be manually synced with Zod schemas (documented in both locations).

```typescript
// @ffp/database/src/schema/users.ts
// IMPORTANT: Keep in sync with userRoleSchema in @ffp/core
export const userRoleEnum = pgEnum('user_role', [
  'system_admin',
  'customer_owner',
  'customer_admin',
  'programme_user',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    organisationId: uuid('organisation_id').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    role: userRoleEnum('role').notNull(),
  },
  (table) => ({
    organisationIdIdx: index('idx_users_organisation_id').on(table.organisationId),
  })
);
```

### Query Patterns

```typescript
import { eq, and } from 'drizzle-orm';

// Basic query
const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// Complex conditions
const items = await db
  .select()
  .from(assessments)
  .where(and(eq(assessments.userId, userId), eq(assessments.status, 'completed')));

// Relational queries for nested data
const program = await db.query.programs.findFirst({
  where: eq(programs.id, programId),
  with: { sessions: { with: { exercises: true } } },
});

// ❌ Never use string concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

### RLS Context (Critical)

**Every database operation must set RLS context for organisation isolation.**

```typescript
// ✅ Always use withRLS wrapper
const users = await withRLS(organisationId, userId, async (tx) => {
  return await tx.query.users.findMany();
});

// ❌ Direct queries leak all organisation data
await db.query.users.findMany();
```

### Insert/Update Patterns

```typescript
// Insert with returning
const [newUser] = await db
  .insert(users)
  .values({ id, organisationId, email, role: 'programme_user' })
  .returning();

// Update
const [updated] = await db
  .update(users)
  .set({ firstName, updatedAt: new Date() })
  .where(eq(users.id, id))
  .returning();

// Upsert
await db
  .insert(progress)
  .values({ userId, videoId, status: 'completed' })
  .onConflictDoUpdate({
    target: [progress.userId, progress.videoId],
    set: { status: 'completed', updatedAt: new Date() },
  });
```

### Transactions

```typescript
// Multiple related operations
await db.transaction(async (tx) => {
  const [assessment] = await tx.insert(assessments).values(data).returning();
  await tx.insert(programs).values({ assessmentId: assessment.id });
});

// With RLS context
await withRLS(organisationId, userId, async (tx) => {
  // All operations in this callback have RLS enforced
});
```

---

## Layer Patterns

For the decision tree on when to use each layer, see `architecture.md`.

### Handler (Zero Business Logic)

```typescript
// packages/functions/users/create-user.ts
export const handler = withErrorHandling(async (event) => {
  const context = extractUserContext(event);
  const body = JSON.parse(event.body || '{}');
  const user = await createUserService(body, context);
  return { statusCode: 201, body: JSON.stringify(user) };
});
```

### Service (Business Orchestration)

```typescript
// packages/core/users/user.service.ts
export const createUserService = async (data: unknown, context: RequestContext) => {
  const validated = createUserSchema.parse(data);

  const existing = await userRepository.findByEmail(validated.email, context);
  if (existing) throw new ConflictError('Email already exists');

  const cognitoUser = await CognitoService.createUser({ ...validated });
  return await userRepository.create({ ...validated, cognitoId: cognitoUser.id }, context);
};
```

### Repository (Data Access with RLS)

```typescript
// packages/core/users/user.repository.ts
export const userRepository = {
  async create(data: NewUser, context: RequestContext): Promise<User> {
    return await withRLS(context, async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ ...data, organisationId: context.organisationId })
        .returning();
      return user;
    });
  },

  async findById(id: string, context: RequestContext): Promise<User | null> {
    return await withRLS(context, async (tx) => {
      return await tx.query.users.findFirst({ where: eq(users.id, id) });
    });
  },
};
```

### Entity (Complex Business Behaviour - Optional)

Use entities only when you have complex calculations, state transitions, or derived data.

```typescript
// packages/core/assessments/assessment.entity.ts
export class AssessmentEntity {
  private data: Assessment;

  constructor(data: Partial<Assessment>) {
    this.data = data as Assessment;
  }

  submitAnswers(answers: Record<string, unknown>): void {
    if (this.data.status !== 'in_progress') {
      throw new InvalidStateError(`Cannot submit in ${this.data.status} state`);
    }
    this.data.answers = answers;
    this.data.status = 'submitted';
    this.data.submittedAt = new Date();
  }

  calculateScores(): void {
    // Complex scoring algorithm
  }

  toDatabase() {
    return this.data;
  }
  toJSON() {
    return { ...this.data, scores: this.getScores() };
  }
}
```

---

## Error Handling

### Custom Error Classes

```typescript
// lib/errors.ts
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### Lambda Error Wrapper

```typescript
export const withErrorHandling = <T>(handler: Handler<T>) => {
  return async (event): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handler(event);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          statusCode: error.statusCode,
          body: JSON.stringify({ error: error.code, message: error.message }),
        };
      }
      console.error('Unexpected error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'INTERNAL_SERVER_ERROR' }) };
    }
  };
};
```

---

## Logging

Use structured JSON logging with tenant context.

```typescript
// lib/logger.ts
export class Logger {
  constructor(private readonly service: string) {}

  info(message: string, context?: Record<string, unknown>) {
    console.log(
      JSON.stringify({
        level: 'INFO',
        service: this.service,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  error(message: string, context?: Record<string, unknown> & { error?: Error }) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        service: this.service,
        message,
        timestamp: new Date().toISOString(),
        ...(context?.error && {
          error: { message: context.error.message, stack: context.error.stack },
        }),
        ...context,
      })
    );
  }
}

// Usage
const logger = new Logger('UserService');
logger.info('User created', { organisationId, userId });
```

---

## React Standards

### Component Declaration

**Always use arrow functions with `React.FC` typing.**

```typescript
// ✅ Correct
interface CardProps {
  title: string;
  onAction: () => void;
}

export const Card: React.FC<CardProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 border rounded">
      <h3>{title}</h3>
      <button onClick={onAction}>Action</button>
    </div>
  );
};

// ❌ Don't use function declarations
export function Card({ title, onAction }: CardProps) { }
```

### Custom Hooks

```typescript
export const useAssessment = (id: string) => {
  const [data, setData] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`/api/assessments/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
};
```

---

## Testing

### Unit Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: MockType<UserRepository>;

  beforeEach(() => {
    mockRepo = { create: vi.fn(), findById: vi.fn() };
    service = new UserService(mockRepo);
  });

  it('creates user with correct data', async () => {
    mockRepo.create.mockResolvedValue({ id: '123', email: 'test@example.com' });

    const result = await service.create({ email: 'test@example.com' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
    expect(result.id).toBe('123');
  });
});
```

---

## Code Review Checklist

### Before PR

- [ ] TypeScript strict mode passes (0 errors)
- [ ] ESLint passes (0 errors/warnings)
- [ ] Prettier formatting applied (`pnpm lint-format`)
- [ ] Types imported from `@ffp/core` (not `@ffp/database`)
- [ ] No `any` types
- [ ] RLS context set in all database queries
- [ ] Error handling with custom error classes
- [ ] Structured logging with organisation context
- [ ] No sensitive data in logs

### Drizzle-Specific

- [ ] PostgreSQL enums match Zod schemas
- [ ] Indexes added for foreign keys and common queries
- [ ] Migrations generated (`pnpm db:generate`)
- [ ] Never used `db:push`

### Multi-Tenant Security

- [ ] All queries use `withRLS()` wrapper
- [ ] Organisation context extracted from JWT (not request body)
- [ ] No cross-organisation data access possible
