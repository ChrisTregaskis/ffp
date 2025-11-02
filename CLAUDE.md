# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language & Spelling Preference

**IMPORTANT**: Always use **British English spelling** throughout the codebase and documentation.

Examples:

- ✅ optimise, prioritise, organise, realise, analyse, summarise
- ❌ optimize, prioritize, organize, realize, analyze, summarize
- ✅ colour, behaviour, favour, honour
- ❌ color, behavior, favor, honor
- ✅ centre, licence (noun), defence
- ❌ center, license (noun), defense

This applies to all code comments, documentation, commit messages, and user-facing content.

## Project Overview

**Fit For Purpose (FFP)** is a multi-tenant physiotherapy SaaS platform built as a monorepo. The platform uses dynamic assessment engines to generate personalised workout programmes from a curated video catalogue.

- **Solo developer**: Christopher Tregaskis
- **Current phase**: Sprint 1 (Foundation) - FFP-7 in progress (88% complete)
- **Critical requirement**: Multi-tenant isolation via PostgreSQL Row-Level Security (RLS)
- **Timeline**: 198 hours across 6 sprints (~6.2 months at 8h/week)

## Essential Commands

### Development Workflow

```bash
# Install dependencies (required: pnpm >= 9.0.0, Node >= 20.0.0)
pnpm install

# Build all packages (respects dependency order via Turborepo)
pnpm build

# Run all packages in dev mode (with hot reload)
pnpm dev

# Run specific package in dev mode
pnpm dev:core       # @ffp/core package
pnpm dev:functions  # @ffp/functions package
pnpm dev:web        # @ffp/web package

# Type checking
pnpm typecheck      # All packages
turbo typecheck --filter=@ffp/core  # Specific package

# Linting & formatting
pnpm lint           # Lint all (root + packages)
pnpm lint:fix       # Auto-fix lint issues
pnpm format         # Format all files
pnpm format:check   # Check formatting without changes
pnpm lint-format    # Lint fix + format (use before commits)
```

### Testing

```bash
# Run all tests (Vitest)
pnpm test

# Root-level tests (monorepo configuration tests)
pnpm test:root
pnpm test:root:watch     # Watch mode
pnpm test:root:ui        # UI mode

# Package-specific tests
turbo test --filter=@ffp/core
turbo test --filter=@ffp/web

# Coverage
pnpm test:coverage  # Target: 30% (Phase 1)
```

### Turborepo Operations

```bash
# Force rebuild (bypass cache)
turbo build --force

# Build only changed packages
turbo build --filter=[HEAD^1]

# Run task for specific package and dependencies
turbo build --filter=@ffp/web...

# Clear Turborepo cache
pnpm clean
```

## Architecture & Structure

### Monorepo Layout

```
ffp/
├── packages/                      # Turborepo workspaces
│   ├── core/                      # Shared business logic (@ffp/core)
│   │   ├── src/                   # TypeScript source (domain-organised)
│   │   │   ├── users/             # User domain
│   │   │   │   ├── user.service.ts      # Business logic orchestration
│   │   │   │   ├── user.entity.ts       # Complex business behaviour (optional)
│   │   │   │   ├── user.repository.ts   # Data access with RLS
│   │   │   │   └── user.schema.ts       # Zod validation schemas
│   │   │   ├── assessments/       # Assessment domain
│   │   │   │   ├── assessment.service.ts
│   │   │   │   ├── assessment.entity.ts
│   │   │   │   ├── assessment.repository.ts
│   │   │   │   └── assessment.schema.ts
│   │   │   ├── programs/          # Program domain
│   │   │   │   ├── program.service.ts
│   │   │   │   ├── program.entity.ts
│   │   │   │   ├── program.repository.ts
│   │   │   │   └── program.schema.ts
│   │   │   ├── lib/               # Cross-cutting utilities
│   │   │   │   ├── context.ts     # Tenant context extraction
│   │   │   │   ├── errors.ts      # Custom error classes
│   │   │   │   ├── logger.ts      # Structured logging
│   │   │   │   └── cognito.ts     # Cognito service wrapper
│   │   │   └── types/             # Shared TypeScript types
│   │   └── dist/                  # Built output
│   ├── functions/                 # Lambda function handlers (@ffp/functions)
│   │   ├── src/                   # Domain-organised handlers
│   │   │   ├── users/             # User management handlers
│   │   │   │   ├── create-user.ts
│   │   │   │   ├── get-user.ts
│   │   │   │   └── invite-user.ts
│   │   │   ├── assessments/       # Assessment handlers
│   │   │   │   ├── create-assessment.ts
│   │   │   │   ├── submit-assessment.ts
│   │   │   │   └── get-assessment.ts
│   │   │   ├── programs/          # Program handlers
│   │   │   │   ├── create-program.ts
│   │   │   │   └── get-program.ts
│   │   │   └── videos/            # Video handlers
│   │   │       ├── get-video.ts
│   │   │       └── update-progress.ts
│   │   └── dist/
│   ├── web/                       # React frontend (@ffp/web)
│   │   ├── src/
│   │   │   ├── components/        # Atomic design structure (future)
│   │   │   ├── contexts/          # React contexts (future)
│   │   │   └── pages/             # Page components (future)
│   │   └── dist/
│   ├── database/                  # Database schemas and migrations (@ffp/database)
│   │   ├── src/
│   │   │   ├── schema/            # Drizzle database schemas
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/               # Database utilities
│   │   │   │   └── rls.ts         # RLS helper functions
│   │   │   └── index.ts
│   │   ├── migrations/            # Generated SQL migrations
│   │   ├── drizzle.config.ts
│   │   └── dist/
│   ├── eslint-config/             # Shared ESLint configuration
│   └── prettier-config/           # Shared Prettier configuration
├── stacks/                        # SST infrastructure-as-code (future)
├── tests/                         # Root-level monorepo tests
└── project-documentation/         # Detailed docs (always check project-state.md)
```

