# FFP - Authentication Documentation

## Overview

FFP uses AWS Cognito for authentication with custom attributes to support multi-tenant architecture. Cognito handles user registration, login, password management, and JWT token generation.

## MVP Authentication Strategy (Phase 1)

### Admin-Only Business Onboarding

**Decision:** For MVP, FFP will NOT have public self-registration. Businesses will be manually onboarded by the system administrator.

**Rationale:**

1. **Billing Complexity**: Self-registration requires automated billing (Stripe integration, subscription management, payment failures, dunning), which is out of scope for Sprint 1
2. **Business Validation**: Manual vetting ensures we onboard legitimate businesses, not individuals misrepresenting themselves
3. **Product Validation**: Pilot phase with 5-10 manually managed businesses validates product-market fit before scaling
4. **Manual Invoicing**: Manageable at small scale, allows pricing flexibility during validation phase
5. **Reduced Risk**: No payment processing failures, disputes, or fraud concerns during initial launch

### MVP Authentication Flows

**Phase 1 (Sprint 1 - Current):**
1. ✅ **Admin creates business**: CLI script creates tenant → customer → owner user
2. ✅ **Business owner logs in**: Receives temporary password via email, forced to change on first login
3. ✅ **Business invites users**: Owner uses "Invite User" feature (AdminCreateUserCommand)
4. ✅ **Invited users log in**: Receive temporary password, forced to change on first login
5. ✅ **Token refresh**: Standard JWT refresh flow

**Phase 2 (Post-MVP with Billing):**
1. 🔄 **Business self-registration**: Public registration endpoint with Cognito SignUpCommand
2. 🔄 **Stripe integration**: Automated billing, subscriptions, trials
3. 🔄 **Payment management**: Handle failed payments, dunning, subscription changes
4. 🔄 **Usage limits**: Enforce tier limits based on subscription

### MVP Onboarding Process

**System Administrator Workflow:**

```bash
# Step 1: Admin creates business account manually
npm run admin:create-business \
  --name="ABC Physiotherapy" \
  --ownerEmail="owner@abcphysio.com" \
  --ownerFirstName="Jane" \
  --ownerLastName="Smith"

# Creates:
# - Tenant record (tenant_id: UUID, type: 'customer')
# - Customer record (customer_id: UUID, tenant_id: UUID, name: 'ABC Physiotherapy')
# - User record (user_id: UUID, tenant_id: UUID, customer_id: UUID, role: 'customer_owner')
# - Cognito user with temporary password (sent via email)
```

**Business Owner Workflow:**
1. Receives email: "Your FFP account is ready - check email for temporary password"
2. Logs in with temporary password
3. Forced to set permanent password
4. Can now invite staff/clients via "Invite User" feature
5. System administrator invoices monthly/quarterly manually

**Invited User Workflow:**
1. Business owner invites user via web portal
2. User receives email with temporary password
3. Logs in, forced to change password
4. Can now access FFP features based on role

### Three-Tier Architecture Support

All authentication flows support the three-tier architecture:

- **Tier 1 (Tenant)**: Top-level isolation boundary, unique per business
- **Tier 2 (Customer)**: Business entity, can have multiple users
- **Tier 3 (Users)**: Individual users, linked to customer and tenant

**JWT Claims:**
```json
{
  "sub": "user-uuid",
  "email": "user@business.com",
  "custom:tenantId": "tenant-uuid",      // Tier 1: Isolation boundary
  "custom:customerId": "customer-uuid",   // Tier 2: Business entity
  "custom:role": "customer_owner"         // User role within customer
}
```

### Future: Self-Service Registration (Phase 2)

**New Epic Required:** Self-Service Business Registration (~20-25 hours)

**Components:**
- Business registration endpoint (POST /auth/register)
- Stripe subscription integration
- Trial period management (14-30 days)
- Payment failure handling and dunning
- Usage limits enforcement
- Automated invoicing
- Subscription tier management

