# Chat 2 Prompt: Create Epics in Jira (All 6 Sprints)

**Before continuing, load these files for Sprint 1 planning context:**

- jira-standards/epic-standards.md
- jira-standards/story-standards.md
- jira-standards/story-points.md

**Context**: This is Chat 2 of the FFP sprint planning process. Chat 1 has defined our Jira ticket standards (see `project-documentation/sprint-planning/jira-standards`).

**Project**: Solo developer building FFP - multi-tenant physiotherapy SaaS platform

**Documentation Location**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/`

**Jira Details**:

- Cloud ID: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- Site: `https://ctregaskis.atlassian.net`
- Project Key: `SCRUM`
- Epic Issue Type ID: `10001`

---

## Objective

Create **6 Epics directly in Jira** (one per sprint) using the Atlassian API.

**Important**:

- Create actual Jira issues, NOT markdown files
- Use the ticket standards from Chat 1
- Focus on Epic-level overview only - no User Story creation yet

---

## Sprint Structure

### Sprint 1: Application Setup

**Scope:**

- Turborepo setup (monorepo, build caching)
- Linting, Prettier, TypeScript config
- Pre-commit/pre-push hooks
- SST infrastructure foundation
- Cognito authentication
- RDS PostgreSQL setup
- API Gateway structure
- Web application scaffold
- Basic web login/logout flow Web/API
- Testing patterns (Vitest, Playwright, MSW)
- Environment configuration (.env, AWS Parameter Store)
- CI/CD foundation (GitHub Actions)
- CloudWatch structured logging
- Error handling patterns
- GitHub Copilot + Actions for PR reviews

### Sprint 2: Assessment Engine Core

**Scope:**

- JSON-driven question schemas (Zod validation)
- Dynamic question trees with conditional logic
- Scoring engine (weighted, categorical, rule-based strategies)
- PostgreSQL assessment storage
- Assessment API endpoints
- Frontend assessment flow (multi-step wizard)
- Progress saving (resume capability)
- Testing: Assessment logic, conditional branching

### Sprint 3: Video Management & Streaming

**Scope:**

- S3 video storage structure
- CloudFront distribution setup
- Signed URL generation
- Video metadata management (PostgreSQL)
- Video search/filtering
- Frontend video player
- Progress tracking (completion states)
- Testing: Access control, streaming

### Sprint 4: User Dashboards & Progress Tracking

**Scope:**

- User dashboard (programs, progress overview)
- Program session view (exercises, videos)
- Progress tracking (per video/session)
- Workout completion flow
- Analytics queries (user engagement)
- Frontend: Dashboard components, progress charts
- Testing: Progress calculations, RLS isolation

### Sprint 5: Business Portal

**Scope:**

- Business owner onboarding
- User invitation flow (AdminCreateUserCommand)
- Sub-user management (list, roles, permissions)
- Business dashboard (team overview)
- Program visibility (view sub-user programs)
- Multi-tenant isolation validation
- Testing: Business flows, tenant isolation

### Sprint 6: Company Management Portal

**Scope:**

- System admin authentication
- Content management (video library CRUD)
- Assessment template management
- User/tenant management
- Analytics dashboard (platform-wide metrics)
- Audit log viewer
- Testing: Admin permissions, content management

---

## Requirements

For each sprint, create **one Epic** with:

1. **Epic Title**: Clear, concise (e.g., "Epic: Application Setup")
2. **Epic Summary**: 1-2 sentence overview
3. **Epic Description**: Using the Epic template from Chat 1
   - Business value
   - Technical scope (high-level)
   - Success criteria
   - Dependencies
4. **Estimated Story Points**: Rough Epic-level estimate (Fibonacci: 13, 21, 34, etc.)
5. **Priority**: Critical/High/Medium/Low
6. **Labels**: Relevant tags (e.g., `infrastructure`, `security`, `multi-tenant`)

---

## Key Considerations

**From project-documentation:**

- Multi-tenant architecture (RLS critical)
- Healthcare security (OWASP compliance)
- Phase 1: Speed over perfection (30% test coverage, simple implementations)
- Testing requirement: Minimum 2 functional tests per User Story
- Deferred: Multi-AZ RDS, video transcoding, MFA, advanced analytics

**Architecture highlights:**

- Serverless AWS (Lambda, API Gateway, RDS, S3, CloudFront)
- Cognito with custom attributes (tenantId, role, parentBusinessId)
- PostgreSQL with Row-Level Security
- React + TypeScript + Tailwind

---

## Deliverables

### 1. Create 6 Epics in Jira

For each sprint, use `createJiraIssue` tool to create Epic with:

- **Issue Type**: Epic (10001)
- **Project**: SCRUM
- **Summary**: Clear Epic title (e.g., "Application Setup")
- **Description**: Following Epic template from Chat 1
- **Labels**: Relevant tags (e.g., `sprint-1`, `infrastructure`, `security`)
- **Priority**: Set appropriately

### 2. Create Summary Document

After creating Epics, generate: `epics-created-summary.md`

Include:

- Table with Epic key, title, URL, story points
- Epic dependencies map
- Estimated timeline
- Links to created Jira Epics

---

## Output Requirements

- **Create in Jira**: Use `createJiraIssue` tool for each Epic
- **High-level only**: No User Story creation yet
- **Complete descriptions**: Follow Epic template from Chat 1
- **Dependencies noted**: Add to Epic description
- **Realistic estimates**: Solo developer context
- **Confirm creation**: Show Jira Epic keys (e.g., SCRUM-1, SCRUM-2)

---

## Next Steps

After Chat 2:

1. Review created Epics in Jira
2. Verify Epic keys and links
3. Save summary document to `sprint-planning/outputs/epics-created-summary.md`
4. Move to Chat [E1]: Create User Stories in Jira for Sprint 1 Epic
5. Continue pattern for remaining Epics

---

## Reference Documents

Before responding, reference:

- `project-state.md` - Current phase and context
- `architecture.md` - Infrastructure overview
- `authentication.md` - Cognito setup
- `database-schema.md` - PostgreSQL schema, RLS
- `testing-strategy.md` - Testing approach

---

**Question**: Ready to create all 6 high-level Epics for FFP?
