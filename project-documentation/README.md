# Fit For Purpose - Project Documentation

## Overview

This directory contains comprehensive documentation for the Fit For Purpose (FFP) physiotherapy platform. The documentation is **optimised for token efficiency** - Claude loads only what's needed for each conversation.

## 🎯 Quick Start

### For New Conversations with Claude

1. **Claude Project Instructions**: Use `custom-instructions.md`
2. **Claude Project Knowledge**: Add `project-state.md` + all detailed docs
3. **Current Phase**: Check `project-state.md` to see where we are

### Token Optimisation Strategy

**Always Loaded** (~1.2K tokens):

- `custom-instructions.md` - Core context
- `project-state.md` - Current phase & recent work

**Loaded On-Demand** (when query needs them):

- All other detailed documentation files

**Result**: 87% reduction in token usage per conversation

---

## Documentation Structure

### 🔄 State Tracking (Always Loaded)

| Document             | Purpose                          | Update Frequency |
| -------------------- | -------------------------------- | ---------------- |
| **project-state.md** | Current phase, status, decisions | Every session    |

### 📚 Core Documents (Load On-Demand)

| Document                     | Purpose                             | When to Load                     |
| ---------------------------- | ----------------------------------- | -------------------------------- |
| **architecture.md**          | AWS infrastructure, system design   | Infrastructure questions         |
| **authentication.md**        | Cognito, multi-tenant auth          | Auth flows, JWT, user management |
| **database-schema.md**       | PostgreSQL schema, RLS policies     | Database design, queries         |
| **assessment-engine.md**     | Question flows, scoring algorithms  | Assessment logic                 |
| **video-management.md**      | S3, CloudFront, streaming           | Video features                   |
| **coding-standards.md**      | TypeScript patterns, best practices | Code reviews, new features       |
| **testing-strategy.md**      | Unit, integration, E2E testing      | Writing tests, test patterns     |
| **deployment.md**            | SST workflows, CI/CD                | Deployment procedures            |
| **monitoring.md**            | CloudWatch, alerting                | Debugging, performance           |
| **security.md**              | OWASP compliance, data protection   | Security reviews                 |
| **future-considerations.md** | Deferred features, roadmap          | Planning Phase 2+                |

---

## Current Project State

**Phase**: Planning  
**Status**: Architecture & ERD design  
**Next**: Sprint 1 - Application Setup

See `project-state.md` for details.

---

## Phase Overview

### ✅ Prototype Phase (COMPLETE)

All core flows prototyped in Figma. UX design finalized.

### 🔄 Planning Phase (CURRENT)

- Finalize database schema
- Document authentication patterns
- Establish code standards
- Plan Sprint 1 scope

### ⏸️ Sprint Phases (UPCOMING)

- **Sprint 1**: Application setup (SST, Cognito, RDS)
- **Sprint 2**: Assessment engine
- **Sprint 3**: Video management
- **Sprint 4**: User dashboards
- **Sprint 5**: Business portal
- **Sprint 6**: Company portal

---

## Project Context

### Tech Stack

- **Monorepo**: Turborepo (build orchestration, caching)
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js/TypeScript + Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security
- **ORM**: Drizzle (type-safe, lightweight)
- **Auth**: AWS Cognito
- **Infrastructure**: SST (Serverless Stack)
- **Storage**: S3 + CloudFront
- **Validation**: Zod (schema validation)

### Core Principles

1. **Multi-Tenant Architecture** - RLS-enforced data isolation
2. **Security First** - Healthcare-grade security (OWASP Top 10)
3. **Solid Foundation** - SOLID patterns, clean architecture
4. **Speed Over Perfection** - Ship fast, iterate on feedback

### Phase 1 MVP Scope

✅ Individual + business accounts  
✅ Dynamic assessment engine  
✅ Program generation  
✅ Video library (single quality)  
✅ Progress tracking  
✅ Basic monitoring

❌ Multi-AZ RDS (deferred)  
❌ Video transcoding (deferred)  
❌ MFA/SSO (deferred)  
❌ Advanced analytics (deferred)

---

## Documentation Maintenance

### When to Update

**After Every Session:**

- Update `project-state.md` "Recent Session Context"

**When Starting New Phase:**

- Update `project-state.md` "Current Phase"
- Update "Status" section
- Add phase-specific focus areas

**After Major Decisions:**

- Add to "Key Decisions Made" in `project-state.md`
- Update relevant detailed documentation

**After Code Changes:**

- Update relevant domain docs (architecture, database, etc.)
- Update `coding-standards.md` if new patterns emerge

---

## Getting Help

### Internal Resources

- Start with `project-state.md` for current context
- Reference detailed docs as needed
- Code comments in critical sections
- Test files for examples

### External Resources

- **SST Docs**: https://sst.dev/
- **AWS Docs**: https://docs.aws.amazon.com/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Zod**: https://zod.dev/
- **React**: https://react.dev/

---

## Development Workflow

### Planning Phase (Current)

```bash
# 1. Review and refine documentation
# 2. Make architectural decisions
# 3. Finalize database schema
# 4. Plan Sprint 1 scope
```

### Implementation Phases (Future)

#### Turborepo Commands

```bash
# Build all packages (with caching)
turbo build

# Run tests across all packages (parallel)
turbo test

# Lint all packages (parallel)
turbo lint

# Type-check all packages
turbo typecheck

# Build only changed packages
turbo build --filter=[HEAD^1]

# Run specific package
turbo build --filter=@ffp/core
```

