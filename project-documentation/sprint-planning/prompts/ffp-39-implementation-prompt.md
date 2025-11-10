# FFP-39 Implementation Prompt: Refresh Token Lambda Function

**Task**: Implement refresh token Lambda function to allow users to obtain new access tokens without re-authenticating.

**Context**: This follows the patterns established in FFP-38 (Login Lambda). All foundational infrastructure is in place - you just need to create the service and handler layers.

---

## Prerequisites (Already Complete)

✅ **CognitoService.refreshToken()** exists in `packages/core/src/lib/cognito.ts`
✅ **refreshTokenSchema** exists in `packages/core/src/schemas/auth.schema.ts`
✅ **withErrorHandling** wrapper available in `packages/core/src/server/index.ts`
✅ **Route proxy** configured in SST (`ANY /auth/{proxy+}`)
✅ **Pattern reference**: FFP-38 Login Lambda implementation

---

## Implementation Steps

### Step 1: Create Refresh Token Service

**File**: `packages/core/src/auth/refresh-token.service.ts`

```typescript
import { CognitoService } from '@ffp/core/lib/cognito';
import { Logger } from '@ffp/core/lib/logger';
import { type RefreshTokenInput } from '@ffp/core/schemas/auth.schema';

const logger = new Logger('RefreshTokenService');

export interface RefreshTokenResult {
  accessToken: string;
  idToken: string;
  refreshToken: string; // Same token passed in (30-day validity)
  expiresIn: number;
}

export async function refreshTokenService(input: RefreshTokenInput): Promise<RefreshTokenResult> {
  logger.info('Token refresh request');

  const result = await CognitoService.refreshToken(input.refreshToken);

  if (!result.AuthenticationResult) {
    throw new Error('Token refresh failed - no authentication result');
  }

  logger.info('Token refreshed successfully');

  return {
    accessToken: result.AuthenticationResult.AccessToken!,
    idToken: result.AuthenticationResult.IdToken!,
    refreshToken: input.refreshToken, // Return original token
    expiresIn: result.AuthenticationResult.ExpiresIn!,
  };
}
```

**Key Details:**

- Standalone service function (not a class method)
- Calls `CognitoService.refreshToken()` which handles errors
- Returns original refresh token (it doesn't rotate, stays valid for 30 days)
- Uses structured logging

---

### Step 2: Create Lambda Handler

**File**: `packages/functions/src/auth/refresh-token.ts`

```typescript
import { withErrorHandling } from '@ffp/core/server';
import { refreshTokenSchema } from '@ffp/core/schemas/auth.schema';
import { refreshTokenService, type RefreshTokenResult } from '@ffp/core/auth/refresh-token.service';
import { type APIGatewayProxyEventV2 } from 'aws-lambda';

export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2): Promise<RefreshTokenResult> => {
    const body = JSON.parse(event.body ?? '{}') as unknown;
    const input = refreshTokenSchema.parse(body);
    const result = await refreshTokenService(input);
    return result;
  }
);
```

**Key Details:**

- Uses `withErrorHandling` wrapper (converts errors to HTTP responses)
- Parses body with `refreshTokenSchema` (camelCase)
- Delegates to service layer
- Returns result directly (wrapper handles HTTP formatting)

---

### Step 3: Register Route

**File**: `packages/functions/src/auth/index.ts`

**Add import at top:**

```typescript
import { handler as refreshTokenHandler } from './refresh-token';
```

**Add route to RouteRegistry:**

```typescript
const routes: RouteRegistry = {
  POST: {
    '/login': loginHandler,
    '/complete-new-password': completeNewPasswordHandler,
    '/invite-user': inviteUserHandler,
    '/refresh-token': refreshTokenHandler, // ADD THIS LINE
  },
};
```

---

### Step 4: Export Service

**File**: `packages/core/src/auth/index.ts`

**Add export:**

```typescript
export { refreshTokenService, type RefreshTokenResult } from './refresh-token.service';
```

---

## Validation Checklist

After implementation, verify:

### TypeScript & Linting

```bash
pnpm typecheck           # Should pass with zero errors
pnpm lint                # Should pass with zero warnings
```

### Build

```bash
pnpm build              # Should build successfully
```

### Manual Testing (Optional)

If you want to test locally:

1. Deploy to dev environment
2. Use Postman "Login" request to get refresh token
3. Use Postman "Refresh Token" request to test endpoint

---

## Error Scenarios

The implementation handles these automatically:

1. **Invalid Refresh Token** → `CognitoService.refreshToken()` throws `UnauthorisedError` → 401 response
2. **Expired Refresh Token** → Same as above
3. **Malformed Token** → `refreshTokenSchema.parse()` throws `ValidationError` → 400 response
4. **Cognito Service Error** → Caught by `withErrorHandling` → 500 response

**No try-catch needed in handler or service** - errors propagate naturally to `withErrorHandling` wrapper.

---

## Implementation Notes

### Refresh Token Behaviour (Cognito)

- Refresh tokens are valid for 30 days (Cognito default)
- Refresh token **does NOT rotate** - same token is reused until expiry
- Access/ID tokens are regenerated with new 1-hour expiry
- If refresh token expires, user must login again

### Why Return Original Refresh Token?

Even though the refresh token doesn't change, we return it in the response for consistency with the login endpoint response structure. This makes the client implementation simpler - they can always update their stored tokens from the response.

---

## Reference Implementation

Your implementation should mirror FFP-38 (Login Lambda):

- **Handler**: `packages/functions/src/auth/login.ts`
- **Service**: `packages/core/src/auth/login.service.ts`
- **Route Registry**: `packages/functions/src/auth/index.ts` (lines 20-30)

---

## Definition of Done

- [ ] Service layer implemented
- [ ] Lambda handler implemented
- [ ] Route registered in RouteRegistry
- [ ] Service exported from auth index
- [ ] TypeScript passes (zero errors)
- [ ] ESLint passes (zero warnings)
- [ ] Build succeeds

---

## Estimated Time: 1 hour

- Service layer: 20 mins
- Lambda handler: 20 mins
- Route registration: 10 mins
- Validation: 10 mins
