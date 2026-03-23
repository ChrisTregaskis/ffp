# Example Code Review Output

This is an example of a well-formatted code review following FFP standards.

---

# Code Review Summary

**Branch**: `feature/ffp-25-user-authentication`
**Files Changed**: 8 files, +342 lines, -87 lines
**Review Focus**: Security, Architecture, British English

---

## [CRITICAL] Issues (Must Fix Before Merge)

### 1. Missing RLS Context in User Repository

**Location**: `packages/core/src/users/user.repository.ts:45-52`

**Issue**: Direct database query without setting RLS context, allowing potential cross-organisation data leaks.

```typescript
// WRONG: CURRENT CODE (WRONG)
export const findUserById = async (userId: string): Promise<User | null> => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
};
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
export const findUserById = async (
  context: RequestContext,
  userId: string
): Promise<User | null> => {
  return await db.transaction(async (tx) => {
    // CRITICAL: Set RLS context
    await setRLSContext(tx, context.organisationId);

    return await tx.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisation_id, context.organisationId) // Explicit organisation check
      ),
    });
  });
};
```

**Why**: Without RLS context, PostgreSQL row-level security policies won't filter by organisation, allowing any organisation to access any user's data.

**Priority**: CRITICAL - This is a severe security vulnerability that violates multi-tenant isolation.

---

### 2. Improper Cognito Claim Access

**Location**: `packages/functions/src/users/create-user.ts:23-27`

**Issue**: Missing `custom:` prefix when accessing Cognito JWT custom attributes.

```typescript
// WRONG: CURRENT CODE (WRONG)
const extractContext = (event: APIGatewayProxyEvent): RequestContext => {
  const claims = event.requestContext.authorizer?.claims;

  return {
    userId: claims.sub,
    organisationId: claims.tenantId, // undefined!
    role: claims.role as UserRole, // undefined!
  };
};
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
const extractContext = (event: APIGatewayProxyEvent): RequestContext => {
  const claims = event.requestContext.authorizer?.claims;

  if (!claims) {
    throw new UnauthorisedError('Missing authentication claims');
  }

  return {
    userId: claims.sub,
    organisationId: claims['custom:tenantId'], // CORRECT: custom: prefix (maps to organisationId)
    role: claims['custom:role'] as UserRole,
  };
};
```

**Why**: Cognito custom attributes must be accessed with bracket notation and `custom:` prefix. Dot notation returns `undefined`, causing authentication to fail silently.

**Priority**: CRITICAL - Results in authentication failures and potential security bypass.

---

### 3. No Input Validation on User Creation

**Location**: `packages/core/src/users/user.service.ts:67-72`

**Issue**: Service method accepts `any` type and doesn't validate input before processing.

```typescript
// WRONG: CURRENT CODE (WRONG)
export const createUser = async (
  context: RequestContext,
  input: any // No type safety or validation
): Promise<User> => {
  return await userRepository.create(context, input);
};
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
export const createUser = async (context: RequestContext, input: unknown): Promise<User> => {
  // Validate input with Zod schema
  const validatedInput = createUserSchema.parse(input);

  return await userRepository.create(context, validatedInput);
};
```

**Why**: Without validation, malicious input could inject unexpected fields, bypass business rules, or cause runtime errors. Zod provides type safety and runtime validation.

**Priority**: CRITICAL - Injection attack vector and data integrity risk.

---

## [HIGH] High Priority (Should Fix)

### 4. Business Logic in Handler

**Location**: `packages/functions/src/users/create-user.ts:34-42`

**Issue**: Handler contains business logic (role validation) that should be in the service layer.

