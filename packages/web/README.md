# @ffp/web

React frontend for Fit For Purpose platform.

## Tech Stack

- React 18
- TypeScript (strict mode)
- Vite (build tool)
- Dependencies: `@ffp/core` (shared types/logic)

## Development

```bash
# From root
pnpm dev

# Or from this package
cd packages/web
pnpm dev
```

## Structure

```
src/
├── components/    # Reusable React components (to be populated)
├── contexts/      # React contexts (Auth, etc - to be populated)
├── pages/         # Page components (to be populated)
├── main.tsx       # Entry point
├── App.tsx        # Root component
└── index.css      # Global styles
```

## Current Status

- ✅ Basic React + Vite setup
- ✅ TypeScript configuration
- ✅ Imports from `@ffp/core` working
- ⏸️ Awaiting FFP-16 for authentication components
- ⏸️ Awaiting UI component library setup

## Coming Soon

- TailwindCSS configuration (FFP-21)
- Authentication components (FFP-16)
- Protected routes
- API integration
