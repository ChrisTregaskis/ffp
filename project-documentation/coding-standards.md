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

### Type Definitions and Single Source of Truth

FFP uses **Zod schemas as the single source of truth** for all entity types. This provides both runtime validation and compile-time type safety through type inference.

```typescript
// ✅ BEST: Zod schemas with type inference (SINGLE SOURCE OF TRUTH)
// Location: @ffp/core/src/schemas/user.schema.ts
import { z } from 'zod';

export const userRoleSchema = z.enum([
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
]);

// Type automatically inferred from schema
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  tenantId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type automatically inferred from schema
export type User = z.infer<typeof userSchema>;

// ✅ Good: Constants for programmatic comparisons
// Location: @ffp/core/src/lib/constants.ts
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  CUSTOMER_OWNER: 'customer_owner',
  CUSTOMER_ADMIN: 'customer_admin',
  CUSTOMER_USER: 'customer_user',
  INDIVIDUAL_USER: 'individual_user',
} as const;

// Usage:
import { User, UserRole } from '@ffp/core';
import { USER_ROLES } from '@ffp/core';

// Use type for typing
const user: User = {
  /* ... */
};

// Use constant for comparisons
if (user.role === USER_ROLES.SYSTEM_ADMIN) {
  // Admin logic
}

// ✅ Good: Use union types for simple status flags
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

// ❌ DEPRECATED: Don't use TypeScript enums
enum UserRole {
  SYSTEM_ADMIN = 'system_admin', // Use Zod enum instead
}

// ❌ DEPRECATED: Don't define types separately from schemas
interface User {
  id: string;
  email: string;
  // Use Zod schema + z.infer instead
}
```

**Import patterns:**

```typescript
// ✅ Recommended: Import from @ffp/core root
import { User, UserRole, Tenant, TenantType, Customer, CustomerStatus } from '@ffp/core';
import { USER_ROLES, TENANT_TYPES, CUSTOMER_STATUS } from '@ffp/core';

// ✅ Also works: Direct import from schemas (for backwards compatibility)
import type { User } from '@ffp/core/types/user.types';
```

**Key principles:**

1. **Zod schemas are the source**: All entity types defined in `@ffp/core/src/schemas/*.schema.ts`
2. **Types via inference**: Use `z.infer<typeof schema>` to derive TypeScript types
3. **Constants for values**: Use `USER_ROLES`, `TENANT_TYPES`, etc. for programmatic comparisons
4. **PostgreSQL enums manual sync**: Database enums must be manually kept in sync with Zod schemas (documented in both locations)

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

FFP uses **Zod schemas in @ffp/core as the source of truth**, with Drizzle database schemas manually kept in sync.

```typescript
// Location: @ffp/database/src/schema/users.ts

// ✅ CRITICAL: PostgreSQL enum must match Zod schema
// IMPORTANT: Keep in sync with userRoleSchema in @ffp/core/src/schemas/user.schema.ts
// The Zod schema is the single source of truth for user roles.
// Manual synchronisation required (cannot auto-generate due to circular dependency).
export const userRoleEnum = pgEnum('user_role', [
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
]);

// ✅ Good: Add indexes in schema definition
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull(),
    cognitoSub: varchar('cognito_sub', { length: 255 }).notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id),
    profileImageUrl: varchar('profile_image_url', { length: 500 }),
    phone: varchar('phone', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index('idx_users_tenant_id').on(table.tenantId),
    emailIdx: index('idx_users_email').on(table.email),
    cognitoSubIdx: index('idx_users_cognito_sub').on(table.cognitoSub),
  })
);

// ✅ Good: Define relations for type-safe joins
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [users.customerId],
    references: [customers.id],
  }),
  assessments: many(userAssessments),
}));

// ✅ Good: Export Drizzle-inferred types for database operations
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ⚠️ IMPORTANT: For validation and typing across the app, import from @ffp/core:
// import { User, UserRole, createUserSchema } from '@ffp/core';
// The @ffp/core schemas are the source of truth, not the database schema types.
```

