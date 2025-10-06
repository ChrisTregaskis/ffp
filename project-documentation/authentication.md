# FFP - Authentication Documentation

## Overview

FFP uses AWS Cognito for authentication with custom attributes to support multi-tenant architecture. Cognito handles user registration, login, password management, and JWT token generation.

## Why Cognito

### Benefits for Phase 1

- **Zero auth code**: Registration, login, password reset all handled
- **FREE**: First 50,000 monthly active users
- **JWT automatic**: Token generation, refresh, validation
- **Security**: Battle-tested AWS security
- **SST integration**: First-class support
- **Extensible**: MFA, SSO ready for Phase 2

### Time Savings

- ~5 days of authentication development
- No password hashing logic
- No token refresh implementation
- No email verification system

## Cognito Configuration (SST)

### User Pool Setup

```typescript
// stacks/AuthStack.ts
import { StackContext, Cognito } from "sst/constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Duration } from "aws-cdk-lib";

export function AuthStack({ stack }: StackContext) {
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
    cdk: {
      userPool: {
        // Password requirements
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },

        // Email verification
        autoVerify: { email: true },

        // Custom attributes for multi-tenancy
        customAttributes: {
          tenantId: new cognito.StringAttribute({
            mutable: false, // Cannot change after creation
          }),
          role: new cognito.StringAttribute({
            mutable: true, // Can be updated
          }),
          parentBusinessId: new cognito.StringAttribute({
            mutable: true, // For business sub-users
          }),
        },

        // Account recovery
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

        // User attributes
        standardAttributes: {
          email: { required: true, mutable: false },
          givenName: { required: true, mutable: true },
          familyName: { required: true, mutable: true },
        },
      },

      userPoolClient: {
        // Token expiry
        accessTokenValidity: Duration.minutes(15),
        refreshTokenValidity: Duration.days(7),
        idTokenValidity: Duration.minutes(15),

        // OAuth flows (future SSO)
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      },
    },
  });

  return { auth };
}
```

## Multi-Tenant Architecture

### JWT Token Structure

When a user authenticates, Cognito returns a JWT with these claims:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "given_name": "John",
  "family_name": "Doe",
  "custom:tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "custom:role": "business_owner",
  "custom:parentBusinessId": null,
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Accessing JWT Claims in Lambda

```typescript
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event
) => {
  // JWT claims automatically available via API Gateway authorizer
  const claims = event.requestContext.authorizer.jwt.claims;

  // Extract tenant context
  const tenantContext = {
    userId: claims.sub as string,
    tenantId: claims["custom:tenantId"] as string,
    role: claims["custom:role"] as string,
    email: claims.email as string,
    parentBusinessId: claims["custom:parentBusinessId"] as string | null,
  };

  // Use for RLS queries
  await setRLSContext(tenantContext.tenantId);
  const data = await repository.find(tenantContext);

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

## User Registration Flows

### Individual User Registration

```typescript
// functions/auth/register.ts
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { randomUUID } from "crypto";
import { z } from "zod";

const cognito = new CognitoIdentityProviderClient({});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  accountType: z.enum(["individual", "business"]),
});

export const handler = async (event) => {
  const body = RegisterSchema.parse(JSON.parse(event.body));

  // Generate unique tenant ID
  const tenantId = randomUUID();
  const role =
    body.accountType === "business" ? "business_owner" : "individual_user";

  // Create user in Cognito
  const signUpResult = await cognito.send(
    new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: body.email,
      Password: body.password,
      UserAttributes: [
        { Name: "email", Value: body.email },
        { Name: "given_name", Value: body.firstName },
        { Name: "family_name", Value: body.lastName },
        { Name: "custom:tenantId", Value: tenantId },
        { Name: "custom:role", Value: role },
      ],
    })
  );

  // Store user in PostgreSQL
  await db.users.create({
    id: signUpResult.UserSub,
    tenantId,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role,
    createdAt: new Date(),
  });

  // Create tenant record
  await db.tenants.create({
    id: tenantId,
    type: body.accountType,
    name:
      body.accountType === "business"
        ? `${body.firstName} ${body.lastName}'s Business`
        : `${body.firstName} ${body.lastName}`,
    createdAt: new Date(),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Registration successful. Check email for verification.",
      userId: signUpResult.UserSub,
    }),
  };
};
```

### Business User Invitation

```typescript
// functions/business/invite-user.ts
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";

