# FFP - Security Documentation

## Overview

Healthcare application handling personal health information (PHI). Security implemented at every layer following OWASP best practices.

## OWASP Top 10 Mitigation Summary

| #   | Threat                        | FFP Mitigation                                                                                                                  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Injection**                 | Drizzle ORM (parameterised queries), Zod input validation, least-privilege DB users                                             |
| 2   | **Broken Authentication**     | AWS Cognito, strong password policy (8+ chars, mixed case, digits, symbols), short-lived JWTs (15 min), refresh tokens (7 days) |
| 3   | **Sensitive Data Exposure**   | TLS 1.3 in transit, KMS encryption at rest (RDS, S3), Secrets Manager for credentials, no PHI in logs                           |
| 4   | **XXE**                       | JSON-only API, no XML parsing                                                                                                   |
| 5   | **Broken Access Control**     | PostgreSQL RLS (tenant isolation), role-based access, JWT tenant context on every request, API Gateway authoriser               |
| 6   | **Security Misconfiguration** | Security headers, restrictive CORS, generic client errors (detailed logs internal), auto-generated credentials, Dependabot      |
| 7   | **XSS**                       | React auto-escaping, Content Security Policy headers, input sanitisation                                                        |
| 8   | **Insecure Deserialisation**  | Zod validation on all inputs, no eval(), TypeScript strict mode                                                                 |
| 9   | **Vulnerable Components**     | `pnpm audit`, Dependabot, lock files committed, minimal dependencies                                                            |
| 10  | **Insufficient Logging**      | CloudWatch structured logs with tenant/user context, security event logging, CloudTrail for AWS API audit                       |

## PHI (Personal Health Information)

**What qualifies as PHI in FFP:**

- Assessment answers (pain levels, body areas, limitations)
- User health goals and exercise restrictions
- Progress notes with health context

**Protection measures:**

- Encryption at rest (RDS, S3 via KMS) and in transit (TLS 1.3)
- No PHI in CloudWatch logs — log IDs only, not content
- RLS tenant isolation at database level
- Access logging via audit trail
- Minimal collection — only necessary data

## Data Retention

| Data                 | Retention                            |
| -------------------- | ------------------------------------ |
| Active user data     | Indefinite while account active      |
| Deleted accounts     | 30-day soft delete, then hard delete |
| Production logs      | 30 days                              |
| Automated DB backups | 7 days                               |
| Manual DB backups    | 90 days                              |

## Network Security Patterns

- **VPC**: Public + private subnets, NAT gateway
- **Security Groups**: Lambda SG → RDS SG (port 5432 only), no public RDS access
- **API Gateway**: JWT authoriser, basic throttling (1000 req/s, 2000 burst)
- **WAF**: Optional Phase 1 — rate limiting + AWS managed rule sets

## Security Checklist (Per Deployment)

- [ ] `pnpm audit` shows 0 high/critical vulnerabilities
- [ ] No secrets in code or committed files
- [ ] All API endpoints have Zod validation
- [ ] All database queries use parameterised queries (Drizzle)
- [ ] RLS policies tested for all tenant-scoped tables
- [ ] CORS configured with specific origins
- [ ] Secrets stored in Secrets Manager
- [ ] TLS 1.3 enforced on all endpoints

## Incident Response

1. **Assess severity** (5 min) — Critical: PHI exposed / active breach → High: successful unauthorised access → Medium: vulnerability found, no exploitation
2. **Contain** (15 min) — Revoke tokens, block IPs (WAF), disable affected accounts
3. **Investigate** (1 hour) — CloudWatch logs, audit table, determine scope and vector
4. **Remediate** — Patch vulnerability, force password resets, deploy fixes
5. **Notify** (24-72 hours) — Internal team immediately, affected users within 72 hours if PHI breach
6. **Post-mortem** (1 week) — Timeline, root cause, prevention measures

## Compliance Considerations

| Standard  | When Required                                        | Status                                                                                               |
| --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **GDPR**  | Users in EU                                          | Phase 2 — privacy policy, data export/deletion, breach notification                                  |
| **HIPAA** | Healthcare providers using FFP for patient treatment | Not required Phase 1 (direct-to-consumer wellness). Phase 3 if needed — BAA, HIPAA-eligible services |
| **SOC 2** | Enterprise sales                                     | Phase 2+                                                                                             |

---

_Security infrastructure (VPC, security groups, WAF) will be configured when SST stacks are built. See Jira backlog for future security enhancements (FFP-258)._
