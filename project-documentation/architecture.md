# FFP - Architecture Documentation

## Overview

FFP uses a serverless-first AWS architecture optimized for multi-tenant SaaS. Phase 1 prioritizes simplicity and speed while establishing scalable patterns.

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
│                    AWS Amplify (Frontend)                   │
│         React SPA + Static Assets (Auto-deployed)           │
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
├── stacks/
│   ├── AuthStack.ts           # Cognito User Pool setup
│   ├── DatabaseStack.ts       # RDS PostgreSQL configuration
│   ├── StorageStack.ts        # S3 buckets, CloudFront distributions
│   ├── ApiStack.ts            # API Gateway + Lambda functions
│   ├── MonitoringStack.ts     # CloudWatch alarms
│   └── VpcStack.ts            # VPC, subnets, security groups
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
5. PostgreSQL: Insert user record with tenantId
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
5. Set RLS context: SET app.tenant_id = 'uuid'
   ↓
6. PostgreSQL: Save answers with tenant isolation
   ↓
7. Lambda: Run scoring algorithm
   ↓
8. Lambda: Generate workout program
   ↓
9. PostgreSQL: Save program with tenant isolation
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
4. Lambda: Check user has access (RLS query)
   ↓
5. Lambda: Generate CloudFront signed URL (5min expiry)
   ↓
6. Response: Signed video URL
   ↓
7. React: Load video from CloudFront CDN
   ↓
8. User watches video (progress tracked locally)
   ↓
9. POST /videos/{id}/progress (periodic updates)
```

## Environment Strategy

### Development (dev)

- Personal developer environment
- Hot-reload Lambda via `sst dev`
- Isolated resources per developer
- Cost: ~$10-20/month

### Staging (staging)

- Shared testing environment
- Matches production configuration
- Used for QA and demo
- Cost: ~$30-50/month

### Production (prod)

- Customer-facing environment
- Enhanced monitoring and alarms
- Daily backups
- Cost: ~$36-66/month (<1000 users)

## Scalability Considerations

### Current Capacity (Phase 1)

- **Concurrent users**: ~1,000
- **API requests**: ~1M/month
- **Database**: 50GB storage, ~100 connections
- **Video bandwidth**: ~500GB/month

### When to Scale (Future)

- **10k users**: Add read replicas, Multi-AZ RDS
- **100k users**: ElastiCache, DynamoDB for rate limiting
- **1M users**: Auto-scaling Lambda concurrency, database sharding

## Cost Breakdown (Phase 1)

| Service         | Monthly Cost | Notes                    |
| --------------- | ------------ | ------------------------ |
| Cognito         | $0           | Free tier (50k MAU)      |
| RDS (t3.small)  | $30          | Single AZ                |
| S3 + CloudFront | $5-20        | Video library dependent  |
| Lambda          | $0-5         | Free tier covers Phase 1 |
| API Gateway     | $0-5         | Free tier (1M requests)  |
| Amplify         | $0           | Free tier (1k build min) |
| CloudWatch      | $0-5         | Basic logging/metrics    |
| Route53         | $1           | Hosted zone              |
| **Total**       | **$36-66**   |                          |

## Security Layers

### Network Security

- VPC isolation
- Private subnets for data tier
- Security groups (least privilege)
- No public RDS access

### Application Security

- JWT validation on all protected routes
- Zod schema validation on all inputs
- RLS enforced at database level
- Structured logging (no sensitive data)

### Data Security

- Encryption at rest (KMS)
- Encryption in transit (TLS 1.3)
- Secrets Manager for credentials
- Regular backups (7-day retention)

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

### Phase 3 (10k-100k users)

- Read replicas for RDS
- DynamoDB for rate limiting
- Advanced analytics pipeline
- Real-time notifications

### Phase 4 (100k+ users)

- Database sharding considerations
- Global deployment (multi-region)
- Chaos engineering
- Advanced observability