**Prerequisites:**
- ✅ Validated pricing model (from pilot phase)
- ✅ Confirmed product-market fit
- ✅ Support processes established
- ✅ Billing infrastructure ready

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
import { StackContext, Cognito } from 'sst/constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Duration } from 'aws-cdk-lib';

export function AuthStack({ stack }: StackContext) {
  const auth = new Cognito(stack, 'Auth', {
    login: ['email'],
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
          customerId: new cognito.StringAttribute({
            mutable: true, // For users under customer organisations
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
  "custom:role": "customer_owner",
  "custom:customerId": null,
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Accessing JWT Claims in Lambda

```typescript
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  // JWT claims automatically available via API Gateway authorizer
  const claims = event.requestContext.authorizer.jwt.claims;

  // Extract tenant context
  const tenantContext = {
    userId: claims.sub as string,
    tenantId: claims['custom:tenantId'] as string,
    role: claims['custom:role'] as string,
    email: claims.email as string,
    customerId: claims['custom:customerId'] as string | null,
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

## User Management Flows (MVP)

### Admin CLI: Create Business Account

**Purpose:** System administrator manually creates business accounts during pilot phase.

```typescript
// packages/functions/src/admin/create-business.ts
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomUUID } from 'crypto';
import { db } from '@ffp/database';
import { tenants, customers, users } from '@ffp/database/schema';
import { withRLS } from '@ffp/database/lib/rls';

const cognito = new CognitoIdentityProviderClient({ region: 'eu-west-2' });

interface CreateBusinessInput {
  businessName: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
}

export async function createBusiness(input: CreateBusinessInput) {
  // Generate UUIDs for three-tier architecture
  const tenantId = randomUUID();
  const customerId = randomUUID();

  // Step 1: Create Cognito user with temporary password
  const cognitoResult = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: input.ownerEmail,
      UserAttributes: [
        { Name: 'email', Value: input.ownerEmail },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: input.ownerFirstName },
        { Name: 'family_name', Value: input.ownerLastName },
        { Name: 'custom:tenantId', Value: tenantId },
        { Name: 'custom:customerId', Value: customerId },
        { Name: 'custom:role', Value: 'customer_owner' },
      ],
      DesiredDeliveryMediums: ['EMAIL'], // Sends temp password via email
      TemporaryPassword: generateSecurePassword(), // Custom function
    })
  );

  const userId = cognitoResult.User!.Username!;

  // Step 2: Create database records in transaction with RLS
  await withRLS(tenantId, userId, async (tx) => {
    // Create tenant
    await tx.insert(tenants).values({
      id: tenantId,
      type: 'customer',
      name: input.businessName,
    });

    // Create customer
    await tx.insert(customers).values({
      id: customerId,
      tenantId: tenantId,
      name: input.businessName,
      status: 'active',
    });

    // Create owner user
    await tx.insert(users).values({
      id: userId,
      tenantId: tenantId,
      customerId: customerId,
      email: input.ownerEmail,
      cognitoSub: userId,
      firstName: input.ownerFirstName,
      lastName: input.ownerLastName,
      role: 'customer_owner',
      status: 'active',
    });
  });

  return {
    tenantId,
    customerId,
    userId,
    message: 'Business created successfully. Owner will receive email with temporary password.',
  };
}

// Helper: Generate secure temporary password
function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
```

**CLI Wrapper:**

```bash
# packages/functions/scripts/create-business.sh
#!/bin/bash

# Usage: npm run admin:create-business -- --name="ABC Physio" --email="owner@abc.com" --firstName="Jane" --lastName="Smith"

ts-node packages/functions/src/admin/create-business.ts \
  --name="${BUSINESS_NAME}" \
  --email="${OWNER_EMAIL}" \
  --firstName="${OWNER_FIRST_NAME}" \
  --lastName="${OWNER_LAST_NAME}"
```

### Invite User Lambda Function

**Purpose:** Business owners invite staff/clients after their account is created.

```typescript
// packages/functions/src/auth/invite-user.ts
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import { db } from '@ffp/database';
import { users } from '@ffp/database/schema';
import { withRLS } from '@ffp/database/lib/rls';
import { extractTenantContext } from '@ffp/core/lib/tenant-context';