```typescript
// WRONG: CURRENT CODE (WRONG)
export const handler = async (event: APIGatewayProxyEvent) => {
  const context = extractUserContext(event);
  const input = JSON.parse(event.body || '{}');

  // Business logic in handler - WRONG!
  if (input.role === 'ADMIN' && context.role !== 'SUPER_ADMIN') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  const user = await userService.createUser(context, input);
  return { statusCode: 201, body: JSON.stringify(user) };
};
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const context = extractUserContext(event);
    const input = parseRequestBody(event.body);

    // Delegate to service layer
    const user = await userService.createUser(context, input);

    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    return handleError(error);
  }
};

// Move business logic to service
export const createUser = async (context: RequestContext, input: unknown): Promise<User> => {
  const validatedInput = createUserSchema.parse(input);

  // Business logic in service - CORRECT!
  if (validatedInput.role === 'ADMIN' && context.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only super admins can create admin users');
  }

  return await userRepository.create(context, validatedInput);
};
```

**Why**: Handlers should be thin HTTP interfaces only. Business logic belongs in services for testability and reusability.

**Priority**: HIGH - Architecture violation that makes testing harder and violates separation of concerns.

---

### 5. Missing Explicit Return Type

**Location**: `packages/core/src/users/user.service.ts:89`

**Issue**: Function missing explicit return type annotation.

```typescript
// WRONG: CURRENT CODE (WRONG)
export const getUsersByTenant = async (context: RequestContext) => {
  return await userRepository.findManyByTenant(context);
};
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
export const getUsersByTenant = async (context: RequestContext): Promise<User[]> => {
  return await userRepository.findManyByTenant(context);
};
```

**Why**: Explicit return types improve code clarity, catch type errors early, and provide better IDE autocomplete.

**Priority**: HIGH - TypeScript strict mode compliance.

---

## [MEDIUM] Suggestions (Consider)

### 6. Raw HTML Elements Instead of Components

**Location**: `packages/web/src/pages/protected/DashboardPage.tsx:34-42`

**Issue**: Using raw HTML elements instead of themed components.

```typescript
// WRONG: CURRENT CODE (WRONG)
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
  <p className="text-sm text-gray-500">Welcome back to your workspace</p>
</div>
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
import { Title, Text } from '@web/components/text';

<div className="mb-8">
  <Title as="h1" colour="foreground">Dashboard</Title>
  <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
    Welcome back to your workspace
  </Text>
</div>
```

**Why**: Using themed components ensures consistent styling, easier theme updates, and better maintainability. Hard-coded colours and raw HTML should be replaced with the app's component system.

**Priority**: MEDIUM - Code quality and design system consistency.

---

### 7. Hard-coded Colours Instead of Theme

**Location**: `packages/web/src/components/ErrorBanner.tsx:12-15`

**Issue**: Hard-coded colour classes instead of theme colours.

```typescript
// WRONG: CURRENT CODE (WRONG)
<div className="bg-red-50 border border-red-200 p-4">
  <p className="text-sm text-red-600">{errorMessage}</p>
</div>
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
import { Text } from '@web/components/text';

<div className="bg-destructive/10 border border-destructive/20 p-4">
  <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }}>
    {errorMessage}
  </Text>
</div>
```

**Why**: Theme colours ensure consistency, allow easy theme changes, and follow the design system. Hard-coded `text-red-600` and `bg-red-50` should use theme variables.

**Priority**: MEDIUM - Design system compliance.

---

### 8. American Spelling in FFP-Specific Function Names

**Location**: `packages/core/src/users/user.service.ts:102`, `user.repository.ts:78`

**Issue**: FFP-specific function names use American spelling instead of British English.

**Note**: This rule applies to FFP domain code only. Framework integrations (e.g., TailwindCSS classes like `text-center`, library APIs) should use the framework's expected spelling.

```typescript
// WRONG: CURRENT CODE (WRONG)
export const optimizeUserQuery = async (...) => { ... };
export const normalizeUserData = (data: unknown) => { ... };
```

**Remediation**:

```typescript
// CORRECT: CORRECT CODE
export const optimiseUserQuery = async (...) => { ... };
export const normaliseUserData = (data: unknown) => { ... };
```

