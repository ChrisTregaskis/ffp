# Chat S1 Template: Create Subtasks for User Story

**Context**: This template is for creating Subtasks for any User Story in the FFP project. Use this after User Stories have been created in Jira.

**Project**: Solo part-time developer building FFP - multi-tenant physiotherapy SaaS platform  
**Capacity**: 8 hours/week minimum (full-time job + family)

**Documentation Location**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/`

**Jira Details**:

- Cloud ID: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- Site: `https://ctregaskis.atlassian.net`
- Project Key: `FFP`
- Subtask Issue Type ID: `10012`

---

## Objective

Create **3-8 Subtasks** for a specific User Story to break down implementation into manageable tasks.

**Important**:

- Create actual Jira Subtask issues
- Link all subtasks to parent User Story
- Estimate time per subtask (0.5h, 1h, 2h, 4h, 8h)
- Keep subtasks granular and actionable

---

## When to Use This Template

Use this prompt when:

- A User Story has been created in Jira
- Story points are >3 (stories with 5, 8, or 13 points)
- Story needs breakdown into implementation steps
- Want to track daily progress

**Optional for**:

- Stories with 1-2 points (already small enough)

---

## Input Required

Before creating subtasks, provide:

1. **Parent Story Key**: e.g., `FFP-7`
2. **Parent Story Title**: e.g., "Turborepo Monorepo Setup"
3. **Story Points**: e.g., 3 points
4. **Story Description**: (copy from Jira or reference)

---

## Subtask Guidelines

### Subtask Naming Convention

```
[Story Key] - [Action Verb] [Component/Feature]
```

**Examples**:

- `FFP-7 - Initialize Turborepo configuration`
- `FFP-7 - Setup workspace packages structure`
- `FFP-7 - Configure TypeScript paths`
- `FFP-7 - Add build caching pipeline`
- `FFP-7 - Write tests for build system`

### Subtask Time Estimates

| Time     | Description                           | When to Use    |
| -------- | ------------------------------------- | -------------- |
| **0.5h** | Quick config change, simple update    | Small tasks    |
| **1h**   | Basic implementation, simple feature  | Standard tasks |
| **2h**   | Moderate complexity, requires testing | Medium tasks   |
| **4h**   | Complex feature, multiple components  | Large tasks    |
| **8h**   | Full day of work (one day = 8h)       | Max task size  |

**Note**: With 8 hours/week, 8h = 1 full week of work

### Subtask Types

Break down stories into these categories:

1. **Setup/Configuration** (0.5-1h each)
   - Initialize tools, install dependencies
   - Configure files (tsconfig, eslint, etc)

2. **Implementation** (2-4h each)
   - Core feature development
   - API endpoints, UI components
   - Business logic

3. **Testing** (1-2h each)
   - Unit tests
   - Integration tests
   - E2E tests

4. **Documentation** (0.5-1h each)
   - Update README
   - Add code comments
   - Update architecture docs

5. **Integration/Deployment** (1-2h each)
   - Connect components
   - Deploy to environment
   - Verify end-to-end

---

## Subtask Description Template

```markdown
## Task Description

[Clear description of what needs to be done]

## Acceptance Criteria

- [ ] [Specific deliverable 1]
- [ ] [Specific deliverable 2]
- [ ] [Specific deliverable 3]

## Technical Notes

[Any specific implementation details, file paths, commands]

## Definition of Done

- [ ] Code written and tested locally
- [ ] Tests passing (if applicable)
- [ ] Code reviewed (self-review)
- [ ] Committed to Git
- [ ] [Any other DoD items]

## Dependencies

[List any blocking subtasks or external dependencies]
```

---

## Example Breakdown

### Example 1: Story FFP-7 (Turborepo Setup - 3 points)

**Parent Story**: "As a developer, I want to setup Turborepo monorepo..."

**Subtasks** (7 tasks, ~3 points = 24 hours):

1. **Initialize Turborepo** (1h)
   - Install turbo package
   - Create turbo.json configuration
   - Verify turbo CLI works

2. **Setup Workspace Structure** (2h)
   - Create packages/ directory
   - Initialize web/ package (Vite + React)
   - Initialize api/ package
   - Initialize core/ package
   - Initialize database/ package

3. **Configure Package Dependencies** (1h)
   - Setup workspace in root package.json
   - Configure package.json for each workspace
   - Install shared dependencies

4. **Configure TypeScript Paths** (2h)
   - Create tsconfig.json for each package
   - Setup path aliases (@ffp/core, etc)
   - Verify imports resolve correctly

5. **Configure Build Pipeline** (2h)
   - Add build scripts to each package
   - Configure turbo pipeline in turbo.json
   - Test build caching works

6. **Write Tests** (2h)
   - Test workspace dependency resolution
   - Test build cache functionality
   - Test TypeScript path resolution

