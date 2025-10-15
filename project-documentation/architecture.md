# FFP - Architecture Documentation

## Overview

FFP uses a serverless-first AWS architecture optimized for multi-tenant SaaS. Phase 1 prioritizes simplicity and speed while establishing scalable patterns. Database access is handled through Drizzle ORM for type-safe, efficient queries.

## Infrastructure Stack (Phase 1)

### Core Services

#### Authentication & API Layer

- **AWS Cognito User Pool**: User authentication, JWT management
  - Custom attributes: `tenantId`, `role`, `parentBusinessId`
  - Access/refresh token handling (15min/7day expiry)
  - Email verification, password reset flows
  - Free tier: 50,000 MAU
- **API Gateway**: REST API management
  - JWT authorizer (validates Cognito tokens)
  - Request validation
  - Per-tenant throttling (1000 req/min default)
  - CORS configuration
- **Lambda Functions**: Serverless business logic
  - Node.js 18+ with TypeScript
  - Single responsibility per function
  - Warm start optimization via provisioned concurrency (critical paths only)
  - Environment variables injected via SST

#### Data & Storage Layer

- **RDS PostgreSQL**: Primary database
  - Instance: t3.small or t4g.small (Graviton)
  - Single AZ (Phase 1), Multi-AZ ready
  - 50GB SSD with auto-scaling
  - Multi-tenant via Row-Level Security (RLS)
  - **Drizzle ORM**: Type-safe database access with TypeScript-first approach
  - Daily automated backups (7-day retention)
  - Encryption at rest via KMS
- **S3 Buckets**: Object storage
  - Videos: `s3://ffp-videos-{env}/library/`
  - Assets: `s3://ffp-assets-{env}/`
  - Lifecycle policies for cost optimization
- **CloudFront**: CDN for global delivery
  - Video streaming with signed URLs
  - Static asset caching
  - Edge locations worldwide

#### Security & Networking

- **VPC**: Network isolation
  - Public subnets: API Gateway, NAT Gateways
  - Private subnets: Lambda, RDS
- **Security Groups**: Firewall rules
  - RDS: Only Lambda security group allowed
  - Lambda: Outbound to RDS and internet (via NAT)
- **Secrets Manager**: Credential storage
  - Database connection strings
  - JWT signing secrets
  - API keys
- **KMS**: Encryption key management
  - RDS encryption
  - S3 bucket encryption
  - Secrets Manager encryption
- **WAF** (optional Phase 1): API Gateway protection
  - SQL injection prevention
  - XSS protection
  - Rate limiting rules

#### Monitoring & Operations

- **CloudWatch**: Centralized logging and metrics
  - Lambda function logs (JSON structured)
  - API Gateway access logs
  - RDS performance metrics
  - Custom business metrics
- **CloudWatch Alarms**: Critical alerts
  - API 5xx errors >5 in 5min
  - Lambda errors >10 in 5min
  - RDS CPU >80% for 10min
  - RDS connections >80% of max
- **CloudTrail**: AWS API audit logging
  - All infrastructure changes tracked
  - Security event monitoring

#### DNS & Domains

- **Route53**: DNS management
  - Primary domain routing
  - Health checks
  - Failover configuration (future)

## Architecture Diagram (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                        User/Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            S3 + CloudFront (Frontend Hosting)               │
│         React SPA + Static Assets (CI/CD deployed)          │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
┌────────────────────┐         ┌────────────────────┐
│  CloudFront CDN    │         │   Cognito User     │
│  (Videos, Assets)  │         │       Pool         │
└────────────────────┘         └─────────┬──────────┘
                                         │ JWT Token
                                         ↓
                               ┌────────────────────┐
                               │   API Gateway      │
                               │ (JWT Authorizer)   │
                               └─────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ↓                    ↓                    ↓
          ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
          │ Lambda: Auth     │ │ Lambda: Business │ │ Lambda: Video    │
          │ (Register, etc)  │ │ (Assessments)    │ │ (Progress, etc)  │
          └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                   │                    │                    │
                   │       Drizzle ORM (Type-safe queries)   │
                   └────────────────────┼────────────────────┘
                                        │
                                        ↓
                              ┌──────────────────┐
                              │   RDS Postgres   │
                              │  (Multi-tenant)  │
                              │   + RLS Policies │
                              └──────────────────┘