**Why**: Project standards require British English spelling throughout codebase (CLAUDE.md, CLAUDE.local.md).

**Priority**: MEDIUM - Code quality and consistency.

---

### 9. Missing JSDoc Comments on Public API

**Location**: `packages/core/src/users/user.service.ts:45-67`

**Issue**: Public service methods lack JSDoc comments explaining parameters and behaviour.

```typescript
// WRONG: CURRENT CODE (COULD BE BETTER)
export const createUser = async (
  context: RequestContext,
  input: CreateUserInput
): Promise<User> => { ... };
```

**Remediation**:

```typescript
// CORRECT: BETTER WITH JSDOC
/**
 * Creates a new user within the current tenant.
 *
 * @param context - Request context containing tenant and actor info
 * @param input - Validated user creation input
 * @returns Newly created user object
 * @throws {ForbiddenError} If actor lacks permission to create users
 * @throws {ValidationError} If input fails validation
 */
export const createUser = async (
  context: RequestContext,
  input: CreateUserInput
): Promise<User> => { ... };
```

**Why**: JSDoc comments improve discoverability and provide inline documentation for other developers.

**Priority**: MEDIUM - Code quality and maintainability.

---

### 10. Hardcoded Error Messages Could Be Centralised

**Location**: Multiple files (user.service.ts:34, user.repository.ts:56)

**Issue**: Error messages duplicated across files.

```typescript
// WRONG: CURRENT CODE (COULD BE BETTER)
throw new NotFoundError('User not found');
throw new ForbiddenError('Insufficient permissions');
```

**Consideration**:

```typescript
// CORRECT: POSSIBLE IMPROVEMENT (Phase 2+)
// Create shared error message constants
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
} as const;

throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
```

**Trade-off**: Adds indirection but improves consistency and i18n readiness. Consider for Phase 2+ when internationalisation is needed.

**Priority**: LOW - Nice-to-have, not critical for Phase 1.

---

## Positive Observations

### Strong Points in This PR

1. **Excellent Test Coverage**: User service has 85% coverage including edge cases
   - `user.service.test.ts:123-245` - Comprehensive role permission tests
   - `user.repository.test.ts:67-189` - RLS integration tests (great!)

2. **Proper Error Classes**: Custom error types used correctly throughout
   - `UnauthorisedError`, `ForbiddenError`, `NotFoundError` - All properly typed
   - Error messages are user-friendly without leaking sensitive data

3. **Good Type Safety**: Mostly excellent TypeScript usage
   - Zod schemas defined for all inputs (`user.schema.ts`)
   - Proper use of type guards in `extractUserContext`
   - Only minor issue with missing return type (see #5 above)

4. **Consistent Formatting**: Code follows 2-space indentation and line length rules
   - Prettier configuration applied correctly
   - ESLint passes with no warnings

5. **Proper Domain Organisation**: Files correctly placed in domain structure
   - `users/` domain clearly separated from `assessments/` and `programs/`
   - Handler → Service → Repository flow respected (minor handler issue in #4)

---

## Summary

**Overall Assessment**: Strong implementation with critical security issues that must be fixed before merge.

**Must Fix**: 3 critical security issues (RLS, Cognito claims, input validation)
**Should Fix**: 2 high-priority architecture/type issues
**Consider**: 5 medium/low-priority code quality improvements (including component usage and theme colours)

**Estimated Fix Time**: 2-3 hours for critical issues, 1 hour for high-priority items

**Next Steps**:

1. Fix critical security issues (#1, #2, #3)
2. Run full test suite to verify changes
3. Address high-priority architecture issues (#4, #5)
4. Consider suggestions for code quality improvements

**Recommendation**: Do not merge until critical issues are resolved. High-priority items should be addressed in this PR or tracked as follow-up tasks.

---

**Reviewer**: Claude Code (senior-code-reviewer)
**Review Date**: 2025-11-03
**Review Duration**: 15 minutes
