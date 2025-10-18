# Sprint 1 - Subtasks Summary

**Generated**: 2025-10-18  
**Updated**: 2025-10-18 22:00  
**Project**: FFP (Fit For Purpose)  
**Sprint**: Sprint 1 - Foundation Infrastructure

---

## Overview

This document summarises all subtasks created for Sprint 1 User Stories. Each story has been broken down into actionable subtasks with time estimates and clear acceptance criteria.

**Total Stories**: 3  
**Total Subtasks**: 30  
**Estimated Time**: ~93 hours (~11.6 weeks at 8h/week)

---

## Story 1: FFP-7 - Turborepo Monorepo Setup

**Story Points**: 3 points (~24 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Highest  
**Status**: To Do

**Story URL**: [FFP-7](https://ctregaskis.atlassian.net/browse/FFP-7)

### Subtasks Summary (8 subtasks, ~13 hours)

| #   | Key        | Title                                               | Estimate | Dependencies | Status | URL                                                    |
| --- | ---------- | --------------------------------------------------- | -------- | ------------ | ------ | ------------------------------------------------------ |
| 1   | **FFP-17** | Initialize Turborepo and base configuration         | 1h       | None         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-17) |
| 2   | **FFP-18** | Create package structure (web, api, core, database) | 2h       | FFP-17       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-18) |
| 3   | **FFP-19** | Configure workspace dependencies                    | 1h       | FFP-18       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-19) |
| 4   | **FFP-20** | Setup TypeScript paths and configuration            | 2h       | FFP-19       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-20) |
| 5   | **FFP-21** | Configure shared ESLint and Prettier                | 2h       | FFP-20       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-21) |
| 6   | **FFP-22** | Configure Turborepo build pipeline and caching      | 2h       | FFP-21       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-22) |
| 7   | **FFP-23** | Write tests for monorepo setup                      | 2h       | FFP-22       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-23) |
| 8   | **FFP-24** | Document monorepo structure and commands            | 1h       | FFP-23       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-24) |

**Total Time**: 13 hours (~1.6 weeks at 8h/week)

### Dependency Chain

```
FFP-17 (Initialize Turborepo)
  ↓
FFP-18 (Create packages)
  ↓
FFP-19 (Configure dependencies)
  ↓
FFP-20 (TypeScript paths)
  ↓
FFP-21 (ESLint/Prettier)
  ↓
FFP-22 (Build pipeline)
  ↓
FFP-23 (Tests)
  ↓
FFP-24 (Documentation)
```

### Definition of Done

- [ ] All packages build successfully
- [ ] Build caching works (second build <1s)
- [ ] TypeScript paths resolve correctly
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Code committed to Git
- [ ] FFP-7 moved to "Done"

---

## Story 2: FFP-8 - SST Infrastructure Foundation

**Story Points**: 5 points (~40 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Highest  
**Status**: To Do

**Story URL**: [FFP-8](https://ctregaskis.atlassian.net/browse/FFP-8)

### Subtasks Summary (10 subtasks, ~27 hours)

| #   | Key        | Title                                               | Estimate | Dependencies   | Status | URL                                                    |
| --- | ---------- | --------------------------------------------------- | -------- | -------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-25** | Initialize SST and create base configuration        | 1h       | FFP-7 complete | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-25) |
| 2   | **FFP-26** | Create VPC and networking infrastructure            | 2h       | FFP-25         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-26) |
| 3   | **FFP-27** | Create AuthStack with Cognito User Pool             | 3h       | FFP-25         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-27) |
| 4   | **FFP-28** | Create DatabaseStack with RDS PostgreSQL            | 4h       | FFP-26         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-28) |
| 5   | **FFP-29** | Create StorageStack with S3 and CloudFront          | 3h       | FFP-25         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-29) |
| 6   | **FFP-30** | Create ApiStack with API Gateway and JWT authorizer | 3h       | FFP-27         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-30) |
| 7   | **FFP-31** | Create MonitoringStack with CloudWatch alarms       | 3h       | FFP-30         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-31) |
| 8   | **FFP-32** | Configure AWS Secrets Manager for credentials       | 2h       | FFP-28         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-32) |
| 9   | **FFP-33** | Configure environment-specific settings             | 2h       | FFP-31         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-33) |
| 10  | **FFP-34** | Deploy and test infrastructure to dev environment   | 4h       | FFP-33         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-34) |

**Total Time**: 27 hours (~3.4 weeks at 8h/week)

### Dependency Chain

```
FFP-7 (Turborepo) → FFP-25 (Initialize SST)
                          ↓
    ┌─────────────────────┼─────────────────────┐
    ↓                     ↓                     ↓
FFP-26 (VPC)        FFP-27 (Auth)        FFP-29 (Storage)
    ↓                     ↓
FFP-28 (Database)   FFP-30 (API)
    ↓                     ↓
FFP-32 (Secrets)    FFP-31 (Monitoring)
                          ↓
                    FFP-33 (Config)
                          ↓
                    FFP-34 (Deploy & Test)
```

### Definition of Done

