# FFP - Monitoring & Observability Documentation

## Overview

FFP uses AWS CloudWatch for centralized logging, metrics, and alerting. Phase 1 focuses on essential monitoring to catch critical issues while keeping complexity low.

## CloudWatch Logging

### Structured Logging Format

All logs use JSON format for easy parsing and filtering:

```json
{
  "level": "INFO",
  "service": "AssessmentService",
  "message": "Assessment created",
  "timestamp": "2025-10-05T14:30:00.000Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "assessmentId": "assessment-123",
  "correlationId": "req-abc-123"
}
```

### Log Groups Structure

```
/aws/lambda/ffp-prod-auth-register
/aws/lambda/ffp-prod-auth-login
/aws/lambda/ffp-prod-assessments-create
/aws/lambda/ffp-prod-assessments-submit
/aws/lambda/ffp-prod-programs-generate
/aws/lambda/ffp-prod-videos-stream
/aws/apigateway/ffp-prod
/aws/rds/instance/ffp-prod-db/error
/aws/rds/instance/ffp-prod-db/slowquery
```

### Retention Policies

- **Production**: 30 days (cost-effective for Phase 1)
- **Staging**: 14 days
- **Development**: 7 days

### CloudWatch Insights Queries

**Find errors by tenant**

```sql
fields @timestamp, message, tenantId, userId, error
| filter level = "ERROR"
| filter tenantId = "550e8400-e29b-41d4-a716-446655440000"
| sort @timestamp desc
| limit 100
```

**Track API response times**

```sql
fields @timestamp, @duration, message
| filter @message like /Assessment created/
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
```

**Count errors by service**

```sql
fields service, level
| filter level = "ERROR"
| stats count() by service
| sort count() desc
```

## CloudWatch Metrics

### Lambda Metrics (Automatic)

- **Invocations**: Total function calls
- **Duration**: Execution time (p50, p90, p99)
- **Errors**: Failed invocations
- **Throttles**: Rate-limited invocations
- **Concurrent Executions**: Active function instances
- **Init Duration**: Cold start time

### API Gateway Metrics (Automatic)

- **Count**: Total API requests
- **4XXError**: Client errors (400-499)
- **5XXError**: Server errors (500-599)
- **Latency**: Response time (p50, p90, p99)
- **IntegrationLatency**: Backend processing time

### RDS Metrics (Automatic)

- **CPUUtilization**: Processor usage (%)
- **DatabaseConnections**: Active connections
- **FreeableMemory**: Available RAM
- **ReadIOPS / WriteIOPS**: Disk operations
- **ReadLatency / WriteLatency**: Query performance

### Custom Business Metrics

```typescript
// lib/metrics.ts
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

export async function trackMetric(
  metricName: string,
  value: number,
  unit: string = "Count",
  dimensions: Record<string, string> = {}
) {
  await cloudwatch.send(
    new PutMetricDataCommand({
      Namespace: "FFP/Business",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: Object.entries(dimensions).map(([name, value]) => ({
            Name: name,
            Value: value,
          })),
        },
      ],
    })
  );
}

// Usage examples
await trackMetric("AssessmentCompleted", 1, "Count", {
  tenantId: context.tenantId,
});

await trackMetric("VideoWatched", 1, "Count", {
  videoId: video.id,
  difficulty: video.difficulty_level,
});

await trackMetric("ProgramGenerated", 1, "Count", {
  assessmentType: template.name,
});
```

### Key Business Metrics to Track

- **User Activity**
  - Daily active users (DAU)
  - Weekly active users (WAU)
  - Monthly active users (MAU)
- **Assessment Metrics**
  - Assessments started
  - Assessments completed
  - Completion rate (completed / started)
  - Average completion time
- **Video Engagement**
  - Videos watched
  - Video completion rate
  - Average watch time
  - Most popular videos
- **Program Metrics**
  - Programs generated
  - Programs started
  - Session completion rate

## CloudWatch Alarms

### Critical Alarms (Immediate Action)