### Domain-Organised Backend Architecture

FFP uses a domain-organised architecture with clear layer separation:

**Flow:** `Handler → Service → Entity → Repository → Drizzle Schema`

**Layers:**

- **Handler** (`packages/functions/{domain}/{action}.ts`): HTTP/Lambda interface only, zero business logic
- **Service** (`packages/core/{domain}/{domain}.service.ts`): Business logic orchestration, validates input, coordinates operations
- **Entity** (`packages/core/{domain}/{domain}.entity.ts`): Complex business behaviour (optional), used for calculations, state transitions
- **Repository** (`packages/core/{domain}/{domain}.repository.ts`): Data access with RLS, dumb data fetching/saving
- **Schema** (`packages/core/{domain}/{domain}.schema.ts`): Zod validation schemas

**When to use each layer:**

- Simple GET: `Handler → Repository`
- Business logic: `Handler → Service → Repository`
- Complex behaviour: `Handler → Service → Entity → Repository`

See `project-documentation/architecture.md` for detailed layer responsibilities and examples.

### Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js + AWS Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security (RLS)
- **ORM**: Drizzle (type-safe, parameterized queries)
- **Auth**: AWS Cognito (JWT with custom attributes: tenantId, role)
- **Infrastructure**: SST (Serverless Stack)
- **Testing**: Vitest, Playwright (future), MSW (future)

### Dependency Flow

```
@ffp/web ──depends on──> @ffp/core
@ffp/functions ──depends on──> @ffp/core
```

**Build order**: `core` must build before `functions` and `web` (enforced by Turborepo)

### Import Patterns

**Cross-package imports** (use workspace protocol):

```typescript
// In @ffp/web or @ffp/functions
import { SomeType } from '@ffp/core';
```

**Intra-package imports** (use namespace aliases):

```typescript
// In @ffp/web package
import { Component } from '@web/components';

// In @ffp/core package
import { util } from '@core/lib';
```

**TypeScript path resolution**:

- Cross-package imports resolve to `dist/` (built output)
- Vite in web package resolves to `src/` for HMR

## Key Configuration Files

### Turborepo Pipeline (`turbo.json`)

Defines task dependencies and caching strategy:

- `build`: Depends on `^build` (builds dependencies first), caches output
- `test`: Depends on `build`, caches coverage
- `lint`: Caches results
- `dev`: No caching (persistent process)

**Cache locations**: `.turbo/` (local), remote caching disabled in Phase 1

### TypeScript Configuration

- **Base**: `tsconfig.base.json` (strict mode, ES2022 target)
- **Package configs**: Extend base, define `paths` for aliases
- **Web special case**: Dual configs (app + build tools via `tsconfig.node.json`)

### Workspace Dependencies

All internal dependencies use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@ffp/core": "workspace:*"
  }
}
```

## Development Best Practices

### Code Quality

- **TypeScript strict mode** is enabled - all code must be type-safe
- **ESLint** runs with `--max-warnings 0` - no warnings allowed
- **Prettier** formats on save (VS Code integration configured)
- **Import order**: External deps → Internal deps → Types → Side effects

### Testing Requirements

- Tests live in `tests/` at root (monorepo tests) or `src/**/*.test.ts` in packages
- All new utilities must have tests (30% coverage target for Phase 1)
- RLS integration tests are CRITICAL when database layer is added (FFP-10)

### Git Workflow

**IMPORTANT**: User controls all git operations (`git add`, `git commit`, `git push`)

**Claude's Role**:

- **NEVER** run `git add`, `git commit`, or `git push` commands
- **DO** suggest when work is ready for commit
- **DO** provide a brief summary of what was accomplished
- **DO** wait for user to handle commit, review, and merge

**Commit Format**:

```bash
# Commit format for sprint work
git commit -m "FFP-XX: Brief description of change"

