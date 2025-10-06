# FFP - Security Documentation

## Overview

As a healthcare application handling personal health information (PHI), FFP implements security best practices at every layer. This document covers OWASP compliance, data protection, and security testing.

## OWASP Top 10 Mitigation

### 1. Injection Attacks

**Threats**: SQL injection, NoSQL injection, command injection

**Mitigations**:

- ✅ **Parameterized queries**: Never concatenate user input into SQL
- ✅ **Input validation**: Zod schemas on all API endpoints
- ✅ **ORM/Query Builder**: Use Knex.js or Prisma
- ✅ **Least privilege**: Database users have minimum required permissions

```typescript
// ❌ BAD: SQL Injection vulnerable
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userInput}'`
);

// ✅ GOOD: Parameterized query
const result = await db.query("SELECT * FROM users WHERE email = $1", [
  userInput,
]);

// ✅ GOOD: Zod validation before query
const EmailSchema = z.string().email().max(255);
const validatedEmail = EmailSchema.parse(userInput);
const result = await db.query("SELECT * FROM users WHERE email = $1", [
  validatedEmail,
]);
```

### 2. Broken Authentication

**Threats**: Weak passwords, credential stuffing, session hijacking

**Mitigations**:

- ✅ **AWS Cognito**: Battle-tested authentication system
- ✅ **Password policy**: Min 8 chars, uppercase, lowercase, digits, symbols
- ✅ **JWT tokens**: Short-lived access tokens (15 min), longer refresh tokens (7 days)
- ✅ **No passwords in logs**: Never log credentials or tokens
- ✅ **MFA ready**: Cognito supports SMS/TOTP (Phase 2)

```typescript
// Cognito password policy
passwordPolicy: {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireDigits: true,
  requireSymbols: true,
  temporaryPasswordValidityDays: 7,
}
```

### 3. Sensitive Data Exposure

**Threats**: Unencrypted data at rest/transit, exposed PHI

**Mitigations**:

- ✅ **TLS 1.3**: All API communication encrypted
- ✅ **RDS encryption**: At-rest encryption via KMS
- ✅ **S3 encryption**: Server-side encryption enabled
- ✅ **Secrets Manager**: No credentials in code/env vars
- ✅ **Minimal PHI**: Only collect necessary health information
- ✅ **No PHI in logs**: Structured logging excludes sensitive data

```typescript
// ✅ GOOD: Log without PHI
logger.info("Assessment completed", {
  userId: context.userId,
  tenantId: context.tenantId,
  assessmentId: assessment.id,
  // ❌ DO NOT LOG: answers, score details, personal health info
});

// ✅ GOOD: Encrypt sensitive fields (if needed)
import { KMSClient, EncryptCommand } from "@aws-sdk/client-kms";

