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

**Phase 1 (Sprint 1-2 - Current):**

1. ✅ **Admin creates business**: API endpoint creates tenant → customer (FFP-112)
2. ✅ **Admin invites owner**: API endpoint creates owner user with Cognito (FFP-37)
3. ✅ **Business owner logs in**: POST /auth/login with temporary password (FFP-38)
4. ✅ **Password change required**: POST /auth/complete-new-password (FFP-38)
5. ✅ **Business invites users**: Owner uses "Invite User" feature (AdminCreateUserCommand)
6. ✅ **Invited users log in**: Receive temporary password, change on first login
7. ✅ **Token refresh**: Standard JWT refresh flow

**Phase 2 (Post-MVP with Billing):**

1. 🔄 **Business self-registration**: Public registration endpoint with Cognito SignUpCommand
2. 🔄 **Stripe integration**: Automated billing, subscriptions, trials
3. 🔄 **Payment management**: Handle failed payments, dunning, subscription changes
4. 🔄 **Usage limits**: Enforce tier limits based on subscription

### MVP Onboarding Process

**System Administrator Workflow (Two-Step Process):**

**Step 1: Create customer account (Postman)**

Note: "customer" represents a business/care home organisation in the system.

```http
POST {{apiUrl}}/admin/create-customer
Authorization: Bearer {{superAdminJwt}}
Content-Type: application/json

{
  "customerName": "ABC Physiotherapy"
}
```

**Response:**

```json
{
  "tenantId": "uuid-1",
  "customerId": "uuid-2",
  "message": "Business account created. Use /auth/invite-user to create owner."
}
```

---

**Step 2: Invite business owner (Postman)**

```http
POST {{apiUrl}}/auth/invite-user
Authorization: Bearer {{superAdminJwt}}
Content-Type: application/json

{
  "tenantId": "uuid-1",
  "customerId": "uuid-2",
  "email": "owner@abcphysio.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "customer_owner"
}
```

**Response:**

```json
{
  "message": "User invited successfully. They will receive an email with temporary password.",
  "userId": "uuid-3"
}
```

**Created:**

- Cognito user with temporary password (sent via email)
- User record in database (linked to tenant and customer)

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
  "custom:tenantId": "tenant-uuid", // Tier 1: Isolation boundary
  "custom:customerId": "customer-uuid", // Tier 2: Business entity
  "custom:role": "customer_owner" // User role within customer
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

JWT claims flow through the layered architecture from handler to service to repository. The system supports both **user-triggered requests** (from API Gateway with JWT) and **system-triggered requests** (from job queues, scheduled tasks).

#### Actor-Based Context

```typescript
// packages/core/lib/context.ts - Enhanced tenant context extraction

import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';

// Actor types: User or System
export interface UserActor {
  type: 'user';
  userId: string;
  userRole: string;
  email: string;
}

export interface SystemActor {
  type: 'system';
  systemId: string; // e.g., 'assessment-processor', 'daily-report-job'
  triggeredBy?: string; // Original user ID if user-triggered
  jobId?: string; // Queue job ID for traceability
}

export type Actor = UserActor | SystemActor;

// Enhanced tenant context (supports both user and system actors)
export interface TenantContext {
  actor: Actor;
  tenantId: string;
  customerId: string | null;
  requestId: string;
  timestamp: Date;
  settings?: PlatformSettings;
  enabledModules?: string[];
}
```

#### User Request Flow

**Handler Layer** (extracts context and passes to service):

```typescript
// packages/functions/assessments/get-assessment.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractUserContext } from '@ffp/core/lib/context';
import { getAssessmentService } from '@ffp/core/assessments/assessment.service';
import { withErrorHandling } from '@ffp/core/lib/errors';

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  // Extract user context from JWT
  const context = extractUserContext(event);

  // Get assessment ID from path
  const assessmentId = event.pathParameters?.id;

  // Call service (passes context down)
  const assessment = await getAssessmentService(assessmentId, context);

  return {
    statusCode: 200,
    body: JSON.stringify(assessment),
  };
});
```

**Service Layer** (receives context and passes to repository):