# Example
git commit -m "FFP-23: Add comprehensive monorepo tests"
```

**Typical Workflow**:

1. Claude completes work and suggests: "Session ready for commit"
2. User reviews changes and runs `git add`, `git commit`, `git push`
3. User reviews PR on GitHub (with Copilot assistance)
4. User merges PR when satisfied
5. User returns to Claude to continue next task

### When Adding New Features

1. Check `project-documentation/project-state.md` for current sprint progress
2. Follow acceptance criteria defined in Jira subtasks
3. Build order matters: changes to `@ffp/core` require rebuilding dependents
4. Run `pnpm lint-format` before committing
5. Update tests for any logic changes

## Multi-Tenant Security (Critical)

**ALWAYS enforce tenant isolation**:

- Database uses Row-Level Security (RLS) policies
- JWT contains `tenantId` custom attribute (extracted from Cognito)
- All Drizzle queries MUST set RLS context before operations
- Never trust client-provided tenantId - always use JWT value

Example pattern (future implementation):

```typescript
// CORRECT: Set RLS context in transaction
await db.transaction(async (tx) => {
  await tx.execute(sql`SET app.current_tenant_id = ${tenantId}`);
  return await tx.query.users.findMany();
});

// WRONG: Direct query without RLS context
await db.query.users.findMany(); // Leaks all tenants!
```

## Common Issues & Troubleshooting

### Build Errors

**"Cannot find module '@ffp/core'"**

- Run `pnpm build` to build core package first
- Check `packages/core/dist/` exists
- Verify workspace dependency in package.json: `"@ffp/core": "workspace:*"`

**TypeScript errors about path aliases**

- Check `tsconfig.json` has correct `paths` configuration
- For web package, check both `tsconfig.json` and `vite.config.ts`
- Run `pnpm typecheck` to verify

### Cache Issues

**Stale builds or tests**

- Run `turbo build --force` to bypass cache
- Clear cache: `pnpm clean` then `pnpm install`
- Check `.turbo/` directory for cache artifacts

### Lint/Format Issues

**ESLint conflicts with Prettier**

- Run `pnpm lint-format` to fix both in correct order
- VS Code: Check ESLint extension is enabled
- Verify `.eslintrc.js` and `.prettierrc.js` in root and packages

## Important Files to Reference

### Documentation Structure

**Root level**:

- `README.md` - Comprehensive guide: commands, workflows, project structure, troubleshooting
- `CLAUDE.md` - This file: AI assistant guidance, essential commands, architecture overview
- `project-documentation/project-state.md` - Current sprint status, next tasks, decisions
- `project-documentation/architecture.md` - Full AWS architecture, cost breakdown, diagrams

**Package level**:

- `packages/core/README.md` - Package-specific: dependencies, design principles, usage examples
- `packages/functions/README.md` - Package-specific: handler patterns, security checklist, dependencies
- `packages/web/README.md` - Package-specific: tech stack, dependencies, testing patterns

**Note**: Package READMEs are intentionally concise and reference root README for common commands and workflows.

**Configuration**:

- `turbo.json` - Build pipeline configuration
- `pnpm-workspace.yaml` - Workspace package definitions

## MCP Server Usage (Context7)

**CRITICAL**: When using the Context7 MCP server, be mindful of token consumption.

### Token Budget Awareness

- Context7 responses can be **very large** (10k-15k tokens per call)
- Each response **fully consumes** those tokens from the context window
- Multiple large calls can quickly fill up available context
- The terminal warning `⚠ Large MCP response (~12.3k tokens)` indicates actual consumption

### Best Practices

**Request smaller token limits**:

```
Use tokens: 5000 instead of default 10000
```

**Be specific with topic parameter**:

```
// ❌ Too broad
topic: "cognito user pool authentication custom attributes SST v3 Ion"

// ✅ More focused
topic: "cognito post authentication trigger SST Ion"
```

**Consider web_search as alternative**:

- **Context7**: More reliable, comprehensive docs, but token-heavy
- **web_search**: More token-efficient, but may require multiple searches or fetches
- **Decision rule**: Use Context7 for definitive documentation, web_search for quick lookups or when context is running low

## Project Constraints

- **Solo developer**: 8 hours/week capacity
- **Phase 1 focus**: Foundation infrastructure (no premature optimisation)
- **Security first**: Healthcare data, OWASP compliance required
- **Cost conscious**: Target ~£54-87/month AWS spend in Phase 1
- **Test coverage**: 30% minimum (will increase in later phases)