**Key difference from typical Drizzle usage:**

- **Typical Drizzle**: Generate Zod schemas FROM database schema using `createInsertSchema()`
- **FFP Pattern**: Define Zod schemas FIRST in @ffp/core, manually sync database enums, use Zod schemas for all validation/typing

**Why this pattern:**

1. Business logic layer (@ffp/core) shouldn't depend on database layer (@ffp/database)
2. Zod schemas provide runtime validation in frontend and backend
3. Single source of truth for types across all packages
4. Database is just one consumer of these types

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

### Validation with Zod Schemas

FFP uses Zod schemas from **@ffp/core** for all validation. These schemas are the single source of truth.

```typescript
// ✅ BEST: Import validation schemas from @ffp/core
// Location: @ffp/core/src/schemas/user.schema.ts
import { z } from 'zod';

export const userRoleSchema = z.enum([
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable(),
  phone: z.string().max(20).nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ✅ Good: Partial schemas for updates
export const updateUserSchema = createUserSchema.partial();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ✅ Good: JWT claims validation
export const jwtUserClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  'custom:tenantId': z.string().uuid(),
  'custom:role': userRoleSchema,
});

export type JwtUserClaims = z.infer<typeof jwtUserClaimsSchema>;

// ✅ Good: Use for API validation in handlers
// Location: packages/functions/users/create-user.ts
import { createUserSchema } from '@ffp/core';

export const handler = async (event: APIGatewayProxyEvent) => {
  const body = JSON.parse(event.body || '{}');

  // Runtime validation with type inference
  const validatedData = createUserSchema.parse(body);
  // validatedData is now type-safe CreateUserInput

  // Call service layer
  const user = await createUserService(validatedData, context);

  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
};

// ✅ Good: Use for frontend validation
// Location: packages/web/src/contexts/AuthContext.tsx
import { jwtUserClaimsSchema } from '@ffp/core';

const idToken = await auth.currentSession?.getIdToken();
const claims = jwtUserClaimsSchema.parse(idToken.payload);
// claims is type-safe JwtUserClaims

// ✅ Good: Extend schemas for specific use cases
export const createUserWithPasswordSchema = createUserSchema
  .extend({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ✅ Good: Omit sensitive fields for API responses
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  // Omit: cognitoSub, passwordHash
});
```

**Key points:**

1. **Import from @ffp/core**: Always import schemas from `@ffp/core`, never from `@ffp/database`
2. **Runtime + Compile-time safety**: Zod provides runtime validation + TypeScript types via `z.infer<>`
3. **Share schemas**: Same schemas used in backend (Lambda), frontend (React), and validation
4. **Manual database sync**: PostgreSQL enums in @ffp/database must be manually kept in sync with Zod enums

## Domain-Organised Architecture Patterns

FFP follows a domain-organised architecture with clear layer separation. Each domain (users, assessments, programs) contains its own service, entity, repository, and schema files.

### Domain Organisation

**Structure**:

```
packages/core/src/
├── users/
│   ├── user.service.ts       # Business logic orchestration
│   ├── user.entity.ts        # Complex business behaviour (optional)
│   ├── user.repository.ts    # Data access with RLS
│   └── user.schema.ts        # Zod validation schemas
├── assessments/
│   ├── assessment.service.ts
│   ├── assessment.entity.ts
│   ├── assessment.repository.ts
│   └── assessment.schema.ts
└── programs/
    ├── program.service.ts
    ├── program.entity.ts
    ├── program.repository.ts
    └── program.schema.ts
```

### Decision Tree: When to Use Each Layer

Use this decision tree to determine which layers your feature needs:

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
    │  state mgmt,     │   │
    │  transformations)│   │
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

**Examples**:

