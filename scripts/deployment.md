# FFP Deployment Guide

This guide covers deploying and verifying the FFP infrastructure to AWS.

## Quick Start

### Deploy to Development

```bash
# Deploy all infrastructure to dev stage
pnpm sst:deploy:dev

# Or use SST dev mode (live Lambda development)
pnpm sst:dev
```

### Verify Deployment

```bash
# Run automated smoke tests
./scripts/smoke-test.sh

# Or specify a stage
STAGE=dev ./scripts/smoke-test.sh
```

---

## Deployment Commands

### Development

```bash
# Local development with live Lambda (personal stage)
pnpm sst:dev

# Deploy to shared dev stage
pnpm sst:deploy:dev

# Deploy to staging
pnpm sst:deploy:staging
```

### Build & Deploy

```bash
# Build all packages first (recommended)
pnpm build

# Then deploy
pnpm sst:deploy:dev
```

---

## Deployment Outputs

After successful deployment, SST outputs resource identifiers:

### Example Output

```
✓  Complete
   apiUrl: https://abc123xyz.execute-api.eu-west-2.amazonaws.com
   assetsBucket: ffp-dev-assetsbucketbucket-dnvmaanu
   cdnUrl: https://d25o0th3bf9azm.cloudfront.net
   region: eu-west-2
   userPoolArn: arn:aws:cognito-idp:eu-west-2:123456789012:userpool/eu-west-2_ABC123XYZ
   userPoolClientId: 7ams44epvr3jgb9dnto3a94hmh
   userPoolId: eu-west-2_ABC123XYZ
   videosBucket: ffp-dev-videosbucketbucket-fhwfrwta
```

### Accessing Outputs

```bash
# View outputs from last deployment
cat .sst/outputs.json

# Or redeploy with outputs flag
pnpm sst:deploy:dev --outputs
```

### Output Reference

| Output             | Description           | Used For                          |
| ------------------ | --------------------- | --------------------------------- |
| `apiUrl`           | API Gateway endpoint  | Frontend API calls, health checks |
| `userPoolId`       | Cognito User Pool ID  | Authentication configuration      |
| `userPoolClientId` | User Pool Client ID   | Frontend authentication           |
| `userPoolArn`      | User Pool ARN         | IAM policies, Lambda triggers     |
| `videosBucket`     | S3 videos bucket name | Video upload/storage              |
| `assetsBucket`     | S3 assets bucket name | Static asset storage              |
| `cdnUrl`           | CloudFront CDN URL    | Video delivery                    |
| `region`           | AWS region            | SDK configuration                 |

---

## Testing Endpoints

### Health Check

```bash
# Get API URL from outputs
API_URL=$(cat .sst/outputs.json | grep -o '"apiUrl":"[^"]*"' | cut -d'"' -f4)

# Test health endpoint
curl -v $API_URL/health

# Expected response (200 OK):
{
  "status": "healthy",
  "message": "FFP Functions - Health Check OK",
  "timestamp": "2025-10-25T12:34:56.789Z",
  "service": "auth",
  "version": "1.0.0"
}
```

### Using Postman

1. Import collection: `postman/FFP-API-Collection.postman_collection.json`
2. Import environment: `postman/FFP-Dev-Environment.postman_environment.json`
3. Update environment variables with deployment outputs
4. Test "Health Check" request

See `postman/README.md` for detailed setup instructions.

---

## Stage Management

### Personal Stages

When using `pnpm sst:dev`, SST creates a personal stage (typically your username):

```bash
pnpm sst:dev
# Creates stage: chris (or your username)
```

**Benefits:**

- Isolated development environment
- No conflicts with team members
- Separate AWS resources per developer

**CORS:** Personal stages default to `http://localhost:5173`

### Shared Stages

Use explicit stage flags for shared environments:

```bash
# Shared dev stage
pnpm sst:deploy:dev

# Shared staging stage
pnpm sst:deploy:staging
```

**Note:** Production stage not yet configured (will be added in pre-production phase).

---

## Resources

- **SST Documentation:** https://sst.dev/docs
- **AWS CLI Reference:** https://docs.aws.amazon.com/cli/
- **Project State:** `project-documentation/project-state.md`
- **Architecture:** `project-documentation/architecture.md`
