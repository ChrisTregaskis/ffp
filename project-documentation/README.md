# Fit For Purpose - Project Documentation

## Overview

This directory contains comprehensive documentation for the Fit For Purpose (FFP) physiotherapy platform. The documentation is structured for use with Claude Projects, allowing AI assistance to reference specific documents as needed.

## Documentation Structure

### Core Documents

| Document                     | Purpose                             | When to Reference                             |
| ---------------------------- | ----------------------------------- | --------------------------------------------- |
| **custom-instructions.md**   | Claude Project settings             | Add to Claude Project custom instructions     |
| **architecture.md**          | AWS infrastructure, system design   | Infrastructure questions, deployment planning |
| **authentication.md**        | Cognito setup, multi-tenant auth    | Auth flows, JWT handling, user management     |
| **database-schema.md**       | PostgreSQL schema, RLS policies     | Database design, queries, migrations          |
| **assessment-engine.md**     | Question flows, scoring algorithms  | Assessment logic, program generation          |
| **video-management.md**      | S3 storage, CloudFront CDN          | Video uploads, streaming, progress tracking   |
| **coding-standards.md**      | TypeScript patterns, best practices | Code reviews, new feature development         |
| **deployment.md**            | SST workflows, CI/CD                | Deployment procedures, environment management |
| **monitoring.md**            | CloudWatch setup, alerting          | Debugging, performance issues, incidents      |
| **security.md**              | OWASP compliance, data protection   | Security reviews, compliance questions        |
| **future-considerations.md** | Deferred features, roadmap          | Planning Phase 2+, scaling decisions          |

## Getting Started

### For Solo Development

1. **Add custom-instructions.md to Claude Project**

   - Copy content to Claude Project settings
   - This ensures core context in every conversation

2. **Reference specific docs as needed**

   - Claude will automatically search these when relevant
   - You can explicitly mention: "Check authentication.md for Cognito setup"

3. **Keep docs updated**
   - Update when architecture changes
   - Document new patterns and decisions

### For Onboarding New Developers

1. **Start with README** (this file)
2. **Read custom-instructions.md** - High-level overview
3. **Review architecture.md** - System design
4. **Study authentication.md** - Multi-tenant patterns
5. **Understand database-schema.md** - RLS and data model
6. **Deep dive into core feature docs** as needed

## Quick Reference

### Common Scenarios

**"How do I add a new API endpoint?"**

1. Check `coding-standards.md` for patterns
2. Review `authentication.md` for JWT validation
3. See `database-schema.md` for RLS context

**"How do I deploy to staging?"**

1. Follow `deployment.md` staging workflow
2. Check `monitoring.md` for post-deployment validation

**"I need to add a new assessment question type"**

1. Review `assessment-engine.md` question schema
2. Update Zod schemas per `coding-standards.md`
3. Test with `database-schema.md` RLS patterns

**"Users report slow video loading"**

1. Check `video-management.md` for optimization tips
2. Review `monitoring.md` for CloudFront metrics
3. Consider `future-considerations.md` for transcoding

**"Security audit is coming up"**

1. Review `security.md` OWASP checklist
2. Verify `authentication.md` JWT practices
3. Check `database-schema.md` RLS policies

## Phase 1 MVP Focus

The project is currently in **Phase 1 MVP** with these priorities:

### ✅ Core Features (Building Now)

- Cognito authentication (individual + business)
- Dynamic assessment engine
- Program generation
- Video library (single quality)
- Progress tracking
- Multi-tenant data isolation (RLS)

### ❌ Deferred to Phase 2+ (See future-considerations.md)

- Multi-AZ database
- Video transcoding
- Advanced monitoring (X-Ray, APM)
- MFA / SSO
- White-label customization
- Mobile apps

### 🎯 Success Criteria

- Ship MVP in 6 - 8 months (solo build!)
- Zero critical security vulnerabilities
- Zero tenant data leakage incidents
- 10-50 beta users successfully using platform

