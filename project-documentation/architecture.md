# FFP - Architecture Documentation

## Overview

FFP uses a serverless-first AWS architecture optimized for multi-tenant SaaS. Phase 1 prioritizes simplicity and speed while establishing scalable patterns. Database access is handled through Drizzle ORM for type-safe, efficient queries.

## Infrastructure Stack (Phase 1)

**Infrastructure-as-Code**: SST v3 Ion (Pulumi-based, TypeScript-first)

### Core Services

#### Authentication & API Layer

- **AWS Cognito User Pool**: User authentication, JWT management
  - Custom attributes: `tenantId`, `role`, `customerId`
  - Access/refresh token handling (15min/7day expiry)
  - Email verification, password reset flows
  - Free tier: 50,000 MAU
- **API Gateway**: REST API management
  - JWT authorizer (validates Cognito tokens)
  - Request validation
  - Per-tenant throttling (1000 req/min default)
  - CORS configuration
- **Lambda Functions**: Serverless business logic
  - Node.js 18+ with TypeScript
  - Single responsibility per function
  - Warm start optimization via provisioned concurrency (critical paths only)
  - Environment variables injected via SST

#### Data & Storage Layer

- **RDS PostgreSQL**: Primary database
  - Instance: t3.small or t4g.small (Graviton)
  - Single AZ (Phase 1), Multi-AZ ready
  - 50GB SSD with auto-scaling
  - Multi-tenant via Row-Level Security (RLS)
  - **Drizzle ORM**: Type-safe database access with TypeScript-first approach
  - Daily automated backups (7-day retention)
  - Encryption at rest via KMS
- **S3 Buckets**: Object storage
  - Videos: `s3://ffp-videos-{env}/library/`
  - Assets: `s3://ffp-assets-{env}/`
  - Lifecycle policies for cost optimization
- **CloudFront**: CDN for global delivery
  - Video streaming with signed URLs
  - Static asset caching
  - Edge locations worldwide

#### Security & Networking

- **VPC**: Network isolation
  - **Phase 1**: AWS default VPC (cost optimisation - no NAT Gateway costs)
  - **Production** (FFP-101): Custom VPC with private subnets and NAT Gateway
  - Public subnets: API Gateway
  - Private subnets: Lambda, RDS (production only)
- **Security Groups**: Firewall rules
  - RDS: Only Lambda security group allowed
  - Lambda: Outbound to RDS and internet
- **Secrets Manager**: Credential storage
  - Database connection strings
  - JWT signing secrets
  - API keys
- **KMS**: Encryption key management
  - RDS encryption
  - S3 bucket encryption
  - Secrets Manager encryption
- **WAF** (optional Phase 1): API Gateway protection
  - SQL injection prevention
  - XSS protection
  - Rate limiting rules

#### Monitoring & Operations

- **CloudWatch**: Centralized logging and metrics
  - Lambda function logs (JSON structured)
  - API Gateway access logs
  - RDS performance metrics
  - Custom business metrics
- **CloudWatch Alarms**: Critical alerts
  - API 5xx errors >5 in 5min
  - Lambda errors >10 in 5min
  - RDS CPU >80% for 10min
  - RDS connections >80% of max
- **CloudTrail**: AWS API audit logging
  - All infrastructure changes tracked
  - Security event monitoring

#### DNS & Domains

- **Route53**: DNS management
  - Primary domain routing
  - Health checks
  - Failover configuration (future)

## Architecture Diagram (Phase 1)

**Note**: Phase 1 uses AWS default VPC for cost optimisation (no NAT Gateway costs). Production will migrate to custom VPC with private subnets (FFP-101).

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
│  Cognito     │          │  Internet Gateway  │
│  User Pool   │          │                    │
└──────┬───────┘          └─────────┬──────────┘
       │ JWT Token                  │
       └────────────────┬───────────┘
                        │
                        ↓
              ┌────────────────────┐
              │   API Gateway      │
              │ (JWT Authorizer)   │
              │ (Regional)         │
              └─────────┬──────────┘
                        │
