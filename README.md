# Fit For Purpose (FFP)

**Fit For Purpose (FFP)** is a multi-tenant physiotherapy SaaS platform built in partnership with a practising physiotherapist. The platform uses dynamic assessment engines to generate personalised workout programmes from a curated video catalogue.

## Overview

FFP combines evidence-based physiotherapy assessment with personalised exercise prescription. The platform enables physiotherapists to:

- **Assess patients** using dynamic, branching question flows
- **Generate programmes** from a curated library of exercise videos
- **Track progress** with multi-tenant isolation and secure data management
- **Scale efficiently** with serverless architecture

Built as a Turborepo monorepo with strict TypeScript, the platform prioritises security (healthcare data compliance), multi-tenant isolation (PostgreSQL RLS), and developer experience (fast builds, HMR, comprehensive testing).

**Current phase**: Sprint 1 (Foundation) - Setting up core infrastructure and development workflows.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ffp

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify setup
pnpm test
pnpm typecheck
pnpm lint
```

### Development

```bash
# Start all packages in development mode
pnpm dev

# This will:
# - Build @ffp/core and watch for changes
# - Start Vite dev server for @ffp/web (http://localhost:5173)
# - Watch @ffp/functions for changes
```

### Before Your First Commit

```bash
# Lint and format all code
pnpm lint-format

# Run type checks
pnpm typecheck

# Run tests
pnpm test
```

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Turborepo Commands](#turborepo-commands)
- [Workspace Dependencies](#workspace-dependencies)
- [Path Aliases](#path-aliases)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## 🛠 Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: React 18 + TypeScript + TailwindCSS + Vite
- **Backend**: Node.js/TypeScript + AWS Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security (RLS)
- **ORM**: Drizzle
- **Auth**: AWS Cognito
- **Infrastructure**: SST v3 Ion (Serverless Stack)
- **Testing**: Vitest, Playwright, MSW
- **Code Quality**: ESLint (strict), Prettier, Husky

---

## 📁 Project Structure

```
ffp/
├── packages/                     # Turborepo workspaces
│   ├── web/                     # React frontend (@ffp/web)
│   │   ├── src/
│   │   │   ├── components/      # Reusable React components
│   │   │   ├── contexts/        # React contexts (Auth, etc)
│   │   │   ├── pages/           # Page components
│   │   │   ├── main.tsx         # Entry point
│   │   │   └── App.tsx          # Root component
│   │   ├── package.json
│   │   ├── tsconfig.json        # Extends tsconfig.base.json
│   │   └── vite.config.ts
│   │
│   ├── functions/               # Lambda handlers (@ffp/functions)
│   │   ├── src/
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── assessments/     # Assessment CRUD
│   │   │   ├── programs/        # Program generation
│   │   │   ├── videos/          # Video metadata
│   │   │   └── business/        # Business portal logic
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core/                    # Shared business logic (@ffp/core)
│   │   ├── src/
│   │   │   ├── types/           # Shared TypeScript types
│   │   │   ├── schemas/         # Zod validation schemas
│   │   │   ├── services/        # Business logic services
│   │   │   ├── repositories/    # Data access layer
│   │   │   └── index.ts         # Public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                # Database schemas and migrations (@ffp/database)
│   │   ├── src/
│   │   │   ├── schema/          # Drizzle database schemas
│   │   │   │   ├── organisations.ts
│   │   │   │   ├── locations.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts         # Public exports
│   │   ├── migrations/          # Generated SQL migrations
│   │   ├── drizzle.config.ts    # Drizzle configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/           # Shared ESLint config (@ffp/eslint-config)
│   └── prettier-config/         # Shared Prettier config (@ffp/prettier-config)
│
├── stacks/                      # SST v3 Ion infrastructure stacks (FFP-28 onwards)
├── tests/                       # Root-level integration tests
│   ├── monorepo/                # Monorepo configuration tests
│   └── ...
│
├── project-documentation/       # AI agent optimised documentation
├── .husky/                      # Git hooks
├── .vscode/                     # VS Code settings
│
├── sst.config.ts                # SST v3 Ion configuration ✅
├── turbo.json                   # Turborepo pipeline configuration
├── tsconfig.base.json           # Base TypeScript config
├── pnpm-workspace.yaml          # pnpm workspace definition
├── .eslintrc.js                 # Root ESLint config
├── .prettierrc.js               # Root Prettier config
├── vitest.config.ts             # Root Vitest config
└── package.json                 # Root package scripts
```

**Detailed documentation**: See `project-documentation/architecture.md`

---

## 💻 Development Commands

### Run All Packages in Development Mode

```bash
# Start all packages in watch mode
pnpm dev
```

This will:

- Build `@ffp/core` and watch for changes
- Start Vite dev server for `@ffp/web` (http://localhost:5173)
- Watch `@ffp/functions` for changes

### Run Individual Packages

```bash
# Run specific package only
pnpm dev:web         # Start web dev server only
pnpm dev:core        # Watch core package only
pnpm dev:functions   # Watch functions package only
```

### Build Commands

```bash
# Build all packages (respects dependency order)
pnpm build