#### SST + Development Commands

```bash
# Local development with hot-reload
npm run dev
# or
turbo dev

# Deploy to environment
npm run deploy --stage dev

# View logs
npm run logs -- --stage dev --function assessments

# Database migrations
turbo db:migrate --filter=@ffp/core
```

#### Monorepo Benefits

- **Fast Builds**: Turborepo caches unchanged packages (~5s vs ~60s)
- **Parallel Tasks**: Tests run 3x faster across packages
- **Type Safety**: Shared `@ffp/core` types across frontend/backend
- **Incremental**: Only rebuild affected packages

---

## Cost Estimates (Phase 1)

| Service         | Monthly Cost     |
| --------------- | ---------------- |
| Cognito         | $0 (Free tier)   |
| RDS (t3.small)  | ~$30             |
| S3 + CloudFront | $5-20            |
| Lambda          | $0-5 (Free tier) |
| API Gateway     | $0-5 (Free tier) |
| Amplify         | $0 (Free tier)   |
| CloudWatch      | $0-5             |
| Route53         | $1               |
| **Total**       | **$36-66/month** |

---

## Success Criteria

### Technical

- API response time <500ms (p95)
- Video start time <5 seconds
- System uptime >99%
- Zero critical security vulnerabilities
- Zero tenant data leakage incidents

### Development Velocity

- Ship MVP as solo developer
- Deploy to dev daily (once in implementation)
- Deploy to production weekly (post-launch)

---

## Monorepo Structure

```
ffp/
├── turbo.json              # Turborepo pipeline config
├── package.json            # Root workspace
├── packages/
│   ├── core/              # Shared logic (@ffp/core)
│   ├── functions/         # Lambda handlers
│   └── web/               # React frontend
├── stacks/                # SST infrastructure
└── schema/                # Drizzle schemas
```

### Workspace Dependencies

```
@ffp/web → depends on → @ffp/core
@ffp/functions → depends on → @ffp/core
```

## Quick Reference

### Common Scenarios

**"I need to understand the database design"**
→ Load `database-schema.md`

**"How should I structure authentication?"**
→ Load `authentication.md`

**"What are the security requirements?"**
→ Load `security.md`

**"Where are we in the project?"**
→ Check `project-state.md`

**"What's deferred to Phase 2?"**
→ Check `future-considerations.md`

**"How do I write tests?"**
→ Load `testing-strategy.md`

---

## Testing Strategy

### Hybrid Approach

**95% Fast Unit Tests** (Mocked DB):

- Service layer business logic
- Validation logic (Zod schemas)
- Frontend components
- Utility functions

**5% Critical Integration Tests** (Real Dev DB):

- RLS multi-tenant isolation
- Database constraints
- Authentication flows

**Phase 1 Coverage Goal**: 30% overall, 80%+ on critical paths

### Testing Stack

- **Vitest** - Fast, TypeScript-native test runner
- **@testing-library/react** - Component testing
- **Playwright** - E2E tests (critical paths only)
- **Dev Database** - RLS integration tests with transaction rollbacks

### Sprint Planning Rule

**MANDATORY**: Minimum of **2 functional tests** required per user story.

- Small story (1-3 points): 2 unit tests
- Medium story (4-6 points): 2 unit + 1 integration test
- Large story (7+ points): 3 unit + 1 integration + 1 E2E test

### Quick Commands

```bash
# Fast unit tests (during development)
npm run test:unit

# RLS tests (before commits)
npm run test:rls

# Watch mode (TDD)
npm run test:watch

# E2E tests (before deployments)
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Key Priorities

✅ **Must Test**:

- RLS policies (100% coverage)
- Authentication/JWT parsing (100%)
- Input validation (80%)
- Assessment scoring (80%)

⚠️ **Should Test**:

- Repository CRUD operations
- Service layer logic
- Major UI components

💡 **Nice-to-Have**:

- Edge cases
- Performance benchmarks
- Accessibility

See `testing-strategy.md` for full details and examples.

---

## Document Index

- [Project State](./project-state.md) - **START HERE** - Current phase & context
- [Custom Instructions](./custom-instructions.md) - For Claude Project setup
- [Architecture](./architecture.md) - AWS infrastructure overview
- [Authentication](./authentication.md) - Cognito and multi-tenant auth
- [Database Schema](./database-schema.md) - PostgreSQL design and RLS
- [Assessment Engine](./assessment-engine.md) - Core feature documentation
- [Video Management](./video-management.md) - S3, CloudFront, streaming
- [Coding Standards](./coding-standards.md) - TypeScript patterns
- [Testing Strategy](./testing-strategy.md) - Unit, integration, and E2E testing
- [Deployment](./deployment.md) - SST and CI/CD workflows
- [Monitoring](./monitoring.md) - CloudWatch setup and alerting
- [Security](./security.md) - OWASP compliance and best practices
- [Future Considerations](./future-considerations.md) - Deferred features

---

## Project Contact

**Project Lead**: Christopher Tregaskis (Principal Engineer)  
**Last Updated**: October 15, 2025  
**Document Version**: 3.0

---

**Remember**: This is a healthcare application. Security and multi-tenant isolation are non-negotiable. Build solid patterns with simple implementations. Ship fast, iterate on real feedback.
