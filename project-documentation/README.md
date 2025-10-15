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

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js/TypeScript + Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security
- **Auth**: AWS Cognito
- **Infrastructure**: SST (Serverless Stack)
- **Storage**: S3 + CloudFront

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

```bash
# Local development with hot-reload
npm run sst dev

# Run tests
npm run test
npm run test:e2e

# Deploy to environment
npm run sst deploy --stage dev

# View logs
npm run sst logs --stage dev --function assessments
```

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

---

## Document Index

- [Project State](./project-state.md) - **START HERE** - Current phase & context
- [Custom Instructions (Optimized)](./custom-instructions-optimized.md) - For Claude Project setup
- [Architecture](./architecture.md) - AWS infrastructure overview
- [Authentication](./authentication.md) - Cognito and multi-tenant auth
- [Database Schema](./database-schema.md) - PostgreSQL design and RLS
- [Assessment Engine](./assessment-engine.md) - Core feature documentation
- [Video Management](./video-management.md) - S3, CloudFront, streaming
- [Coding Standards](./coding-standards.md) - TypeScript patterns
- [Deployment](./deployment.md) - SST and CI/CD workflows
- [Monitoring](./monitoring.md) - CloudWatch setup and alerting
- [Security](./security.md) - OWASP compliance and best practices
- [Future Considerations](./future-considerations.md) - Deferred features

---

## Project Contact

**Project Lead**: Christopher Tregaskis (Principal Engineer)  
**Last Updated**: October 15, 2025  
**Document Version**: 3.0 (Optimized)

---

**Remember**: This is a healthcare application. Security and multi-tenant isolation are non-negotiable. Build solid patterns with simple implementations. Ship fast, iterate on real feedback.