┌────────────────────┐         ┌────────────────────┐
│  S3: Video Files   │         │   CloudWatch       │
│  (Private bucket)  │         │  (Logs + Metrics)  │
└────────────────────┘         └────────────────────┘
```

## SST Project Structure

```
/
├── sst.config.ts              # SST main configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── stacks/
│   ├── AuthStack.ts           # Cognito User Pool setup
│   ├── DatabaseStack.ts       # RDS PostgreSQL configuration
│   ├── StorageStack.ts        # S3 buckets, CloudFront distributions
│   ├── ApiStack.ts            # API Gateway + Lambda functions
│   ├── MonitoringStack.ts     # CloudWatch alarms
│   └── VpcStack.ts            # VPC, subnets, security groups
├── schema/                    # Drizzle schema definitions
│   ├── tenants.ts
│   ├── users.ts
│   ├── assessments.ts
│   ├── programs.ts
│   ├── videos.ts
│   └── index.ts
├── migrations/                # Generated SQL migrations
│   ├── 0000_initial.sql
│   ├── 0001_add_preferences.sql
│   └── meta/
│       └── _journal.json
├── packages/
│   ├── functions/             # Lambda function code
│   │   ├── auth/              # Registration, login handlers
│   │   ├── assessments/       # Assessment CRUD
│   │   ├── programs/          # Program generation
│   │   ├── videos/            # Video metadata, progress
│   │   └── business/          # Business portal logic
│   ├── core/                  # Shared business logic
│   │   ├── services/          # Service layer implementations
│   │   ├── repositories/      # Data access layer
│   │   ├── lib/               # Utilities, helpers
│   │   │   └── database.ts    # Drizzle client and RLS helpers
│   │   └── types/             # Shared TypeScript types
│   └── web/                   # React frontend
│       ├── src/
│       │   ├── components/    # Atomic design structure
│       │   ├── contexts/      # React contexts (Auth, etc)
│       │   ├── pages/         # Page components
│       │   └── lib/           # Frontend utilities
│       └── public/            # Static assets
└── docs/                      # This documentation
```

## Data Flow Examples

### User Registration Flow

```
1. User submits registration form (React)
   ↓
2. POST /auth/register (API Gateway)
   ↓
3. Lambda: Generate tenantId, validate input (Zod)
   ↓
4. Cognito: Create user with custom attributes
   ↓
5. PostgreSQL: Insert user record with tenantId (via Drizzle)
   ↓
6. Cognito: Send verification email
   ↓
7. Response: Registration successful
```

### Assessment Submission Flow

```
1. User submits assessment answers (React)
   ↓
2. POST /assessments/{id}/submit (API Gateway)
   ↓
3. JWT Authorizer: Validate token, extract tenantId
   ↓
4. Lambda: Validate answers (Zod schema)
   ↓
5. Drizzle: Set RLS context in transaction
   ↓
6. PostgreSQL: Save answers with tenant isolation
   ↓
7. Lambda: Run scoring algorithm
   ↓
8. Lambda: Generate workout program
   ↓
9. PostgreSQL: Save program with tenant isolation (via Drizzle)
   ↓
10. Response: Program generated successfully
```

### Video Playback Flow

```
1. User clicks "Play Exercise" (React)
   ↓
2. GET /videos/{id}/stream (API Gateway)
   ↓
3. JWT Authorizer: Validate token
   ↓
4. Lambda: Check user has access (Drizzle RLS query)
   ↓
5. Lambda: Generate CloudFront signed URL (5min expiry)
   ↓
6. Response: Signed video URL
   ↓
7. React: Load video from CloudFront CDN
   ↓
8. User watches video (progress tracked locally)
   ↓
