# @ffp/core

Shared business logic, types, schemas, and utilities for the FFP platform. This package is the foundation used by both `@ffp/web` and `@ffp/functions`.

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

## 🚀 Usage

### Importing in Other Packages

```typescript
// Import types
import type { User, Assessment, Program } from '@ffp/core';

// Import schemas
import { UserSchema, AssessmentSchema } from '@ffp/core';

// Import services
import { UserService, AssessmentService } from '@ffp/core';

// Import utilities
import { validateEmail, formatDate } from '@ffp/core/utils';

// Import custom errors
import { AppError, ValidationError } from '@ffp/core/errors';
```

### Within This Package

Use `@core/*` aliases for imports within this package:

```typescript
// ✅ Good - using intra-package alias
import { UserRepository } from '@core/repositories/UserRepository';
import type { User } from '@core/types/User';

// ❌ Bad - using workspace dependency on itself
import { UserRepository } from '@ffp/core/repositories/UserRepository';
```

### Example: Using Schemas

```typescript
import { UserSchema } from '@ffp/core';

const userData = {
  email: 'user@example.com',
  name: 'John Doe',
  organisationId: 'org-123',
};

// Validate with Zod
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log('Valid user:', result.data);
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

---

## 📦 Dependencies

### Production Dependencies

- **zod** (^3.23.8) - Schema validation and type inference

### Dev Dependencies

- **typescript** (^5.6.3) - TypeScript compiler
- **vitest** (^2.1.4) - Unit testing framework
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

## 📚 Further Reading

For detailed commands, project structure, and workflows, see:

- **Root README**: `../../README.md` - Development commands and monorepo structure
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
- **Database Schema**: `../../project-documentation/database-schema.md`
