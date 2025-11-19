# FFP - Reference Guide

**Load this file only when you need:**

- Development workflow commands
- Cost estimates
- Success criteria
- Monorepo structure details
- Quick testing reference

---

## Development Workflow

### Turborepo Commands

```bash
# Build all packages (with caching)
turbo build

# Run tests across all packages (parallel)
turbo test

# Lint all packages (parallel)
turbo lint

# Type-check all packages
turbo typecheck

# Build only changed packages
turbo build --filter=[HEAD^1]

# Run specific package
turbo build --filter=@ffp/core
```

### SST Commands

```bash
# Local development with hot-reload
npm run dev
turbo dev

# Deploy to environment
npm run deploy --stage dev

# View logs
npm run logs -- --stage dev --function assessments

# Database migrations
turbo db:migrate --filter=@ffp/core
```

### Testing Commands

```bash
# Fast unit tests (during development)
npm run test:unit

# RLS tests (before commits)
npm run test:rls

# Watch mode (TDD)
npm run test:watch

# E2E tests (before deployments)
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## Monorepo Structure

```
ffp/
├── turbo.json              # Turborepo pipeline config
├── package.json            # Root workspace
├── packages/
│   ├── core/              # Shared logic (@ffp/core)
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   └── package.json
│   ├── functions/         # Lambda handlers
│   │   ├── auth/
│   │   ├── assessments/
│   │   ├── programs/
│   │   └── videos/
│   └── web/               # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── contexts/
│       │   └── lib/
│       └── package.json
├── stacks/                # SST infrastructure
│   ├── AuthStack.ts
│   ├── DatabaseStack.ts
│   ├── ApiStack.ts
│   └── StorageStack.ts
└── schema/                # Drizzle schemas
    └── index.ts
```

### Workspace Dependencies

```
@ffp/web → depends on → @ffp/core
@ffp/functions → depends on → @ffp/core
```

### Turborepo Benefits

- **Fast Builds**: Caches unchanged packages (~5s vs ~60s)
- **Parallel Tasks**: Tests run 3x faster across packages
- **Type Safety**: Shared `@ffp/core` types across frontend/backend
- **Incremental**: Only rebuild affected packages

---

## Cost Estimates (Phase 1)

| Service         | Monthly Cost     | Notes                    |
| --------------- | ---------------- | ------------------------ |
| Cognito         | $0               | Free tier (50k MAU)      |
| RDS (t3.small)  | ~$30             | Single AZ                |
| S3 + CloudFront | $5-20            | Depends on video storage |
| Lambda          | $0-5             | Free tier covers Phase 1 |
| API Gateway     | $0-5             | Free tier (1M requests)  |
| Amplify         | $0               | Free tier (1k build min) |
| CloudWatch      | $0-5             | Basic logs & metrics     |
| Route53         | $1               | Hosted zone              |
| **Total**       | **$36-66/month** | <1000 users              |

### Cost at Scale

| Users    | Monthly Cost | Notes                           |
| -------- | ------------ | ------------------------------- |
| <1k      | $36-66       | Phase 1 target                  |
| 1k-10k   | $100-300     | Add Multi-AZ, caching           |
| 10k-100k | $500-2k      | Read replicas, CDN optimization |

---

## Success Criteria

### Technical (Phase 1)

- API response time <500ms (p95)
- Video start time <5 seconds
- System uptime >99%
- Zero critical security vulnerabilities
- Zero tenant data leakage incidents

### Testing Coverage

- Overall: 8% minimum
- Critical paths: 80%+ coverage
- RLS policies: 100% coverage
- Authentication/JWT: 100% coverage

### Development Velocity

- Ship MVP in 6-8 months (solo)
- Deploy to dev daily (once in implementation)
- Deploy to production weekly (post-launch)

---

## Testing Strategy Quick Ref

### Coverage Targets

- **Must Test** (100%):
  - RLS policies
  - Authentication/JWT parsing
- **Should Test** (80%):
  - Input validation (Zod schemas)
  - Assessment scoring algorithms
  - Repository CRUD operations
  - Service layer logic

- **Nice-to-Have** (15%):
  - Edge cases
  - UI components
  - Error boundaries

### Test Distribution

- **95%**: Fast unit tests (mocked DB)
- **5%**: Integration tests (real dev DB with RLS)
- **E2E**: Critical paths only (login, assessment, video)

### Sprint Planning Rule

**MANDATORY**: Minimum **2 functional tests** per User Story

- 1-3 points: 2 unit tests
- 4-6 points: 2 unit + 1 integration
- 7+ points: 3 unit + 1 integration + 1 E2E

See `testing-strategy.md` for full details.

---

## Phase 1 MVP Scope

### ✅ In Scope

- Individual + business accounts
- Dynamic assessment engine
- Program generation from assessments
- Video library (single quality)
- Progress tracking
- Basic CloudWatch monitoring
- Multi-tenant RLS isolation

### ❌ Deferred (Phase 2+)

- Multi-AZ RDS
- Video transcoding/multiple qualities
- Advanced monitoring (X-Ray, DataDog)
- MFA / SSO
- White-label customization
- Advanced analytics
- Mobile native apps

See `future-considerations.md` for full deferred features list.

---

## External Resources

- **SST**: https://sst.dev/
- **AWS**: https://docs.aws.amazon.com/
- **Drizzle ORM**: https://orm.drizzle.team/
- **TypeScript**: https://www.typescriptlang.org/
- **Zod**: https://zod.dev/
- **React**: https://react.dev/
- **Turborepo**: https://turbo.build/repo

---

**When to load this file**: Implementation phase, deployment setup, cost discussions, or when you need quick command references.
