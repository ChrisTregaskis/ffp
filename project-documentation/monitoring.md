# FFP - Monitoring & Observability

## Overview

CloudWatch for centralised logging, metrics, and alerting. Phase 1 focuses on essential monitoring to catch critical issues while keeping complexity low.

## Structured Logging

All logs use JSON format for parsing and filtering:

```json
{
  "level": "INFO",
  "service": "AssessmentService",
  "message": "Assessment created",
  "timestamp": "2025-10-05T14:30:00.000Z",
  "organisationId": "uuid",
  "userId": "uuid",
  "correlationId": "req-abc-123"
}
```

**Log Retention:**

| Environment | Retention |
| ----------- | --------- |
| Production  | 30 days   |
| Staging     | 14 days   |
| Development | 7 days    |

## Key CloudWatch Insights Queries

```sql
-- Errors by organisation
fields @timestamp, message, organisationId, userId, error
| filter level = "ERROR"
| filter organisationId = "uuid"
| sort @timestamp desc

-- API response times (5-minute buckets)
fields @timestamp, @duration, message
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)

-- Error count by service
fields service, level
| filter level = "ERROR"
| stats count() by service
| sort count() desc
```

## Alarm Strategy

### Critical (Immediate Action)

| Alarm          | Metric                  | Threshold    | Evaluation |
| -------------- | ----------------------- | ------------ | ---------- |
| API 5xx errors | API Gateway ServerError | >5 in 5 min  | 1 period   |
| Lambda errors  | Function Errors         | >10 in 5 min | 1 period   |
| DB connections | RDS DatabaseConnections | >80% max     | 2 periods  |

### Warning (Investigation Required)

| Alarm       | Metric                   | Threshold        | Evaluation |
| ----------- | ------------------------ | ---------------- | ---------- |
| API latency | API Gateway p95          | >500ms           | 3 periods  |
| DB CPU      | RDS CPUUtilization       | >80%             | 2 periods  |
| Cold starts | Lambda InitDuration rate | >20% invocations | 2 periods  |

Alerts via SNS topic → email (and optionally Slack webhook via Lambda).

## Custom Business Metrics

Track via CloudWatch custom namespace `FFP/Business`:

- Assessments started / completed (completion rate)
- Programmes generated
- Daily / weekly / monthly active users

## Incident Response Runbook

### High Error Rate

1. Check CloudWatch dashboard — identify affected service
2. Filter recent ERROR logs, check for recent deployments
3. Assess impact (users/organisations affected)
4. Rollback or hotfix
5. Monitor 30 minutes post-fix
6. Document post-mortem

### Database Connection Exhaustion

1. Check RDS connection metrics
2. Identify which Lambda functions consume most connections
3. Immediate: restart Lambda functions (connection reset)
4. Long-term: implement connection pooling or RDS Proxy

### High API Latency

1. Identify slow endpoints via API Gateway per-route metrics
2. Check Lambda duration, RDS CPU, slow query log
3. Optimise: add caching, tune queries, increase Lambda memory

## Cost Notes

- Log ingestion: $0.50/GB, storage: $0.03/GB/month
- First 10 custom metrics free, then $0.30/metric/month
- First 3 dashboards free, then $3/dashboard/month
- Use metric filters over custom metrics where possible

---

_CloudWatch dashboard, alarm CDK constructs, and SNS topic configuration will be implemented when infrastructure stacks are built. See Jira backlog for future monitoring enhancements (FFP-257)._
