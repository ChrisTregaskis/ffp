# @ffp/web

React frontend for the Fit For Purpose platform.

---

## 📋 Contents

- [Tech Stack](#tech-stack)
- [Structure](#structure)
- [Development](#development)
- [Path Aliases](#path-aliases)
- [Building](#building)
- [Testing](#testing)
- [Current Status](#current-status)

---

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite (fast HMR, optimised builds)
- **Styling**: TailwindCSS (to be configured in future sprint)
- **Testing**: Vitest + React Testing Library
- **Shared Logic**: `@ffp/core` (workspace dependency)

---

## 📁 Structure

```
packages/web/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── index.ts        # Component exports
│   │
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx (to be created in FFP-16)
│   │   └── index.ts
│   │
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── index.ts
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── index.ts
│   │
│   ├── utils/              # Frontend utilities
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root component
│   └── index.css           # Global styles
│
├── dist/                   # Built output (gitignored)
├── package.json
├── tsconfig.json           # TypeScript config
├── tsconfig.node.json      # Node/build tools config
├── vite.config.ts          # Vite configuration
└── README.md
```

---

## 💻 Development

### Start Development Server

```bash
# From root (recommended)
pnpm dev

# Or run web package only
pnpm dev:web

# Or from this package
cd packages/web
pnpm dev
```

This starts the Vite dev server at **http://localhost:5173**

**Features:**

- ⚡ Fast Hot Module Replacement (HMR)
- 🔄 Auto-reloads on file changes
- 📦 Imports from `@ffp/core` work seamlessly

---

## 🔗 Path Aliases

### Cross-Package Imports (from @ffp/core)

Use workspace dependencies to import shared logic:

```typescript
// ✅ Import types from @ffp/core
import type { User, Assessment } from '@ffp/core';

// ✅ Import schemas from @ffp/core
import { UserSchema, AssessmentSchema } from '@ffp/core';

// ✅ Import services from @ffp/core
import { UserService } from '@ffp/core';

// ✅ Import utilities from @ffp/core
import { validateEmail } from '@ffp/core/utils';
```

### Intra-Package Imports (within @ffp/web)

Use `@web/*` aliases for imports within the web package:

```typescript
// ✅ Import components
import { Button } from '@web/components/Button';
import { Input } from '@web/components/Input';

// ✅ Import contexts
import { useAuth } from '@web/contexts/AuthContext';

// ✅ Import pages
import { Dashboard } from '@web/pages/Dashboard';

// ✅ Import hooks
import { useLocalStorage } from '@web/hooks/useLocalStorage';

// ✅ Import utilities
import { apiClient } from '@web/utils/api';
```

**Configuration in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@web/*": ["./src/*"]
    }
  }
}
```

**Vite Configuration** (`vite.config.ts`):

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@web': path.resolve(__dirname, './src'),
      '@ffp/core': path.resolve(__dirname, '../core/src'), // HMR for core
    },
  },
});
```

### Path Alias Rules

1. **Cross-package**: Use `@ffp/core` for shared logic
2. **Intra-package**: Use `@web/*` for local imports
3. **Never**: Don't use `@ffp/web` within the web package

---

## 🏗 Building

### Production Build

```bash
# From root (recommended)
pnpm build

# Or build web package only
pnpm turbo build --filter=@ffp/web

# Or from this package
cd packages/web
pnpm build
```

**Output**: `dist/` directory with optimised production bundle

**Build Steps:**

1. TypeScript compilation (`tsc`)
2. Vite production build
3. Asset optimisation and minification

### Preview Production Build

```bash
# Preview the production build locally
pnpm preview
```

Serves the `dist/` directory at **http://localhost:4173**

---

## 🧪 Testing

### Run Tests

```bash
# From root
pnpm turbo test --filter=@ffp/web

# Or from this package
cd packages/web
pnpm test           # Run once
pnpm test:watch     # Watch mode
pnpm test:ui        # Vitest UI
```

### Writing Tests

```typescript
// Example: Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@web/components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## 🎯 Current Status

### ✅ Complete

- Basic React + Vite setup
- TypeScript configuration with strict mode
- Workspace dependency on `@ffp/core`
- Intra-package path aliases (`@web/*`)
- Hot Module Replacement (HMR) working
- Testing framework configured

### ⏸️ Awaiting Future Sprints

- **TailwindCSS** configuration
- **Authentication** components (FFP-16)
- **Protected** routes
- **API integration** with Lambda functions
- **UI component** library setup

---

## 📚 Further Reading

- **Root README**: `../../README.md` - Monorepo commands and structure
- **Core Package**: `../core/README.md` - Shared business logic
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`

---

## 🔄 Common Workflows

### Adding a New Component

```bash
# 1. Create component file
touch src/components/NewComponent.tsx

# 2. Implement component
# Use @web/* for local imports
# Use @ffp/core for shared types

# 3. Export from components/index.ts
echo "export * from './NewComponent';" >> src/components/index.ts

# 4. Test component
pnpm test
```

### Adding a New Page

```bash
# 1. Create page file
touch src/pages/NewPage.tsx

# 2. Implement page component
# Import components using @web/components/*
# Import shared types using @ffp/core

# 3. Export from pages/index.ts
echo "export * from './NewPage';" >> src/pages/index.ts

# 4. Add route (once routing is set up)
```

### Using Shared Types

```typescript
// In src/pages/UserProfile.tsx
import type { User } from '@ffp/core';
import { UserSchema } from '@ffp/core';
import { Button } from '@web/components/Button';

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  // Validate user data
  const result = UserSchema.safeParse(user);

  return (
    <div>
      <h1>{user.name}</h1>
      <Button>Edit Profile</Button>
    </div>
  );
}
```

---

**Current Sprint**: Sprint 1 - Foundation Setup  
**Last Updated**: October 22, 2025  
**Status**: ✅ Package setup complete, awaiting authentication implementation