## Key Principles

1. **Speed Over Perfection** - Ship fast, iterate on feedback
2. **Solid Foundation** - Establish patterns even if simple
3. **Security First** - Healthcare app = higher security bar
4. **Multi-Tenant Always** - Never skip tenant context validation

## Tech Stack Summary

- **Frontend**: React 18 + TypeScript + TailwindCSS + Amplify
- **Backend**: Node.js + TypeScript + Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security
- **Auth**: AWS Cognito with custom attributes
- **Infrastructure**: SST (Serverless Stack)
- **Storage**: S3 + CloudFront CDN
- **Monitoring**: CloudWatch
- **Validation**: Zod schemas everywhere

## Architecture Diagram (Simplified)

```
User/Browser
    ↓ HTTPS
Amplify (React SPA)
    ↓
CloudFront (Videos) + Cognito (Auth)
    ↓ JWT Token
API Gateway (Validation)
    ↓
Lambda Functions (Business Logic)
    ↓
PostgreSQL RDS (Multi-tenant + RLS) + S3 (Videos)
    ↓
CloudWatch (Logs + Metrics)
```

## Development Workflow

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

## Cost Estimates (Phase 1)

| Service                   | Monthly Cost     |
| ------------------------- | ---------------- |
| Cognito                   | $0 (Free tier)   |
| RDS (t3.small, Single AZ) | ~$30             |
| S3 + CloudFront           | $5-20            |
| Lambda                    | $0-5 (Free tier) |
| API Gateway               | $0-5 (Free tier) |
| Amplify                   | $0 (Free tier)   |
| CloudWatch                | $0-5             |
| Route53                   | $1               |
| **Total**                 | **$36-66/month** |

## Critical Reminders

### Non-Negotiables (Even Phase 1)

- ✅ Multi-tenant data isolation (RLS)
- ✅ Secure authentication (Cognito)
- ✅ Input validation (Zod)
- ✅ Encrypted data at rest and in transit
- ✅ Audit logging (CloudWatch)
- ✅ No sensitive data in logs

### Acceptable Trade-offs (Phase 1)

- ⚠️ Single AZ database (can upgrade later)
- ⚠️ Basic monitoring (can add X-Ray later)
- ⚠️ Single video quality (can add transcoding later)
- ⚠️ 30% test coverage (increase over time)

## Documentation Maintenance

### When to Update

**After Infrastructure Changes:**

- Update `architecture.md` with new services
- Update `deployment.md` with new workflows

**After Security Changes:**

- Update `security.md` with new policies
- Update `authentication.md` if auth flow changes

**After Adding Features:**

- Update relevant domain doc (assessment, video, etc.)
- Update `coding-standards.md` if new patterns emerge

**When Deferring Features:**

- Add to `future-considerations.md` with rationale

### Version Control

- All documentation lives in Git
- Update docs in same PR as code changes
- Tag docs with version releases

## Getting Help

### Internal Resources

- This documentation directory
- Code comments in critical sections
- Test files for examples

### External Resources

- **SST Docs**: https://sst.dev/
- **AWS Docs**: https://docs.aws.amazon.com/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Zod**: https://zod.dev/
- **React**: https://react.dev/

### When Stuck

1. Check relevant documentation file first
2. Review CloudWatch logs with tenant/user context
3. Test in isolation (unit test the specific function)
4. Ask Claude (with context from these docs)
5. Check AWS service limits and quotas

## Project Contact

**Project Lead**: Christopher Tregaskis (Principal Engineer)  
**Last Updated**: October 2025  
**Document Version**: 2.0

---

## Document Index

Quick links to all documentation:

- [Custom Instructions](./custom-instructions.md) - For Claude Project setup
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

**Remember**: You're building a healthcare application as a solo developer. Focus on shipping a secure, functional MVP. Establish solid patterns with simple implementations. Scale what works based on real user feedback.

Good luck! 🚀