╔═══════════════════════╧═══════════════════════════════════════════════╗
║                   AWS Default VPC (Phase 1)                           ║
║                   (Custom VPC in Production - FFP-101)                ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │              Default Public Subnets (Multi-AZ)                  │  ║
║  │                                                                 │  ║
║  │  ┌─────────────────────┐      ┌─────────────────────┐           │  ║
║  │  │ Lambda Functions    │      │ Lambda Functions    │           │  ║
║  │  │ (Security Group:    │      │ (Security Group:    │           │  ║
║  │  │  LambdaSG)          │      │  LambdaSG)          │           │  ║
║  │  │                     │      │                     │           │  ║
║  │  │ • Auth Handler      │      │ • Assessment Svc    │           │  ║
║  │  │ • Video Handler     │      │ • Program Gen       │           │  ║
║  │  └──────────┬──────────┘      └──────────┬──────────┘           │  ║
║  │             │                            │                      │  ║
║  │         Drizzle ORM (Type-safe, parameterised)                  │  ║
║  │             │                            │                      │  ║
║  │             └────────────┬───────────────┘                      │  ║
║  │                          ↓                                      │  ║
║  │             ┌──────────────────────────┐                        │  ║
║  │             │   RDS PostgreSQL         │                        │  ║
║  │             │   (Security Group: RDSSG)│                        │  ║
║  │             │   • Multi-tenant + RLS   │                        │  ║
║  │             │   • Port 5432            │                        │  ║
║  │             │   • Encrypted at rest    │                        │  ║
║  │             └──────────────────────────┘                        │  ║
║  │                                                                 │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  Security Group Rules:                                                ║
║  • RDSSG: Inbound port 5432 ONLY from LambdaSG                        ║
║  • LambdaSG: Outbound to RDSSG (port 5432) + Internet (direct)        ║
║                                                                       ║
║  Cost Savings: ~£30-35/month (no NAT Gateway in Phase 1)              ║
╚═══════════════════════════════════════════════════════════════════════╝

┌────────────────────────┐       ┌────────────────────────┐
│  S3: Private Buckets   │       │   CloudWatch           │
│  • Videos (encrypted)  │       │   • Logs (30d)         │
│  • Assets              │       │   • Metrics            │
│  • Backups             │       │   • Alarms             │
└────────────────────────┘       └────────────────────────┘

