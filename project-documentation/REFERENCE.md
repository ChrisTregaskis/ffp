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

**Region**: eu-west-2 (London) | **Sources**: [AWS Pricing Calculator](https://calculator.aws/) (October 2025)

| Service                       | Monthly Cost (GBP) | Notes                                            |
| ----------------------------- | ------------------ | ------------------------------------------------ |
| **Cognito**                   | £0                 | Free tier: 50,000 MAU                            |
| **RDS PostgreSQL (t3.small)** | £22-27             | Single AZ, ~£0.031/hour, 2 vCPU, 2GB RAM         |
| **S3 + CloudFront**           | £4-15              | Video library (500GB-1TB storage + bandwidth)    |
| **Lambda**                    | £0-4               | Free tier: 1M requests/month                     |
| **API Gateway**               | £0-4               | Free tier: 1M API calls/month                    |
| **CloudWatch**                | £0-4               | 5GB ingestion free tier                          |
| **Route53**                   | £0.40              | Hosted zone (~£0.50/month)                       |
| **NAT Gateway**               | £27-32             | ~£0.045/hour (Phase 1 uses default VPC to avoid) |
| **Secrets Manager**           | £0.32              | ~5 secrets × £0.40/month                         |
| **Total**                     | **£54-87**         | With NAT Gateway; ~£27-55 without                |

### Cost at Scale

| Users    | Monthly Cost | Key Changes                            |
| -------- | ------------ | -------------------------------------- |
| <1k      | £54-87       | Phase 1 baseline (free tiers active)   |
| 1k-10k   | £85-150      | RDS t3.medium, increased bandwidth     |
| 10k-100k | £300-600     | Multi-AZ RDS, ElastiCache              |
| 100k+    | £1,200-3,000 | Read replicas, sharding considerations |

### Cost Optimisation Tips

1. Use t4g.small (ARM/Graviton) instead of t3.small for RDS (~20% cheaper)
2. Enable S3 Intelligent-Tiering for video files
3. Set CloudFront cache TTL appropriately
4. Right-size Lambda memory allocation

---

## Database Connection Limits

RDS PostgreSQL connection limits based on instance memory:

| Instance Class | Memory | max_connections | Recommended App Limit |
| -------------- | ------ | --------------- | --------------------- |
| db.t3.small    | 2 GB   | ~112            | ~80                   |
| db.t3.medium   | 4 GB   | ~225            | ~160                  |
| db.t3.large    | 8 GB   | ~450            | ~320                  |
| db.r5.large    | 16 GB  | ~900            | ~650                  |

**When to add RDS Proxy (~£15-20/month):**

- Lambda concurrency exceeds 50% of max_connections
- Frequent connection timeouts in CloudWatch logs
- Scaling beyond t3.medium instance

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