async function encryptSensitiveData(data: string): Promise<string> {
  const kms = new KMSClient({ region: process.env.AWS_REGION });
  const result = await kms.send(
    new EncryptCommand({
      KeyId: process.env.KMS_KEY_ID,
      Plaintext: Buffer.from(data),
    })
  );
  return result.CiphertextBlob!.toString("base64");
}
```

### 4. XML External Entities (XXE)

**Threat**: XML injection attacks

**Mitigation**:

- ✅ **JSON-only**: FFP uses JSON, not XML
- ✅ **No XML parsing**: Avoid XML libraries entirely

### 5. Broken Access Control

**Threats**: Unauthorized data access, privilege escalation

**Mitigations**:

- ✅ **Row-Level Security**: Database-enforced tenant isolation
- ✅ **Role-based access control**: User roles checked on every request
- ✅ **Tenant context**: Every query includes tenant_id
- ✅ **API Gateway authorizer**: JWT validation before Lambda invocation
- ✅ **Principle of least privilege**: Users can only access their own data

```typescript
// ✅ GOOD: Role-based access check
export const handler = async (event) => {
  const context = extractTenantContext(event);

  // Only business owners can invite users
  if (context.role !== "business_owner") {
    throw new ForbiddenError("Only business owners can invite users");
  }

  // Ensure RLS context is set
  await setRLSContext(context.tenantId, context.userId);

  // Query automatically filtered by tenant
  const users = await db.query(
    "SELECT * FROM users WHERE tenant_id = current_setting('app.tenant_id')::uuid"
  );
};
```

### 6. Security Misconfiguration

**Threats**: Default credentials, unnecessary services, verbose errors

**Mitigations**:

- ✅ **helmet.js**: Security headers for Express/Fastify
- ✅ **CORS**: Restrictive CORS policy (specific origins only)
- ✅ **Error messages**: Generic errors to clients, detailed logs internally
- ✅ **Security Groups**: Minimal network access
- ✅ **No default passwords**: All credentials auto-generated
- ✅ **Regular updates**: Dependabot for dependency updates

```typescript
// Express security middleware
import helmet from "helmet";
import cors from "cors";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  })
);
```

### 7. Cross-Site Scripting (XSS)

**Threats**: Malicious scripts injected into web pages

**Mitigations**:

- ✅ **React auto-escaping**: React escapes all output by default
- ✅ **Content Security Policy**: CSP headers prevent inline scripts
- ✅ **Input sanitization**: Validate and sanitize all user input
- ✅ **DOMPurify**: Sanitize rich text if needed (future)

```typescript
// ✅ GOOD: React auto-escapes
function UserProfile({ user }: { user: User }) {
  // Safe - React will escape HTML entities
  return (
    <div>
      {user.firstName} {user.lastName}
    </div>
  );
}

