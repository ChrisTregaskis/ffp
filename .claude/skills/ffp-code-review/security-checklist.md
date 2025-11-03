# FFP Security Review Checklist

This checklist provides detailed security patterns for reviewing FFP code changes.

## Multi-Tenant Isolation (CRITICAL)

### Row-Level Security (RLS)

**Every database transaction MUST set RLS context:**

```typescript
// CORRECT: Transaction with RLS context
export const findUserById = async (
  context: RequestContext,
  userId: string
): Promise<User | null> => {
  return await db.transaction(async (tx) => {
    // CRITICAL: Set RLS context first
    await setRLSContext(tx, context.tenantId);

    return await tx.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.tenant_id, context.tenantId) // Belt and braces
      ),
    });
  });
};

// WRONG: Missing RLS context
export const findUserById = async (userId: string): Promise<User | null> => {
  // CRITICAL BUG: No RLS context = leaks all tenants!
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
};

// WRONG: RLS context but missing tenant_id filter
export const findUserById = async (
  context: RequestContext,
  userId: string
): Promise<User | null> => {
  return await db.transaction(async (tx) => {
    await setRLSContext(tx, context.tenantId);

    // WRONG: Missing tenant_id in where clause
    // RLS should catch this, but don't rely on it alone!
    return await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });
  });
};
```

**Checklist:**

- [ ] Every `db.transaction()` has `setRLSContext(tx, context.tenantId)`
- [ ] Every query has `eq(table.tenant_id, context.tenantId)` in where clause
- [ ] No direct `db.query.*` calls (always use transactions)
- [ ] `context.tenantId` is never from client input (only JWT)

### Cognito JWT Claims

**Always use `custom:` prefix for custom attributes:**

```typescript
// CORRECT: Extract claims with custom: prefix
export const extractUserContext = (event: APIGatewayProxyEvent): RequestContext => {
  const claims = event.requestContext.authorizer?.claims;

  if (!claims) {
    throw new UnauthorisedError('Missing authentication claims');
  }

  return {
    userId: claims.sub,
    tenantId: claims['custom:tenantId'], // CORRECT: custom: prefix
    role: claims['custom:role'] as UserRole,
    parentBusinessId: claims['custom:parentBusinessId'],
  };
};

// WRONG: Missing custom: prefix
export const extractUserContext = (event: APIGatewayProxyEvent): RequestContext => {
  const claims = event.requestContext.authorizer?.claims;

  return {
    userId: claims.sub,
    tenantId: claims.tenantId, // WRONG: undefined!
    role: claims.role as UserRole, // WRONG: undefined!
  };
};
```

**Checklist:**