7. **Documentation** (1h)
   - Update README with monorepo structure
   - Document build commands
   - Add troubleshooting guide

**Total**: 11 hours (~3 points with 8 hours/week = 1.5 weeks)

---

### Example 2: Story FFP-9 (Cognito Auth - 8 points)

**Parent Story**: "As a user, I want to register and login..."

**Subtasks** (10 tasks, ~8 points = 64 hours):

1. **Create Cognito User Pool** (2h)
   - Configure User Pool in AuthStack
   - Setup custom attributes (tenantId, role)
   - Configure password policy

2. **Implement Registration Lambda** (4h)
   - Create Lambda function handler
   - Implement SignUpCommand
   - Generate unique tenantId
   - Set custom attributes

3. **Implement Login Lambda** (2h)
   - Create Lambda function handler
   - Implement InitiateAuthCommand
   - Return JWT with claims

4. **Configure API Gateway Authorizer** (2h)
   - Setup JWT authorizer
   - Configure allowed origins
   - Test authorization flow

5. **Create Zod Validation Schemas** (2h)
   - Define RegisterSchema
   - Define LoginSchema
   - Add validation tests

6. **Implement Database User Creation** (2h)
   - Create user record on registration
   - Create tenant record
   - Handle transaction rollback

7. **Write Unit Tests** (4h)
   - Test registration logic
   - Test login logic
   - Test validation schemas
   - Test error handling

8. **Write Integration Tests** (4h)
   - Test Cognito user creation
   - Test database record creation
   - Test multi-tenant tenantId uniqueness

9. **Create Frontend Forms** (4h)
   - Registration form with react-hook-form
   - Login form
   - Error handling and display

10. **E2E Test** (2h)
    - Complete registration flow
    - Complete login flow
    - Verify JWT contains tenantId

**Total**: 28 hours (~8 points with 8 hours/week = 3.5 weeks)

---

## Required Fields for Subtasks

```typescript
{
  issueTypeName: "Sub-task",
  projectKey: "FFP",
  parent: "FFP-7", // Parent story key
  summary: "Initialize Turborepo configuration",
  description: `## Task Description

Install Turborepo package and create turbo.json configuration file.

## Acceptance Criteria

- [ ] turbo package installed as dev dependency
- [ ] turbo.json created with pipeline configuration
- [ ] turbo CLI accessible via pnpm turbo

## Technical Notes

\`\`\`bash
pnpm add -D turbo
pnpm turbo --version
\`\`\`

Create turbo.json with build and test pipelines.

## Definition of Done

- [ ] Turbo installed and working
- [ ] turbo.json configured
- [ ] Verified turbo CLI works
- [ ] Changes committed to Git`,
  labels: ["subtask", "setup", "turborepo"],
  // Note: Time estimate can be tracked in separate field or custom field
}
```

---

## Deliverables

### 1. Create Subtasks in Jira

For each subtask:

- Use `createJiraIssue` with issueTypeName="Sub-task"
- Link to parent story via `parent` field
- Include clear description with acceptance criteria
- Add relevant labels

### 2. Update Subtask Summary Document

Location: `project-documentation/sprint-planning/outputs/2025-10-18_2200_sprint-1-subtasks-summary.md`

Include:

- Table with Subtask key, title, estimate, URL
- Total time estimate
- Subtask dependencies
- Checklist for DoD

---

## Output Requirements

- **Create in Jira**: Use `createJiraIssue` for each subtask
- **Link to parent**: Ensure parent field is set correctly
- **Actionable**: Each subtask should be doable in one sitting (max 8h)
- **Clear acceptance criteria**: What "done" looks like
- **Confirm creation**: Show Jira Subtask keys

---

## Best Practices

### Do:

✅ Break down into 1-4 hour chunks (easier to complete)  
✅ Include clear acceptance criteria  
✅ Add technical notes (commands, file paths)  
✅ Order subtasks by dependency  
✅ Include testing subtasks

### Don't:

❌ Create subtasks >8 hours (split further)  
❌ Make subtasks too vague ("Work on feature")  
❌ Skip testing subtasks  
❌ Forget documentation subtasks  
❌ Mix multiple concerns in one subtask

---

## Next Steps After Creating Subtasks

1. Review subtasks in Jira
2. Verify parent story linkage
3. Confirm time estimates are realistic
4. Save summary document
5. Start working through subtasks in order
6. Move subtasks to "In Progress" as you work
7. Mark as "Done" when acceptance criteria met

---

## Reference Documents

- `jira-standards/subtask-standards.md` - Subtask template (if exists)
- `jira-standards/story-points.md` - Time estimation
- `definition-of-done.md` - DoD checklist
- Parent story in Jira for context

---

**Remember**:

- Subtasks should be completable in 1 sitting (1-4 hours ideal)
- 8 hours/week means each 8h subtask = 1 full week
- Break down complex tasks further if needed
- Testing and documentation are non-negotiable