// ❌ BAD: dangerouslySetInnerHTML (avoid unless absolutely necessary)
function RichText({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ GOOD: If you must use innerHTML, sanitize first
import DOMPurify from "dompurify";

function SafeRichText({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 8. Insecure Deserialization

**Threats**: Remote code execution, data tampering

**Mitigations**:

- ✅ **Zod validation**: Validate all incoming data
- ✅ **No eval()**: Never use eval or Function constructor
- ✅ **Type checking**: TypeScript strict mode catches many issues

```typescript
// ✅ GOOD: Validate before processing
const SubmitAssessmentSchema = z.object({
  answers: z.record(z.unknown()),
});

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const validated = SubmitAssessmentSchema.parse(body);

  // Safe to process validated.answers
};
```

### 9. Using Components with Known Vulnerabilities

**Threats**: Exploitable dependencies

**Mitigations**:

- ✅ **npm audit**: Run regularly
- ✅ **Dependabot**: Automatic dependency updates
- ✅ **Lock files**: package-lock.json committed
- ✅ **Minimal dependencies**: Only use necessary packages
- ✅ **Review updates**: Don't blindly accept all updates

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update specific package
npm update package-name
```

### 10. Insufficient Logging & Monitoring

**Threats**: Undetected breaches, slow incident response

**Mitigations**:

- ✅ **CloudWatch logging**: All Lambda functions log to CloudWatch
- ✅ **Structured logs**: JSON format with tenant/user context
- ✅ **Security events**: Log authentication, authorization failures
- ✅ **CloudWatch alarms**: Alert on suspicious activity
- ✅ **CloudTrail**: Audit all AWS API calls
- ✅ **Audit table**: Database audit log for sensitive operations

```typescript
// Security event logging
logger.warn("Failed login attempt", {
  email: email,
  ipAddress: event.requestContext.identity.sourceIp,
  userAgent: event.requestContext.identity.userAgent,
});

logger.error("Unauthorized access attempt", {
  userId: context.userId,
  tenantId: context.tenantId,
  attemptedResource: resourceId,
  action: "delete",
});

// Database audit log
await db.query(
  `
  INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata, ip_address)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`,
  [
    context.tenantId,
    context.userId,
    "assessment.submit",
    "assessment",
    assessmentId,
    JSON.stringify({ score: result.score }),
    ipAddress,
  ]
);
```

## Data Protection

### PHI (Personal Health Information) Handling

**What qualifies as PHI in FFP:**

- Assessment answers (pain levels, body areas, limitations)
- User health goals
- Exercise limitations or restrictions
- Progress notes with health context

**PHI Protection Measures:**

- ✅ Encryption at rest (RDS, S3)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access logging (audit table)
- ✅ Minimal collection (only necessary data)
- ✅ No PHI in CloudWatch logs
- ✅ Row-level security (tenant isolation)

### Data Retention

- **Active user data**: Retained indefinitely while account active
- **Deleted accounts**: 30-day soft delete, then hard delete
- **Logs**: 30 days (production), 14 days (staging), 7 days (dev)
- **Backups**: 7 days automated, manual backups retained 90 days

### Data Deletion (GDPR Right to be Forgotten)

```typescript
// Soft delete (Phase 1)
async function softDeleteUser(userId: string, context: TenantContext) {
  await db.query(
    `
    UPDATE users 
    SET deleted_at = NOW(), 
        email = CONCAT('deleted-', id, '@deleted.local'),
        status = 'deleted'
    WHERE id = $1 AND tenant_id = $2
  `,
    [userId, context.tenantId]
  );
}

// Hard delete cascade (Phase 2 - future)
async function hardDeleteUser(userId: string, context: TenantContext) {
  // Delete in order respecting foreign keys
  await db.query(
    "DELETE FROM user_progress WHERE user_id = $1 AND tenant_id = $2",
    [userId, context.tenantId]
  );
  await db.query("DELETE FROM programs WHERE user_id = $1 AND tenant_id = $2", [
    userId,
    context.tenantId,
  ]);
  await db.query(
    "DELETE FROM user_assessments WHERE user_id = $1 AND tenant_id = $2",
    [userId, context.tenantId]
  );
  await db.query("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [
    userId,
    context.tenantId,
  ]);

  // Log deletion
  logger.info("User data permanently deleted", {
    userId,
    tenantId: context.tenantId,
  });
}
```

## Network Security

### VPC Configuration

```typescript
// stacks/VpcStack.ts
const vpc = new Vpc(stack, "VPC", {
  maxAzs: 2,
  natGateways: 1, // Cost optimization for Phase 1
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: "Public",
      subnetType: SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: "Private",
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    },
  ],
});
```

### Security Groups

```typescript
// RDS Security Group
const dbSecurityGroup = new SecurityGroup(stack, "DatabaseSG", {
  vpc,
  description: "Security group for RDS database",
  allowAllOutbound: false,
});

// Lambda Security Group
const lambdaSG = new SecurityGroup(stack, "LambdaSG", {
  vpc,
  description: "Security group for Lambda functions",
});

// Allow Lambda to connect to RDS
dbSecurityGroup.addIngressRule(
  lambdaSG,
  Port.tcp(5432),
  "Allow Lambda to access RDS"
);

// No public access to RDS
// RDS only accessible from private subnets via Lambda
```

### WAF (Web Application Firewall) - Optional Phase 1

```typescript
// stacks/WafStack.ts
const webAcl = new CfnWebACL(stack, "ApiWAF", {
  defaultAction: { allow: {} },
  scope: "REGIONAL",
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "FFP-WAF",
    sampledRequestsEnabled: true,
  },
  rules: [
    {
      name: "RateLimitRule",
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: 2000,
          aggregateKeyType: "IP",
        },
      },
      action: { block: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "RateLimitRule",
        sampledRequestsEnabled: true,
      },
    },
    {
      name: "AWSManagedRulesCommonRuleSet",
      priority: 2,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "CommonRuleSet",
        sampledRequestsEnabled: true,
      },
    },
  ],
});
```

## API Security

### Rate Limiting

```typescript
// API Gateway throttling
const api = new Api(stack, "Api", {
  throttle: {
    rateLimit: 1000, // requests per second
    burstLimit: 2000, // concurrent requests
  },
  routes: {
    // Per-route rate limiting for expensive operations
    "POST /assessments/{id}/submit": {
      function: "functions/assessments/submit.handler",
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
    },
  },
});
```

### Request Validation

```typescript
// API Gateway request validation
const requestValidator = api.addRequestValidator("Validator", {
  validateRequestBody: true,
  validateRequestParameters: true,
});

