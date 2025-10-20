# TypeScript Path Alias Strategy

## Overview

This project uses **namespace-based path aliases** to prevent conflicts between packages while maintaining clean, readable imports.

## Complete Namespace Map

| Package       | Namespace     | Example Import                                             |
| ------------- | ------------- | ---------------------------------------------------------- |
| **Web**       | `@web/`       | `import { Button } from "@web/components/Button"`          |
| **Core**      | `@core/`      | `import { UserService } from "@core/services/UserService"` |
| **Functions** | `@functions/` | `import { AuthHandler } from "@functions/auth/handler"`    |
| **Workspace** | `@ffp/`       | `import { APP_NAME } from "@ffp/core"`                     |

## Alias Namespaces

### Web Package (`@web/`)

All internal web package imports use the `@web/` namespace:

```typescript
// ✅ Good - Web package internal imports
import { Button } from "@web/components/Button";
import { useAuth } from "@web/hooks/useAuth";
import { formatDate } from "@web/utils/date";
```

### Core Package (`@core/`)

All internal core package imports use the `@core/` namespace:

```typescript
// ✅ Good - Core package internal imports
import { APP_NAME } from "@core/lib/constants";
import { UserService } from "@core/services/UserService";
import { Tenant } from "@core/types/tenant.types";
```

### Functions Package (`@functions/`)

All internal functions package imports use the `@functions/` namespace:

```typescript
// ✅ Good - Functions package internal imports
import { AuthHandler } from "@functions/auth/handlers";
import { AssessmentEngine } from "@functions/assessments/engine";
import { VideoProcessor } from "@functions/videos/processor";
```

### Workspace Imports (`@ffp/`)

Cross-package imports use the workspace namespace:

```typescript
// ✅ Good - Workspace imports
import { APP_NAME, UserService } from "@ffp/core";
```

## Adding New Directories

When you add new directories to any package:

### Web Package

1. **Update TypeScript config** (`packages/web/tsconfig.json`):

   ```json
   "@web/newDirectory/*": ["./newDirectory/*"]
   ```

2. **Update Vite config** (`packages/web/vite-alias-config.ts`):
   ```typescript
   "@web/newDirectory": path.resolve(packageRoot, "src/newDirectory")
   ```

### Functions Package

1. **Update TypeScript config** (`packages/functions/tsconfig.json`):
   ```json
   "@functions/newDirectory/*": ["./newDirectory/*"]
   ```

### Core Package

1. **Update TypeScript config** (`packages/core/tsconfig.json`):
   ```json
   "@core/newDirectory/*": ["./newDirectory/*"]
   ```

Then use in imports:

```typescript
import { something } from "@packageName/newDirectory/something";
```

## Migration Guide

If you have existing imports using `@/`, update them to use the appropriate namespace:

```typescript
// ❌ Old (conflicts)
import { Component } from "@/components/Component";
import { AuthHandler } from "@/auth/handler";
import { UserService } from "@/services/UserService";

// ✅ New (clear namespace)
import { Component } from "@web/components/Component"; // Web package
import { AuthHandler } from "@functions/auth/handler"; // Functions package
import { UserService } from "@core/services/UserService"; // Core package
```

This approach ensures your codebase remains clean and conflict-free as it grows!
