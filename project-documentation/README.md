# Fit For Purpose - Project Documentation

## 🎯 Quick Start

**For Claude conversations:**

1. Custom Instructions already configured (in Project settings)
2. `project-state.md` set as always-loaded
3. Load other docs only when query needs them

**For humans:**

- Start with `project-state.md` - current phase & context
- Reference specific docs as needed

---

## Token Optimization

**Always Loaded** (~800 tokens):

- `project-state.md` - Current phase, status, recent work

**Load On-Demand** (when query needs them):

- All other documentation files

**Result**: 90% token reduction per conversation

---

## Current Status

**Phase**: Planning  
**Next**: Sprint 1 - Application Setup

See `project-state.md` for full details.

---

## Document Index

### 🔄 Always Loaded

- **project-state.md** - Current phase, status, decisions

### 📚 Core Documentation (Load On-Demand)

- **architecture.md** - AWS infrastructure, system design
- **authentication.md** - Cognito, multi-tenant auth
- **database-schema.md** - PostgreSQL schema, RLS
- **assessment-engine.md** - Question flows, scoring
- **video-management.md** - S3, CloudFront, streaming
- **coding-standards.md** - TypeScript patterns
- **testing-strategy.md** - Unit, integration, E2E
- **deployment.md** - SST, CI/CD
- **monitoring.md** - CloudWatch, alerting
- **security.md** - OWASP compliance
- **future-considerations.md** - Deferred features

### 🔧 Implementation Reference (Load When Needed)

- **REFERENCE.md** - Commands, costs, monorepo structure, quick refs

### 📋 Sprint Planning (Modular)

- **sprint-planning/jira-standards/** - Load `LOAD-THIS-FIRST.md` for guide

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

1. **Multi-Tenant** - RLS-enforced data isolation
2. **Security First** - Healthcare-grade security
3. **Solid Foundation** - SOLID patterns, clean architecture
4. **Speed Over Perfection** - Ship fast, iterate

---

## Documentation Maintenance

**After every session:**

- Update `project-state.md` recent context

**When starting new phase:**

- Update `project-state.md` current phase

**After major decisions:**

- Add to `project-state.md` key decisions
- Update relevant domain docs

---

## Quick Reference

**"Where are we in the project?"**  
→ `project-state.md`

**"How does [feature] work?"**  
→ Load relevant domain doc

**"What are the turbo/SST commands?"**  
→ `REFERENCE.md`

**"What's the cost estimate?"**  
→ `REFERENCE.md`

**"What's the database schema?"**  
→ `database-schema.md`

**"How do I create Jira tickets?"**  
→ `sprint-planning/jira-standards/LOAD-THIS-FIRST.md`

**"What's deferred to Phase 2?"**  
→ `future-considerations.md`

---

**Local Path**: `<project-root>/project-documentation`

**Last Updated**: October 17, 2025  
**Version**: 4.0