const cognito = new CognitoIdentityProviderClient({});

const InviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["business_admin", "business_user"]),
});

export const handler = async (event) => {
  const body = InviteUserSchema.parse(JSON.parse(event.body));
  const businessOwner = event.requestContext.authorizer.jwt.claims;

  // Only business owners can invite
  if (businessOwner["custom:role"] !== "business_owner") {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Only business owners can invite users" }),
    };
  }

  const businessTenantId = businessOwner["custom:tenantId"] as string;
  const businessOwnerId = businessOwner.sub as string;

  // Create user with temporary password (emailed to user)
  const result = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: body.email,
      UserAttributes: [
        { Name: "email", Value: body.email },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: body.firstName },
        { Name: "family_name", Value: body.lastName },
        { Name: "custom:tenantId", Value: businessTenantId }, // Same tenant!
        { Name: "custom:role", Value: body.role },
        { Name: "custom:parentBusinessId", Value: businessOwnerId },
      ],
      DesiredDeliveryMediums: ["EMAIL"], // Send temp password via email
    })
  );

  // Store in database
  await db.users.create({
    id: result.User!.Username!,
    tenantId: businessTenantId,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role,
    parentBusinessId: businessOwnerId,
    createdAt: new Date(),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Invitation sent successfully",
      userId: result.User!.Username,
    }),
  };
};
```

## Frontend Integration

### Setup Amplify Auth

```typescript
// lib/auth.ts
import { Amplify } from "aws-amplify";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: "code",
    },
  },
});

// Registration
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return await signUp({
    username: data.email,
    password: data.password,
    options: {
      userAttributes: {
        email: data.email,
        given_name: data.firstName,
        family_name: data.lastName,
      },
    },
  });
}

// Verify email
export async function verifyEmail(email: string, code: string) {
  return await confirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

// Login
export async function login(email: string, password: string) {
  return await signIn({ username: email, password });
}

// Get current user with tenant context
export async function getCurrentUserWithContext() {
  const user = await getCurrentUser();
  const session = await fetchAuthSession();

  const idToken = session.tokens?.idToken;

  return {
    userId: user.userId,
    email: user.signInDetails?.loginId,
    username: user.username,
    tenantId: idToken?.payload["custom:tenantId"] as string,
    role: idToken?.payload["custom:role"] as string,
    parentBusinessId: idToken?.payload["custom:parentBusinessId"] as
      | string
      | null,
  };
}

// Logout
export async function logout() {
  return await signOut();
}

// Forgot password
export async function forgotPassword(email: string) {
  return await resetPassword({ username: email });
}

// Reset password
export async function resetPasswordSubmit(
  email: string,
  code: string,
  newPassword: string
) {
  return await confirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword,
  });
}
```

### Auth Context Provider

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as auth from "../lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await auth.getCurrentUserWithContext();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await auth.login(email, password);
    await checkAuth();
  }

  async function logout() {
    await auth.logout();
    setUser(null);
  }

  async function register(data: RegisterData) {
    await auth.register(data);
    // User needs to verify email before login
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## API Gateway Configuration

### Cognito Authorizer

```typescript
// stacks/ApiStack.ts
import { StackContext, Api, use } from "sst/constructs";
import { AuthStack } from "./AuthStack";

