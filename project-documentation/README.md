# Fit For Purpose - Project Documentation

## Quick Start

**For Claude conversations:**

1. Custom Instructions already configured (in Project settings)
2. Load docs only when query needs them

**For humans:**

- Check Jira for current sprint context
- Reference specific docs as needed

---

## Document Index

### Core Documentation (Load On-Demand)

- **architecture.md** — AWS infrastructure, system design
- **authentication.md** — Cognito, multi-tenant auth
- **database-schema.md** — PostgreSQL schema, RLS
- **assessment-engine.md** — Question flows, scoring
- **video-management.md** — S3, CloudFront, streaming
- **coding-standards.md** — TypeScript patterns
- **testing-strategy.md** — Unit, integration, E2E
- **deployment.md** — SST, CI/CD
- **monitoring.md** — CloudWatch, alerting
- **security.md** — OWASP compliance
- **future-considerations.md** — Deferred features

### Implementation Reference (Load When Needed)

- **REFERENCE.md** — Commands, costs, monorepo structure, quick refs

### Sprint Planning (Modular)

- **`.claude/sprint-planning/jira-standards/`** — Ticket templates (Epic, Story, Task, Bug). Load `README.md` for guide.

---

## Tech Stack Quick Ref

- **Version Control**: GitHub (private repository)
- **Monorepo**: Turborepo
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js/TypeScript + Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with RLS
- **ORM**: Drizzle
- **Auth**: Cognito
- **Infrastructure**: SST
- **CI/CD**: GitHub Actions (Phase 1: testing only, Phase 2+: full automation)

See `architecture.md` for full stack details, `REFERENCE.md` for commands.

---

## Core Principles

1. **Multi-Tenant** — RLS-enforced data isolation
2. **Security First** — Healthcare-grade security
3. **Solid Foundation** — SOLID patterns, clean architecture
4. **Speed Over Perfection** — Ship fast, iterate

---

## Quick Reference

**"How does [feature] work?"**
→ Load relevant domain doc

**"What are the turbo/SST commands?"**
→ `REFERENCE.md`

**"What's the cost estimate?"**
→ `REFERENCE.md`

**"What's the database schema?"**
→ `database-schema.md`

**"How do I create Jira tickets?"**
→ `.claude/sprint-planning/jira-standards/README.md`

**"What's deferred to Phase 2?"**
→ `future-considerations.md`

---

**Local Path**: `<project-root>/project-documentation`