```typescript
// packages/core/assessments/assessment.service.ts
import { assessmentRepository } from './assessment.repository';
import { TenantContext } from '../lib/context';
import { NotFoundError } from '../lib/errors';

export const getAssessmentService = async (assessmentId: string, context: TenantContext) => {
  // Call repository with tenant context
  const assessment = await assessmentRepository.findById(assessmentId, context);

  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  // Could add business logic here if needed
  return assessment;
};
```

**Repository Layer** (uses context to set RLS):

```typescript
// packages/core/assessments/assessment.repository.ts
import { db } from '@ffp/database';
import { assessments } from '@ffp/database/schema/assessments';
import { eq } from 'drizzle-orm';
import { setRLSContext } from '@ffp/database/lib/rls';
import { TenantContext } from '../lib/context';

export const assessmentRepository = {
  async findById(id: string, context: TenantContext): Promise<Assessment | null> {
    return await db.transaction(async (tx) => {
      // Set RLS context for tenant isolation
      await setRLSContext(tx, context.tenantId);

      return await tx.query.assessments.findFirst({
        where: eq(assessments.id, id),
        // RLS ensures only assessments from this tenant are returned
      });
    });
  },
};
```

#### System Request Flow (Jobs & Scheduled Tasks)

**Job Worker** (processes background jobs):

```typescript
// packages/functions/jobs/process-assessment.ts
import { SQSEvent } from 'aws-lambda';
import { extractJobContext } from '@ffp/core/lib/context';
import { processAssessmentService } from '@ffp/core/assessments/assessment.service';
import { withErrorHandling } from '@ffp/core/lib/errors';

export const handler = withErrorHandling(async (event: SQSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    // Extract system context from job message
    const context = extractJobContext({
      tenantId: message.tenantId,
      customerId: message.customerId,
      userId: message.userId, // Original user who triggered this
      jobId: record.messageId,
      jobType: 'assessment-processor',
    });

    // Call service with system context
    await processAssessmentService(message.assessmentId, context);
  }
});
```

**Scheduled Task** (runs on schedule):

```typescript
// packages/functions/scheduled/daily-report.ts
import { ScheduledEvent } from 'aws-lambda';
import { createSystemContext } from '@ffp/core/lib/context';
import { generateDailyReportService } from '@ffp/core/reports/report.service';

export const handler = async (event: ScheduledEvent) => {
  // Get all active tenants
  const tenants = await getTenantRepository().findAllActive();

  for (const tenant of tenants) {
    // Create system context for each tenant
    const context = createSystemContext({
      systemId: 'daily-report-job',
      tenantId: tenant.id,
      customerId: null, // Report spans all customers
    });

    // Generate report with system context
    await generateDailyReportService(context);
  }
};
```

**Key Points**:

- **User requests**: Extract context from JWT using `extractUserContext()`
- **Job workers**: Extract context from message using `extractJobContext()`
- **Scheduled tasks**: Create context explicitly using `createSystemContext()`
- Context flows down through layers identically (Handler/Worker → Service → Repository)
- Repository uses context.tenantId to set RLS (works for both user and system actors)
- Audit logging uses `actor` field for traceability (user vs system)
- System jobs retain original user ID via `triggeredBy` when applicable

## User Management Flows (MVP)

### Invite User Lambda Function

**Purpose:** Business owners invite staff/clients after their account is created.

**Implementation:** `packages/functions/src/auth/invite-user.ts` and `packages/core/src/auth/invite-user.service.ts`

**Flow:**

1. **Handler** extracts JWT context and validates user role (customer_owner only)
2. **Service** validates input with Zod schema, checks for existing email
3. **Cognito** creates user with temporary password (sent via email)
4. **Database** persists user record with tenant/customer linkage
5. **Rollback** deletes Cognito user if database insert fails (critical for data consistency)

**Architecture:** Demonstrates full layered architecture (Handler → Service → Repository + External Service)

**Key Features:**

- Requires JWT authentication (customer_owner role)
- Multi-tenant isolation via RLS
- Cognito-to-database rollback pattern
- Custom attributes set (tenantId, customerId, role)
- Temporary password sent via email

See implementation files for current code.

### Login & Password Management

**Purpose:** Public endpoints for user authentication and temporary password flow.

**Implementation:**

