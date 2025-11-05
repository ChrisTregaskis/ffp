# Chat E1: Create User Stories for Sprint 1 (FFP-1)

**Context**: This is Chat E1 (Epic 1 User Stories) of the FFP sprint planning process. Chat 2 has created all 6 Epics in Jira.

**Project**: Solo part-time developer building FFP - multi-tenant physiotherapy SaaS platform  
**Capacity**: 8 hours/week minimum (full-time job + family)  
**Sprint Duration**: 8-10 weeks for Sprint 1

**Documentation Location**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/`

**Jira Details**:

- Cloud ID: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- Site: `https://ctregaskis.atlassian.net`
- Project Key: `FFP`
- Epic: `FFP-1` (Application Setup & Foundation)
- Story Issue Type ID: `10010`

---

## Objective

Create **8-10 User Stories directly in Jira** for Sprint 1 (FFP-1: Application Setup & Foundation).

**Important**:

- Create actual Jira issues, NOT markdown files
- Use story-standards.md template
- Link all stories to FFP-1 Epic
- Estimate story points (1, 2, 3, 5, 8, 13)
- Include minimum 2 functional tests per story

---

## Sprint 1 Scope (from FFP-1)

**Epic Goal**: Establish core infrastructure for FFP

**Stories to Create** (~8-10 stories):

1. **Turborepo Monorepo Setup** (3 points)
   - Setup Turborepo with packages: web, api, core, database
   - Configure build caching and workspace dependencies
   - Setup TypeScript paths and shared configs

2. **SST Infrastructure Foundation** (5 points)
   - Create SST stacks: AuthStack, DatabaseStack, ApiStack, MonitoringStack
   - Configure AWS resources in sst.config.ts
   - Setup environment variables and secrets

3. **Cognito Authentication** (8 points)
   - Configure Cognito User Pool with custom attributes
   - Implement registration endpoint (SignUpCommand)
   - Implement login endpoint (InitiateAuthCommand)
   - Setup JWT authorizers on API Gateway

4. **PostgreSQL Schema with RLS** (8 points)
   - Create tenants and users tables
   - Implement Row-Level Security policies
   - Setup RLS context per request
   - Create integration tests for tenant isolation

5. **Drizzle ORM Setup** (5 points)
   - Configure Drizzle with PostgreSQL
   - Create type-safe schema definitions
   - Setup migration system
   - Implement database connection pooling

6. **Testing Framework** (5 points)
   - Configure Vitest for unit tests
   - Setup Playwright for E2E tests
   - Configure MSW for API mocking
   - Create test helpers and utilities

7. **CI/CD Pipeline** (5 points)
   - Setup GitHub Actions workflows
   - Configure dev/staging/prod environments
   - Implement automated testing in CI
   - Setup deployment to AWS via SST

8. **CloudWatch Logging** (3 points)
   - Implement structured JSON logging
   - Configure log groups and retention
   - Setup correlation IDs for requests
   - Create logging utilities and patterns

9. **Error Handling Patterns** (3 points)
   - Create custom error classes
   - Implement error handling middleware
   - Setup error logging with context
   - Create error response utilities

10. **Web Login/Logout Flow** (5 points)
    - Create React registration form
    - Create React login form
    - Implement Amplify Auth integration
    - Create protected route wrapper
    - E2E test for auth flow

---

## User Story Requirements

For each story, create with:

### Required Fields

- **Issue Type**: Story (10010)
- **Summary**: As a [user type], I want [action] so that [benefit]
- **Epic Link**: FFP-1
- **Story Points**: 1, 2, 3, 5, 8, or 13 (see story-points.md)
- **Priority**: Highest, High, Medium, Low
- **Labels**: `phase-1`, `sprint-1`, relevant tech tags
- **Sprint**: Sprint 1

### Description Template (from story-standards.md)

```markdown
## User Story

As a [user type],  
I want [action/feature],  
So that [benefit/value].

## Background / Context

[Why is this needed? What problem does it solve?]

## Acceptance Criteria

**AC1: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

**AC2: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

**AC3: [Title]**  
Given [precondition],  
When [action],  
Then [expected outcome].

## Technical Notes

### Implementation Approach

[High-level technical approach]

### Database Changes

- [Schema changes if any]
- [Migrations required]

### API Endpoints

- `POST /api/endpoint` - Description
- `GET /api/endpoint/:id` - Description

### Security Considerations

- [RLS validation required]
- [Zod schema for validation]
- [Auth requirements]

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Test: [Description]
- [ ] Test: [Description]

### Integration Tests

- [ ] Test: Multi-tenant isolation verification

### E2E Tests

- [ ] Test: Critical user flow

## Dependencies

[List blockers or dependencies]

## Out of Scope

[What's NOT included to prevent scope creep]
```

---

## Story Point Guidelines (from story-points.md)

| Points | Time (Full-Time) | Time (8hrs/week)               | Complexity   |
| ------ | ---------------- | ------------------------------ | ------------ |
| **1**  | 1-2h             | ~1 week                        | Trivial      |
| **2**  | 3-4h             | ~1-2 weeks                     | Simple       |
| **3**  | 5-8h             | ~2-3 weeks                     | Moderate     |
| **5**  | 1-2d             | ~3-4 weeks                     | Complex      |
| **8**  | 2-3d             | ~4-6 weeks                     | Very Complex |
| **13** | 3-5d             | **Split into smaller stories** | Too Large    |

---

## Key Considerations

### Multi-Tenant Architecture

- Every story touching database must include RLS considerations
- Integration test for tenant isolation is REQUIRED
- JWT must include tenantId for all authenticated requests

### Security (OWASP Compliance)

- Zod validation on all API inputs
- No secrets in code (AWS Secrets Manager)
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)

### Testing Requirements

- Minimum 2 functional tests per story
- Integration test for multi-tenant isolation (where applicable)
- E2E test for critical user flows

### Phase 1 Constraints

- 15% test coverage target (not 100%)
- Simple implementations preferred
- Deferred features documented in "Out of Scope"

---

## Deliverables

### 1. Create 8-10 Stories in Jira

Use `createJiraIssue` tool for each story with all required fields.

### 2. Create Summary Document

After creating stories, generate: `sprint-1-stories-summary.md`

Include:

- Table with Story key, title, points, URL
- Total story points for Sprint 1
- Estimated sprint duration (based on 8 hours/week)
- Dependencies between stories
- Testing coverage summary

---

## Output Requirements

- **Create in Jira**: Use `createJiraIssue` for each story
- **Link to Epic**: Ensure all stories link to FFP-1
- **Realistic estimates**: Solo developer with 8 hours/week
- **Complete descriptions**: Follow story template
- **Testing requirements**: Minimum 2 tests per story
- **Confirm creation**: Show Jira Story keys

---

## Next Steps After Chat E1

1. Review created stories in Jira
2. Verify story points and estimates
3. Save summary to `sprint-planning/outputs/sprint-1-stories-summary.md`
4. Move to Chat S1: Create Subtasks for first story
5. Continue subtask creation for remaining stories

---

## Reference Documents

- `jira-standards/story-standards.md` - Story template
- `jira-standards/story-points.md` - Estimation guidelines
- `project-state.md` - Current phase
- `architecture.md` - Infrastructure details
- `authentication.md` - Cognito patterns
- `database-schema.md` - RLS implementation

---

**Remember**:

- 8 hours/week capacity (not 40 hours)
- 8-10 week sprint (not 2 weeks)
- Simple implementations over perfect solutions
- Multi-tenant isolation is non-negotiable