const cognito = new CognitoIdentityProviderClient({ region: 'eu-west-2' });

const InviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['customer_admin', 'customer_user']),
});

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  // Extract tenant context from JWT
  const context = extractTenantContext(event);

  // Only customer owners can invite users
  if (context.role !== 'customer_owner') {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'FORBIDDEN',
        message: 'Only business owners can invite users'
      }),
    };
  }

  const body = InviteUserSchema.parse(JSON.parse(event.body || '{}'));

  // Create user in Cognito with temporary password
  const cognitoResult = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: body.email,
      UserAttributes: [
        { Name: 'email', Value: body.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: body.firstName },
        { Name: 'family_name', Value: body.lastName },
        { Name: 'custom:tenantId', Value: context.tenantId },
        { Name: 'custom:customerId', Value: context.customerId! },
        { Name: 'custom:role', Value: body.role },
      ],
      DesiredDeliveryMediums: ['EMAIL'], // Sends temp password via email
    })
  );

  const newUserId = cognitoResult.User!.Username!;

  // Store user in database with RLS context
  await withRLS(context.tenantId, context.userId, async (tx) => {
    await tx.insert(users).values({
      id: newUserId,
      tenantId: context.tenantId,
      customerId: context.customerId!,
      email: body.email,
      cognitoSub: newUserId,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      status: 'active',
    });
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User invited successfully. They will receive an email with temporary password.',
      userId: newUserId,
    }),
  };
};
```

### Future: Self-Service Business Registration (Phase 2)

_Deferred to Phase 2 with billing integration. See "MVP Authentication Strategy" section above._

**When implemented, will use:**

```typescript
// packages/functions/src/auth/register.ts (FUTURE - Phase 2)
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

// Self-registration with Stripe subscription
// - Business signs up via public form
// - Creates tenant + customer + owner user
// - Initiates Stripe trial period
// - Requires billing integration
```

## Frontend Integration

### Setup Amplify Auth

```typescript
// lib/auth.ts
import { Amplify } from 'aws-amplify';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
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
    tenantId: idToken?.payload['custom:tenantId'] as string,
    role: idToken?.payload['custom:role'] as string,
    customerId: idToken?.payload['custom:customerId'] as string | null,
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
export async function resetPasswordSubmit(email: string, code: string, newPassword: string) {
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
import { StackContext, Api, use } from 'sst/constructs';
import { AuthStack } from './AuthStack';

export function ApiStack({ stack }: StackContext) {
  const { auth } = use(AuthStack);

  const api = new Api(stack, 'Api', {
    authorizers: {
      jwt: {
        type: 'user_pool',
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId],
        },
      },
    },
    defaults: {
      authorizer: 'jwt', // Protect all routes by default
    },
    routes: {
      // Public routes (no auth required)
      'POST /auth/register': {
        function: 'functions/auth/register.handler',
        authorizer: 'none',
      },

      // Protected routes (JWT required)
      'GET /assessments': 'functions/assessments/list.handler',
      'POST /assessments': 'functions/assessments/create.handler',
      'GET /programs': 'functions/programs/list.handler',
      'POST /business/invite': 'functions/business/invite-user.handler',
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
console.log(JSON.stringify(event.requestContext.authorizer.jwt.claims, null, 2));
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
describe('extractTenantContext', () => {
  it('extracts tenant context from JWT claims', () => {
    const mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123',
              'custom:tenantId': 'tenant-456',
              'custom:role': 'business_owner',
            },
          },
        },
      },
    };

    const context = extractTenantContext(mockEvent);

    expect(context.userId).toBe('user-123');
    expect(context.tenantId).toBe('tenant-456');
    expect(context.role).toBe('business_owner');
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

  it('customer sub-users share parent tenantId', async () => {
    const owner = await registerCustomerOwner({ email: 'owner@test.com', ... });
    const subUser = await inviteCustomerUser(owner, { email: 'sub@test.com', ... });

    expect(subUser.tenantId).toBe(owner.tenantId);
    expect(subUser.customerId).toBe(owner.id);
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