# Build is fast with Turborepo caching:
# - Cold build: ~10-15 seconds
# - Warm cache: ~100-300ms ⚡
```

### Testing Commands

```bash
# Run all tests
pnpm test

# Run root integration tests only
pnpm test:root

# Run unit tests only (excludes integration tests)
pnpm test:unit

# Watch mode for root tests
pnpm test:root:watch

# Test with UI
pnpm test:root:ui

# Generate coverage report
pnpm test:coverage
```

### Code Quality Commands

```bash
# Lint all packages
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# Format all code
pnpm format

# Check formatting without changes
pnpm format:check

# Lint and format (combined)
pnpm lint-format

# Type check all packages
pnpm typecheck
```

### Clean Commands

```bash
# Remove all build outputs and node_modules
pnpm clean

# Clear Turborepo cache only
rm -rf node_modules/.cache/turbo
```

---

## 🎯 Turborepo Commands

### Basic Usage

```bash
# Run a task across all packages
turbo <task>

# Run task for specific package
turbo <task> --filter=<package-name>

# Examples:
turbo build
turbo test --filter=@ffp/web
turbo dev --filter=@ffp/core --filter=@ffp/functions
```

### Advanced Options

```bash
# Force rebuild (ignore cache)
turbo build --force

# Dry run (show what would execute)
turbo build --dry

# Verbose output
turbo build --verbosity=2

# See task summary
turbo build --summarize

# Run tasks in parallel
turbo build test lint --parallel

# Continue on error
turbo test --continue
```

### Cache Management

```bash
# View cache status
turbo run build --dry

# Clear local cache
rm -rf node_modules/.cache/turbo

# Force cache miss for debugging
turbo run build --force
```

**Detailed caching information**: See `project-documentation/sprint-planning/outputs/2025-10-20_2100_TURBOREPO_CACHING.md`

---

## 📦 Workspace Dependencies

### How It Works

FFP uses **pnpm workspaces** with the `workspace:*` protocol for internal package dependencies:

```json
{
  "dependencies": {
    "@ffp/core": "workspace:*"
  }
}
```

**Benefits:**

- Always uses local package version (no npm registry needed)
- Hot Module Replacement (HMR) works across packages
- Type safety with TypeScript project references
- Fast installs and updates

### Package Dependency Graph

```
@ffp/web
  └─> @ffp/core (workspace:*)

@ffp/functions
  └─> @ffp/core (workspace:*)

@ffp/core
  └─> (no internal dependencies)
```

### Adding Workspace Dependencies

```bash
# Add workspace dependency
cd packages/web
pnpm add @ffp/core@workspace:*

# Or from root (recommended)
pnpm --filter @ffp/web add @ffp/core@workspace:*
```

### Installing External Dependencies

```bash
# Add to specific package
pnpm --filter @ffp/web add react-router-dom

# Add to all packages
pnpm add -w lodash

# Add dev dependency to root
pnpm add -D -w vitest
```

---

## 🔗 Path Aliases

### Cross-Package Imports

Use **workspace dependencies** for importing between packages:

```typescript
// ✅ In @ffp/web or @ffp/functions
import { UserSchema } from '@ffp/core';
import { validateUser } from '@ffp/core/validation';
```

**How it works:**

- TypeScript uses `paths` in `tsconfig.base.json` pointing to `dist/` (compiled output)
- Vite uses custom alias configuration pointing to `src/` (for HMR during dev)
- Turborepo ensures `@ffp/core` is built before dependent packages

### Intra-Package Imports

Use **namespace-based aliases** for imports within the same package:

```typescript
// ✅ In packages/web/src/pages/Dashboard.tsx
import { Button } from '@web/components/Button';
import { useAuth } from '@web/contexts/AuthContext';

// ✅ In packages/core/src/services/UserService.ts
import { UserRepository } from '@core/repositories/UserRepository';
import type { User } from '@core/types/User';

