# User Story Standards

## Purpose

User Stories describe features from end-user perspective, delivering tangible value. Completable within 1 sprint (5-13 points).

**When to use:**

- Delivers user-facing value
- Completable in 1 sprint
- Has clear acceptance criteria
- Independently testable

---

## Required Fields

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Issue Type**   | Story (10004)                                            |
| **Summary**      | As a [user type], I want [action] so that [benefit]      |
| **Epic Link**    | Parent epic                                              |
| **Story Points** | 1, 2, 3, 5, 8, 13 (see story-points.md)                  |
| **Priority**     | Highest, High, Medium, Low                               |
| **Labels**       | `frontend`, `backend`, `database`, `security`, `testing` |
| **Sprint**       | Current sprint                                           |

---

## Description Template

```markdown
## User Story

As a [user type],  
I want [action/feature],  
So that [benefit/value].

## Background / Context

[Why is this needed? What problem does it solve?]

## Acceptance Criteria

**AC1: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

**AC2: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

**AC3: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

## Technical Notes

### Implementation Approach

[High-level technical approach]

### Database Changes

- [Schema changes if any]
- [Migrations required]

### API Endpoints

- `POST /api/endpoint` - Description
- `GET /api/endpoint/:id` - Description

### Security Considerations

- [RLS validation required]
- [Zod schema for validation]
- [Auth requirements]

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Test: [Description]
- [ ] Test: [Description]

### Integration Tests

- [ ] Test: Multi-tenant isolation verification

### E2E Tests

- [ ] Test: Critical user flow

## Dependencies

[List blockers or dependencies]

## Out of Scope

[What's NOT included to prevent scope creep]
```

---

## Acceptance Criteria Format

Use **Given-When-Then** for clarity:

```markdown
**AC1: User can successfully authenticate**  
Given a registered user with valid credentials,  
When they submit the login form,  
Then they receive a JWT token with tenant context and are redirected to dashboard.

**AC2: Invalid credentials show error**  
Given a user with invalid credentials,  
When they submit the login form,  
Then they see "Invalid email or password" error message.

**AC3: Multi-tenant isolation enforced**  
Given two users from different tenants,  
When User A queries their data,  
Then User A only sees their own tenant's data (verified by integration test).
```

---

## Examples

### Example 1: User Registration (5 points)

```markdown
**Summary**: As a new user, I want to register an account so that I can access FFP

**Epic Link**: SCRUM-EPIC-1 (Application Setup)
**Story Points**: 5
**Priority**: High
**Labels**: phase-1, frontend, backend, authentication

## User Story

As a new user,  
I want to register an account with email and password,  
So that I can access the FFP platform and start creating workout programs.

## Background / Context

First user-facing feature of FFP. Registration supports both individual users and business accounts, with each user assigned unique `tenantId` at registration.

## Acceptance Criteria

**AC1: Successful registration for individual user**  
Given a new user with valid email and password,  
When they submit the registration form,  
Then a Cognito user is created with custom attributes (`tenantId`, `role`="individual_user"), database record is created, and they receive verification email.

**AC2: Registration fails with invalid data**  
Given a user with invalid email or weak password,  
When they submit the registration form,  
Then they see validation error message and form is not submitted.

**AC3: Email already exists**  
Given a user with email that already exists,  
When they submit the registration form,  
Then they see "Email already registered. Please login." error.

**AC4: Multi-tenant tenantId is unique**  
Given two users registering separately,  
When both registrations complete,  
Then each user has unique `tenantId` in Cognito custom attributes.

## Technical Notes

### Implementation Approach

- Frontend: React form with react-hook-form + Zod
- Backend: Lambda `auth/register.ts` calls Cognito SignUpCommand
- Database: Insert user record with same `id` as Cognito `sub`
- Cognito: Set custom attributes during signup

### Database Changes

- Uses existing `users` table (no schema changes)

### API Endpoints

- `POST /auth/register`
  - Body: `{ email, password, firstName, lastName, accountType }`
  - Response: `{ userId, message: "Registration successful" }`

### Security Considerations

- Password policy: min 8 chars, uppercase, lowercase, digits, symbols
- Zod validates email format, password strength, name fields
- Generate `tenantId` server-side using randomUUID()
- RLS not applicable (creating new tenant)

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Zod schema validates correct payload
- [ ] Zod schema rejects invalid email
- [ ] randomUUID() generates unique tenantIds

### Integration Tests

- [ ] Two registrations create different tenantId values
- [ ] User record matches Cognito attributes

### E2E Tests

- [ ] End-to-end registration from form to verification email

## Dependencies

- Cognito User Pool created
- Database schema deployed

## Out of Scope

- Email verification flow (separate story)
- Business account invitation (separate story)
- Social login (Phase 2)
```