1. **Simple CRUD (No Service, No Entity)**
   - Flow: `Handler → Repository`
   - Example: Get user by ID
   - When: No business rules, just data retrieval

2. **Business Logic (Service, No Entity)**
   - Flow: `Handler → Service → Repository`
   - Example: Invite user (validate, create Cognito user, save to DB)
   - When: Orchestration needed but logic is straightforward

3. **Complex Business Behaviour (Full Stack)**
   - Flow: `Handler → Service → Entity → Repository`
   - Example: Complete assessment (validate, calculate scores, generate recommendations)
   - When: Complex calculations, state transitions, or transformations

## Service Layer Pattern

### Location

`packages/core/{domain}/{domain}.service.ts`

### Purpose

Business logic orchestration - decides **WHAT** to do, not **HOW** to do it.

### Responsibilities

- Validate input using Zod schemas
- Coordinate between multiple entities/repositories
- Enforce business rules and constraints
- Manage transactions
- Call external services (Cognito, S3, etc.)
- Transform data between layers

### When to Skip

- Simple CRUD operations with no business rules
- Direct repository calls are sufficient

### Implementation

```typescript
// packages/core/users/user.service.ts
import { createUserSchema } from './user.schema';
import { userRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { TenantContext } from '../lib/context';
import { CognitoService } from '../lib/cognito';
import { ConflictError } from '../lib/errors';

export const createUserService = async (data: unknown, context: TenantContext) => {
  // 1. Validate input
  const validated = createUserSchema.parse(data);

  // 2. Business rule: Check if email already exists
  const existing = await userRepository.findByEmail(validated.email, context);
  if (existing) {
    throw new ConflictError('User with this email already exists');
  }

  // 3. Coordinate with external service
  const cognitoUser = await CognitoService.createUser({
    email: validated.email,
    tenantId: context.tenantId,
    role: validated.role,
  });

  // 4. Create entity for complex logic (if needed)
  const entity = new UserEntity({
    ...validated,
    cognitoId: cognitoUser.Username,
    tenantId: context.tenantId,
  });

  // 5. Apply business logic via entity
  await entity.setInitialPassword(validated.temporaryPassword);

  // 6. Persist via repository
  const user = await userRepository.create(entity.toDatabase(), context);

  // 7. Return safe data
  return entity.toJSON();
};

// Simpler example - when you DON'T need entity
export const getUserService = async (userId: string, context: TenantContext) => {
  // Direct repository call - no complex logic
  return await userRepository.findById(userId, context);
};
```

## Entity Layer Pattern (Optional)

### Location

`packages/core/{domain}/{domain}.entity.ts`

### Purpose

Business behaviour - encapsulates **HOW** complex logic works.

### Use When You Have

- Password hashing/validation logic
- Score calculations with complex algorithms
- State transitions with validation (draft → submitted → approved)
- Permission checks based on user role
- Derived data or calculations
- Complex data transformations

### Skip When You Have

- Simple CRUD operations
- Basic validation (use Zod instead)
- No complex business behaviour

### Implementation

