---
description: Review current branch changes against FFP standards
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*)
argument-hint: <base-branch>
---

# Code Review Request

## Review Context

**Review Context File**: @.claude/review-context.md

If the review context file exists, use it to understand:

- Goals and requirements for this branch
- Specific changes made and why
- Areas to focus the review on
- Known limitations or trade-offs
- Questions the developer has

If missing, note "No review context provided - consider creating `.claude/review-context.md`" and proceed with general review.

## Current Changes

**Current Branch**: !`git branch --show-current`

**Status**: !`git status --short`

**Diff from $ARGUMENTS**: !`git diff $ARGUMENTS...HEAD`

**Recent commits**: !`git log $ARGUMENTS..HEAD --oneline --no-decorate`

## Project Context

Review these changes as a senior engineer specialising in multi-tenant healthcare SaaS.

**Project Standards**: @CLAUDE.md
**Personal Preferences**: @CLAUDE.local.md
**Current Sprint**: @project-documentation/project-state.md
**Architecture Patterns**: @project-documentation/architecture.md

## Review Checklist

### [CRITICAL] Security (Must Fix)

- [ ] RLS context set properly (no direct queries without `setRLSContext`)
- [ ] `tenant_id` validated in all queries
- [ ] Cognito claims use `custom:` prefix (e.g., `custom:tenantId`)
- [ ] Parameterised queries (no SQL injection risk via string concatenation)
- [ ] No secrets, API keys, or credentials committed
- [ ] Input validation with Zod schemas
- [ ] Error messages don't leak sensitive data

### [HIGH] Architecture Compliance (Should Fix)

- [ ] Domain-organised structure: Handler → Service → Repository
- [ ] No business logic in handlers (handlers = HTTP interface only)
- [ ] Services orchestrate, repositories do data access
- [ ] Proper error handling with custom error classes (not generic `Error`)
- [ ] TypeScript strict mode (no `any` types)
- [ ] Explicit types on function signatures

### [MEDIUM] Code Quality (Consider)

- [ ] British English spelling (organise, colour, behaviour, optimise, prioritise)
- [ ] `programme` not `program` in FFP-specific code (exception: third-party APIs)
- [ ] No emojis in code, comments, or user-facing strings
- [ ] No raw HTML elements (use components instead):
  - [ ] No `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>` tags (use `<Title>` component)
  - [ ] No `<p>` or `<span>` tags for text (use `<Text>` component)
  - [ ] No raw `<button>` tags (use `<Button>` or `<IconButton>` component)
- [ ] No hard-coded colours (use theme colours):
  - [ ] No `text-gray-XXX`, `text-red-XXX`, `text-blue-XXX` classes
  - [ ] Use theme colours via components: `foreground`, `muted-foreground`, `destructive`, `primary`, `success`, `warning`, `info`
  - [ ] Background/border colours use theme with opacity: `bg-primary/10`, `border-destructive/20`
- [ ] 2-space indentation
- [ ] Descriptive variable and function names
- [ ] Comments explain "why", not "what"

### [CRITICAL] Multi-Tenant Safety

- [ ] NEVER trust client-provided `tenantId` - always use JWT
- [ ] ALL database queries filter by `tenant_id`
- [ ] Audit logging includes tenant context

## Component & Theme Usage (Web Package)

When reviewing `.tsx` files in `packages/web/`, check for:

**Raw HTML → Components**:

```typescript
// WRONG
<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
<p className="text-sm text-gray-500">Description</p>
<button className="bg-blue-600 text-white px-4 py-2">Click</button>

// CORRECT
<Title as="h1" colour="foreground">Dashboard</Title>
<Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>Description</Text>
<Button variant="primary">Click</Button>
```

**Hard-coded Colours → Theme**:

```typescript
// WRONG
className="text-gray-900"
className="text-red-600"
className="bg-blue-50"

// CORRECT
<Text styleProps={{ colour: 'foreground' }} />
<Text styleProps={{ colour: 'destructive' }} />
className="bg-info/10"
```

**Acceptable exceptions**: Structural elements (div, section, nav), gradients, dev-only components.

## Instructions

Provide feedback in order of severity (Critical → High → Medium → Low) with:

1. **Specific file:line references** (e.g., `user.repository.ts:45`)
2. **Remediation code examples** (show wrong vs. correct patterns)
3. **Explanation of why** (not just what to change)
4. **Positive observations** (what was done well)

Format your response as:

```markdown
# Code Review Summary

**Branch**: [branch-name]
**Files Changed**: X files, +Y lines, -Z lines
**Review Context**: [Yes/No] - [If yes, summarise key goals and focus areas]

## [CRITICAL] Issues (Must Fix)

[Security vulnerabilities, data leaks, RLS violations]

## [HIGH] Priority (Should Fix)

[Architecture violations, type safety, error handling]

## [MEDIUM] Suggestions (Consider)

[Code quality, naming, documentation]

## Positive Observations

[What was done well]
```

Remember: This is Phase 1 (Foundation) - prioritise security and correctness over premature optimisation.