export function ApiStack({ stack }: StackContext) {
  const { auth } = use(AuthStack);

  const api = new Api(stack, "Api", {
    authorizers: {
      jwt: {
        type: "user_pool",
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId],
        },
      },
    },
    defaults: {
      authorizer: "jwt", // Protect all routes by default
    },
    routes: {
      // Public routes (no auth required)
      "POST /auth/register": {
        function: "functions/auth/register.handler",
        authorizer: "none",
      },

      // Protected routes (JWT required)
      "GET /assessments": "functions/assessments/list.handler",
      "POST /assessments": "functions/assessments/create.handler",
      "GET /programs": "functions/programs/list.handler",
      "POST /business/invite": "functions/business/invite-user.handler",
    },
  });

  return { api };
}
```

## Common Issues & Solutions

### Issue: Custom Attributes Not in JWT

**Symptom**: `custom:tenantId` is undefined

**Solutions**:

1. Check custom attributes are marked "readable" in Cognito console
2. Verify attributes were set during user creation
3. Use correct claim format: `claims['custom:tenantId']` not `claims.tenantId`
4. Decode JWT at jwt.io to inspect actual claims

**Debug**:

```typescript
// Log full claims object
console.log(
  JSON.stringify(event.requestContext.authorizer.jwt.claims, null, 2)
);
```

### Issue: User Registration Fails

**Symptom**: SignUpCommand throws error

**Common Causes**:

1. Password doesn't meet policy requirements
2. Email already exists
3. Custom attribute mismatch

**Debug**:

```typescript
try {
  await cognito.send(new SignUpCommand({...}));
} catch (error) {
  console.error('Cognito Error:', error.name, error.message);
  // Check error.name: UsernameExistsException, InvalidPasswordException, etc.
}
```

### Issue: Invited Users Can't Login

**Symptom**: User receives temp password but can't login

**Solutions**:

1. Ensure `email_verified` set to "true" during AdminCreateUser
2. Check user received temp password email
3. User must change password on first login

## Security Best Practices

### Token Handling

- ✅ Store tokens in memory (React state)
- ✅ Use HttpOnly cookies if possible (requires custom implementation)
- ✅ Never store tokens in localStorage (XSS risk)
- ✅ Implement token refresh before expiry
- ✅ Clear tokens on logout

### Password Policy

- ✅ Minimum 8 characters
- ✅ Require uppercase, lowercase, digits, symbols
- ✅ Enforce via Cognito (automatic)
- ✅ No password reuse (Cognito tracks 24 previous passwords)

### Rate Limiting

- ✅ Cognito has built-in brute force protection
- ✅ Add WAF rules for additional API protection
- ✅ Monitor failed login attempts via CloudWatch

### Session Management

- ✅ Access tokens: 15 minutes (short-lived)
- ✅ Refresh tokens: 7 days (long-lived)
- ✅ Automatic refresh before expiry
- ✅ Revoke refresh tokens on suspicious activity (future)

## Testing Authentication

### Unit Tests

```typescript
describe("extractTenantContext", () => {
  it("extracts tenant context from JWT claims", () => {
    const mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: "user-123",
              "custom:tenantId": "tenant-456",
              "custom:role": "business_owner",
            },
          },
        },
      },
    };

    const context = extractTenantContext(mockEvent);

    expect(context.userId).toBe("user-123");
    expect(context.tenantId).toBe("tenant-456");
    expect(context.role).toBe("business_owner");
  });
});
```

### Integration Tests

```typescript
describe('User Registration', () => {
  it('creates user with unique tenantId', async () => {
    const user1 = await registerUser({ email: 'user1@test.com', ... });
    const user2 = await registerUser({ email: 'user2@test.com', ... });

    expect(user1.tenantId).not.toBe(user2.tenantId);
  });

  it('business sub-users share parent tenantId', async () => {
    const owner = await registerBusinessOwner({ email: 'owner@test.com', ... });
    const subUser = await inviteBusinessUser(owner, { email: 'sub@test.com', ... });

    expect(subUser.tenantId).toBe(owner.tenantId);
    expect(subUser.parentBusinessId).toBe(owner.id);
  });
});
```

## Future Enhancements (Phase 2+)

### Multi-Factor Authentication (MFA)

- Enable SMS or TOTP in Cognito
- Required for business owner accounts
- Optional for individual users

### Single Sign-On (SSO)

- Configure SAML/OIDC identity providers
- Enterprise customer requirement
- Google, Microsoft, Okta integration

### Social Login

- Add Google, Apple sign-in
- Simpler onboarding for individual users
- Maps to same multi-tenant structure

### Advanced Session Management

- Track active sessions in DynamoDB
- "Logout from all devices" feature
- Session analytics for compliance