```typescript
// stacks/MonitoringStack.ts
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";

// API Gateway 5xx Error Rate
new Alarm(stack, "ApiServerErrors", {
  metric: api.metricServerError({
    period: Duration.minutes(5),
    statistic: "Sum",
  }),
  threshold: 5,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "API returning too many 5xx errors",
  actionsEnabled: true,
}).addAlarmAction(new SnsAction(alertTopic));

// Lambda Function Errors
new Alarm(stack, "AssessmentFunctionErrors", {
  metric: assessmentFunction.metricErrors({
    period: Duration.minutes(5),
    statistic: "Sum",
  }),
  threshold: 10,
  evaluationPeriods: 1,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "Assessment function failing repeatedly",
}).addAlarmAction(new SnsAction(alertTopic));

// RDS Connection Pool Exhaustion
new Alarm(stack, "DatabaseConnectionsHigh", {
  metric: database.metricDatabaseConnections({
    period: Duration.minutes(5),
    statistic: "Average",
  }),
  threshold: 80, // 80% of max connections
  evaluationPeriods: 2,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "Database running out of connections",
}).addAlarmAction(new SnsAction(alertTopic));
```

### Warning Alarms (Investigation Required)

```typescript
// API Latency High
new Alarm(stack, "ApiLatencyHigh", {
  metric: api.metricLatency({
    period: Duration.minutes(5),
    statistic: "p95",
  }),
  threshold: 500, // 500ms
  evaluationPeriods: 3,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "API response time degraded",
  treatMissingData: TreatMissingData.NOT_BREACHING,
}).addAlarmAction(new SnsAction(warningTopic));

// RDS CPU High
new Alarm(stack, "DatabaseCPUHigh", {
  metric: database.metricCPUUtilization({
    period: Duration.minutes(10),
    statistic: "Average",
  }),
  threshold: 80, // 80%
  evaluationPeriods: 2,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "Database CPU consistently high",
}).addAlarmAction(new SnsAction(warningTopic));

// Lambda Cold Starts High
new Alarm(stack, "ColdStartsHigh", {
  metric: new MathExpression({
    expression: "coldStarts / invocations * 100",
    usingMetrics: {
      coldStarts: assessmentFunction.metric("InitDuration", {
        period: Duration.minutes(5),
        statistic: "SampleCount",
      }),
      invocations: assessmentFunction.metricInvocations({
        period: Duration.minutes(5),
      }),
    },
  }),
  threshold: 20, // 20% of invocations
  evaluationPeriods: 2,
  comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: "Too many Lambda cold starts",
}).addAlarmAction(new SnsAction(warningTopic));
```

## SNS Notification Topics

### Alert Topic (Critical)

```typescript
const alertTopic = new Topic(stack, "AlertTopic", {
  displayName: "FFP Critical Alerts",
});

// Email subscription
alertTopic.addSubscription(new EmailSubscription("alerts@ffp.app"));

// SMS subscription (optional)
alertTopic.addSubscription(new SmsSubscription("+1-555-0123"));

// Slack webhook (via Lambda)
const slackFunction = new Function(stack, "SlackAlert", {
  handler: "functions/notifications/slack.handler",
  environment: {
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL!,
  },
});
alertTopic.addSubscription(new LambdaSubscription(slackFunction));
```

## Dashboards

### CloudWatch Dashboard (Phase 1)

