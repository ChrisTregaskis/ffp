# Sprint 1 - Subtasks Summary

**Generated**: 2025-10-18  
**Updated**: 2025-10-19 16:15  
**Project**: FFP (Fit For Purpose)  
**Sprint**: Sprint 1 - Foundation Infrastructure

---

## Overview

This document summarises all subtasks created for Sprint 1 User Stories. Each story has been broken down into actionable subtasks with time estimates and clear acceptance criteria.

**Total Stories**: 8  
**Total Subtasks**: 82  
**Estimated Time**: ~171 hours (~21.4 weeks at 8h/week)

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

---

## Story 3: FFP-9 - Cognito Authentication

**Story Points**: 8 points (~64 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Highest  
**Status**: To Do

**Story URL**: [FFP-9](https://ctregaskis.atlassian.net/browse/FFP-9)

### Subtasks Summary (12 subtasks, ~34 hours)

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

---

## Story 4: FFP-10 - PostgreSQL Schema with RLS

**Story Points**: 8 points (~64 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Highest  
**Status**: To Do

**Story URL**: [FFP-10](https://ctregaskis.atlassian.net/browse/FFP-10)

### Subtasks Summary (9 subtasks, ~31 hours)

| #   | Key        | Title                                              | Estimate | Dependencies   | Status | URL                                                    |
| --- | ---------- | -------------------------------------------------- | -------- | -------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-47** | Create tenants table schema                        | 2h       | FFP-8 complete | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-47) |
| 2   | **FFP-48** | Create users table schema                          | 3h       | FFP-47         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-48) |
| 3   | **FFP-49** | Enable RLS on users table                          | 2h       | FFP-48         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-49) |
| 4   | **FFP-50** | Create setRLSContext utility function              | 3h       | FFP-49         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-50) |
| 5   | **FFP-51** | Create database indexes                            | 2h       | FFP-48         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-51) |
| 6   | **FFP-52** | Write unit tests for RLS utilities                 | 3h       | FFP-50         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-52) |
| 7   | **FFP-53** | Write integration test for cross-tenant isolation  | 4h       | FFP-52         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-53) |
| 8   | **FFP-54** | Write integration test for RLS context application | 4h       | FFP-52         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-54) |
| 9   | **FFP-55** | Update documentation                               | 1h       | FFP-53, FFP-54 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-55) |

**Total Time**: 24 hours (~3 weeks at 8h/week)

**Key Focus**: Multi-tenant data isolation via Row-Level Security (RLS) - **Critical security requirement**

---

## Story 5: FFP-11 - Drizzle ORM Setup

**Story Points**: 5 points (~40 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: High  
**Status**: To Do

**Story URL**: [FFP-11](https://ctregaskis.atlassian.net/browse/FFP-11)

### Subtasks Summary (9 subtasks, ~22 hours)

| #   | Key        | Title                                  | Estimate | Dependencies    | Status | URL                                                    |
| --- | ---------- | -------------------------------------- | -------- | --------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-56** | Install and configure Drizzle packages | 1h       | FFP-8 complete  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-56) |
| 2   | **FFP-57** | Create drizzle.config.ts               | 2h       | FFP-56          | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-57) |
| 3   | **FFP-58** | Define schema for tenants table        | 2h       | FFP-56, FFP-57  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-58) |
| 4   | **FFP-59** | Define schema for users table          | 2h       | FFP-58          | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-59) |
| 5   | **FFP-60** | Setup migration system                 | 2h       | FFP-58, FFP-59  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-60) |
| 6   | **FFP-61** | Configure connection pooling           | 4h       | None (parallel) | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-61) |
| 7   | **FFP-62** | Write unit tests                       | 4h       | All above       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-62) |
| 8   | **FFP-63** | Write integration tests                | 4h       | All above       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-63) |
| 9   | **FFP-64** | Documentation and usage guide          | 1h       | All above       | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-64) |

