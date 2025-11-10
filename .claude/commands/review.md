---
description: Review current branch changes against FFP standards
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*)
argument-hint: [base-branch]
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

**Diff from ${1:-main}**: !`git diff ${1:-main}...HEAD`

**Recent commits**: !`git log ${1:-main}..HEAD --oneline --no-decorate`

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
- [ ] No emojis in code, comments, or user-facing strings
- [ ] 2-space indentation
- [ ] Descriptive variable and function names
- [ ] Comments explain "why", not "what"

### [CRITICAL] Multi-Tenant Safety

- [ ] NEVER trust client-provided `tenantId` - always use JWT
- [ ] ALL database queries filter by `tenant_id`
- [ ] Audit logging includes tenant context

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