- [ ] All stacks deploy successfully to dev
- [ ] Health check endpoint returns 200
- [ ] Cognito User Pool accessible
- [ ] RDS database accessible from Lambda
- [ ] CloudWatch logs being captured
- [ ] All secrets configured in Secrets Manager
- [ ] Documentation updated
- [ ] FFP-8 moved to "Done"

---

## Story 3: FFP-9 - Cognito Authentication

**Story Points**: 8 points (~64 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Highest  
**Status**: To Do

**Story URL**: [FFP-9](https://ctregaskis.atlassian.net/browse/FFP-9)

### Subtasks Summary (12 subtasks, ~40 hours)

| #   | Key        | Title                                        | Estimate | Dependencies           | Status | URL                                                    |
| --- | ---------- | -------------------------------------------- | -------- | ---------------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-35** | Create Zod validation schemas for auth       | 2h       | FFP-8 complete         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-35) |
| 2   | **FFP-36** | Create tenant context extraction utility     | 2h       | FFP-35                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-36) |
| 3   | **FFP-37** | Implement registration Lambda function       | 4h       | FFP-36                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-37) |
| 4   | **FFP-38** | Implement login Lambda function              | 3h       | FFP-36                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-38) |
| 5   | **FFP-39** | Implement refresh token Lambda function      | 2h       | FFP-38                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-39) |
| 6   | **FFP-40** | Configure API Gateway auth routes            | 2h       | FFP-37, FFP-38, FFP-39 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-40) |
| 7   | **FFP-41** | Write unit tests for auth logic              | 4h       | FFP-37, FFP-38         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-41) |
| 8   | **FFP-42** | Write integration tests for auth flows       | 4h       | FFP-40                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-42) |
| 9   | **FFP-43** | Create error handling classes and middleware | 3h       | FFP-35                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-43) |
| 10  | **FFP-44** | Implement structured logging for auth events | 2h       | FFP-43                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-44) |
| 11  | **FFP-45** | Test auth in deployed dev environment        | 4h       | FFP-42                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-45) |
| 12  | **FFP-46** | Document authentication API and usage        | 2h       | FFP-45                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-46) |

**Total Time**: 34 hours (~4.3 weeks at 8h/week)

### Dependency Chain

```
FFP-8 (Infrastructure) → FFP-35 (Zod schemas)
                              ↓
                         FFP-36 (Tenant context)
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
           FFP-37 (Register)    FFP-38 (Login)
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                         FFP-39 (Refresh)
                              ↓
                         FFP-40 (API routes)
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
           FFP-41 (Unit tests)  FFP-42 (Integration)

           FFP-43 (Error handling)
                    ↓
           FFP-44 (Logging)
                    ↓
           FFP-45 (Deploy test)
                    ↓
           FFP-46 (Documentation)
```

### Key Deliverables

- [x] Zod validation schemas for registration/login
- [x] Tenant context extraction from JWT
- [x] Registration endpoint with unique tenantId generation
- [x] Login endpoint returning JWT with custom claims
- [x] Refresh token endpoint
- [x] API Gateway routes configured
- [x] Comprehensive unit and integration tests
- [x] Error handling classes and middleware
- [x] Structured logging for security events
- [x] Complete API documentation

### Definition of Done

- [ ] Users can register with email/password
- [ ] Users can login and receive JWT tokens
- [ ] JWT contains custom claims (tenantId, role, parentBusinessId)
- [ ] API Gateway validates JWT tokens
- [ ] Tenant context extractable in Lambda functions
- [ ] All tests pass (unit + integration)
- [ ] Error handling works correctly
- [ ] Security events logged to CloudWatch
- [ ] API documentation complete
- [ ] FFP-9 moved to "Done"

---

## Overall Sprint 1 Timeline

**Capacity**: 8 hours/week  
**Total Estimated Time**: ~74 hours (13h + 27h + 34h)  
**Expected Duration**: ~9-10 weeks

### Recommended Schedule

#### Week 1 (8h) - Turborepo Setup

- **Mon/Wed (2h)**: FFP-17 ✓ (1h) + Start FFP-18 (1h)
- **Weekend (6h)**: Complete FFP-18 (1h), FFP-19 (1h), FFP-20 (2h), Start FFP-21 (2h)

#### Week 2 (8h) - Complete Turborepo + Start SST

- **Mon/Wed (4h)**: Complete FFP-21, FFP-22 (2h), Start FFP-23 (2h)
- **Weekend (4h)**: Complete FFP-23, FFP-24 (1h), FFP-25 (1h), Start FFP-26 (2h)

#### Week 3 (8h) - Core Infrastructure

- **Mon/Wed (4h)**: Complete FFP-26, Start FFP-27 (3h)
- **Weekend (4h)**: Complete FFP-27, Start FFP-28 (4h)

#### Week 4 (8h) - Database & Storage

- **Mon/Wed (4h)**: Complete FFP-28, Start FFP-29 (3h)
- **Weekend (4h)**: Complete FFP-29 (1h), FFP-30 (3h)

#### Week 5 (8h) - Monitoring & Deployment

- **Mon/Wed (4h)**: Complete FFP-30, FFP-31 (3h)
- **Weekend (4h)**: FFP-32 (2h), FFP-33 (2h)