```typescript
// stacks/MonitoringStack.ts
import {
  Dashboard,
  GraphWidget,
  SingleValueWidget,
} from "aws-cdk-lib/aws-cloudwatch";

const dashboard = new Dashboard(stack, "FFPDashboard", {
  dashboardName: "FFP-Production-Overview",
});

// API Metrics
dashboard.addWidgets(
  new GraphWidget({
    title: "API Request Count",
    left: [api.metricCount({ period: Duration.minutes(5) })],
  }),
  new GraphWidget({
    title: "API Latency (p95)",
    left: [
      api.metricLatency({ period: Duration.minutes(5), statistic: "p95" }),
    ],
  }),
  new GraphWidget({
    title: "API Errors",
    left: [
      api.metricClientError({ period: Duration.minutes(5), label: "4xx" }),
      api.metricServerError({ period: Duration.minutes(5), label: "5xx" }),
    ],
  })
);

// Lambda Metrics
dashboard.addWidgets(
  new GraphWidget({
    title: "Lambda Invocations",
    left: [
      assessmentFunction.metricInvocations({ period: Duration.minutes(5) }),
      videoFunction.metricInvocations({ period: Duration.minutes(5) }),
    ],
  }),
  new GraphWidget({
    title: "Lambda Errors",
    left: [
      assessmentFunction.metricErrors({ period: Duration.minutes(5) }),
      videoFunction.metricErrors({ period: Duration.minutes(5) }),
    ],
  })
);

// RDS Metrics
dashboard.addWidgets(
  new GraphWidget({
    title: "Database Connections",
    left: [database.metricDatabaseConnections({ period: Duration.minutes(5) })],
  }),
  new GraphWidget({
    title: "Database CPU",
    left: [database.metricCPUUtilization({ period: Duration.minutes(5) })],
  })
);

// Business Metrics
dashboard.addWidgets(
  new SingleValueWidget({
    title: "Active Users Today",
    metrics: [
      new Metric({
        namespace: "FFP/Business",
        metricName: "ActiveUsers",
        statistic: "Sum",
        period: Duration.hours(24),
      }),
    ],
  }),
  new SingleValueWidget({
    title: "Assessments Completed Today",
    metrics: [
      new Metric({
        namespace: "FFP/Business",
        metricName: "AssessmentCompleted",
        statistic: "Sum",
        period: Duration.hours(24),
      }),
    ],
  })
);
```

## Performance Monitoring

### Lambda Performance Optimization

**Monitor these metrics:**

- Init Duration (cold starts)
- Billed Duration (execution time)
- Memory utilization
- Throttles (rate limiting)

**Optimization strategies:**

```typescript
// Reduce bundle size
// Use esbuild or webpack for tree-shaking

// Reuse connections
let dbClient: Pool;
export const handler = async (event) => {
  if (!dbClient) {
    dbClient = new Pool({
      /* config */
    });
  }
  // Use dbClient
};

// Optimize memory allocation
// Monitor memory usage, right-size Lambda memory
// More memory = faster CPU (and sometimes cheaper)
```

### Database Performance Monitoring

**Enable Enhanced Monitoring:**

```typescript
const database = new DatabaseInstance(stack, "Database", {
  // ... other config
  enablePerformanceInsights: true,
  performanceInsightRetention: PerformanceInsightRetention.DEFAULT, // 7 days
});
```

**Track slow queries:**

```sql
-- Enable slow query log (RDS Parameter Group)
slow_query_log = 1
long_query_time = 1  -- Log queries >1 second
log_output = FILE
```

**Query performance analysis:**

```bash
# Download slow query log
aws rds download-db-log-file-portion \
  --db-instance-identifier ffp-prod-db \
  --log-file-name slowquery/postgresql.log.2025-10-05-14

# Analyze with pg_stat_statements
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Error Tracking

### Error Categories

**User Errors (4xx)**

- Authentication failures
- Validation errors
- Not found errors
- Permission denied

**System Errors (5xx)**

- Database connection failures
- Timeout errors
- Unexpected exceptions
- Resource exhaustion

### Error Correlation

```typescript
// Generate correlation ID per request
import { randomUUID } from "crypto";

