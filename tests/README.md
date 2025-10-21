# Tests Package

This package contains monorepo-wide integration tests for the FFP project.

## Overview

The `@ffp/tests` package is a dedicated workspace package for testing the overall monorepo structure and configuration. It validates that:

- Turborepo configuration is correct
- TypeScript path aliases work across packages
- Build outputs are generated correctly
- Code quality standards are maintained
- Workspace dependencies are properly configured

## Structure

```
tests/
├── package.json          # Package configuration with test dependencies
├── tsconfig.json         # TypeScript configuration for tests
├── .eslintrc.cjs         # ESLint configuration (more permissive for tests)
├── vitest.config.ts      # Vitest configuration
├── README.md             # This file
└── monorepo/             # Monorepo-specific tests
    ├── build-outputs.test.ts      # Build output validation
    ├── code-quality.test.ts       # Code quality checks
    ├── path-aliases.test.ts       # TypeScript path alias tests
    ├── turborepo-config.test.ts   # Turborepo configuration tests
    └── workspace-dependencies.test.ts # Workspace dependency tests
```

## Running Tests

### From the tests directory:

```bash
cd tests
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:ui           # Run tests with Vitest UI
pnpm typecheck         # TypeScript type checking
pnpm lint              # ESLint checking
```

### From the root using Turborepo:

```bash
# Run tests only
pnpm turbo test --filter=@ffp/tests

# Run all quality checks
pnpm turbo test lint typecheck --filter=@ffp/tests

# Include in global runs
pnpm turbo test          # Runs tests for all packages including @ffp/tests
pnpm turbo lint          # Runs lint for all packages including @ffp/tests
```

## Configuration

### TypeScript

- Extends the base TypeScript configuration
- Includes path aliases for test utilities and package imports
- Configured for test files (no emit, includes test types)

### ESLint

- Extends the base ESLint configuration
- More permissive rules for test files:
  - Allows `any` types for test mocks
  - Allows `require()` statements for dynamic imports
  - Allows console output for debugging
  - Disables strict type checking rules

### Vitest

- Configured for Node.js environment
- Includes coverage reporting
- Resolves path aliases for imports

## Turborepo Integration

The tests package is fully integrated with Turborepo:

- **Dependencies**: Builds `@ffp/core` before running tests
- **Caching**: Test results are cached based on input files
- **Parallel execution**: Can run alongside other package tests
- **Workspace awareness**: Part of the pnpm workspace configuration

## Writing New Tests

When adding new tests:

1. Place them in the appropriate directory under `monorepo/`
2. Use descriptive test names that explain what's being validated
3. Take advantage of the relaxed ESLint rules for test-specific code
4. Import packages using the configured path aliases
5. Follow the existing pattern of grouping related tests in describe blocks

## Test Categories

### Build Outputs (`build-outputs.test.ts`)

Validates that packages build correctly and produce expected outputs.

### Code Quality (`code-quality.test.ts`)

Checks that code quality tools are properly configured and working.

### Path Aliases (`path-aliases.test.ts`)

Ensures TypeScript path aliases are configured correctly across packages.

### Turborepo Config (`turborepo-config.test.ts`)

Validates Turborepo pipeline configuration and task dependencies.

### Workspace Dependencies (`workspace-dependencies.test.ts`)

Checks that workspace package dependencies are correctly configured.
