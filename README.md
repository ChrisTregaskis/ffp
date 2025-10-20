# Fit For Purpose (FFP)

**Fit For Purpose (FFP)** is a multi-tenant physiotherapy SaaS platform built in partnership with a practising physiotherapist. The platform uses dynamic assessment engines to generate personalised workout programmes from a curated video catalogue.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js/TypeScript + AWS Lambda + API Gateway
- **Database**: PostgreSQL (RDS) with Row-Level Security (RLS)
- **ORM**: Drizzle
- **Auth**: AWS Cognito
- **Infrastructure**: SST (Serverless Stack)
- **Testing**: Vitest, Playwright, MSW

## Project Structure

```
ffp/
├── packages/                 # Turborepo workspaces
│   ├── web/                 # React frontend (to be created)
│   ├── functions/           # Lambda function handlers (to be created)
│   └── core/                # Shared business logic (to be created)
├── stacks/                  # SST infrastructure-as-code
├── schema/                  # Drizzle database schemas (to be created)
├── migrations/              # SQL migration files (to be created)
├── project-documentation/   # AI agent optimised docs
├── sst.config.ts            # SST configuration (to be created)
├── drizzle.config.ts        # Drizzle ORM config (to be created)
├── turbo.json               # Turborepo pipeline
└── pnpm-workspace.yaml      # pnpm workspace config
```

**For detailed structure**: See `project-documentation/architecture.md`

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Development

```bash
# Run all packages in dev mode
pnpm dev
```

## Documentation

The `project-documentation/` directory is built for optimising AI Agent assistance during sprint planning and build of the project. However, it can be useful documentation for other developers who join the project.

**See current project state here**: `project-documentation/project-state.md`

## License

Proprietary - All rights reserved