┌────────────────────────┐       ┌────────────────────────┐
│  Secrets Manager       │       │   CloudTrail           │
│  • DB Credentials      │       │   • Audit Logs         │
│  • API Keys            │       │   • Compliance         │
└────────────────────────┘       └────────────────────────┘
```

### Network Flow Details

**Public Traffic Flow:**

1. User → CloudFront (Frontend/Videos) → S3
2. User → Cognito (Authentication) → JWT Token
3. User → API Gateway (with JWT) → Lambda Functions

**VPC Internal Flow:**

1. API Gateway invokes Lambda in Private Subnets
2. Lambda (LambdaSG) → RDS (RDSSG) on port 5432 only
3. Lambda → Internet (Cognito, external APIs) via NAT Gateway
4. Lambda → S3 (via VPC Gateway Endpoint - no NAT charge)

**Security Boundaries:**

- **Public Subnet**: NAT Gateways only (no compute resources)
- **Private Subnet**: All Lambda functions and RDS (no direct internet access)
- **Security Groups**: Strict least-privilege rules
- **RLS**: Database-level tenant isolation (enforced by Drizzle queries)

## Monorepo Management with Turborepo

FFP uses [Turborepo](https://turborepo.com/) for efficient monorepo management, providing:

### Benefits

- **Smart Caching**: Never rebuild the same work twice
- **Parallel Execution**: Run tasks across packages simultaneously
- **Pipeline Management**: Define dependencies between tasks
- **Remote Caching**: Share build artifacts across team (future)
- **Incremental Builds**: Only rebuild what changed

### Task Dependencies

```
build (web) → depends on → build (core)
test (functions) → depends on → build (core)
deploy (functions) → depends on → build + test
```

### Performance Benefits

- **First build**: ~60s (all packages)
- **Cached rebuild**: ~5s (no changes)
- **Incremental**: ~10-15s (core changes only)
- **Parallel tests**: 3x faster than sequential

## SST Project Structure

```
/
├── turbo.json                 # Turborepo configuration
├── package.json               # Root workspace configuration
├── sst.config.ts              # SST main configuration
├── stacks/
│   ├── AuthStack.ts           # Cognito User Pool setup
│   ├── DatabaseStack.ts       # RDS PostgreSQL configuration
│   ├── StorageStack.ts        # S3 buckets, CloudFront distributions
│   ├── ApiStack.ts            # API Gateway + Lambda functions
│   ├── MonitoringStack.ts     # CloudWatch alarms
│   └── VpcStack.ts            # VPC, subnets, security groups
├── packages/                  # Turborepo workspaces
│   ├── database/              # Database schemas and migrations
│   │   ├── package.json       # Database workspace config
│   │   ├── drizzle.config.ts  # Drizzle ORM configuration
│   │   ├── src/
│   │   │   ├── schema/        # Drizzle schema definitions
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── customers.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/           # Database utilities
│   │   │   │   └── rls.ts     # RLS helper functions
│   │   │   └── index.ts
│   │   └── migrations/        # Generated SQL migrations
│   │       ├── 0000_spotty_makkari.sql
│   │       └── meta/
│   │           └── _journal.json
│   ├── functions/             # Lambda function handlers (domain-organised)
│   │   ├── package.json       # Functions workspace config
│   │   ├── users/             # User management handlers
│   │   │   ├── create-user.ts
│   │   │   ├── get-user.ts
│   │   │   └── update-user.ts
│   │   ├── assessments/       # Assessment handlers
│   │   │   ├── create-assessment.ts
│   │   │   ├── submit-assessment.ts
│   │   │   └── get-assessment.ts
│   │   ├── programs/          # Program handlers
│   │   │   ├── create-program.ts
│   │   │   └── get-program.ts
│   │   └── videos/            # Video handlers
│   │       ├── get-video.ts
│   │       └── update-progress.ts
│   ├── core/                  # Shared business logic (domain-organised)
│   │   ├── package.json       # Core workspace config
│   │   ├── tsconfig.json      # TypeScript config (extends root)
│   │   ├── schemas/           # Zod validation schemas (SINGLE SOURCE OF TRUTH)
│   │   │   ├── user.schema.ts       # User types + validation
│   │   │   ├── tenant.schema.ts     # Tenant types + validation
│   │   │   ├── customer.schema.ts   # Customer types + validation
│   │   │   ├── assessment.schema.ts # Assessment types + validation
│   │   │   ├── program.schema.ts    # Program types + validation
│   │   │   └── index.ts             # Re-export all schemas
│   │   ├── types/             # Type re-exports (backwards compatibility)
│   │   │   ├── user.types.ts        # Re-exports from user.schema.ts
│   │   │   ├── tenant.types.ts      # Re-exports from tenant.schema.ts
│   │   │   └── customer.types.ts    # Re-exports from customer.schema.ts
│   │   ├── users/             # User domain (future - not yet implemented)
│   │   │   ├── user.service.ts      # Business logic orchestration
│   │   │   ├── user.entity.ts       # Business behaviour (optional)
│   │   │   └── user.repository.ts   # Data access with RLS
│   │   ├── assessments/       # Assessment domain (future)
│   │   │   ├── assessment.service.ts
│   │   │   ├── assessment.entity.ts
│   │   │   └── assessment.repository.ts
│   │   ├── programs/          # Program domain (future)
│   │   │   ├── program.service.ts
│   │   │   ├── program.entity.ts
│   │   │   └── program.repository.ts
│   │   └── lib/               # Cross-cutting utilities
│   │       ├── context.ts     # Tenant context extraction
│   │       ├── errors.ts      # Custom error classes
│   │       ├── logger.ts      # Structured logging
│   │       ├── cognito.ts     # Cognito service wrapper
│   │       └── constants.ts   # Shared constants (USER_ROLES, TENANT_TYPES, etc.)
│   └── web/                   # React frontend
│       ├── package.json       # Web workspace config
│       ├── tsconfig.json      # TypeScript config (extends root)
│       ├── src/
│       │   ├── components/    # Atomic design structure
│       │   ├── contexts/      # React contexts (Auth, etc)
│       │   ├── pages/         # Page components
│       │   └── lib/           # Frontend utilities
│       └── public/            # Static assets
└── docs/                      # This documentation
```

## Backend Architecture: Domain-Organised Layers

FFP uses a clear separation of concerns with domain-organised architecture. Each domain (users, assessments, programs, etc.) contains its own service, entity, repository, and schema files.

### Architectural Layers

```
┌────────────────────────────────────────────────────────────┐
│                   API Gateway + JWT Auth                   │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Handler Layer (packages/functions/users/create-user.ts)   │
│  Responsibility: HTTP/Lambda interface                     │
│  - Extract data from API Gateway event                     │
│  - Extract tenant context from JWT                         │
│  - Call service                                            │
│  - Format HTTP response                                    │
│  - Handle errors at HTTP level                             │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Service Layer (packages/core/users/user.service.ts)       │
│  Responsibility: Business logic orchestration              │
│  - Validate input (Zod)                                    │
│  - Coordinate between entities/repositories                │
│  - Enforce business rules                                  │
│  - Transaction management                                  │
│  - Call external services (Cognito, etc.)                  │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Entity Layer (packages/core/users/user.entity.ts)         │
│  Responsibility: Complex business behaviour (optional)     │
│  - Encapsulate complex business rules                      │
│  - Data transformations                                    │
│  - Derived calculations                                    │
│  - State transitions                                       │
│  - Validation depending on object state                    │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Schema Layer (packages/core/src/schemas/user.schema.ts)  │
│  Responsibility: SINGLE SOURCE OF TRUTH for types          │
│  - Zod validation schemas                                  │
│  - TypeScript type inference (z.infer)                     │
│  - Runtime + compile-time type safety                      │
│  - Exported to all packages via @ffp/core                  │
└───────────────────────────┬────────────────────────────────┘
                            │
                   All layers use these types
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Repository Layer (packages/core/users/user.repository.ts) │
│  Responsibility: Data access with RLS                      │
│  - CRUD operations                                         │
│  - Database queries                                        │
│  - RLS context management                                  │
│  - Transactions                                            │
│  - No business logic                                       │
│  - Uses types from @ffp/core                               │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│  Drizzle Schema (packages/database/src/schema/users.ts)    │
│  Responsibility: Database schema definition                │
│  - Table structure                                         │
│  - Column types                                            │
│  - Relations                                               │
│  - Indexes                                                 │
│  - PostgreSQL enums (manually synced with Zod)             │
│  ⚠️ Types from here used ONLY in repositories internally   │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ↓
┌────────────────────────────────────────────────────────────┐
│              PostgreSQL with Row-Level Security            │
└────────────────────────────────────────────────────────────┘
```

### When to Use Each Layer

Use this decision tree to determine which layers you need:

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

**Examples:**

1. **Simple GET request** (no business logic):
   - Flow: `Handler → Repository`
   - Example: Get user by ID

2. **Business logic without complex behaviour**:
   - Flow: `Handler → Service → Repository`
   - Example: Invite user (validate, create Cognito user, save to DB)

3. **Complex business behaviour**:
   - Flow: `Handler → Service → Entity → Repository`
   - Example: Complete assessment (validate, calculate scores, generate recommendations, state transition)

### Layer Responsibilities in Detail

#### 1. Handler Layer (Controller)

**Location**: `packages/functions/{domain}/{action}.ts`

**Purpose**: HTTP/Lambda interface - plumbing only, zero business logic

**Responsibilities**:

- Extract data from API Gateway event
- Extract tenant context from JWT claims
- Call appropriate service method
- Format HTTP response
- Handle HTTP-level errors (400, 401, 403, 404, 500)

**Example**:

```typescript
// packages/functions/users/create-user.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractTenantContext } from '@ffp/core/lib/context';
import { createUserService } from '@ffp/core/users/user.service';
import { withErrorHandling } from '@ffp/core/lib/errors';

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const context = extractTenantContext(event);
  const body = JSON.parse(event.body || '{}');
  const user = await createUserService(body, context);

  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
});
```

#### 2. Service Layer

**Location**: `packages/core/{domain}/{domain}.service.ts`

**Purpose**: Business logic orchestration - decides WHAT to do

**Responsibilities**:

- Validate input using Zod schemas
- Coordinate between multiple entities/repositories
- Enforce business rules and constraints
- Manage transactions
- Call external services (Cognito, S3, etc.)
- Transform data between layers

**When to skip**: Simple CRUD operations with no business rules

**Example**:

```typescript
// packages/core/users/user.service.ts
import { createUserSchema, CreateUserInput, User } from '@ffp/core';
import { userRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { TenantContext } from '../lib/context';
import { CognitoService } from '../lib/cognito';

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

  // 4. Create entity for complex logic
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
```

#### 3. Entity Layer (Optional)

**Location**: `packages/core/{domain}/{domain}.entity.ts`

**Purpose**: Business behaviour - encapsulates HOW complex logic works

**Use when you have**:

- Password hashing/validation logic
- Score calculations with complex algorithms
- State transitions with validation (draft → submitted → approved)
- Permission checks based on user role
- Derived data or calculations

**Skip when you have**:

- Simple CRUD operations
- Basic validation (use Zod instead)
- No complex business behaviour

**Example**:

```typescript
// packages/core/users/user.entity.ts
import { hash, verify } from '@node-rs/argon2';
import { User } from '@ffp/core';

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

#### 4. Repository Layer

**Location**: `packages/core/{domain}/{domain}.repository.ts`

**Purpose**: Data access layer with RLS - dumb data fetching/saving

**Responsibilities**:

- CRUD operations
- Database queries using Drizzle
- RLS context management (CRITICAL for multi-tenancy)
- Transaction management
- Query composition
- **No business logic** - just data operations

**Example**:

```typescript
// packages/core/users/user.repository.ts
import { db } from '@ffp/database';
// ⚠️ EXCEPTION: Repository MAY import database types for internal use only
// All other layers (service, entity, handler) MUST import from @ffp/core
import { users, NewUser, User as DbUser } from '@ffp/database/schema/users';
import { eq, and, sql } from 'drizzle-orm';
import { setRLSContext } from '@ffp/database/lib/rls';
import { TenantContext } from '../lib/context';
import type { User } from '@ffp/core';

export const userRepository = {
  async create(data: NewUser, context: TenantContext): Promise<User> {
    return await db.transaction(async (tx) => {
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

  async findById(id: string, context: TenantContext): Promise<User | null> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      return await tx.query.users.findFirst({
        where: eq(users.id, id),
      });
    });
  },

  async findByEmail(email: string, context: TenantContext): Promise<User | null> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      return await tx.query.users.findFirst({
        where: eq(users.email, email),
      });
    });
  },

  async update(id: string, data: Partial<User>, context: TenantContext): Promise<User> {
    return await db.transaction(async (tx) => {
      await setRLSContext(tx, context.tenantId);

      const [updated] = await tx.update(users).set(data).where(eq(users.id, id)).returning();

      return updated;
    });
  },

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

#### 5. Schema Layer (Validation)

**Location**: `packages/core/{domain}/{domain}.schema.ts`

**Purpose**: Input validation using Zod

**Example**:

```typescript
// packages/core/users/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['customer_owner', 'customer_admin', 'program_user']),
  customerId: z.string().uuid(),
  temporaryPassword: z.string().min(8),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

#### 6. Drizzle Schema Layer

**Location**: `packages/database/src/schema/{table}.ts`

**Purpose**: Database table definitions

**Example**:

```typescript
// packages/database/src/schema/users.ts
import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { customers } from './customers';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),

  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),

  passwordHash: varchar('password_hash', { length: 255 }),
  mustChangePassword: boolean('must_change_password').default(true),
  passwordChangedAt: timestamp('password_changed_at'),

  cognitoId: varchar('cognito_id', { length: 255 }).unique(),
  emailVerified: boolean('email_verified').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Domain Organisation Benefits

**Clear boundaries**: Each domain is self-contained with all its layers in one folder

**Easy navigation**: Finding user-related code? Go to `packages/core/users/`

**Scalability**: Adding a new domain (e.g., `videos/`) doesn't affect existing domains

**Testing**: Each domain can be tested independently

**Consistency**: All domains follow the same structure pattern

---

## Enhanced Context Architecture: User & System Requests

FFP supports both **user-triggered requests** (API calls) and **system-triggered requests** (job queues, scheduled tasks).

### Context Interfaces

```typescript
// packages/core/lib/context.ts

/**
 * Actor represents who/what is making the request
 */
export type ActorType = 'user' | 'system';

export interface UserActor {
  type: 'user';
  userId: string;
  userRole: string;
  email: string;
}

export interface SystemActor {
  type: 'system';
  systemId: string; // e.g., 'export-worker', 'cleanup-job'
  triggeredBy?: string; // Original user ID if job was queued by a user
  jobId?: string; // For job queue processors
}

export type Actor = UserActor | SystemActor;

/**
 * Core tenant context required for all requests (user or system)
 */
export interface TenantContext {
  // Actor (who/what is performing the action)
  actor: Actor;

  // Tenant info (required for RLS)
  tenantId: string;
  customerId: string | null;

  // Request metadata
  requestId: string;
  timestamp: Date;

  // Platform settings (loaded lazily if needed)
  settings?: PlatformSettings;
  enabledModules?: string[];
}
```

### Usage Examples

**User-triggered API request:**

```typescript
// packages/functions/users/invite-user.ts
export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const context = extractUserContext(event); // User actor
  const user = await inviteUserService(body, context);
  return { statusCode: 201, body: JSON.stringify(user) };
});
```

**System job queue worker:**

```typescript
// packages/functions/jobs/process-export.ts
export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const job: ExportJob = JSON.parse(record.body);

    const context = extractJobContext({
      systemId: 'export-worker',
      tenantId: job.tenantId,
      customerId: job.customerId,
      triggeredBy: job.triggeredBy, // Original user
      jobId: job.id,
    });

    await generateExportService(job, context); // System actor
  }
};
```

**Scheduled cleanup task:**

```typescript
// packages/functions/scheduled/cleanup.ts
export const handler = async () => {
  const tenants = await getAllTenants();

  for (const tenant of tenants) {
    const context = createSystemContext({
      systemId: 'cleanup-job',
      tenantId: tenant.id,
    });

    await cleanupExpiredSessionsService(context); // System actor
  }
};
```

**Key Points:**

- Single `TenantContext` interface works for both user and system requests
- RLS always enforced via `tenantId` regardless of actor type
- Audit logs capture both user and system actions
- System jobs retain original user ID when applicable (job traceability)

## Environment Strategy

### Development (dev)

- Personal developer environment
- Hot-reload Lambda via `sst dev`
- Isolated resources per developer
- Use `drizzle-kit push` for rapid schema iteration

### Staging (staging)

- Shared testing environment
- Matches production configuration
- Used for QA and demo
- Use `drizzle-kit generate` + `migrate` for controlled schema changes

### Production (prod)

- Customer-facing environment
- Enhanced monitoring and alarms
- Daily backups
- Strict migration review process

## Scalability Considerations

### Current Capacity (Phase 1)

- **Concurrent users**: ~1,000
- **API requests**: ~1M/month
- **Database**: 50GB storage, ~100 connections
- **Video bandwidth**: ~500GB/month
- **Drizzle**: Handles current load efficiently with minimal overhead

### When to Scale (Future)

- **10k users**: Add read replicas, Multi-AZ RDS
- **100k users**: ElastiCache, DynamoDB for rate limiting
- **1M users**: Auto-scaling Lambda concurrency, database sharding
- **Drizzle**: Continues to work efficiently at all scales

## Cost Breakdown (Phase 1)

**Region**: eu-west-2 (London)

**Pricing Sources**:

- [AWS RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/) (Last checked: October 2025)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/) (Last checked: October 2025)
- [AWS CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/) (Last checked: October 2025)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/) (Last checked: October 2025)
- [AWS API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/) (Last checked: October 2025)
- [AWS Route53 Pricing](https://aws.amazon.com/route53/pricing/) (Last checked: October 2025)
- [AWS Cognito Pricing](https://aws.amazon.com/cognito/pricing/) (Last checked: October 2025)
- [AWS CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/) (Last checked: October 2025)
- [AWS Pricing Calculator](https://calculator.aws/) - Use this for exact quotes

| Service                       | Monthly Cost (GBP) | Notes                                                      |
| ----------------------------- | ------------------ | ---------------------------------------------------------- |
| **Cognito**                   | £0                 | Free tier: 50,000 MAU                                      |
| **RDS PostgreSQL (t3.small)** | £22-27             | Single AZ, ~£0.031/hour, 2 vCPU, 2GB RAM                   |
| **S3 + CloudFront**           | £4-15              | Video library (500GB-1TB storage + bandwidth)              |
| **Lambda**                    | £0-4               | Free tier: 1M requests/month, 400,000 GB-seconds           |
| **API Gateway**               | £0-4               | Free tier: 1M API calls/month (12 months for new accounts) |
| **S3 (Frontend Hosting)**     | £0-1               | Static assets, CloudFront caching reduces costs            |
| **CloudWatch**                | £0-4               | Basic logging/metrics, 5GB ingestion free tier             |
| **Route53**                   | £0.40              | Hosted zone (~£0.50/month, 1M queries included)            |
| **NAT Gateway**               | £27-32             | Required for Lambda VPC internet access (~£0.045/hour)     |
| **Secrets Manager**           | £0.32              | ~5 secrets × £0.40/month per secret                        |
| **Total (Estimated)**         | **£54-87**         | Actual costs will vary based on usage                      |

### Cost Notes

**⚠️ Important**: Prices shown are estimates based on eu-west-2 (London) region pricing as of October 2025. AWS pricing changes over time and varies by region. Always verify current pricing using the [AWS Pricing Calculator](https://calculator.aws/) before making budget decisions.

**Exchange Rate**: Estimates use approximate rate of £1 = $1.27 USD (October 2025). Actual billing depends on your AWS billing currency.

**Drizzle ORM**: No additional cost - it's a lightweight library that runs in your Lambda functions. The minimal overhead (~50KB bundle size) has negligible impact on Lambda costs.

**NAT Gateway**: The largest single cost driver in Phase 1. Required for Lambda functions in private subnets to access the internet (Cognito, external APIs, etc.). Consider:

- **Phase 1**: Single NAT Gateway in one AZ (~£27-32/month)
- **Phase 2**: Multi-AZ NAT Gateways for high availability (~£60/month)
- **Alternative**: Lambda functions outside VPC (less secure, saves NAT costs)

**Cost Optimization Considerations**:

1. Use t4g.small (ARM/Graviton) instead of t3.small for RDS (~20% cheaper)
2. Enable S3 Intelligent-Tiering for video files
3. Set CloudFront cache TTL appropriately (reduce origin requests)
4. Right-size Lambda memory allocation (higher memory can be more cost-effective)
5. Use Reserved Instances for RDS after confirming instance type (~40% savings)
6. Drizzle's lightweight nature means minimal Lambda execution time

### Scaling Cost Projections

| User Count | Estimated Monthly Cost | Key Changes                            |
| ---------- | ---------------------- | -------------------------------------- |
| <100       | £54-87                 | Phase 1 baseline (free tiers active)   |
| 100-1k     | £85-150                | RDS t3.medium, increased bandwidth     |
| 1k-10k     | £300-600               | Multi-AZ RDS, ElastiCache, more Lambda |
| 10k-100k   | £1,200-3,000           | Read replicas, sharding considerations |

## Security Layers

### Network Security

- VPC isolation
- Private subnets for data tier
- Security groups (least privilege)
- No public RDS access

### Application Security

- JWT validation on all protected routes
- Zod schema validation on all inputs (auto-generated from Drizzle schemas)
- RLS enforced at database level
- Type-safe queries prevent SQL injection
- Structured logging (no sensitive data)

### Data Security

- Encryption at rest (KMS)
- Encryption in transit (TLS 1.3)
- Secrets Manager for credentials
- Regular backups (7-day retention)
- Drizzle parameterized queries (SQL injection protection)

### Monitoring & Incident Response

- CloudWatch alarms for anomalies
- CloudTrail for audit logs
- Structured logging with correlation IDs
- Tenant/user context in all logs

## Migration Path (Future Phases)

### Phase 2 (1k-10k users)

- Enable Multi-AZ RDS
- Add ElastiCache for caching
- Video transcoding pipeline
- Enhanced monitoring (X-Ray)
- Drizzle continues to handle increased load efficiently

### Phase 3 (10k-100k users)

- Read replicas for RDS
- DynamoDB for rate limiting
- Advanced analytics pipeline
- Real-time notifications
- Consider connection pooling (RDS Proxy)

### Phase 4 (100k+ users)

- Database sharding considerations
- Global deployment (multi-region)
- Chaos engineering
- Advanced observability
- Drizzle works seamlessly with sharded architectures