// ✅ In packages/functions/src/auth/register.ts
import { validateInput } from '@functions/utils/validation';
```

**Configuration:**

Each package has its own `tsconfig.json` with intra-package aliases:

```json
// packages/web/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@web/*": ["./src/*"]
    }
  }
}
```

### Path Alias Rules

1. **Cross-package**: Use `@ffp/package-name` (workspace dependencies)
2. **Intra-package**: Use `@web/*`, `@core/*`, `@functions/*` (namespace aliases)
3. **Never mix**: Don't use `@ffp/web` inside the web package - use `@web/*` instead

---

## 🔄 Common Workflows

### Starting a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/FFP-XXX-description

# 2. Start development servers
pnpm dev

# 3. Make changes in packages/web or packages/core

# 4. Run tests in watch mode
pnpm test:root:watch

# 5. Check code quality
pnpm lint-format
pnpm typecheck

# 6. Commit changes
git add .
git commit -m "FFP-XXX: Description of changes"
```

### Adding a New Shared Type

```bash
# 1. Add type to core package
cd packages/core
mkdir -p src/types
touch src/types/NewType.ts

# 2. Export from core/index.ts
echo "export * from './types/NewType';" >> src/index.ts

# 3. Build core package
cd ../..
pnpm turbo build --filter=@ffp/core

# 4. Use in web or functions
# Import will work immediately via @ffp/core
```

### Adding a New Component

```bash
# 1. Create component in web package
cd packages/web/src/components
touch Button.tsx

# 2. Use intra-package alias
# In Button.tsx, import other web components:
# import { Icon } from '@web/components/Icon';

# 3. Export if needed for other components
# Add to components/index.ts

# 4. Test component
cd ../../..
pnpm --filter @ffp/web test
```

### Debugging Build Issues

```bash
# 1. Clear all build outputs
pnpm clean

# 2. Rebuild from scratch
pnpm install
pnpm build

# 3. If specific package fails, build in isolation
cd packages/core
pnpm build

# 4. Check Turborepo cache
turbo build --dry --verbosity=2

# 5. Force fresh build
turbo build --force
```

### Running Tests for Specific Package

```bash
# Run tests for web package only
pnpm --filter @ffp/web test

# Watch mode for specific package
pnpm --filter @ffp/web test:watch

# With UI for specific package
pnpm --filter @ffp/web test:ui
```

---

## 🔧 Troubleshooting

### Import Errors: "Cannot find module '@ffp/core'"

**Cause**: Core package not built or TypeScript paths misconfigured.

**Solution**:

```bash
# Build core package
pnpm turbo build --filter=@ffp/core

# Verify dist/ exists
ls packages/core/dist

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### HMR Not Working Across Packages

**Cause**: Vite pointing to `dist/` instead of `src/`.

**Solution**: Check `vite.config.ts` has correct alias:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@ffp/core': path.resolve(__dirname, '../core/src'),
    },
  },
});
```

### Turborepo Cache Issues

**Cause**: Stale cache or cache key conflicts.

**Solution**:

```bash
# Clear cache
rm -rf node_modules/.cache/turbo

# Force rebuild
turbo build --force

# Check what's cached
turbo build --dry --verbosity=2
```

### ESLint/TypeScript Errors After Adding Dependency

**Cause**: VS Code not picking up new dependencies.

**Solution**:

```bash
# Restart VS Code
# Cmd+Q then reopen

# Or restart TypeScript/ESLint servers
# Cmd+Shift+P → "TypeScript: Restart TS Server"
# Cmd+Shift+P → "ESLint: Restart ESLint Server"
```

### Type Errors in Tests

**Cause**: Test files trying to import from `dist/` instead of `src/`.

**Solution**: Use intra-package aliases or relative imports in tests:

```typescript
// ✅ Good - intra-package alias
import { Button } from '@web/components/Button';

// ❌ Bad - workspace dependency in same package
import { Button } from '@ffp/web/components/Button';
```

### pnpm Install Fails

**Cause**: Wrong package manager or pnpm version mismatch.

**Solution**:

```bash
# Verify pnpm version
pnpm --version  # Should be >= 9.0.0

# Update pnpm if needed
npm install -g pnpm@latest

# Clean and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install
```

### "Only pnpm is allowed" Error

**Cause**: Trying to use npm or yarn instead of pnpm.

**Solution**: Always use `pnpm`:

```bash
# ✅ Correct
pnpm install
pnpm build

# ❌ Wrong - will fail
npm install
yarn build
```

---

## 📚 Documentation

The `project-documentation/` directory contains comprehensive documentation optimised for AI agent assistance and developer onboarding:

### Core Documentation

- **`project-state.md`** - Current phase, sprint progress, next tasks
- **`architecture.md`** - AWS services, infrastructure design
- **`authentication.md`** - Cognito setup, multi-tenant auth
- **`database-schema.md`** - PostgreSQL schema, RLS policies
- **`coding-standards.md`** - TypeScript patterns, conventions
- **`deployment.md`** - SST, CI/CD, database migrations

### Technical Deep Dives

- **`assessment-engine.md`** - Question flows, scoring logic
- **`video-management.md`** - S3, CloudFront, streaming
- **`monitoring.md`** - CloudWatch, alarms, dashboards
- **`security.md`** - OWASP compliance, encryption
- **`future-considerations.md`** - Deferred features

### Sprint Planning

- **`sprint-planning/jira-standards/`** - Ticket templates (Epic, Story, Task, Bug)
- **`sprint-planning/outputs/`** - Sprint plans, decisions

### Turborepo Specific

- **`sprint-planning/outputs/2025-10-20_2100_TURBOREPO_CACHING.md`** - Caching strategies, performance

**Getting Started**: Always check `project-state.md` first for current context and active tasks.

---

## 📄 License

Proprietary - All rights reserved