```typescript
// packages/core/users/user.entity.ts
import { hash, verify } from '@node-rs/argon2';
import { User } from '@ffp/database/schema/users';
import { UnauthorisedError } from '../lib/errors';

export class UserEntity {
  private data: User;
  private passwordHash?: string;

  constructor(data: Partial<User>) {
    this.data = data as User;
  }

  // Business logic: Password management
  async setInitialPassword(tempPassword: string): Promise<void> {
    this.passwordHash = await hash(tempPassword);
    this.data.passwordChangedAt = new Date();
    this.data.mustChangePassword = true;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.passwordHash) {
      throw new Error('No password hash available');
    }

    const isValid = await verify(this.passwordHash, oldPassword);
    if (!isValid) {
      throw new UnauthorisedError('Current password is incorrect');
    }

    this.passwordHash = await hash(newPassword);
    this.data.passwordChangedAt = new Date();
    this.data.mustChangePassword = false;
  }

  // Business logic: Permission checks
  hasPermission(permission: Permission): boolean {
    const rolePermissions = {
      admin: ['users:read', 'users:write', 'users:delete', 'assessments:*'],
      staff: ['users:read', 'assessments:*'],
      patient: ['assessments:read'],
    };

    return rolePermissions[this.data.role].includes(permission);
  }

  // Business logic: Derived state
  isActive(): boolean {
    return !this.data.deletedAt && !this.data.suspendedAt && this.data.emailVerified;
  }

  // Serialisation: What goes to database
  toDatabase() {
    return {
      ...this.data,
      passwordHash: this.passwordHash,
    };
  }

  // Serialisation: What goes to API response (SAFE)
  toJSON() {
    const { passwordHash, cognitoId, ...safe } = this.data;
    return {
      ...safe,
      isActive: this.isActive(),
    };
  }
}
```

### Complex Entity Example: Assessment

```typescript
// packages/core/assessments/assessment.entity.ts
import { Assessment } from '@ffp/database/schema/assessments';
import { InvalidStateError } from '../lib/errors';

export class AssessmentEntity {
  private data: Assessment;
  private scores: Map<string, number> = new Map();

  constructor(data: Partial<Assessment>) {
    this.data = data as Assessment;
  }

  // Business logic: State transitions
  submitAnswers(answers: Record<string, unknown>): void {
    if (this.data.status !== 'in_progress') {
      throw new InvalidStateError(
        `Cannot submit answers for assessment in ${this.data.status} state`
      );
    }

    this.data.answers = answers;
    this.data.status = 'submitted';
    this.data.submittedAt = new Date();
  }

  // Business logic: Complex calculations
  calculateScores(): void {
    if (this.data.status !== 'submitted') {
      throw new InvalidStateError('Cannot calculate scores before submission');
    }

    // Complex scoring algorithm
    const painScore = this.calculatePainScore();
    const mobilityScore = this.calculateMobilityScore();
    const functionalScore = this.calculateFunctionalScore();

    this.scores.set('pain', painScore);
    this.scores.set('mobility', mobilityScore);
    this.scores.set('functional', functionalScore);

    this.data.totalScore = painScore + mobilityScore + functionalScore;
  }

  // Business logic: Recommendations based on scores
  generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.scores.get('pain')! > 7) {
      recommendations.push('Focus on pain management exercises');
    }

    if (this.scores.get('mobility')! < 5) {
      recommendations.push('Emphasise mobility and flexibility work');
    }

    return recommendations;
  }

  // Business logic: Mark complete
  markComplete(): void {
    if (this.data.status !== 'submitted') {
      throw new InvalidStateError('Cannot complete unsubmitted assessment');
    }

    this.data.status = 'completed';
    this.data.completedAt = new Date();
    this.data.recommendations = this.generateRecommendations();
  }

  private calculatePainScore(): number {
    // Complex pain scoring logic
    return 0;
  }

  private calculateMobilityScore(): number {
    // Complex mobility scoring logic
    return 0;
  }

  private calculateFunctionalScore(): number {
    // Complex functional scoring logic
    return 0;
  }

  toDatabase() {
    return this.data;
  }

  toJSON() {
    return {
      ...this.data,
      scores: Object.fromEntries(this.scores),
    };
  }
}
```

## Repository Pattern

### Location

`packages/core/{domain}/{domain}.repository.ts`

### Purpose

Data access layer with RLS - dumb data fetching/saving.

### Responsibilities

- CRUD operations
- Database queries using Drizzle
- RLS context management (CRITICAL for multi-tenancy)
- Transaction management
- Query composition
- **No business logic** - just data operations

### Implementation with Drizzle

