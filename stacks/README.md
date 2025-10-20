# Stacks

This directory contains SST (Serverless Stack) infrastructure-as-code definitions for the FFP application.

**Note**: Full SST configuration will be added in FFP-8 (SST Infrastructure Foundation).

## Structure

```
stacks/
├── api-stack.ts       # API Gateway + Lambda functions
├── auth-stack.ts      # Cognito User Pools
├── database-stack.ts  # RDS PostgreSQL
├── storage-stack.ts   # S3 buckets + CloudFront
└── index.ts          # Stack orchestration
```

## Current Status

- ✅ Directory structure created
- ⏸️ Awaiting FFP-8 implementation