9. POST /videos/{id}/progress (periodic updates via Drizzle)
```

## Environment Strategy

### Development (dev)

- Personal developer environment
- Hot-reload Lambda via `sst dev`
- Isolated resources per developer
- Use `drizzle-kit push` for rapid schema iteration
- Cost: ~$10-20/month

### Staging (staging)

- Shared testing environment
- Matches production configuration
- Used for QA and demo
- Use `drizzle-kit generate` + `migrate` for controlled schema changes
- Cost: ~$30-50/month

### Production (prod)

- Customer-facing environment
- Enhanced monitoring and alarms
- Daily backups
- Strict migration review process
- Cost: ~$36-66/month (<1000 users)

## Scalability Considerations

### Current Capacity (Phase 1)

- **Concurrent users**: ~1,000
- **API requests**: ~1M/month
- **Database**: 50GB storage, ~100 connections
- **Video bandwidth**: ~500GB/month
- **Drizzle**: Handles current load efficiently with minimal overhead

### When to Scale (Future)

- **10k users**: Add read replicas, Multi-AZ RDS
- **100k users**: ElastiCache, DynamoDB for rate limiting
- **1M users**: Auto-scaling Lambda concurrency, database sharding
- **Drizzle**: Continues to work efficiently at all scales

## Cost Breakdown (Phase 1)

**Region**: eu-west-2 (London)

**Pricing Sources**:

- [AWS RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/) (Last checked: October 2025)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/) (Last checked: October 2025)
- [AWS CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/) (Last checked: October 2025)
- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/) (Last checked: October 2025)
- [AWS API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/) (Last checked: October 2025)
- [AWS Route53 Pricing](https://aws.amazon.com/route53/pricing/) (Last checked: October 2025)
- [AWS Cognito Pricing](https://aws.amazon.com/cognito/pricing/) (Last checked: October 2025)
- [AWS CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/) (Last checked: October 2025)
- [AWS Pricing Calculator](https://calculator.aws/) - Use this for exact quotes

| Service                       | Monthly Cost (GBP) | Notes                                                      |
| ----------------------------- | ------------------ | ---------------------------------------------------------- |
| **Cognito**                   | £0                 | Free tier: 50,000 MAU                                      |
| **RDS PostgreSQL (t3.small)** | £22-27             | Single AZ, ~£0.031/hour, 2 vCPU, 2GB RAM                   |
| **S3 + CloudFront**           | £4-15              | Video library (500GB-1TB storage + bandwidth)              |
| **Lambda**                    | £0-4               | Free tier: 1M requests/month, 400,000 GB-seconds           |
| **API Gateway**               | £0-4               | Free tier: 1M API calls/month (12 months for new accounts) |
| **S3 (Frontend Hosting)**     | £0-1               | Static assets, CloudFront caching reduces costs            |
| **CloudWatch**                | £0-4               | Basic logging/metrics, 5GB ingestion free tier             |
| **Route53**                   | £0.40              | Hosted zone (~£0.50/month, 1M queries included)            |
| **NAT Gateway**               | £27-32             | Required for Lambda VPC internet access (~£0.045/hour)     |
| **Secrets Manager**           | £0.32              | ~5 secrets × £0.40/month per secret                        |
| **Total (Estimated)**         | **£54-87**         | Actual costs will vary based on usage                      |

### Cost Notes

**⚠️ Important**: Prices shown are estimates based on eu-west-2 (London) region pricing as of October 2025. AWS pricing changes over time and varies by region. Always verify current pricing using the [AWS Pricing Calculator](https://calculator.aws/) before making budget decisions.

**Exchange Rate**: Estimates use approximate rate of £1 = $1.27 USD (October 2025). Actual billing depends on your AWS billing currency.

**Drizzle ORM**: No additional cost - it's a lightweight library that runs in your Lambda functions. The minimal overhead (~50KB bundle size) has negligible impact on Lambda costs.

**NAT Gateway**: The largest single cost driver in Phase 1. Required for Lambda functions in private subnets to access the internet (Cognito, external APIs, etc.). Consider:

- **Phase 1**: Single NAT Gateway in one AZ (~£27-32/month)
- **Phase 2**: Multi-AZ NAT Gateways for high availability (~£60/month)
- **Alternative**: Lambda functions outside VPC (less secure, saves NAT costs)

**Free Tier Benefits**:

- **Cognito**: Always free up to 50,000 MAU
- **Lambda**: 1M requests + 400,000 GB-seconds per month (always free)
- **S3**: 5GB storage + 20,000 GET requests (12 months for new accounts)
- **RDS**: 750 hours of t3.micro/t4g.micro (12 months for new accounts) - t3.small not included
- **CloudWatch**: 5GB logs + 10 metrics (always free)
- **API Gateway**: 1M calls per month (12 months for new accounts)

**Cost Optimization Tips**:

1. Use t4g.small (ARM/Graviton) instead of t3.small for RDS (~20% cheaper)
2. Enable S3 Intelligent-Tiering for video files
3. Set CloudFront cache TTL appropriately (reduce origin requests)
4. Right-size Lambda memory allocation (higher memory can be more cost-effective)
5. Use Reserved Instances for RDS after confirming instance type (~40% savings)
6. Drizzle's lightweight nature means minimal Lambda execution time

### Scaling Cost Projections

| User Count | Estimated Monthly Cost | Key Changes                            |
| ---------- | ---------------------- | -------------------------------------- |
| <100       | £54-87                 | Phase 1 baseline (free tiers active)   |
| 100-1k     | £85-150                | RDS t3.medium, increased bandwidth     |
| 1k-10k     | £300-600               | Multi-AZ RDS, ElastiCache, more Lambda |
| 10k-100k   | £1,200-3,000           | Read replicas, sharding considerations |

## Security Layers

### Network Security

- VPC isolation
- Private subnets for data tier
- Security groups (least privilege)
- No public RDS access

### Application Security

- JWT validation on all protected routes
- Zod schema validation on all inputs (auto-generated from Drizzle schemas)
- RLS enforced at database level
- Type-safe queries prevent SQL injection
- Structured logging (no sensitive data)

### Data Security

- Encryption at rest (KMS)
- Encryption in transit (TLS 1.3)
- Secrets Manager for credentials
- Regular backups (7-day retention)
- Drizzle parameterized queries (SQL injection protection)

### Monitoring & Incident Response

- CloudWatch alarms for anomalies
- CloudTrail for audit logs
- Structured logging with correlation IDs
- Tenant/user context in all logs

## Migration Path (Future Phases)

### Phase 2 (1k-10k users)

- Enable Multi-AZ RDS
- Add ElastiCache for caching
- Video transcoding pipeline
- Enhanced monitoring (X-Ray)
- Drizzle continues to handle increased load efficiently

### Phase 3 (10k-100k users)

- Read replicas for RDS
- DynamoDB for rate limiting
- Advanced analytics pipeline
- Real-time notifications
- Consider connection pooling (RDS Proxy)

### Phase 4 (100k+ users)

- Database sharding considerations
- Global deployment (multi-region)
- Chaos engineering
- Advanced observability
- Drizzle works seamlessly with sharded architectures
