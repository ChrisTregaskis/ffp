# @ffp/web

React frontend for the Fit For Purpose platform.

---

## Tech Stack

- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite (fast HMR, optimised builds)
- **Styling**: TailwindCSS (to be configured in future sprint)
- **Testing**: Vitest + React Testing Library
- **Shared Logic**: `@ffp/core` (workspace dependency)

---

## Usage

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

## Further Reading

For detailed commands, project structure, and workflows, see:

- **Root README**: `../../README.md` - Development commands and monorepo structure
- **Core Package**: `../core/README.md` - Shared business logic
- **Architecture**: `../../project-documentation/architecture.md`
- **Coding Standards**: `../../project-documentation/coding-standards.md`