```typescript
// packages/core/users/user.repository.ts
import { db } from '@ffp/database';
import { users, NewUser, User } from '@ffp/database/schema/users';
import { eq, and, sql } from 'drizzle-orm';
import { setRLSContext } from '@ffp/database/lib/rls';
import { TenantContext } from '../lib/context';

export const userRepository = {
  /**
   * Create a user (with RLS context)
   */
  async create(data: NewUser, context: TenantContext): Promise<User> {
    return await db.transaction(async (tx) => {
      // Set RLS context for tenant isolation
      await setRLSContext(tx, context.tenantId);

      const [user] = await tx
        .insert(users)
        .values({
          ...data,
          tenantId: context.tenantId,
          customerId: context.customerId,
        })
        .returning();

      return user;
    });
  },

  /**
   * Find user by ID (with RLS - automatically filtered)
   */
  async findById(id: string, context: TenantContext): Promise<User | null> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      return await tx.query.users.findFirst({
        where: eq(users.id, id),
        // RLS ensures only users from this tenant are returned
      });
    });
  },

  /**
   * Find user by email (with RLS)
   */
  async findByEmail(email: string, context: TenantContext): Promise<User | null> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      return await tx.query.users.findFirst({
        where: eq(users.email, email),
      });
    });
  },

  /**
   * Update user (with RLS)
   */
  async update(id: string, data: Partial<User>, context: TenantContext): Promise<User> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      const [updated] = await tx.update(users).set(data).where(eq(users.id, id)).returning();

      return updated;
    });
  },

  /**
   * List users for a customer (with pagination)
   */
  async listByCustomer(
    customerId: string,
    pagination: { offset: number; limit: number },
    context: TenantContext
  ): Promise<{ users: User[]; total: number }> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      const usersList = await tx.query.users.findMany({
        where: eq(users.customerId, customerId),
        offset: pagination.offset,
        limit: pagination.limit,
      });

      // Count total (for pagination)
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.customerId, customerId));

      return {
        users: usersList,
        total: Number(count),
      };
    });
  },
};
```

## Handler Layer Pattern

### Location

`packages/functions/{domain}/{action}.ts`

### Purpose

HTTP/Lambda interface - plumbing only, **zero business logic**.

### Responsibilities

- Extract data from API Gateway event
- Extract tenant context from JWT claims
- Call appropriate service method
- Format HTTP response
- Handle HTTP-level errors (400, 401, 403, 404, 500)

### Implementation

```typescript
// packages/functions/users/create-user.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractTenantContext } from '@ffp/core/lib/context';
import { createUserService } from '@ffp/core/users/user.service';
import { withErrorHandling } from '@ffp/core/lib/errors';

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  // 1. Extract context from JWT
  const context = extractTenantContext(event);

  // 2. Parse body
  const body = JSON.parse(event.body || '{}');

  // 3. Call service (business logic)
  const user = await createUserService(body, context);

  // 4. Return HTTP response
  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
});
```

**Key Point**: Handler has ZERO business logic - just plumbing.

## Schema Layer Pattern (Single Source of Truth)

### Location

`packages/core/src/schemas/{domain}.schema.ts`

### Purpose

**Single source of truth** for entity types, validation, and runtime type checking using Zod.

### Key Principles

1. **All entity schemas defined here**: User, Tenant, Customer, Assessment, etc.
2. **Types via inference**: Use `z.infer<typeof schema>` to derive TypeScript types
3. **Runtime + Compile-time safety**: Zod provides both validation and type safety
4. **Exported from @ffp/core root**: Available to all packages via `import { User } from '@ffp/core'`
5. **PostgreSQL enums manually synced**: Database enums in @ffp/database must match Zod enums

### Implementation