- `packages/functions/src/auth/login.ts` - Login Lambda handler
- `packages/functions/src/auth/complete-new-password.ts` - Complete new password Lambda handler
- `packages/core/src/auth/login.service.ts` - Login service
- `packages/core/src/auth/complete-new-password.service.ts` - Password change service

These endpoints are **public** (no JWT required) as users cannot have a token before logging in.

**Login Flow (POST /auth/login):**

1. **Handler** validates request with Zod schema (email format, password presence)
2. **Service** calls CognitoService.login() with USER_PASSWORD_AUTH flow
3. **Challenge Response**: If temporary password, returns NEW_PASSWORD_REQUIRED challenge with session token
4. **Success Response**: If permanent password, returns JWT tokens (accessToken, idToken, refreshToken)

**Complete New Password Flow (POST /auth/complete-new-password):**

1. **Handler** validates session token, email, and new password strength
2. **Service** calls CognitoService.completeNewPassword() with RespondToAuthChallengeCommand
3. **Success Response**: Returns JWT tokens immediately (no second login needed)

**Architecture:** Demonstrates handler → service → external service pattern for public endpoints

**Password Requirements:**

- Minimum 8 characters with uppercase, lowercase, digit, and special character

**Error Responses:**

- `401 Unauthorised`: Invalid credentials or expired session
- `400 Validation Error`: Invalid email format or weak password

**Key Features:**

- Public endpoints (no JWT required at API Gateway level)
- Session tokens expire after ~3 minutes (security best practice)
- Proper validation without non-null assertions (ESLint compliant)
- Clear error messages without exposing sensitive information
- Tokens returned immediately after password change

See implementation files for current code.

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

### Manual Testing Guide

Test the complete authentication flow using Postman.

#### Test 1: Temporary Password Flow (New Users)

**1. Create a test user:**

```http
POST /auth/invite-user
Authorization: Bearer {{jwtToken}}

{
  "email": "test.user@example.com",
  "firstName": "Test",
  "lastName": "User",
  "role": "customer_admin"
}
```

**2. Login with temporary password:**

```http
POST /auth/login

{
  "email": "test.user@example.com",
  "password": "TempPass123!"  # From email
}
```

**Expected:** NEW_PASSWORD_REQUIRED challenge with session token

**3. Complete password change:**

```http
POST /auth/complete-new-password

{
  "session": "{{passwordChallengeSession}}",  # Auto-populated by Postman
  "email": "test.user@example.com",
  "newPassword": "NewSecure123!"
}
```

**Expected:** JWT tokens returned, user can now access protected endpoints

**4. Verify JWT claims:**

- Copy `idToken` from response
- Decode at https://jwt.io
- Verify `custom:tenantId`, `custom:customerId`, `custom:role` present

#### Test 2: Regular Login (Existing Users)

**1. Login with permanent password:**

```http
POST /auth/login

{
  "email": "test.user@example.com",
  "password": "NewSecure123!"
}
```

**Expected:** JWT tokens returned immediately (no challenge)

**2. Test protected endpoint:**
Use returned token to access `/auth/invite-user` or other protected endpoints

#### Test 3: Error Scenarios

**Invalid credentials:**

```http
POST /auth/login
{ "email": "test.user@example.com", "password": "WrongPass" }
```

**Expected:** 401 Unauthorised

**Invalid email format:**

```http
POST /auth/login
{ "email": "not-an-email", "password": "Pass123!" }
```

**Expected:** 400 Validation Error

**Weak password:**

```http
POST /auth/complete-new-password
{ "session": "valid-session", "email": "test@example.com", "newPassword": "weak" }
```

**Expected:** 400 Validation Error (minimum 8 chars, uppercase, lowercase, digit, special char)

**Expired session:**
Wait 5 minutes and retry complete-new-password with old session
**Expected:** 401 Unauthorised (sessions expire after ~3 minutes)

#### Quick Checklist

After running all tests:

- [ ] Temporary password login returns NEW_PASSWORD_REQUIRED challenge
- [ ] Session token saved to Postman `passwordChallengeSession` variable
- [ ] Complete-new-password returns JWT tokens
- [ ] JWT tokens contain custom claims (tenantId, customerId, role)
- [ ] Regular login works after password changed
- [ ] Invalid credentials return 401
- [ ] Invalid email format returns 400
- [ ] Weak password returns 400
- [ ] Expired session returns 401

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
