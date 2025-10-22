# @ffp/web

React frontend for the Fit For Purpose platform.

---

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite (fast HMR, optimised builds)
- **Styling**: TailwindCSS (to be configured in future sprint)
- **Testing**: Vitest + React Testing Library
- **Shared Logic**: `@ffp/core` (workspace dependency)

---

## 🚀 Usage

### Importing from @ffp/core

Use workspace dependencies to import shared logic:

```typescript
// Import types
import type { User, Assessment } from '@ffp/core';

// Import schemas
import { UserSchema, AssessmentSchema } from '@ffp/core';

// Import services
import { UserService } from '@ffp/core';

// Import utilities
import { validateEmail } from '@ffp/core/utils';
```

### Within This Package

Use `@web/*` aliases for imports within the web package:

```typescript
// Import components
import { Button } from '@web/components/Button';

// Import contexts
import { useAuth } from '@web/contexts/AuthContext';

// Import pages
import { Dashboard } from '@web/pages/Dashboard';

// Import hooks
import { useLocalStorage } from '@web/hooks/useLocalStorage';
```

---

## 🧪 Testing

### Writing Component Tests

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

## 📦 Dependencies

### Production Dependencies

- **@ffp/core** (workspace:\*) - Shared business logic, types, and schemas
- **react** (^18.x) - UI library
- **react-dom** (^18.x) - React DOM renderer

### Dev Dependencies

- **vite** (^5.4.10) - Build tool and dev server
- **typescript** (^5.6.3) - TypeScript compiler
- **vitest** (^2.1.4) - Unit testing framework
- **@testing-library/react** - React component testing
- **@ffp/eslint-config** - Shared ESLint configuration

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

For detailed commands, project structure, and workflows, see:

- **Root README**: `../../README.md` - Development commands and monorepo structure
- **Core Package**: `../core/README.md` - Shared business logic
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