```typescript
// packages/core/src/schemas/user.schema.ts
import { z } from 'zod';

/**
 * User role enumeration - Single source of truth for user roles
 *
 * Defines the access levels and permissions for users in the system.
 *
 * IMPORTANT: Keep PostgreSQL enum in @ffp/database/src/schema/users.ts in sync
 */
export const userRoleSchema = z.enum([
  'system_admin',
  'customer_owner',
  'customer_admin',
  'customer_user',
  'individual_user',
]);

/**
 * TypeScript type derived from Zod schema
 * Use this across all packages for type-safe user role handling
 */
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Full user schema representing a complete user record
 * Used for validation and type generation across the platform
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email().max(255),
  cognitoSub: z.string().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable(),
  profileImageUrl: z.string().url().nullable(),
  phone: z.string().max(20).nullable(),
  dateOfBirth: z.string().date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * TypeScript type inferred from Zod schema
 * Single source of truth for User type across all packages
 */
export type User = z.infer<typeof userSchema>;

/**
 * Schema for creating a new user
 * Omits auto-generated fields (id, timestamps) and tenant context
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable(),
  cognitoSub: z.string().max(255),
  phone: z.string().max(20).nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
});

/**
 * TypeScript type for user creation input
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema for updating an existing user
 * All fields optional except immutable ones (id, tenantId, cognitoSub)
 */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
});

/**
 * TypeScript type for user update input
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * JWT claims schema for Cognito token validation
 * Used in authentication context to parse and validate ID tokens
 */
export const jwtUserClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  'custom:tenantId': z.string().uuid(),
  'custom:role': userRoleSchema,
});

/**
 * TypeScript type for JWT claims
 */
export type JwtUserClaims = z.infer<typeof jwtUserClaimsSchema>;
```

### Usage Examples

**In Lambda handlers:**

```typescript
// packages/functions/users/create-user.ts
import { createUserSchema } from '@ffp/core';

export const handler = async (event: APIGatewayProxyEvent) => {
  const body = JSON.parse(event.body || '{}');

  // Runtime validation + type inference
  const validatedData = createUserSchema.parse(body);

  const user = await createUserService(validatedData, context);

  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
};
```

**In React components:**

```typescript
// packages/web/src/contexts/AuthContext.tsx
import { jwtUserClaimsSchema, type UserRole } from '@ffp/core';

const idToken = await auth.currentSession?.getIdToken();

// Runtime validation of JWT claims
const claims = jwtUserClaimsSchema.parse(idToken.payload);

setUser({
  userId: claims.sub,
  email: claims.email,
  tenantId: claims['custom:tenantId'],
  role: claims['custom:role'], // Type-safe UserRole
});
```

**In service layer:**

```typescript
// packages/core/users/user.service.ts
import { createUserSchema, User, CreateUserInput } from '@ffp/core';

export const createUserService = async (data: unknown, context: TenantContext): Promise<User> => {
  // Validate input
  const validated: CreateUserInput = createUserSchema.parse(data);

  // Business logic...
  const user = await userRepository.create(validated, context);

  return user;
};
```

## Enhanced Patterns

### Base Entity Class (Optional)

For simple domains where you want consistency without complex behaviour, extend `BaseEntity`:

```typescript
// packages/core/lib/base-entity.ts
export abstract class BaseEntity<T> {
  protected data: T;

  constructor(data: Partial<T>) {
    this.data = data as T;
  }

  toDatabase(): T {
    return this.data;
  }

  toJSON(): Partial<T> {
    return this.data;
  }
}

// Simple domain usage
export class VideoEntity extends BaseEntity<Video> {
  // Inherits basic serialisation
  // Add custom methods only if needed

  getDurationMinutes(): number {
    return Math.floor(this.data.durationSeconds / 60);
  }
}
```

### Entity Factory Methods

Use factory methods for validation and flexible construction:

```typescript
// packages/core/users/user.entity.ts
import { createUserSchema } from './user.schema';

export class UserEntity {
  private data: User;

  // Private constructor allows partial data for internal use
  private constructor(data: Partial<User>) {
    this.data = data as User;
  }

  // Factory method with validation
  static create(data: unknown): UserEntity {
    const validated = createUserSchema.parse(data);
    return new UserEntity(validated);
  }

  // Factory method from database (no validation needed)
  static fromDatabase(data: User): UserEntity {
    return new UserEntity(data);
  }

  // Validate current state
  validate(): void {
    createUserSchema.parse(this.data);
  }

  // Business methods can check state
  async setInitialPassword(tempPassword: string): Promise<void> {
    if (!this.data.email) {
      throw new Error('Email required before setting password');
    }
    // ... password logic
  }

  toDatabase(): User {
    return this.data;
  }

  toJSON(): Partial<User> {
    const { passwordHash, cognitoId, ...safe } = this.data;
    return safe;
  }
}
```

**Service layer usage**:

```typescript
export const createUserService = async (data: unknown, context: TenantContext) => {
  // Option 1: Explicit validation at service layer
  const validated = createUserSchema.parse(data);
  const entity = new UserEntity(validated);

  // Option 2: Use factory method (validation built-in)
  const entity = UserEntity.create(data);

  // ... rest of logic
};
```

### Repository save() Method

Add a smart `save()` method to repositories for create-or-update convenience:

```typescript
// packages/core/users/user.repository.ts
export const userRepository = {
  /**
   * Save user (creates or updates based on existence)
   */
  async save(data: NewUser, context: TenantContext): Promise<User> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      // Check if user exists
      if (data.id) {
        const existing = await tx.query.users.findFirst({
          where: eq(users.id, data.id),
        });

        if (existing) {
          // Update existing
          const [updated] = await tx
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, data.id))
            .returning();
          return updated;
        }
      }

      // Create new
      const [created] = await tx
        .insert(users)
        .values({
          ...data,
          tenantId: context.tenantId,
          customerId: context.customerId,
        })
        .returning();

      return created;
    });
  },

  // Explicit methods still available
  async create(data: NewUser, context: TenantContext): Promise<User> {
    /* ... */
  },
  async update(id: string, data: Partial<User>, context: TenantContext): Promise<User> {
    /* ... */
  },
};
```

**Service layer usage**:

```typescript
export const saveUserService = async (data: unknown, context: TenantContext) => {
  const validated = saveUserSchema.parse(data);
  const entity = UserEntity.create(validated);

  // Repository handles create vs update automatically
  return await userRepository.save(entity.toDatabase(), context);
};
```

**Key benefits**:

- Service doesn't need to know if it's create or update
- Repository maintains separation of concerns
- Explicit `create()` and `update()` methods still available when needed

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
- [ ] **Zod schemas imported from @ffp/core (NOT @ffp/database)**
- [ ] Types imported from @ffp/core (User, UserRole, Tenant, Customer, etc.)
- [ ] Constants used for comparisons (USER_ROLES, TENANT_TYPES, CUSTOMER_STATUS)
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
- [ ] **PostgreSQL enums synced with Zod schemas (if changed)**

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

### Type Management Checks

- [ ] **Types imported from @ffp/core, NOT @ffp/database**
- [ ] No duplicate type definitions (User, Tenant, Customer already in @ffp/core)
- [ ] Zod schemas used for runtime validation (via `.parse()`)
- [ ] Types derived from Zod schemas using `z.infer<typeof schema>`
- [ ] Constants (USER_ROLES, etc.) used for programmatic comparisons
- [ ] No TypeScript enums for entity types (use Zod enums instead)
- [ ] PostgreSQL enums match Zod schemas (documented in both locations)

### Drizzle-Specific Checks

- [ ] Schema changes use proper Drizzle types
- [ ] Relations defined where appropriate
- [ ] Indexes added for foreign keys and common queries
- [ ] **PostgreSQL enums reference Zod schemas as source of truth**
- [ ] **Database types (User, NewUser from Drizzle) only used internally in repositories**
- [ ] **@ffp/core types used everywhere else (services, handlers, components)**
- [ ] Migrations generated and reviewed before applying