- [ ] All custom claims use `claims['custom:attributeName']` syntax
- [ ] No dot notation for custom claims (e.g., `claims.tenantId` is wrong)
- [ ] Standard claims (sub, email) use dot notation correctly
- [ ] Missing claims throw proper errors (don't silently fail)

### Input Validation

**All inputs MUST be validated with Zod schemas:**

```typescript
// CORRECT: Zod validation before processing
export const createUser = async (context: RequestContext, input: unknown): Promise<User> => {
  // Validate input with Zod
  const validatedInput = createUserSchema.parse(input);

  // Proceed with validated data
  return await userRepository.create(context, validatedInput);
};

// WRONG: No input validation
export const createUser = async (
  context: RequestContext,
  input: any // WRONG: any type + no validation
): Promise<User> => {
  // Dangerous: input could be malicious
  return await userRepository.create(context, input);
};
```

**Checklist:**

- [ ] All service methods validate input with Zod schemas
- [ ] No `any` types on input parameters
- [ ] Zod errors are caught and mapped to user-friendly messages
- [ ] Validation happens BEFORE any business logic

## SQL Injection Prevention

**Use parameterised queries, NEVER string concatenation:**

```typescript
// CORRECT: Parameterised query
await tx.execute(sql`SET app.tenant_id = ${tenantId}`);

// WRONG: String concatenation - SQL injection risk!
await tx.execute(`SET app.tenant_id = '${tenantId}'`);

// CORRECT: Drizzle query builder (parameterised)
await tx.query.users.findMany({
  where: eq(users.name, searchName),
});

// WRONG: Raw SQL with string interpolation
await tx.execute(`SELECT * FROM users WHERE name = '${searchName}'`);
```

**Checklist:**

- [ ] All SQL uses Drizzle query builder or `sql` tagged template
- [ ] No string concatenation for SQL queries
- [ ] No `${variable}` in raw SQL strings
- [ ] All dynamic values passed as parameters

## Secrets Management

**Never commit secrets to code:**

```typescript
// CORRECT: Environment variables
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.THIRD_PARTY_API_KEY;

// WRONG: Hardcoded secrets
const dbUrl = 'postgres://user:password123@localhost/ffp';
const apiKey = 'sk_live_abc123xyz789';
```

**Checklist:**

- [ ] No hardcoded passwords, API keys, tokens
- [ ] All secrets loaded from environment variables
- [ ] `.env` files are gitignored
- [ ] No secrets in comments or documentation
- [ ] AWS Secrets Manager used for production secrets (Phase 2+)

## Error Handling

**Don't leak sensitive data in error messages:**

```typescript
// CORRECT: Generic user-facing error, detailed internal log
try {
  await db.transaction(async (tx) => {
    await setRLSContext(tx, context.tenantId);
    return await tx.query.users.findFirst({ ... });
  });
} catch (error) {
  // Log full error internally
  logger.error('Database query failed', {
    error,
    userId: context.userId,
    tenantId: context.tenantId,
  });

  // Return generic message to user
  throw new InternalServerError('Failed to retrieve user');
}

// WRONG: Leaks sensitive data to user
try {
  await db.transaction(async (tx) => { ... });
} catch (error) {
  // WRONG: Exposes internal details
  throw new Error(`Database error: ${error.message}`);
}
```

**Checklist:**

- [ ] User-facing errors are generic (don't expose stack traces)
- [ ] Detailed errors logged internally with context
- [ ] No database connection strings in error messages
- [ ] No tenant IDs or user IDs in user-facing errors

## Authentication & Authorisation

**Verify permissions before operations:**

```typescript
// CORRECT: Check role permissions
export const deleteUser = async (context: RequestContext, userId: string): Promise<void> => {
  // Check authorisation first
  if (context.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can delete users');
  }

  // Verify ownership within tenant
  const user = await userRepository.findById(context, userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.tenant_id !== context.tenantId) {
    throw new ForbiddenError('Cannot delete user from another tenant');
  }

  await userRepository.delete(context, userId);
};

// WRONG: No permission checks
export const deleteUser = async (context: RequestContext, userId: string): Promise<void> => {
  // WRONG: No role check, no tenant verification
  await userRepository.delete(context, userId);
};
```

**Checklist:**

- [ ] Role-based access control (RBAC) enforced in services
- [ ] Cross-tenant access blocked explicitly
- [ ] Resource ownership verified before mutations
- [ ] Proper error types (ForbiddenError vs UnauthorisedError)

## Audit Logging

**Log security-relevant actions:**

```typescript
// CORRECT: Audit log with context
export const updateUserRole = async (
  context: RequestContext,
  userId: string,
  newRole: UserRole
): Promise<User> => {
  const user = await userRepository.update(context, userId, { role: newRole });

  // Audit log with full context
  logger.info('User role updated', {
    action: 'USER_ROLE_UPDATED',
    actorId: context.userId,
    actorRole: context.role,
    tenantId: context.tenantId,
    targetUserId: userId,
    oldRole: user.role,
    newRole: newRole,
    timestamp: new Date().toISOString(),
  });

  return user;
};

// WRONG: No audit logging
export const updateUserRole = async (
  context: RequestContext,
  userId: string,
  newRole: UserRole
): Promise<User> => {
  // WRONG: Sensitive action with no audit trail
  return await userRepository.update(context, userId, { role: newRole });
};
```

**Checklist:**

- [ ] Sensitive actions logged (create, update, delete)
- [ ] Logs include: actor, tenant, action, timestamp
- [ ] Logs use structured format (JSON)
- [ ] No sensitive data (passwords, tokens) in logs

## OWASP Top 10 Coverage

**Ensure these are addressed:**

1. **Broken Access Control**: RLS + tenant_id validation
2. **Cryptographic Failures**: TLS 1.3, encryption at rest (KMS)
3. **Injection**: Parameterised queries, Zod validation
4. **Insecure Design**: Multi-tenant architecture with RLS
5. **Security Misconfiguration**: Strict TypeScript, no debug in prod
6. **Vulnerable Components**: Regular dependency updates (Dependabot)
7. **Authentication Failures**: Cognito with MFA, JWT validation
8. **Data Integrity Failures**: Input validation, output encoding
9. **Logging Failures**: Structured logging with CloudWatch
10. **SSRF**: Input validation on URLs, allowlist external services

**Checklist:**

- [ ] All OWASP Top 10 categories addressed in code
- [ ] Security requirements in `project-documentation/security.md` followed
- [ ] Healthcare data compliance (sensitive data protection) enforced
