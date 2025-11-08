# Development Authentication Guide

Quick reference for obtaining JWT tokens during Phase 1 development.

## Prerequisites

```bash
# Set environment variables
export CLIENT_ID="<your-cognito-client-id>"
export SUPER_ADMIN_EMAIL="<your-email>"
```

## First-Time Login (Temporary Password)

After running the bootstrap admin script, you'll receive a temporary password via email.

### Step 1: Initial Authentication

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $CLIENT_ID \
  --auth-parameters USERNAME=$SUPER_ADMIN_EMAIL,PASSWORD=<temporary-password> \
  --region eu-west-2
```

This returns a `NEW_PASSWORD_REQUIRED` challenge with a session token.

### Step 2: Set Permanent Password

```bash
aws cognito-idp respond-to-auth-challenge \
  --client-id $CLIENT_ID \
  --challenge-name NEW_PASSWORD_REQUIRED \
  --session "<session-token-from-step-1>" \
  --challenge-responses USERNAME=$SUPER_ADMIN_EMAIL,NEW_PASSWORD="<your-new-password>" \
  --region eu-west-2
```

**Password requirements**: Min 8 chars, uppercase, lowercase, number, symbol

This returns JWT tokens in `AuthenticationResult`.

## Subsequent Logins

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $CLIENT_ID \
  --auth-parameters USERNAME=$SUPER_ADMIN_EMAIL,PASSWORD=<your-password> \
  --region eu-west-2
```

Returns tokens immediately in `AuthenticationResult`.

## Using JWT Tokens

Extract the `IdToken` from the response (contains custom claims: `tenantId`, `role`).

### Environment Variable

```bash
export JWT_TOKEN="<paste-IdToken-here>"
```

### cURL

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://your-api-url/admin/create-customer
```

### Postman

1. Authorization tab → Type: Bearer Token
2. Token: `<paste-IdToken-here>`

## Token Expiry

- **Access Token**: 60 minutes
- **ID Token**: 60 minutes
- **Refresh Token**: 30 days

Use the `RefreshToken` to obtain new tokens without re-authenticating.

## Notes

- USER_PASSWORD_AUTH is **temporary** for Phase 1 development (see FFP-113)
- Production will use OAuth Authorization Code flow with hosted UI
- Tokens contain: `custom:tenantId`, `custom:role`, `custom:customerId`
