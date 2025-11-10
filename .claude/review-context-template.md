# Review Context

**Branch**: feature/your-branch-name
**Related Ticket**: FFP-XX
**Parent Branch**: main

## Goals

What is this branch trying to achieve? List 2-3 high-level objectives.

- Goal 1: e.g., Implement Cognito user pool authentication
- Goal 2: e.g., Add JWT claim extraction with custom attributes
- Goal 3: e.g., Set up RLS context from tenant claims

## Requirements

What must this implementation satisfy? Include functional and non-functional requirements.

- Must extract tenantId from `custom:tenantId` claim
- Must validate JWT on every request
- Must integrate with existing user domain
- Must maintain multi-tenant isolation
- Must follow British English spelling

## Changes Made

What files were created/modified and why? Provide a brief summary of each change.

- Created `packages/core/src/lib/cognito.ts` - Cognito service wrapper for JWT validation
- Updated `packages/core/src/lib/context.ts` - Added extractUserContext() to extract claims
- Modified `packages/functions/src/users/*.ts` - Updated handlers to use new auth flow
- Added tests in `packages/core/src/lib/cognito.test.ts` - JWT extraction edge cases

## Areas to Focus

What should the reviewer pay special attention to? Guide them to critical areas.

- **Security**: JWT validation and claim extraction logic
- **Multi-tenant**: Ensure tenantId properly propagated to RLS context
- **Error handling**: Proper error types for auth failures (UnauthorisedError vs ForbiddenError)
- **Type safety**: No `any` types, all claims properly typed

## Known Limitations / Trade-offs

What's intentionally not included or deferred? Explain decisions to prevent false flags.

- Phase 1: No token refresh logic (deferred to FFP-30 in Phase 2)
- Using environment variables for Cognito config (will move to AWS Parameter Store in Phase 2)
- Basic error messages (will add i18n in Phase 3)

## Testing Notes

What testing has been done? What still needs testing?

- ✓ Unit tests cover claim extraction edge cases
- ✓ Unit tests cover missing/invalid claims
- ⏳ Integration tests with API Gateway pending (FFP-25 subtask)
- ⏳ E2E tests with real Cognito pending (Phase 2)

## Questions for Reviewer

Any specific feedback you're looking for?

- Is the error handling approach appropriate?
- Should we add more defensive checks in claim extraction?
- Any security concerns with current implementation?

---

**Usage**: Copy this template to `.claude/review-context.md` and fill it out before requesting a code review.
