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

## Authentication

### Overview

Authentication is handled via **AWS Cognito** using the AWS Amplify SDK. The implementation includes:

- **AuthContext** (`src/contexts/AuthContext.tsx`) - Global auth state management with React Context
- **JWT Claims Parsing** - Extracts multi-tenant context (`tenantId`, `role`) from Cognito ID tokens
- **Zod Validation** - Runtime validation of JWT claims using `@ffp/core` schemas
- **Invite-only** - No public sign-up (admin-controlled user creation only)

User sessions are automatically restored on app load by checking for valid Cognito tokens.

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# AWS Cognito Configuration (required)
VITE_COGNITO_USER_POOL_ID=eu-west-2_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional configuration
VITE_LOG_LEVEL=debug          # Controls client-side logging (debug|info|warn|error)
ENVIRONMENT=development        # Explicit environment identifier
```

**Obtaining Cognito values:**

- User Pool ID and Client ID are output by SST after infrastructure deployment
- Alternatively, find them in **AWS Console → Cognito → User Pools → App Integration**

### Usage

```typescript
import { useAuth } from '@web/contexts/AuthContext';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <Text>Welcome, {user.email}</<Text>
      <<Text>Tenant: {user.tenantId}</<Text>
      <<Text>Role: {user.role}</<Text>
      <Button onClick={() => logout()}>Log out</Button>
    </div>
  );
}
```

### Testing

Authentication uses **Zod schemas** for validation (defined in `src/schemas/auth.schema.ts`). Tests verify:

- Login credentials validation (email format, password presence)
- Password complexity requirements (Cognito policy: 8+ chars, uppercase, lowercase, number, special character)
- Password confirmation matching

Run tests:

```bash
turbo test --filter=@ffp/web
```

See `src/schemas/auth.schema.test.ts` for examples.

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