#### Week 6 (8h) - Test Infrastructure + Start Auth

- **Mon/Wed (4h)**: FFP-34 (4h) - Deploy and test
- **Weekend (4h)**: FFP-35 (2h), FFP-36 (2h)

#### Week 7 (8h) - Authentication Core

- **Mon/Wed (4h)**: FFP-37 (4h) - Registration
- **Weekend (4h)**: FFP-38 (3h), Start FFP-39 (1h)

#### Week 8 (8h) - Auth Routes & Testing

- **Mon/Wed (4h)**: Complete FFP-39 (1h), FFP-40 (2h), Start FFP-41 (1h)
- **Weekend (4h)**: Complete FFP-41 (3h), Start FFP-42 (1h)

#### Week 9 (8h) - Error Handling & Logging

- **Mon/Wed (4h)**: Complete FFP-42 (3h), Start FFP-43 (1h)
- **Weekend (4h)**: Complete FFP-43 (2h), FFP-44 (2h)

#### Week 10 (4h) - Final Testing & Documentation

- **Weekend (4h)**: FFP-45 (4h) - Deploy test

#### Week 11 (2h) - Documentation

- **Weekend (2h)**: FFP-46 (2h) - Documentation

---

## Progress Tracking

### FFP-7 Progress

- [ ] FFP-17: Initialize Turborepo
- [ ] FFP-18: Create package structure
- [ ] FFP-19: Configure workspace dependencies
- [ ] FFP-20: Setup TypeScript paths
- [ ] FFP-21: Configure ESLint/Prettier
- [ ] FFP-22: Configure build pipeline
- [ ] FFP-23: Write tests
- [ ] FFP-24: Document structure

### FFP-8 Progress

- [ ] FFP-25: Initialize SST
- [ ] FFP-26: Create VPC
- [ ] FFP-27: Create AuthStack
- [ ] FFP-28: Create DatabaseStack
- [ ] FFP-29: Create StorageStack
- [ ] FFP-30: Create ApiStack
- [ ] FFP-31: Create MonitoringStack
- [ ] FFP-32: Configure Secrets Manager
- [ ] FFP-33: Configure environments
- [ ] FFP-34: Deploy and test

### FFP-9 Progress

- [ ] FFP-35: Create Zod schemas
- [ ] FFP-36: Tenant context utility
- [ ] FFP-37: Registration Lambda
- [ ] FFP-38: Login Lambda
- [ ] FFP-39: Refresh token Lambda
- [ ] FFP-40: Configure API routes
- [ ] FFP-41: Unit tests
- [ ] FFP-42: Integration tests
- [ ] FFP-43: Error handling
- [ ] FFP-44: Structured logging
- [ ] FFP-45: Deploy and test
- [ ] FFP-46: Documentation

---

## Best Practices

### Daily Development Workflow

1. **Select next subtask** from dependency chain
2. **Move to "In Progress"** in Jira
3. **Create feature branch** (if needed): `git checkout -b subtask/FFP-17`
4. **Work on subtask** according to acceptance criteria
5. **Test locally** before marking complete
6. **Commit changes**: `git commit -m "FFP-17: Initialize Turborepo"`
7. **Update Jira** to "Done" with time spent
8. **Update this document** with checkbox ✓

### Time Tracking

After each session:

- Log actual time spent in Jira
- Note any blockers or issues
- Update expected completion date if needed

### Blockers

If blocked on a subtask:

1. Mark as "Blocked" in Jira
2. Document blocker in comment
3. Move to next unblocked subtask
4. Review weekly for unblocking

---

## Key Resources

### Documentation

- [Turborepo Docs](https://turbo.build/repo/docs)
- [SST Docs](https://docs.sst.dev/)
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [Cognito Docs](https://docs.aws.amazon.com/cognito/)
- Project docs: `/project-documentation/`

### Project Files

- `sst.config.ts` - SST configuration
- `turbo.json` - Turborepo pipeline
- `tsconfig.base.json` - TypeScript configuration
- `stacks/` - Infrastructure stacks
- `packages/api/` - Lambda functions

### Commands

```bash
# Turborepo
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages

# SST
pnpm sst dev      # Start dev mode
pnpm sst deploy   # Deploy to AWS
pnpm sst remove   # Remove all resources
```

---

## Next Steps After Sprint 1

Once all subtasks are complete:

1. ✅ **Review infrastructure** in AWS Console
2. ✅ **Test all endpoints** with Postman/curl
3. ✅ **Update project documentation** with deployment guide
4. ✅ **Plan Sprint 2** - Database schema and migrations
5. ✅ **Celebrate** 🎉 - Foundation complete!

---

## Notes

- All time estimates are based on solo part-time development (8h/week)
- Actual time may vary; adjust schedule as needed
- Some subtasks can be worked on in parallel
- Authentication requires infrastructure to be deployed first
- Keep detailed notes on AWS resource configuration
- Test authentication flow thoroughly before moving to frontend

---

**Document Status**: Active  
**Last Updated**: 2025-10-18 22:00  
**Next Review**: After completing FFP-24 (Turborepo setup)
