# Sprint 1 Stories Summary

**Epic**: FFP-1 - Application Setup & Foundation  
**Sprint Duration**: 8-10 weeks  
**Target Capacity**: 8 hours/week (64-80 hours total)  
**Created**: October 18, 2025

---

## Overview

Sprint 1 establishes the foundational infrastructure for FFP. All 10 stories focus on setting up the development environment, AWS infrastructure, authentication, database, testing, and CI/CD pipelines. This sprint creates the platform upon which all future features will be built.

---

## Stories Created

| Story Key                                                | Title                           | Story Points | Priority | Status |
| -------------------------------------------------------- | ------------------------------- | ------------ | -------- | ------ |
| [FFP-7](https://ctregaskis.atlassian.net/browse/FFP-7)   | Turborepo Monorepo Setup        | 3            | Highest  | To Do  |
| [FFP-8](https://ctregaskis.atlassian.net/browse/FFP-8)   | SST Infrastructure Foundation   | 5            | Highest  | To Do  |
| [FFP-9](https://ctregaskis.atlassian.net/browse/FFP-9)   | Cognito Authentication          | 8            | Highest  | To Do  |
| [FFP-10](https://ctregaskis.atlassian.net/browse/FFP-10) | PostgreSQL Schema with RLS      | 8            | Highest  | To Do  |
| [FFP-11](https://ctregaskis.atlassian.net/browse/FFP-11) | Drizzle ORM Setup               | 5            | High     | To Do  |
| [FFP-12](https://ctregaskis.atlassian.net/browse/FFP-12) | Testing Framework Configuration | 5            | High     | To Do  |
| [FFP-13](https://ctregaskis.atlassian.net/browse/FFP-13) | CI/CD Pipeline                  | 5            | High     | To Do  |
| [FFP-14](https://ctregaskis.atlassian.net/browse/FFP-14) | CloudWatch Logging              | 3            | Medium   | To Do  |
| [FFP-15](https://ctregaskis.atlassian.net/browse/FFP-15) | Error Handling Patterns         | 3            | Medium   | To Do  |
| [FFP-16](https://ctregaskis.atlassian.net/browse/FFP-16) | Web Login/Logout Flow           | 5            | High     | To Do  |

**Total Story Points**: 50

---

## Capacity Analysis

### Estimated Timeline

- **Story Points**: 50 total
- **Velocity Estimate**: 5-6 points/week (8 hours/week capacity)
- **Sprint Duration**: 8-10 weeks
- **Buffer**: Built-in for solo developer with family/job commitments

### Story Point Breakdown

| Complexity | Points | Count | Total Points |
| ---------- | ------ | ----- | ------------ |
| Simple     | 3      | 3     | 9            |
| Moderate   | 5      | 5     | 25           |
| Complex    | 8      | 2     | 16           |

### Time Estimates (8 hours/week)

| Story  | Points | Estimated Weeks | Estimated Hours |
| ------ | ------ | --------------- | --------------- |
| FFP-7  | 3      | 2-3             | 16-24           |
| FFP-8  | 5      | 3-4             | 24-32           |
| FFP-9  | 8      | 4-6             | 32-48           |
| FFP-10 | 8      | 4-6             | 32-48           |
| FFP-11 | 5      | 3-4             | 24-32           |
| FFP-12 | 5      | 3-4             | 24-32           |
| FFP-13 | 5      | 3-4             | 24-32           |
| FFP-14 | 3      | 2-3             | 16-24           |
| FFP-15 | 3      | 2-3             | 16-24           |
| FFP-16 | 5      | 3-4             | 24-32           |

**Note**: These are maximum estimates. Actual time may be less due to:

- Turborepo build caching reducing rebuild times
- Parallel work on independent stories
- Learning/familiarity with tools increasing velocity

---

## Story Dependencies

### Critical Path (Sequential Dependencies)

```
FFP-7 (Turborepo)
    ↓
FFP-8 (SST Stacks)
    ↓
FFP-9 (Cognito Auth) + FFP-10 (Database Schema) + FFP-11 (Drizzle ORM)
    ↓
FFP-16 (Web Login Flow)
```

### Parallel Work Opportunities

**After FFP-7 completes:**

- FFP-12 (Testing Framework) - Can start immediately
- FFP-14 (CloudWatch Logging) - Can start immediately
- FFP-15 (Error Handling) - Can start immediately

**After FFP-8 completes:**

- FFP-9 (Auth), FFP-10 (Database), FFP-11 (Drizzle) - Can work in parallel
- FFP-13 (CI/CD) - Can start once FFP-12 is complete

### Dependency Graph

```
FFP-7 (Foundation)
├── FFP-8 (SST)
│   ├── FFP-9 (Auth)
│   │   └── FFP-16 (Web Login)
│   ├── FFP-10 (Database)
│   │   └── FFP-11 (Drizzle)
│   └── FFP-14 (Logging)
├── FFP-12 (Testing)
│   └── FFP-13 (CI/CD)
└── FFP-15 (Error Handling)
```

---

## Testing Coverage Summary

### Unit Tests Required

- **Total Stories with Unit Tests**: 10/10 (100%)
- **Minimum Tests per Story**: 2
- **Estimated Total Unit Tests**: 20+

### Integration Tests Required

**Critical Integration Tests**:

- **FFP-10**: Multi-tenant data isolation (HIGHEST PRIORITY)
- FFP-9: Cognito authentication flow
- FFP-11: Database query execution
- FFP-12: MSW API mocking
- FFP-13: CI/CD workflow execution

### E2E Tests Required

**Critical E2E Tests**:

- **FFP-16**: Full registration → login → logout flow
- FFP-16: Protected route redirect for unauthenticated users

**Testing Philosophy for Sprint 1**:

- Focus on critical paths (authentication, multi-tenant isolation)
- Target 30% code coverage (not 100%)
- Prioritise integration tests over unit tests for infrastructure
- E2E tests for user-facing flows only

---

## Security Considerations

### Non-Negotiable Security Requirements

All stories must adhere to these security principles:

1. **Multi-Tenant Isolation** (FFP-10)

   - RLS policies on all tenant-scoped tables
   - Integration tests to verify cross-tenant access blocked
   - JWT claims validated in every Lambda function

2. **Authentication Security** (FFP-9)

   - Cognito password policy: min 8 chars, mixed case, digits, symbols
   - JWT short-lived: 15 min access, 7 day refresh
   - Custom attributes: tenantId (immutable), role (mutable)

3. **Input Validation** (All API stories)

   - Zod schemas on all endpoints
   - SQL injection prevention (parameterised queries)
   - XSS prevention (React auto-escaping)

4. **Secrets Management** (FFP-8)

   - AWS Secrets Manager for all credentials
   - Never commit secrets to Git
   - Environment-specific secrets (dev/staging/prod)

5. **Logging Security** (FFP-14)
   - Never log passwords, tokens, or PHI
   - Structured JSON with tenant/user context
   - Sanitise sensitive data before logging

---

## Technical Architecture Summary

### Monorepo Structure (FFP-7)

```
/
├── packages/
│   ├── web/          # React + Vite frontend
│   ├── api/          # Lambda functions
│   ├── core/         # Shared business logic
│   └── database/     # Drizzle schema + migrations
├── stacks/           # SST infrastructure
├── .github/          # CI/CD workflows
└── turbo.json        # Turborepo config
```

### AWS Infrastructure (FFP-8)

```
AuthStack     → Cognito User Pool
DatabaseStack → RDS PostgreSQL (t3.small, Single AZ)
ApiStack      → API Gateway + Lambda Functions
MonitoringStack → CloudWatch Log Groups + Alarms
```

### Technology Stack

| Layer          | Technology                                 | Story                 |
| -------------- | ------------------------------------------ | --------------------- |
| Frontend       | React 18 + TypeScript + Vite + TailwindCSS | FFP-7, FFP-16         |
| Backend        | Node.js 18 + TypeScript + Lambda           | FFP-7, FFP-8          |
| Database       | PostgreSQL 15 (RDS) + Drizzle ORM          | FFP-8, FFP-10, FFP-11 |
| Auth           | AWS Cognito + Amplify                      | FFP-9, FFP-16         |
| Infrastructure | SST (Serverless Stack)                     | FFP-8                 |
| Testing        | Vitest + Playwright + MSW                  | FFP-12                |
| CI/CD          | GitHub Actions                             | FFP-13                |
| Monitoring     | CloudWatch Logs                            | FFP-14                |
| Validation     | Zod                                        | All API stories       |

---

## Definition of Done (Sprint 1)

For Sprint 1 to be considered complete, all stories must meet these criteria:

### Code Quality

- [ ] TypeScript strict mode passes with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] Prettier formatting applied
- [ ] No `any` types used
- [ ] All functions have explicit return types

### Testing

- [ ] Minimum 2 unit tests per story implemented
- [ ] Integration tests for multi-tenant isolation pass (FFP-10)
- [ ] E2E test for login flow passes (FFP-16)
- [ ] CI pipeline runs all tests successfully

### Security

- [ ] RLS policies tested and verified (FFP-10)
- [ ] No secrets in code or committed files
- [ ] Zod validation on all API endpoints
- [ ] CloudWatch logging excludes sensitive data

### Deployment

- [ ] `sst deploy --stage dev` completes successfully
- [ ] All Lambda functions deploy without errors
- [ ] Database migrations run successfully
- [ ] CloudWatch logs appear for all functions

### Documentation

- [ ] README updated with setup instructions
- [ ] Environment variables documented
- [ ] Architecture diagrams up to date
- [ ] Known issues/limitations documented

---

## Risk Assessment

### High Risk Items

1. **Database RLS Testing** (FFP-10)

   - **Risk**: Cross-tenant data leakage
   - **Mitigation**: Integration tests MUST be comprehensive
   - **Contingency**: Thorough manual testing before any production use

2. **Solo Developer Capacity** (All Stories)

   - **Risk**: 8 hours/week may be optimistic with job + family
   - **Mitigation**: 8-10 week timeline includes buffer
   - **Contingency**: Reduce scope if needed (defer FFP-13, FFP-14)

3. **Cognito Custom Attributes** (FFP-9)
   - **Risk**: JWT claims may not include custom attributes
   - **Mitigation**: Test early, verify at jwt.io
   - **Contingency**: Fallback to database lookups if needed

### Medium Risk Items

1. **Drizzle ORM Learning Curve** (FFP-11)

   - **Risk**: New tool, may take longer than estimated
   - **Mitigation**: Excellent documentation available
   - **Contingency**: Extra 1-2 weeks if needed

2. **CI/CD Pipeline Configuration** (FFP-13)
   - **Risk**: GitHub Actions + AWS IAM can be complex
   - **Mitigation**: Start with simple workflows, iterate
   - **Contingency**: Manual deployments acceptable for Sprint 1

### Low Risk Items

- Turborepo setup (well-documented)
- React/TypeScript frontend (familiar stack)
- CloudWatch logging (straightforward)
- Error handling patterns (standard practice)

---

## Success Metrics

Sprint 1 will be considered successful when:

1. **Infrastructure Deployed**

   - All AWS resources created via SST
   - Dev environment fully functional
   - Can deploy with single command

2. **Authentication Working**

   - Users can register and log in
   - JWT contains tenant context
   - Protected routes enforce authentication

3. **Database Secure**

   - RLS policies prevent cross-tenant access
   - Integration tests verify isolation
   - Migrations run successfully

4. **Testing Established**

   - CI pipeline runs on every PR
   - Critical paths have test coverage
   - E2E test for login flow passes

5. **Code Quality**
   - TypeScript strict mode enforced
   - Linting and formatting automated
   - Error handling patterns consistent

---

## Next Steps After Sprint 1

Once Sprint 1 is complete, the following become possible:

### Sprint 2 Scope (Assessment Engine)

- Create assessment templates
- Implement question flow logic
- Build scoring algorithms
- Generate workout programs

### Sprint 3 Scope (Video Management)

- Upload videos to S3
- Implement video streaming
- Track user progress
- Create program sessions

### Sprint 4 Scope (Business Portal)

- Invite sub-users
- View user programs
- Business dashboard
- User management

---

## Story Labels

All stories tagged with:

- `phase-1` - Phase 1 MVP work
- `sprint-1` - Sprint 1 specific
- Technology-specific tags:
  - `infrastructure` (FFP-7, FFP-8)
  - `authentication` (FFP-9, FFP-16)
  - `database` (FFP-10, FFP-11)
  - `testing` (FFP-12)
  - `cicd` (FFP-13)
  - `monitoring` (FFP-14)
  - `error-handling` (FFP-15)
  - `frontend` (FFP-16)

---

## Notes for Solo Developer

### Time Management Tips

1. **Work in Focused Blocks**

   - 2-hour sessions preferred over 8-hour marathons
   - 4 sessions per week = 8 hours

2. **Prioritise Critical Path**

   - Start with FFP-7 (foundation)
   - Then FFP-8 (infrastructure)
   - FFP-9 + FFP-10 are highest priority

3. **Parallelize When Possible**

   - Testing framework can be set up anytime after FFP-7
   - Logging and error handling don't block other work

4. **Don't Perfectionate**
   - Simple implementations first
   - Can refactor in later sprints
   - 30% test coverage is acceptable

### When to Ask for Help

- AWS IAM permission issues (FFP-8, FFP-13)
- RLS policy debugging (FFP-10)
- Cognito custom attribute problems (FFP-9)
- GitHub Actions workflow failures (FFP-13)

### Celebration Milestones

- ✅ First successful `sst deploy` (FFP-8)
- ✅ First user registration (FFP-9)
- ✅ RLS integration test passes (FFP-10)
- ✅ Full login E2E test passes (FFP-16)
- 🎉 Sprint 1 complete!

---

## References

- [Epic FFP-1](https://ctregaskis.atlassian.net/browse/FFP-1)
- [Story Standards](/project-documentation/sprint-planning/jira-standards/story-standards.md)
- [Story Points Guide](/project-documentation/sprint-planning/jira-standards/story-points.md)
- [Architecture Documentation](/project-documentation/architecture.md)
- [Authentication Documentation](/project-documentation/authentication.md)
- [Database Schema Documentation](/project-documentation/database-schema.md)

---

**Document Version**: 1.0  
**Last Updated**: October 18, 2025  
**Created By**: Sprint Planning Chat E1  
**Next Review**: After Sprint 1 completion
