# FFP - Authentication Documentation

## Overview

AWS Cognito for authentication with custom JWT attributes supporting multi-tenant architecture. Handles user invitation, login, password management, and token generation.

## MVP Strategy (Phase 1)

**No public self-registration.** Businesses are manually onboarded by the system administrator.

**Rationale:** Self-registration requires Stripe billing integration (subscriptions, payment failures, dunning) which is out of scope. Manual onboarding enables business validation and pricing flexibility during pilot phase with 5-10 businesses.

## Implemented Authentication Flows

### Admin Onboarding (Two-Step)

1. **Create organisation** — `POST /admin/organisations` (system admin only) → creates organisation + location
2. **Invite business owner** — `POST /auth/invite-user` (system admin) → creates Cognito user + DB record, sends temporary password email

### User Invitation

Business owners invite staff/clients via `POST /auth/invite-user` (requires `customer_owner` role).

**Flow:** Handler validates JWT role → Service validates input (Zod) + checks duplicate email → Cognito AdminCreateUser (temporary password) → DB insert → Rollback Cognito user if DB fails

**Implementation:** `packages/functions/src/auth/invite-user.ts` → `packages/core/src/auth/invite-user.service.ts`

### Login & Password Change

Both are **public endpoints** (no JWT required).

**Login** (`POST /auth/login`):

- Validates email/password via Cognito `InitiateAuthCommand` (USER_PASSWORD_AUTH)
- Temporary password → returns `NEW_PASSWORD_REQUIRED` challenge with session token
- Permanent password → returns JWT tokens (access, id, refresh)

**Complete New Password** (`POST /auth/complete-new-password`):

- Takes session token + new password
- Calls Cognito `RespondToAuthChallengeCommand`
- Returns JWT tokens immediately (no second login needed)
- Session tokens expire after ~3 minutes

**Implementation:** `packages/functions/src/auth/login.ts`, `packages/core/src/auth/login.service.ts`, `packages/functions/src/auth/complete-new-password.ts`, `packages/core/src/auth/complete-new-password.service.ts`

## JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "user@business.com",
  "custom:tenantId": "org-uuid",
  "custom:customerId": "location-uuid",
  "custom:role": "customer_owner"
}
```

**Note**: Cognito attributes retain their original names (`custom:tenantId`, `custom:customerId`) as they are immutable. In application code, these map to `organisationId` and `locationId` respectively.

**Access claims with `custom:` prefix** — `claims['custom:tenantId']` (maps to organisationId), not `claims.tenantId`.

## Actor-Based Context

The system supports both user-triggered and system-triggered requests, unified through a common context interface.

| Source            | Extraction                    | Actor Type                            |
| ----------------- | ----------------------------- | ------------------------------------- |
| API Gateway (JWT) | `extractUserContext(event)`   | `UserActor` (userId, role, email)     |
| Job queue (SQS)   | `extractJobContext(message)`  | `SystemActor` (systemId, triggeredBy) |
| Scheduled tasks   | `createSystemContext(config)` | `SystemActor` (systemId)              |

Context flows identically through all layers: **Handler/Worker → Service → Repository**. Repository uses `context.organisationId` to set RLS regardless of actor type.

**Implementation:** `packages/core/src/lib/context.ts` (types + extraction functions, ~60 unit tests)

## Three-Tier Architecture

- **Tier 1 (Organisation)**: Top-level RLS isolation boundary
- **Tier 2 (Location)**: Business entity within organisation (billing level)
- **Tier 3 (User)**: Individual user, linked to location and organisation

## Token Management

| Token         | Lifetime   | Purpose                  |
| ------------- | ---------- | ------------------------ |
| Access token  | 60 minutes | API authorisation        |
| ID token      | 60 minutes | User identity claims     |
| Refresh token | 30 days    | Obtain new access tokens |

Lifetimes are set on the web app client in `sst.config.ts` (`accessTokenValidity`, `idTokenValidity`, `refreshTokenValidity`) and match the deployed dev client (`aws cognito-idp describe-user-pool-client`, read 2026-09-30). Token revocation is enabled on the client, so `signOut()` revokes the refresh token: signing out ends the session for good, not just in that tab.

**Where the tokens live:** Amplify v6 keeps the tokens in `window.localStorage` by default, and FFP does not override that (`packages/web/src/lib/auth.ts`). The keys are `CognitoIdentityServiceProvider.<clientId>.<username>.{idToken,accessToken,refreshToken,clockDrift,signInDetails}` plus one `CognitoIdentityServiceProvider.<clientId>.LastAuthUser` pointer, so an origin holds **one signed-in user at a time**. The trade-off: any script running on the page (an XSS flaw) can read the 30-day refresh token, so preventing XSS (React's escaping, no unsanitised `dangerouslySetInnerHTML`, a Content Security Policy) is what protects the session; revocation on sign-out limits how long a stolen token stays useful. Sources: `@aws-amplify/auth` 6.17.0 `providers/cognito/tokenProvider/tokenProvider.ts` (`defaultStorage`) and `TokenStore.ts`; Amplify docs, "Manage user sessions" (https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/manage-user-sessions/).

**Refresh:** `getCurrentUser()` and `fetchAuthSession()` refresh expired tokens with the refresh token. If the refresh fails with a definitive auth error (`NotAuthorizedException`, `TokenRevokedException`, `UserNotFoundException` and similar), Amplify clears the tokens; for any other failure (network, service, throttling) it keeps them and re-throws (`TokenOrchestrator.handleErrors`). `AuthContext` mirrors that split (`contexts/auth/auth-retry.ts`): only those definitive names, or no stored session, count as signed out. Any other failure is retried once, then shows a "can't reach the sign-in service" retry state instead of redirecting to sign in.

## Password Policy

Enforced by Cognito: minimum 8 characters, uppercase, lowercase, digit, special character. No reuse (24 previous passwords tracked).

## Common Issues

**`custom:tenantId` is undefined (maps to organisationId):**

- Ensure custom attributes marked "readable" in Cognito console
- Verify attributes were set during AdminCreateUser
- Use `claims['custom:tenantId']` not `claims.tenantId` — the Cognito attribute name is immutable

**Invited users can't login:**

- Ensure `email_verified` set to `"true"` during AdminCreateUser
- User must change temporary password on first login

---

_Self-service registration (Phase 2) requires Stripe billing integration. See Jira backlog for future auth enhancements (FFP-258). Frontend AuthContext provider is implemented in `packages/web/src/contexts/AuthContext.tsx`._