**Total Time**: 22 hours (~2.75 weeks at 8h/week)

**Key Focus**: Type-safe database access with Drizzle ORM, optimised connection pooling for Lambda

---

## Story 6: FFP-12 - Testing Framework Configuration

**Story Points**: 5 points (~40 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: High  
**Status**: To Do

**Story URL**: [FFP-12](https://ctregaskis.atlassian.net/browse/FFP-12)

### Subtasks Summary (10 subtasks, ~22 hours)

| #   | Key        | Title                                | Estimate | Dependencies        | Status | URL                                                    |
| --- | ---------- | ------------------------------------ | -------- | ------------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-65** | Install and Configure Vitest         | 2h       | None                | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-65) |
| 2   | **FFP-66** | Create Vitest Configuration File     | 2h       | FFP-65              | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-66) |
| 3   | **FFP-67** | Install and Configure Playwright     | 2h       | None                | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-67) |
| 4   | **FFP-68** | Create Playwright Configuration File | 2h       | FFP-67              | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-68) |
| 5   | **FFP-69** | Install Mock Service Worker (MSW)    | 1h       | None                | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-69) |
| 6   | **FFP-70** | Configure MSW Server and Handlers    | 3h       | FFP-69, FFP-66      | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-70) |
| 7   | **FFP-71** | Create Test Helper Utilities         | 4h       | Database setup      | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-71) |
| 8   | **FFP-72** | Write Sample Unit Tests              | 2h       | FFP-66, FFP-71      | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-72) |
| 9   | **FFP-73** | Write Sample E2E Test                | 2h       | FFP-68, FFP-8 (web) | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-73) |
| 10  | **FFP-75** | Update Testing Documentation         | 2h       | All previous        | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-75) |

**Total Time**: 22 hours (~2.75 weeks at 8h/week)

**Note**: FFP-74 (Write Sample MSW Mock Test) may also exist - verify in Jira.

**Key Focus**: Comprehensive testing infrastructure with Vitest (unit), Playwright (E2E), and MSW (API mocking) to achieve 30% coverage target

---

## Story 7: FFP-14 - CloudWatch Logging

**Story Points**: 3 points (~24 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: High  
**Status**: To Do

**Story URL**: [FFP-14](https://ctregaskis.atlassian.net/browse/FFP-14)

### Subtasks Summary (7 subtasks, ~14 hours)

| #   | Key        | Title                                           | Estimate | Dependencies    | Status | URL                                                    |
| --- | ---------- | ----------------------------------------------- | -------- | --------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-76** | Create Logger Class with Structured JSON Output | 2h       | None            | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-76) |
| 2   | **FFP-77** | Add Correlation ID Generation Helper            | 1h       | FFP-76          | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-77) |
| 3   | **FFP-78** | Configure CloudWatch Log Groups and Retention   | 3h       | None (parallel) | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-78) |
| 4   | **FFP-79** | Integrate Logger with Lambda Functions          | 3h       | FFP-76, FFP-77  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-79) |
| 5   | **FFP-80** | Write Unit Tests for Logger Class               | 2h       | FFP-76          | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-80) |
| 6   | **FFP-81** | Write Integration Tests for CloudWatch Logging  | 2h       | FFP-78, FFP-79  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-81) |
| 7   | **FFP-82** | Update Documentation with Logging Patterns      | 1h       | FFP-76, FFP-78  | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-82) |

**Total Time**: 14 hours (~1.75 weeks at 8h/week)

**Key Focus**: Structured JSON logging with CloudWatch for debugging multi-tenant applications. Includes tenant/user context tracking and correlation IDs for request tracing.

---

## Story 8: FFP-15 - Error Handling Patterns

**Story Points**: 3 points (~24 hours)  
**Epic**: FFP-1 (Application Setup & Foundation)  
**Priority**: Medium  
**Status**: To Do

