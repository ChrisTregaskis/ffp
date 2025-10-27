# Epic Standards

## Purpose

Epics represent large bodies of work spanning multiple sprints (4+ weeks) that deliver significant business value.

**When to use:**

- Work requires 2+ sprints
- Contains 5+ User Stories
- Delivers complete feature set
- Represents major system component

---

## Required Fields

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Issue Type** | Epic (10011)                                                   |
| **Summary**    | Epic: [Feature Area]                                           |
| **Epic Name**  | Short descriptor (2-4 words)                                   |
| **Priority**   | Highest, High, Medium, Low                                     |
| **Labels**     | `phase-1`, `infrastructure`, `security`, `frontend`, `backend` |
| **Components** | See jira-fields.md                                             |

---

## Description Template

```markdown
## Business Value

[Why is this epic important? What problem does it solve?]

## Scope

### In Scope

- [Major feature 1]
- [Major feature 2]
- [Major feature 3]

### Out of Scope

- [Explicitly exclude scope creep items]
- [Future phase enhancements]

## Technical Approach

[High-level architectural decisions and patterns]

## Security Considerations

[OWASP compliance, data protection, multi-tenant isolation]

## Dependencies

- [External dependencies]
- [Other epics or infrastructure]

## Success Metrics

- [Measurable outcomes]
- [Performance/adoption metrics]

## User Stories

[List linked stories - populate as created]

## Documentation Updates Required

- [Architecture diagrams]
- [API documentation]
- [Security documentation]
```

---

## Acceptance Criteria (Epic Level)

```markdown
## Acceptance Criteria

- [ ] All child User Stories marked as Done
- [ ] Integration tests passing for complete feature set
- [ ] Documentation updated in project-documentation/
- [ ] Security review completed (if applicable)
- [ ] Performance benchmarks met (if applicable)
- [ ] Deployed to staging and validated
```

---

## Examples

### Example 1: Sprint 1 Epic

```markdown
**Summary**: Epic: Application Setup & Foundation
**Epic Name**: Application Setup
**Priority**: Highest
**Labels**: phase-1, infrastructure, security

## Business Value

Establish core infrastructure for FFP, enabling rapid feature development with security, scalability, and maintainability built-in from day one.

## Scope

### In Scope

- Turborepo monorepo (web, api, core, database packages)
- SST infrastructure (API Gateway, Lambda, RDS)
- AWS Cognito authentication with custom attributes
- PostgreSQL schema with Row-Level Security (RLS)
- Drizzle ORM with type-safe migrations
- CI/CD pipelines (GitHub Actions) for dev/staging/prod
- Testing framework (Vitest + Playwright + MSW)
- CloudWatch logging and basic monitoring

### Out of Scope

- X-Ray tracing (Phase 2)
- Multi-AZ RDS (can upgrade later)
- MFA/SSO (Phase 2)
- Load testing (not needed at Phase 1 scale)

## Technical Approach

- **Monorepo**: Turborepo for code sharing
- **IaC**: SST for all AWS resources
- **Database**: PostgreSQL 14+ with Drizzle + RLS
- **Auth**: Cognito with custom attributes (tenantId, role, customerId)
- **API**: API Gateway + Lambda + JWT authorizers
- **Testing**: Vitest (unit), Playwright (E2E), MSW (mocking)

## Security Considerations

- RLS enforced at database level for all tenant-scoped tables
- JWT validation on all protected routes
- Zod schema validation for all API inputs
- Secrets in AWS Secrets Manager
- Encryption at rest (KMS) and in transit (TLS 1.3)
- CloudWatch audit logs with tenant/user context

## Dependencies

- AWS account with appropriate permissions
- Domain name for production
- GitHub repository
- Cognito User Pool creation
- RDS instance (t3.small, Single AZ for Phase 1)

## Success Metrics

- [ ] Deploys to dev, staging, production
- [ ] User can register, login, receive JWT with tenant context
- [ ] Database migrations run successfully
- [ ] Unit tests achieve 30% coverage
- [ ] E2E tests cover authentication flow
- [ ] CloudWatch logs capture all requests with tenant context
- [ ] API response time <500ms (p95)
- [ ] Zero critical npm audit vulnerabilities

## User Stories

- FFP-1: Setup Turborepo monorepo
- FFP-2: Configure SST infrastructure
- FFP-3: Implement Cognito authentication
- FFP-4: Create PostgreSQL schema with RLS
- FFP-5: Setup Drizzle ORM with migrations
- FFP-6: Configure CI/CD pipelines
- FFP-7: Implement testing framework
- FFP-8: Configure CloudWatch monitoring

## Documentation Updates

- architecture.md (infrastructure diagram)
- authentication.md (Cognito setup)
- database-schema.md (schema and RLS)
- deployment.md (CI/CD workflow)
```

### Example 2: Sprint 2 Epic

```markdown
**Summary**: Epic: Assessment Engine Core
**Epic Name**: Assessment Engine
**Priority**: Highest
**Labels**: phase-1, backend, frontend

## Business Value

Enable FFP to deliver personalized workout programs through dynamic, JSON-driven assessments. Core value proposition: assess users' fitness levels and generate tailored programs.

## Scope

### In Scope

- JSON-driven question schema with Zod validation
- Question types: single-choice, multi-choice, numeric, scale, text
- Conditional question logic (show/hide based on answers)
- Assessment save & resume functionality
- Pluggable scoring strategies: weighted, categorical, rule-based
- Program generation from assessment results
- Assessment history and versioning
- Multi-tenant data isolation
- Frontend assessment wizard with progress tracking

### Out of Scope

- Visual question editor (Phase 2)
- A/B testing framework (Phase 2)
- Assessment analytics dashboard (Phase 2)
- AI-powered scoring (Phase 3)

## Technical Approach

- **Schema**: Zod schemas for type-safe questions in PostgreSQL JSONB
- **Logic**: JSONPath-style conditional expressions
- **Scoring**: Strategy pattern for pluggable algorithms
- **Generation**: Rule-based exercise selection
- **Frontend**: React wizard with react-hook-form
- **State**: Auto-save progress to database

## Security Considerations

- Assessment responses contain PHI - no logging of answers
- RLS enforced on user_assessments table
- Tenant context validation on all queries
- Zod validation on all submission payloads

## Dependencies

- Video library schema (for program generation)
- User authentication system (tenant context)
- PostgreSQL JSONB support
- Assessment templates from physiotherapist

## Success Metrics

- [ ] User completes assessment end-to-end
- [ ] Progress auto-saves every 30 seconds
- [ ] User can resume incomplete assessment
- [ ] Scoring correctly categorizes users
- [ ] Program generation selects appropriate exercises
- [ ] Assessment history displays attempts
- [ ] Multi-tenant isolation verified
- [ ] Completion rate >70%

## User Stories

- FFP-10: Define assessment Zod schemas
- FFP-11: Implement conditional logic engine
- FFP-12: Create assessment service with save/resume
- FFP-13: Implement weighted scoring strategy
- FFP-14: Implement categorical scoring
- FFP-15: Build program generation algorithm
- FFP-16: Create frontend wizard component
- FFP-17: Implement assessment history
- FFP-18: Add multi-tenant isolation tests

## Documentation Updates

- assessment-engine.md (schemas, scoring)
- database-schema.md (assessment tables)
- coding-standards.md (service patterns)
```

---

## Estimation

**Epics are not estimated.** They contain estimated User Stories which roll up to epic totals.

---

## See Also

- **story-standards.md** - Creating child stories
- **jira-fields.md** - Labels, components, API examples
- **definition-of-done.md** - Epic completion criteria
