# @ffp/core

Shared business logic, types, schemas, and utilities for the FFP platform. This package is the foundation used by both `@ffp/web` and `@ffp/functions`.

---

## 📋 Contents

- [Overview](#overview)
- [Structure](#structure)
- [Usage](#usage)
- [Development](#development)
- [Path Aliases](#path-aliases)
- [Exports](#exports)
- [Dependencies](#dependencies)

---

## 🎯 Overview

The `@ffp/core` package provides:

- **TypeScript Types** - Shared interfaces and types
- **Zod Schemas** - Validation schemas for data integrity
- **Business Logic** - Domain services and business rules
- **Data Access** - Repository pattern implementations
- **Utilities** - Helper functions and common utilities

**Key Principle**: This package contains **no framework-specific code** - it's pure TypeScript that can be used in any environment (browser, Node.js, Lambda).

---

## 📁 Structure

```
packages/core/
├── src/
│   ├── types/           # TypeScript interfaces and types
│   │   ├── User.ts
│   │   ├── Assessment.ts
│   │   ├── Program.ts
│   │   └── index.ts
│   │
│   ├── schemas/         # Zod validation schemas
│   │   ├── userSchemas.ts
│   │   ├── assessmentSchemas.ts
│   │   └── index.ts
│   │
│   ├── services/        # Business logic services
│   │   ├── UserService.ts
│   │   ├── AssessmentService.ts
│   │   └── README.md
│   │
│   ├── repositories/    # Data access layer
│   │   ├── BaseRepository.ts
│   │   ├── UserRepository.ts
│   │   └── README.md
│   │
│   ├── utils/           # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── index.ts
│   │
│   ├── errors/          # Custom error classes
│   │   ├── AppError.ts
│   │   └── index.ts
│   │
│   └── index.ts         # Main export file
│
├── dist/                # Compiled JavaScript (gitignored)
├── package.json
├── tsconfig.json        # TypeScript configuration
└── README.md
```

---

## 🚀 Usage

### In Other Packages

Import from `@ffp/core` in `@ffp/web` or `@ffp/functions`:

```typescript
// ✅ Import types
import type { User, Assessment, Program } from '@ffp/core';

// ✅ Import schemas
import { UserSchema, AssessmentSchema } from '@ffp/core';

// ✅ Import services
import { UserService, AssessmentService } from '@ffp/core';

// ✅ Import utilities
import { validateEmail, formatDate } from '@ffp/core/utils';

// ✅ Import custom errors
import { AppError, ValidationError } from '@ffp/core/errors';
```

### Example: Using Schemas for Validation

```typescript
import { UserSchema } from '@ffp/core';

const userData = {
  email: 'user@example.com',
  name: 'John Doe',
  tenantId: 'tenant-123',
};

// Validate with Zod
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log('Valid user:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

### Example: Using Services

```typescript
import { UserService } from '@ffp/core';

const userService = new UserService(userRepository);
const user = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  tenantId: 'tenant-123',
});
```

---

## 💻 Development

### Development Mode

```bash
# Watch for changes and rebuild automatically
pnpm dev

# Or from root
cd ../..
pnpm dev:core
```

### Build

```bash
# Build once
pnpm build

# Or from root
cd ../..
pnpm turbo build --filter=@ffp/core
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui
```

### Type Checking

```bash
# Type check without building
pnpm typecheck
```

### Linting

```bash
# Lint code
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

---

## 🔗 Path Aliases

### Intra-Package Imports (Within @ffp/core)

Use `@core/*` aliases for imports within this package:

```typescript
// ✅ Good - using intra-package alias
import { UserRepository } from '@core/repositories/UserRepository';
import type { User } from '@core/types/User';
import { validateEmail } from '@core/utils/validation';

// ❌ Bad - using workspace dependency on itself
import { UserRepository } from '@ffp/core/repositories/UserRepository';

// ❌ Bad - relative imports for distant files
import { UserRepository } from '../../repositories/UserRepository';
```

**Configuration in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/*"]
    }
  }
}
```

---

## 📤 Exports

All public exports are defined in `src/index.ts`:

```typescript
// Types
export * from './types';

// Schemas
export * from './schemas';

// Services
export * from './services';

// Utilities
export * from './utils';

// Errors
export * from './errors';
```

**Adding New Exports:**

1. Create your file in the appropriate directory
2. Export from the directory's `index.ts`
3. Verify it's re-exported from `src/index.ts`

---

## 📦 Dependencies

### Production Dependencies

- **zod** (^3.23.8) - Schema validation and type inference

### Dev Dependencies

- **typescript** (^5.6.3) - TypeScript compiler
- **vitest** (^2.1.4) - Unit testing framework
- **eslint** (^8.57.1) - Code linting
- **@ffp/eslint-config** - Shared ESLint configuration

---

## 🎯 Design Principles

### 1. Framework Agnostic

This package should work in any JavaScript environment:

- ✅ Node.js (Lambda functions)
- ✅ Browser (React app)
- ✅ Edge runtime (future)

**Don't include:**

- React-specific code
- Lambda-specific code
- Browser APIs
- Node.js built-in modules (except types)

### 2. Type Safety First

- Use TypeScript strict mode
- Export types alongside implementation
- Provide Zod schemas for runtime validation
- No `any` types

### 3. Single Responsibility

Each module should have one clear purpose:

- Types define shape
- Schemas validate data
- Services contain business logic
- Repositories handle data access
- Utilities provide helpers

### 4. Testing

- Unit test all business logic
- Test Zod schemas with valid/invalid data
- Mock external dependencies
- Aim for 80%+ coverage on critical paths

---

## 🔄 Workflow

### Adding a New Type

```bash
# 1. Create type file
touch src/types/NewType.ts

# 2. Define interface
# In src/types/NewType.ts:
export interface NewType {
  id: string;
  name: string;
}

# 3. Export from types/index.ts
echo "export * from './NewType';" >> src/types/index.ts

# 4. Rebuild
pnpm build
```

### Adding a New Schema

```bash
# 1. Create schema file
touch src/schemas/newSchemas.ts

# 2. Define Zod schema
# In src/schemas/newSchemas.ts:
import { z } from 'zod';
export const NewSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

# 3. Export from schemas/index.ts
echo "export * from './newSchemas';" >> src/schemas/index.ts

# 4. Rebuild and test
pnpm build
pnpm test
```

### Adding a New Service

```bash
# 1. Create service file
touch src/services/NewService.ts

# 2. Implement service class
# Follow patterns in existing services

# 3. Export from services/index.ts
echo "export * from './NewService';" >> src/services/index.ts

# 4. Write tests
touch src/services/__tests__/NewService.test.ts

# 5. Test and build
pnpm test
pnpm build
```

---

## 📚 Further Reading

- **Root README**: `../../README.md` - Monorepo structure and commands
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
- **Database Schema**: `../../project-documentation/database-schema.md`

---

**Current Status**: ✅ Core package structure complete  
**Last Updated**: October 22, 2025  
**Maintained By**: FFP Development Team
