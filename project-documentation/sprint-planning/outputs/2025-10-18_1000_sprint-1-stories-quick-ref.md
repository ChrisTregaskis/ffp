# Sprint 1 Stories - Quick Reference

**Epic**: FFP-1 - Application Setup & Foundation  
**Total Story Points**: 50  
**Estimated Duration**: 8-10 weeks (8 hours/week)

---

## Stories at a Glance

| #   | Story Key  | Title                           | Points | Priority | Dependencies         | URL                                                    |
| --- | ---------- | ------------------------------- | ------ | -------- | -------------------- | ------------------------------------------------------ |
| 1   | **FFP-7**  | Turborepo Monorepo Setup        | 3      | Highest  | None                 | [View](https://ctregaskis.atlassian.net/browse/FFP-7)  |
| 2   | **FFP-8**  | SST Infrastructure Foundation   | 5      | Highest  | FFP-7                | [View](https://ctregaskis.atlassian.net/browse/FFP-8)  |
| 3   | **FFP-9**  | Cognito Authentication          | 8      | Highest  | FFP-8                | [View](https://ctregaskis.atlassian.net/browse/FFP-9)  |
| 4   | **FFP-10** | PostgreSQL Schema with RLS      | 8      | Highest  | FFP-8, FFP-11        | [View](https://ctregaskis.atlassian.net/browse/FFP-10) |
| 5   | **FFP-11** | Drizzle ORM Setup               | 5      | High     | FFP-8                | [View](https://ctregaskis.atlassian.net/browse/FFP-11) |
| 6   | **FFP-12** | Testing Framework Configuration | 5      | High     | FFP-7                | [View](https://ctregaskis.atlassian.net/browse/FFP-12) |
| 7   | **FFP-13** | Automated Testing Pipeline      | 5      | High     | FFP-7, FFP-8, FFP-12 | [View](https://ctregaskis.atlassian.net/browse/FFP-13) |
| 8   | **FFP-14** | CloudWatch Logging              | 3      | Medium   | FFP-8                | [View](https://ctregaskis.atlassian.net/browse/FFP-14) |
| 9   | **FFP-15** | Error Handling Patterns         | 3      | Medium   | FFP-14               | [View](https://ctregaskis.atlassian.net/browse/FFP-15) |
| 10  | **FFP-16** | Web Login/Logout Flow           | 5      | High     | FFP-9, FFP-7         | [View](https://ctregaskis.atlassian.net/browse/FFP-16) |

---

## Execution Order (Recommended)

### Week 1-3: Foundation

1. **FFP-7** (3 points) - Turborepo Setup
2. **Start FFP-12** (5 points) - Testing Framework (can be parallel)

### Week 3-6: Infrastructure

3. **FFP-8** (5 points) - SST Stacks
4. **FFP-14** (3 points) - CloudWatch Logging (can be parallel)
5. **FFP-15** (3 points) - Error Handling (can be parallel)

### Week 6-10: Core Features

6. **FFP-11** (5 points) - Drizzle ORM
7. **FFP-10** (8 points) - Database Schema + RLS
8. **FFP-9** (8 points) - Cognito Authentication
9. **FFP-13** (5 points) - Automated Testing Pipeline (GitHub Actions)
10. **FFP-16** (5 points) - Web Login Flow

---

## Critical Success Criteria

### Must Have (Non-Negotiable)

- ✅ FFP-10: RLS integration tests pass
- ✅ FFP-9: JWT contains tenantId, role
- ✅ FFP-16: E2E login test passes
- ✅ All: TypeScript strict mode, no errors

### Should Have (High Priority)

- ✅ FFP-13: Automated testing pipeline functional (Phase 1: testing only)
- ✅ FFP-12: Testing framework operational
- ✅ FFP-14: Structured logging implemented

### Nice to Have (Lower Priority)

- ⚪ FFP-15: Error handling patterns (can be iterative)
- ⚪ Full test coverage (targeting 15%, not 100%)

---

## Risk Mitigation

| Risk                      | Story  | Mitigation                                         | Contingency                                              |
| ------------------------- | ------ | -------------------------------------------------- | -------------------------------------------------------- |
| Cross-tenant data leakage | FFP-10 | Comprehensive integration tests                    | Manual security audit                                    |
| JWT missing custom claims | FFP-9  | Early testing with jwt.io                          | Database lookup fallback                                 |
| CI/CD complexity          | FFP-13 | Phase 1: Testing only, defer deployment automation | Manual deployments OK for Sprint 1 (documented strategy) |
| Solo dev capacity         | All    | 8-10 week buffer                                   | Defer FFP-13, FFP-14 if needed                           |

---

## Testing Requirements Summary

| Story  | Unit Tests | Integration Tests             | E2E Tests         |
| ------ | ---------- | ----------------------------- | ----------------- |
| FFP-7  | 2          | Build + TypeScript            | -                 |
| FFP-8  | 2          | Deploy success                | -                 |
| FFP-9  | 3          | Auth flow                     | -                 |
| FFP-10 | 2          | **Multi-tenant isolation** ⚠️ | -                 |
| FFP-11 | 3          | DB query execution            | -                 |
| FFP-12 | 2          | MSW mocking                   | 1 sample          |
| FFP-13 | 2          | Workflow execution            | -                 |
| FFP-14 | 3          | Logs in CloudWatch            | -                 |
| FFP-15 | 4          | Error logging                 | -                 |
| FFP-16 | 2          | Cognito registration          | **Login flow** ⚠️ |

**⚠️ = Critical tests that must pass**

---

## Technology Stack

```
Frontend:  React 18 + TypeScript + Vite + TailwindCSS + S3/CloudFront
Backend:   Node.js 18 + TypeScript + Lambda + API Gateway
Database:  PostgreSQL 15 (RDS) + Drizzle ORM + Row-Level Security
Auth:      AWS Cognito (custom attributes: tenantId, role)
IaC:       SST (Serverless Stack)
Testing:   Vitest + Playwright + MSW
CI:        GitHub Actions (Phase 1: automated testing only)
Monitoring: CloudWatch Logs
Validation: Zod schemas
```

---

## Useful Commands

```bash
# Development
npm run sst dev              # Live Lambda development
npm run dev                  # Start web app (Vite)
npm run db:studio            # Open Drizzle Studio

# Testing
npm test                     # Run Vitest unit tests
npm run test:e2e             # Run Playwright E2E tests
npm run test:coverage        # Generate coverage report

# Deployment
npm run sst deploy --stage dev        # Deploy to dev
npm run sst remove --stage dev        # Remove all resources
npm run db:migrate --stage dev        # Run database migrations

# CI (Phase 1 - Testing Only)
git push origin develop      # Triggers automated tests via GitHub Actions

# Manual Deployments (Phase 1)
npm run sst deploy --stage dev        # Deploy backend to dev
npm run build && aws s3 sync dist/ s3://bucket  # Deploy frontend
npm run db:migrate --stage dev        # Run database migrations

# Monitoring
npm run sst logs --stage dev --function auth-register  # View logs
npm run sst logs:watch --stage dev                     # Tail all logs
```

---

## Next Steps

1. ✅ **Review stories in Jira** - Verify all details correct
2. ✅ **Save this summary** - Reference during Sprint 1
3. ⏭️ **Move to Chat S1** - Create subtasks for FFP-7
4. ⏭️ **Continue subtasks** - Create subtasks for remaining stories
5. ⏭️ **Start Sprint 1** - Begin with FFP-7 (Turborepo setup)

---

**Quick Links**:

- [Full Summary](./sprint-1-stories-summary.md)
- [Epic FFP-1](https://ctregaskis.atlassian.net/browse/FFP-1)
- [Jira Board](https://ctregaskis.atlassian.net/jira/software/projects/FFP/boards/1)