export const handler = async (event) => {
  const correlationId = event.requestContext.requestId || randomUUID();

  const logger = new Logger("AssessmentService");
  logger.setCorrelationId(correlationId);

  try {
    // Process request
  } catch (error) {
    logger.error("Request failed", { error, correlationId });
    throw error;
  }
};
```

### Error Aggregation Query

```sql
-- CloudWatch Insights
fields @timestamp, service, error.message, correlationId
| filter level = "ERROR"
| stats count() by service, error.message
| sort count() desc
```

## Health Checks

### API Health Endpoint

```typescript
// functions/health/check.ts
export const handler = async () => {
  const checks = {
    database: await checkDatabase(),
    cognito: await checkCognito(),
    s3: await checkS3(),
  };

  const healthy = Object.values(checks).every((c) => c.healthy);

  return {
    statusCode: healthy ? 200 : 503,
    body: JSON.stringify({
      status: healthy ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    }),
  };
};

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.query("SELECT 1");
    return { healthy: true, message: "Database connected" };
  } catch (error) {
    return { healthy: false, message: "Database connection failed" };
  }
}
```

### CloudWatch Synthetic Monitoring (Future)

```typescript
// Use CloudWatch Synthetics for uptime monitoring
const canary = new Canary(stack, "ApiHealthCanary", {
  test: Test.custom({
    handler: "healthCheck.handler",
    code: Code.fromAsset("canaries"),
  }),
  schedule: Schedule.rate(Duration.minutes(5)),
  runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9,
});
```

## Debugging Tools

### CloudWatch Logs Insights

```bash
# Start interactive logs viewer
npm run logs:watch -- --stage prod --function assessments

# Filter by correlation ID
npm run logs:search -- --stage prod --filter "correlationId=req-abc-123"

# Export logs for analysis
aws logs filter-log-events \
  --log-group-name /aws/lambda/ffp-prod-assessments-create \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR" \
  > errors.json
```

### X-Ray Tracing (Future - Phase 2)

Enable distributed tracing for complex request flows:

```typescript
import { captureAWS } from "aws-xray-sdk-core";
import AWS from "aws-sdk";

const capturedAWS = captureAWS(AWS);
const s3 = new capturedAWS.S3();

// X-Ray will trace this S3 call
await s3.getObject({ Bucket: "videos", Key: "exercise-001.mp4" }).promise();
```

## Incident Response Runbook

### High Error Rate Alarm

1. **Check CloudWatch Dashboard**: Identify affected service
2. **View Recent Logs**: Filter for ERROR level logs
3. **Check Recent Deployments**: Was there a recent deploy?
4. **Assess Impact**: How many users/tenants affected?
5. **Rollback or Fix**: Rollback if deployment issue, otherwise hotfix
6. **Monitor**: Watch metrics for 30 minutes post-fix
7. **Post-mortem**: Document issue and prevention steps

### Database Connection Exhaustion

1. **Check Active Connections**: CloudWatch RDS metrics
2. **Identify Source**: Which Lambda functions using most connections?
3. **Immediate Fix**: Restart Lambda functions (connection reset)
4. **Long-term Fix**: Implement connection pooling or RDS Proxy
5. **Scale RDS**: Increase instance size if needed

### High API Latency

1. **Identify Slow Endpoints**: API Gateway metrics per route
2. **Check Lambda Duration**: Which functions are slow?
3. **Check Database**: Slow query log, RDS CPU
4. **Check External Services**: S3, Cognito latency
5. **Optimize**: Add caching, optimize queries, increase Lambda memory

## Cost Monitoring

### CloudWatch Costs

- **Log ingestion**: $0.50 per GB
- **Log storage**: $0.03 per GB per month
- **Metrics**: First 10 metrics free, then $0.30 per metric per month
- **Alarms**: $0.10 per alarm per month
- **Dashboards**: First 3 free, then $3 per dashboard per month

### Cost Optimization

- Set appropriate log retention (30 days vs 90 days)
- Use metric filters instead of custom metrics where possible
- Archive old logs to S3 ($0.023 per GB per month)
- Delete unused alarms and dashboards

## Future Enhancements (Phase 2+)

### Advanced Monitoring

- **X-Ray**: Distributed tracing
- **DataDog/New Relic**: APM and anomaly detection
- **Real-time Dashboards**: Grafana with live data
- **User Session Replay**: LogRocket or FullStory

### Advanced Alerting

- **PagerDuty**: On-call rotation
- **Smart Alerting**: ML-based anomaly detection
- **Alert Fatigue Reduction**: Correlation and grouping

### Business Intelligence

- **Analytics Pipeline**: Kinesis + Redshift
- **User Behavior Analytics**: Mixpanel or Amplitude
- **Revenue Metrics**: Stripe integration