### Example 2: Assessment Wizard (8 points)

```markdown
**Summary**: As a user, I want to answer dynamic assessment questions so that I receive a personalized program

**Epic Link**: SCRUM-EPIC-2 (Assessment Engine)
**Story Points**: 8
**Priority**: High
**Labels**: phase-1, frontend, backend

## User Story

As a user,  
I want to answer dynamic assessment questions with conditional logic,  
So that the system generates a personalized workout program based on my responses.

## Background / Context

Frontend assessment wizard and backend conditional logic. Users see only relevant questions based on previous answers (e.g., "reduce pain" goal shows pain-related questions).

## Acceptance Criteria

**AC1: User navigates through questions**  
Given a user starts assessment,  
When they answer a question,  
Then next relevant question displays based on conditional logic, and progress bar updates.

**AC2: Conditional questions appear correctly**  
Given user selects "reduce_pain" for goal (q1),  
When they proceed,  
Then they see pain level scale question (q2), hidden if different goal selected.

**AC3: Progress auto-saves**  
Given user answers 3 questions,  
When page reloads,  
Then user resumes from question 4 with previous answers preserved.

**AC4: Assessment submission succeeds**  
Given user completes all required questions,  
When they submit,  
Then backend calculates scores, generates program, redirects to program view.

## Technical Notes

### Implementation Approach

- Frontend: React wizard with stepper UI (TailwindCSS)
- State: useState for current question and answers
- Logic: Evaluate conditionalLogic rules for visible questions
- Auto-save: Debounced API call every 30 seconds
- Backend: Validate answers with Zod schema

### Database Changes

- Use existing `user_assessments` table
- Store answers in JSONB `answers` column

### API Endpoints

- `POST /assessments/start` - Creates assessment instance
- `POST /assessments/{id}/progress` - Saves partial answers
- `POST /assessments/{id}/submit` - Submits and triggers scoring

### Security Considerations

- JWT required (authenticated user)
- Tenant context from JWT set in RLS
- Zod validates all answer payloads
- Assessment answers are PHI - no logging

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Conditional logic shows/hides questions correctly
- [ ] Auto-save debounces correctly
- [ ] Zod validates answer structure

### Integration Tests

- [ ] Progress saves with correct tenantId
- [ ] Multi-tenant isolation: User A cannot access User B's assessment

### E2E Tests

- [ ] Complete assessment flow from start to program generation

## Dependencies

- Assessment template in database
- Question schema Zod types

## Out of Scope

- Assessment analytics (Phase 2)
- Question branching preview (Phase 2)
- A/B testing (Phase 2)
```

---

## Key Requirements

1. **Testing**: Minimum 2 functional tests per story
2. **Multi-Tenant**: Always include isolation AC and integration test
3. **Security**: Zod validation for all API inputs
4. **Documentation**: Update project-documentation/ for new patterns

---

## See Also

- **story-points.md** - Estimation guidelines
- **definition-of-done.md** - Story DoD checklist
- **subtask-standards.md** - Breaking down stories