// Model for request body
const assessmentModel = api.addModel("AssessmentModel", {
  contentType: "application/json",
  schema: {
    type: "object",
    required: ["templateId"],
    properties: {
      templateId: { type: "string", format: "uuid" },
    },
  },
});
```

## Security Testing

### Automated Security Scans

```bash
# Dependency vulnerability scan
npm audit

# SAST (Static Application Security Testing)
npm run lint:security

# Secrets detection
npm install -g trufflehog
trufflehog filesystem . --json
```

### Penetration Testing (Phase 2)

Before major launches or annually:

- Hire external security firm
- Test authentication bypass
- Test authorization escalation
- Test data isolation between tenants
- Test API rate limiting
- Test SQL injection vectors
- Test XSS vulnerabilities

### Security Checklist (Per Deployment)

- [ ] npm audit shows 0 high/critical vulnerabilities
- [ ] No secrets in code or committed files
- [ ] All API endpoints have Zod validation
- [ ] All database queries use parameterized queries
- [ ] RLS policies tested for all tenant-scoped tables
- [ ] Security headers configured (helmet.js)
- [ ] CORS configured with specific origins
- [ ] CloudWatch logging includes security events
- [ ] Secrets stored in Secrets Manager (not env vars)
- [ ] TLS 1.3 enforced on all endpoints

## Incident Response Plan

### Security Incident Detection

**Indicators:**

- Unusual spike in authentication failures
- High error rates from single IP/tenant
- Unauthorized data access attempts in logs
- CloudWatch alarm: suspicious activity pattern
- User report of unauthorized access

### Response Steps

1. **Assess Severity** (5 min)

   - Critical: PHI exposed, active breach
   - High: Unauthorized access attempt successful
   - Medium: Vulnerability discovered, no exploitation
   - Low: Suspicious activity, under investigation

2. **Contain** (15 min)

   - Revoke compromised tokens (invalidate Cognito sessions)
   - Block attacking IP addresses (WAF)
   - Disable affected user accounts
   - Enable additional logging

3. **Investigate** (1 hour)

   - Review CloudWatch logs
   - Check audit_logs table
   - Identify scope of breach
   - Determine attack vector

4. **Remediate** (varies)

   - Patch vulnerability
   - Force password resets for affected users
   - Update security rules
   - Deploy fixes

5. **Notify** (24-72 hours)

   - Internal team notification (immediately)
   - Affected users (within 72 hours if PHI breach)
   - Regulatory bodies if required (GDPR, HIPAA)

6. **Post-Mortem** (1 week)
   - Document timeline
   - Root cause analysis
   - Prevention measures
   - Update runbook

## Compliance Considerations

### GDPR (General Data Protection Regulation)

**Applicable if**: Users in EU

**Requirements (Phase 2)**:

- ✅ Privacy policy
- ✅ Cookie consent
- ✅ Right to access data
- ✅ Right to deletion
- ✅ Right to data portability
- ✅ Breach notification (72 hours)

### HIPAA (Health Insurance Portability and Accountability Act)

**Applicable if**: Healthcare providers use FFP for patient treatment

**Not required for Phase 1** (direct-to-consumer wellness app)

**If needed (Phase 3)**:

- Business Associate Agreement (BAA)
- AWS HIPAA-eligible services
- Enhanced audit logging
- Access controls and encryption
- Risk assessment and policies

### SOC 2 (Service Organization Control 2)

**When needed**: Before enterprise sales (Phase 2+)

**Audit areas**:

- Security
- Availability
- Processing integrity
- Confidentiality
- Privacy

## Future Security Enhancements (Phase 2+)

- **MFA (Multi-Factor Authentication)**: SMS or TOTP via Cognito
- **SSO (Single Sign-On)**: SAML/OIDC for enterprise customers
- **Advanced threat detection**: AWS GuardDuty
- **DDoS protection**: AWS Shield Advanced
- **Secret rotation**: Automated via Secrets Manager
- **Penetration testing**: Annual third-party assessment
- **Bug bounty program**: HackerOne or similar
- **Security awareness training**: For team members
- **HIPAA compliance**: If entering healthcare provider market