**Story URL**: [FFP-15](https://ctregaskis.atlassian.net/browse/FFP-15)

### Subtasks Summary (7 subtasks, ~15 hours)

| #   | Key        | Title                                             | Estimate | Dependencies           | Status | URL                                                    |
| --- | ---------- | ------------------------------------------------- | -------- | ---------------------- | ------ | ------------------------------------------------------ |
| 1   | **FFP-83** | Create custom error classes                       | 2h       | None                   | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-83) |
| 2   | **FFP-84** | Implement error handler middleware                | 4h       | FFP-83, FFP-14         | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-84) |
| 3   | **FFP-85** | Add error logging with context                    | 2h       | FFP-83, FFP-84, FFP-14 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-85) |
| 4   | **FFP-86** | Write unit tests for error classes                | 2h       | FFP-83                 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-86) |
| 5   | **FFP-87** | Write unit tests for error middleware             | 2h       | FFP-83, FFP-84, FFP-14 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-87) |
| 6   | **FFP-88** | Write integration tests for error handling        | 2h       | FFP-83, FFP-84, FFP-85 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-88) |
| 7   | **FFP-89** | Update documentation with error handling patterns | 1h       | FFP-83, FFP-84, FFP-85 | To Do  | [View](https://ctregaskis.atlassian.net/browse/FFP-89) |

**Total Time**: 15 hours (~1.9 weeks at 8h/week)

**Key Focus**: Custom error classes with standardised HTTP responses, structured error logging with tenant/user context, and comprehensive testing. Integrates with FFP-14 (Logger) for consistent error handling patterns across all Lambda functions.

---

## Overall Sprint 1 Timeline

**Capacity**: 8 hours/week  
**Total Estimated Time**: ~171 hours  
**Expected Duration**: ~21.4 weeks (~5.4 months)

### Story Completion Estimates

| Story     | Title                      | Subtasks | Hours    | Weeks          |
| --------- | -------------------------- | -------- | -------- | -------------- |
| FFP-7     | Turborepo Monorepo         | 8        | 13h      | 1.6            |
| FFP-8     | SST Infrastructure         | 10       | 27h      | 3.4            |
| FFP-9     | Cognito Authentication     | 12       | 34h      | 4.3            |
| FFP-10    | PostgreSQL Schema with RLS | 9        | 24h      | 3.0            |
| FFP-11    | Drizzle ORM Setup          | 9        | 22h      | 2.75           |
| FFP-12    | Testing Framework          | 10       | 22h      | 2.75           |
| FFP-14    | CloudWatch Logging         | 7        | 14h      | 1.75           |
| FFP-15    | Error Handling Patterns    | 7        | 15h      | 1.9            |
| **Total** |                            | **82**   | **171h** | **21.4 weeks** |

**Note**: Actual subtask estimates total 171h. Sprint 1 will take approximately **21.4 weeks (~5.4 months)** at 8h/week capacity.

---

## Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-5, ~40 hours)

**Week 1-2: Turborepo Setup**

- FFP-17 through FFP-24 (13 hours)
- Establish monorepo structure
- ✅ Checkpoint: All packages build successfully

**Week 3-5: Infrastructure Deployment**

- FFP-25 through FFP-34 (27 hours)
- Deploy all AWS infrastructure
- ✅ Checkpoint: Infrastructure deployed and tested

### Phase 2: Authentication (Weeks 6-9, ~34 hours)

**Week 6-9: Cognito Authentication**

- FFP-35 through FFP-46 (34 hours)
- Implement registration and login
- ✅ Checkpoint: Users can register and authenticate

### Phase 3: Database Layer (Weeks 10-15, ~46 hours)

**Week 10-12: PostgreSQL Schema**

- FFP-47 through FFP-55 (24 hours)
- Implement RLS for multi-tenant isolation
- ✅ Checkpoint: Database schema deployed with RLS working

**Week 13-15: Drizzle ORM**

- FFP-56 through FFP-64 (22 hours)
- Type-safe database access
- ✅ Checkpoint: ORM configured and tested

### Phase 4: Testing, Logging & Error Handling (Weeks 16-22, ~51 hours)

**Week 16-18: Testing Framework**

- FFP-65 through FFP-75 (22 hours)
- Vitest, Playwright, and MSW setup
- ✅ Checkpoint: All testing frameworks configured and working

**Week 19-20: CloudWatch Logging**

- FFP-76 through FFP-82 (14 hours)
- Structured JSON logging with tenant/user context
- ✅ Checkpoint: Logger class integrated with Lambda functions

**Week 21-22: Error Handling Patterns**

- FFP-83 through FFP-89 (15 hours)
- Custom error classes and middleware
- Error logging with tenant/user context
- ✅ Checkpoint: Consistent error handling across all Lambda functions

---

## Progress Tracking

### FFP-7 Progress (Turborepo)

- [ ] FFP-17: Initialize Turborepo
- [ ] FFP-18: Create package structure
- [ ] FFP-19: Configure workspace dependencies
- [ ] FFP-20: Setup TypeScript paths
- [ ] FFP-21: Configure ESLint/Prettier
- [ ] FFP-22: Configure build pipeline
- [ ] FFP-23: Write tests
- [ ] FFP-24: Document structure

### FFP-8 Progress (Infrastructure)

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

### FFP-9 Progress (Authentication)

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

### FFP-10 Progress (Database Schema)

- [ ] FFP-47: Create tenants table
- [ ] FFP-48: Create users table
- [ ] FFP-49: Enable RLS
- [ ] FFP-50: Create setRLSContext utility
- [ ] FFP-51: Create indexes
- [ ] FFP-52: Unit tests
- [ ] FFP-53: Cross-tenant isolation test
- [ ] FFP-54: RLS context test
- [ ] FFP-55: Documentation

### FFP-11 Progress (Drizzle ORM)

- [ ] FFP-56: Install packages
- [ ] FFP-57: Create config
- [ ] FFP-58: Define tenants schema
- [ ] FFP-59: Define users schema
- [ ] FFP-60: Setup migrations
- [ ] FFP-61: Configure connection pooling
- [ ] FFP-62: Unit tests
- [ ] FFP-63: Integration tests
- [ ] FFP-64: Documentation

### FFP-12 Progress (Testing Framework)

- [ ] FFP-65: Install Vitest
- [ ] FFP-66: Vitest configuration
- [ ] FFP-67: Install Playwright
- [ ] FFP-68: Playwright configuration
- [ ] FFP-69: Install MSW
- [ ] FFP-70: Configure MSW handlers
- [ ] FFP-71: Create test helpers
- [ ] FFP-72: Sample unit tests
- [ ] FFP-73: Sample E2E test
- [ ] FFP-74: MSW mock test (verify in Jira)
- [ ] FFP-75: Testing documentation

### FFP-14 Progress (CloudWatch Logging)

- [ ] FFP-76: Create Logger Class
- [ ] FFP-77: Add Correlation ID Helper
- [ ] FFP-78: Configure CloudWatch Log Groups
- [ ] FFP-79: Integrate Logger with Lambdas
- [ ] FFP-80: Write Unit Tests
- [ ] FFP-81: Write Integration Tests
- [ ] FFP-82: Update Documentation

### FFP-15 Progress (Error Handling Patterns)

- [ ] FFP-83: Create custom error classes
- [ ] FFP-84: Implement error handler middleware
- [ ] FFP-85: Add error logging with context
- [ ] FFP-86: Write unit tests for error classes
- [ ] FFP-87: Write unit tests for error middleware
- [ ] FFP-88: Write integration tests for error handling
- [ ] FFP-89: Update documentation with error handling patterns

---

## Key Milestones

### Milestone 1: Foundation Complete (Week 5)

✅ Turborepo configured  
✅ All AWS infrastructure deployed  
✅ Dev environment accessible

### Milestone 2: Authentication Complete (Week 9)

✅ User registration working  
✅ Login with JWT tokens  
✅ API Gateway validates tokens

### Milestone 3: Database Complete (Week 15)

✅ PostgreSQL schema deployed  
✅ RLS enforcing multi-tenant isolation  
✅ Drizzle ORM configured  
✅ Type-safe database queries working

### Milestone 4: Testing Complete (Week 18)

✅ Vitest configured for unit tests  
✅ Playwright configured for E2E tests  
✅ MSW configured for API mocking  
✅ Test helpers created  
✅ Sample tests passing  
✅ 30% coverage target achievable

### Milestone 5: Logging & Error Handling Complete (Week 22)

✅ Logger class with structured JSON output  
✅ Correlation IDs for request tracing  
✅ CloudWatch log groups configured  
✅ Logger integrated with Lambda functions  
✅ Tenant/user context in all logs  
✅ Custom error classes created  
✅ Error handler middleware implemented  
✅ Error logging with context  
✅ Comprehensive error handling tests  
✅ Documentation updated with error patterns

**🎉 Sprint 1 Complete**: Foundation infrastructure ready for Sprint 2 (Assessment Engine)

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
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Project docs: `/project-documentation/`

### Project Files

- `sst.config.ts` - SST configuration
- `turbo.json` - Turborepo pipeline
- `tsconfig.base.json` - TypeScript configuration
- `stacks/` - Infrastructure stacks
- `packages/api/` - Lambda functions
- `packages/database/` - Database schemas and migrations

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

# Database
pnpm db:generate  # Generate migration
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema (dev only)
```

---

## Critical Reminders

### Security Non-Negotiables

1. **RLS Must Be Tested**: Cross-tenant isolation tests are mandatory
2. **Never Skip Tenant Context**: Always set `app.tenant_id` before queries
3. **Test Data Isolation**: Integration tests must verify RLS blocking
4. **Connection Pooling**: Max 10 connections for Lambda optimization

### Quality Gates

Before marking a story as "Done":

- [ ] All subtasks completed
- [ ] All tests passing (unit + integration)
- [ ] Documentation updated
- [ ] Code reviewed (self-review minimum)
- [ ] Deployed and tested in dev environment
- [ ] No critical security vulnerabilities

---

## Next Steps After Sprint 1

Once all subtasks are complete:

1. ✅ **Review infrastructure** in AWS Console
2. ✅ **Test all endpoints** with Postman/curl
3. ✅ **Verify RLS** with integration tests
4. ✅ **Update project documentation** with deployment guide
5. ✅ **Plan Sprint 2** - Assessment Engine Core
6. ✅ **Celebrate** 🎉 - Foundation complete!

---

**Document Status**: Active  
**Last Updated**: 2025-10-19 16:15  
**Total Stories**: 7  
**Total Subtasks**: 75  
**Next Review**: After completing FFP-24 (Turborepo setup)

---

## Recent Updates

### 2025-10-19 16:30 - FFP-15 Subtasks Created

- Created 7 subtasks for FFP-15 (Error Handling Patterns)
- Total time: 15 hours (~1.9 weeks)
- Focus on custom error classes, middleware, and error logging
- Dependencies: FFP-83 → FFP-84 → FFP-85 → FFP-88; FFP-86 and FFP-87 in parallel
- Requires FFP-14 (Logger) complete before FFP-84 and FFP-85
- Updated overall sprint estimates: 82 subtasks, 171 hours, 21.4 weeks

### 2025-10-19 16:15 - FFP-14 Subtasks Created

- Created 7 subtasks for FFP-14 (CloudWatch Logging)
- Total time: 14 hours (~1.75 weeks)
- Focus on structured JSON logging with tenant/user context
- Dependencies: FFP-76 → FFP-77 → FFP-79 → FFP-81
- FFP-78 can be done in parallel
- Updated overall sprint estimates: 75 subtasks, 156 hours, 19.5 weeks
