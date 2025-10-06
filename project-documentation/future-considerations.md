# FFP - Future Considerations

## Overview

This document catalogs features, optimizations, and infrastructure improvements that are **intentionally deferred** from Phase 1 MVP. These items will be prioritized based on user feedback, scale requirements, and business needs.

---

## Infrastructure & Performance

### Multi-AZ RDS Database

**When to add**: Before 1,000+ active users or when uptime becomes business-critical

**Benefits**:

- High availability with automatic failover
- Zero downtime for maintenance windows
- Data replication across availability zones

**Implementation**:

- Enable Multi-AZ in AWS console (minimal downtime)
- Update connection strings (automatic failover endpoint)
- Cost: ~2x current database cost (~$60/month)

**Why deferred**: Single AZ sufficient for Phase 1, can upgrade without code changes

---

### Read Replicas (PostgreSQL)

**When to add**: Read-heavy workload (>70% reads) or slow query performance

**Benefits**:

- Offload read queries from primary database
- Improve performance for reporting/analytics
- Geographic distribution for global users

**Implementation**:

- Create read replica(s) via RDS console
- Update application to route reads to replica
- Read-after-write consistency considerations

**Cost**: Additional RDS instance cost per replica (~$30-60/month each)

**Why deferred**: Phase 1 read/write ratio not demanding

---

### ElastiCache (Redis)

**When to add**: Need advanced caching features or >10,000 requests/minute

**Benefits**:

- Fast caching for session data and API responses
- Pub/sub for real-time features
- Complex data structures (sorted sets, bitmaps)
- Leaderboards and ranking systems

**Implementation**:

- Deploy ElastiCache cluster in VPC
- Update Lambda functions to use Redis client
- Implement cache invalidation strategy

**Cost**: ~$50+/month for t3.small cluster

**Why deferred**: Cognito handles authentication, DynamoDB better for serverless caching

---

### DynamoDB for Caching

**When to add**: Need serverless caching or complex rate limiting

**Benefits**:

- True serverless, pay-per-use pricing
- Scales infinitely, no capacity planning
- Built-in TTL for automatic expiry
- Strong consistency when needed

**Use cases**:

- Session storage (if moving away from Cognito)
- Rate limiting counters per tenant/user
- Temporary assessment state
- API response caching

**Cost**: $0-50/month based on usage

**Implementation**:

- Create DynamoDB tables via SST
- Update Lambda functions to use DynamoDB SDK
- Set TTL attributes for automatic cleanup

**Why deferred**: Not needed for Phase 1 scale

---

## Video & Media

### Video Transcoding Pipeline

**When to add**: Video library grows >100 videos or users complain about quality/buffering

**Benefits**:

- Multiple quality levels (360p, 720p, 1080p)
- Faster loading on slow connections
- Reduced bandwidth costs
- Better user experience

**Implementation**:

1. S3 upload triggers Lambda function
2. Lambda invokes AWS MediaConvert job
3. MediaConvert outputs multiple qualities to S3
4. Update database with new video URLs
5. Frontend selects appropriate quality

**Cost**: ~$0.015 per minute of video transcoded, one-time processing cost

**Services**: AWS MediaConvert, Lambda, S3

**Why deferred**: Single quality sufficient for MVP, manual upload acceptable

---

### Adaptive Bitrate Streaming (HLS/DASH)

**When to add**: Users on varied connection speeds or international users

**Benefits**:

- Automatic quality adjustment based on bandwidth
- Seamless switching during playback
- Reduced buffering and interruptions
- Industry-standard streaming protocol

**Implementation**:

- MediaConvert outputs HLS manifests
- CloudFront configured for HLS delivery
- Frontend uses video.js or HLS.js player

**Cost**: Minimal incremental cost beyond transcoding

**Why deferred**: Requires transcoding pipeline first

---

### Video Thumbnail Generation

**When to add**: Video library >50 videos or UI requires rich previews

**Benefits**:

- Better UX with visual previews
- Hover previews showing video content
- Multiple thumbnails per video (different timestamps)

**Implementation**:

- Lambda function triggered on S3 video upload
- ffmpeg layer extracts frames at intervals
- Save thumbnails to S3, update database

**Cost**: Minimal (Lambda execution + S3 storage)

**Why deferred**: Manual thumbnails or placeholders sufficient for Phase 1

---

### Video Preloading

**When to add**: User feedback indicates slow video start times

**Benefits**:

- Instant playback for next exercise
- Improved perceived performance
- Better user experience during workouts

**Implementation**:

- Frontend preloads next video while current playing
- Use `<link rel="preload">` or Service Worker
- Manage cache size to avoid memory issues

**Cost**: Slightly higher bandwidth usage

**Why deferred**: Not a user pain point yet

---

### Offline Video Support

**When to add**: Users request offline workout capability (Phase 3+)

**Benefits**:

- Use app without internet connection
- Better experience in gyms with poor WiFi
- Download programs for travel

**Implementation**:

- Service Workers for asset caching
- IndexedDB for video storage
- Background sync when online
- Cache eviction policies

**Complexity**: High - requires significant frontend work

**Why deferred**: Complex feature, unclear demand, mobile apps may be better solution

---

## Monitoring & Observability

### AWS X-Ray Distributed Tracing

**When to add**: Performance debugging becomes difficult or multi-service latency issues

**Benefits**:

- Visualize request flow across services
- Identify bottlenecks in request path
- Trace errors to source
- Service dependency map

**Implementation**:

- Enable X-Ray SDK in Lambda functions
- Annotate custom segments
- Configure sampling rates
- View traces in X-Ray console

**Cost**: $0-20/month based on trace volume

**Why deferred**: CloudWatch logs sufficient for Phase 1 debugging

---

### Advanced Monitoring (DataDog, New Relic)

**When to add**: CloudWatch insufficient or need advanced analytics/alerting

**Benefits**:

- Better dashboards and visualization
- Anomaly detection with ML
- APM (Application Performance Monitoring)
- Log aggregation across services
- Custom alerting rules

**Cost**: $100-500+/month depending on scale

**Why deferred**: CloudWatch adequate for Phase 1, significant cost

---

### Real-time Dashboards

**When to add**: Need live visibility or executive reporting

**Benefits**:

- Instant insight into system health
- Business metrics in real-time
- Detect issues immediately
- Share with stakeholders

**Implementation**:

- CloudWatch dashboards (simple)
- Grafana + Prometheus (advanced)
- Custom React dashboard

**Cost**: Minimal (CloudWatch dashboards free for first 3)

**Why deferred**: Static dashboards sufficient for Phase 1

---

### Application Performance Monitoring (APM)

**When to add**: Need code-level performance insights

**Benefits**:

- Profile slow functions and queries
- Identify memory leaks
- CPU profiling
- Flame graphs for bottleneck analysis

**Tools**: DataDog APM, New Relic, AWS X-Ray

**Cost**: $50-200/month

**Why deferred**: Not needed at Phase 1 scale

---

## Authentication & Security

### Multi-Factor Authentication (MFA)

**When to add**: First enterprise customer or compliance requirement

**Benefits**:

- Enhanced security for business accounts
- Compliance with security standards
- Reduce account takeover risk

**Implementation**:

- Enable MFA in Cognito (SMS or TOTP)
- Frontend flows for MFA setup/verification
- Required for business_owner role

**Cost**: SMS ~$0.00645 per message (TOTP free)

**Why deferred**: Not required for Phase 1 launch

---

### Single Sign-On (SSO)

**When to add**: Enterprise customer requires it

**Benefits**:

- Better UX for enterprise users
- Centralized identity management
- Simplified onboarding

**Implementation**:

- Configure Cognito identity providers (SAML, OIDC)
- Support Google Workspace, Microsoft 365, Okta
- Custom attribute mapping

**Cost**: Minimal (Cognito supports SSO)

**Why deferred**: No enterprise customers yet

---

### Social Login (Google, Apple)

**When to add**: High signup friction or users request it

**Benefits**:

- Faster registration flow
- One-click signup
- Higher conversion rates

**Implementation**:

- Configure Cognito social providers
- OAuth flows for Google/Apple
- Map social profile to FFP user

**Cost**: Free (built into Cognito)

**Why deferred**: Email signup sufficient for Phase 1

---

### Advanced Session Management

**When to add**: Need to force logout users or track active sessions

**Benefits**:

- Security incident response ("logout all sessions")
- Session analytics for compliance
- Active session count per user
- Device management

**Implementation**:

- Store sessions in DynamoDB
- Session ID in JWT
- Validate session exists on each request
- Revoke sessions via DynamoDB delete

**Cost**: $2-10/month (DynamoDB)

**Why deferred**: Stateless JWT sufficient for Phase 1

---

### IP Allowlisting / Georestriction

**When to add**: Enterprise customer requires network-level controls

**Benefits**:

- Restrict access to specific IP ranges
- Compliance with customer policies
- Additional security layer

**Implementation**:

- WAF rules for IP filtering
- CloudFront geo-restriction
- Per-tenant IP allowlists

**Cost**: WAF ~$5+/month

**Why deferred**: No enterprise requirements yet

---

## Features & Functionality

### White-Label Customization

**When to add**: Business customers want branded experience

**Benefits**:

- Higher pricing tier for white-label plans
- Enterprise sales enabler
- Partner/reseller opportunities

**Implementation**:

- Tenant-specific themes (colors, logos)
- Custom domains per tenant
- Branded emails
- Custom exercise library per tenant

**Complexity**: Moderate (multi-tenant frontend logic)

**Why deferred**: No demand from current users

---

### Data Export / Deletion (GDPR)

**When to add**: Before operating in EU or at 10,000+ users

**Benefits**:

- GDPR compliance (right to data portability)
- User trust and transparency
- Legal requirement in EU

**Implementation**:

- Export user data to JSON/CSV
- Cascade delete with referential integrity
- Audit trail of deletions
- Soft delete with 30-day recovery window

**Complexity**: Moderate (ensure all related data deleted)

**Why deferred**: Not legally required for Phase 1 (US-only)

---

### Advanced Analytics Dashboard

**When to add**: Business customers want insights or internal reporting needs

**Benefits**:

- Product differentiation (enterprise feature)
- Data-driven decisions
- Demonstrate ROI to business customers
- Identify usage patterns

**Features**:

- User engagement metrics
- Program completion rates
- Exercise popularity
- Time-series charts
- Exportable reports

**Implementation**:

- Time-series data collection
- Recharts or Chart.js visualizations
- Export to PDF/CSV
- Scheduled email reports

**Complexity**: High (requires analytics pipeline)

**Why deferred**: Focus on core product first

---

### Real-time Notifications

**When to add**: Users want push notifications for reminders/achievements

**Benefits**:

- Better engagement and retention
- Workout reminders
- Achievement celebrations
- Progress milestones

**Implementation**:

- SNS for push notifications
- EventBridge for scheduled reminders
- WebSockets for live updates (API Gateway)
- Frontend notification permissions

**Cost**: $0-10/month based on volume

**Why deferred**: Email notifications sufficient for Phase 1

---

### Mobile Native Apps (iOS/Android)

**When to add**: Mobile-first usage or app store distribution desired

**Benefits**:

- Better mobile UX
- Offline capabilities
- Push notifications
- App store visibility

**Timeline**: 3-6 months development

**Team**: Requires mobile developers (React Native or native)

**Cost**: Significant development investment

**Why deferred**: PWA/responsive web app sufficient for Phase 1

---

### Assessment Versioning & A/B Testing

**When to add**: Need to iterate on questions without breaking history

**Benefits**:

- Experiment with different question flows
- Compare completion rates across versions
- Maintain historical data integrity
- Gradually roll out changes

**Implementation**:

- Version field on assessment templates
- Historical assessments reference specific version
- A/B test framework for random assignment
- Analytics on version performance

**Complexity**: Moderate

**Why deferred**: Premature optimization for Phase 1

---

### AI-Powered Program Generation

**When to add**: Phase 3+ or when assessment scoring needs enhancement

**Benefits**:

- More personalized programs
- Better outcomes for users
- Continuous learning from results
- Product differentiation

**Implementation**:

- Train ML model on assessment → outcome data
- AWS SageMaker for model hosting
- Lambda for inference
- Regular model retraining

**Complexity**: Very high (requires ML expertise)

**Cost**: Significant (SageMaker hosting, ML expertise)

**Why deferred**: Rule-based scoring sufficient for Phase 1

---

### Advanced Rate Limiting

**When to add**: Abuse detected or need granular per-user/per-tenant limits

**Benefits**:

- Prevent API abuse
- Ensure fair usage across tenants
- Protect backend resources

**Implementation**:

- DynamoDB counters with TTL
- API Gateway usage plans with API keys
- Per-tenant throttling rules

**Cost**: Minimal

**Why deferred**: API Gateway basic throttling sufficient for Phase 1

---

### Video Player Analytics

**When to add**: Need detailed engagement metrics

**Benefits**:

- Understand user behavior
- Identify drop-off points
- Optimize video content
- A/B test video formats

**Metrics**:

- Play rate (started / viewed)
- Completion rate
- Average watch time
- Replay rate
- Most watched segments

**Implementation**:

- Custom video player events
- CloudWatch custom metrics
- Dashboard visualization

**Why deferred**: Basic progress tracking sufficient for Phase 1

---

### Social Features

**When to add**: Users request community features (Phase 3+)

**Features**:

- User profiles
- Follow other users
- Activity feed
- Leaderboards
- Challenges and competitions
- Comments and reactions

**Complexity**: Very high (entire new feature set)

**Why deferred**: Focus on core product first

---

## Testing & Quality

### Load Testing

**When to add**: Before major launch or at 1,000+ concurrent users

**Benefits**:

- Identify breaking points
- Capacity planning
- Confidence in scalability
- Optimize bottlenecks

**Tools**: Artillery, K6, AWS Load Testing Solution

**Implementation**:

- Define realistic user scenarios
- Gradual load increase
- Monitor all metrics
- Document results

**Cost**: Minimal (mostly time investment)

**Why deferred**: Not needed at Phase 1 scale

---

### Higher Test Coverage (>80%)

**When to add**: After core features stable, before Series A

**Benefits**:

- Confidence in code changes
- Fewer production bugs
- Faster development (catch issues early)
- Better documentation via tests

**Implementation**:

- Gradual increase in test coverage
- Focus on critical paths first
- Add tests when fixing bugs
- Enforce coverage gates in CI/CD

**Timeline**: Ongoing effort over 6-12 months

**Why deferred**: 30% coverage sufficient for Phase 1 MVP

---

### Comprehensive E2E Test Suite

**When to add**: Frequent regressions or before major releases

**Benefits**:

- Catch integration issues
- Test real user workflows
- Confidence in deployments

**Implementation**:

- Expand Playwright test suite
- Test all major user flows
- Run in CI/CD pipeline
- Parallel execution for speed

**Cost**: CI/CD compute time

**Why deferred**: Critical path E2E tests sufficient for Phase 1

---

### Chaos Engineering

**When to add**: At scale (10k+ users) or mission-critical uptime required

**Benefits**:

- Validate system resilience
- Identify weaknesses before they cause outages
- Practice incident response

**Tools**: AWS Fault Injection Simulator, Chaos Monkey

**Complexity**: Advanced (requires mature operations)

**Why deferred**: Overkill for Phase 1

---

## Database & Scale

### Database Query Optimization

**When to add**: Slow queries appear in logs or user complaints

**Activities**:

- EXPLAIN ANALYZE on slow queries
- Add missing indexes
- Optimize query structure
- Use materialized views
- Query result caching

**Cost**: Mostly time investment

**Why deferred**: No slow query issues yet

---

### Materialized Views

**When to add**: Complex analytics queries slow down application

**Benefits**:

- Pre-computed query results
- Much faster read performance
- Reduced database load

**Implementation**:

- Create materialized views for common queries
- Refresh strategy (scheduled or on-demand)
- Balance freshness vs performance

**Cost**: Additional storage for materialized data

**Why deferred**: Query performance adequate for Phase 1

---

### Connection Pooling (RDS Proxy)

**When to add**: Lambda connection exhaustion issues

**Benefits**:

- Efficient connection management
- Reduce connection overhead
- Automatic failover
- Better for serverless

**Implementation**:

- Enable RDS Proxy in AWS console
- Update Lambda connection strings
- Configure connection limits

**Cost**: ~$15+/month

**Why deferred**: Lambda connection pooling sufficient for Phase 1

---

### Database Partitioning

**When to add**: Tables >10M rows or query performance degrades

**Benefits**:

- Faster queries on partitioned data
- Easier maintenance (drop old partitions)
- Better for time-series data

**Complexity**: High (requires careful planning and migration)

**Why deferred**: Not needed at current data volumes

---

### Database Sharding

**When to add**: Single database can't handle load (100k+ users)

**Benefits**:

- Horizontal scalability
- Distribute load across databases
- Handle massive data volumes

**Complexity**: Very high (fundamental architecture change)

**Why deferred**: Multi-year growth required before needed

---

## Timeline for Future Considerations

### Phase 2 (6-12 months, 1k-10k users)

- Multi-AZ RDS
- Video transcoding pipeline
- MFA for business accounts
- Advanced monitoring (X-Ray)
- Data export/deletion (GDPR)
- Higher test coverage (>60%)

### Phase 3 (12-24 months, 10k-100k users)

- Read replicas
- ElastiCache or DynamoDB caching
- Adaptive bitrate streaming
- White-label customization
- Mobile native apps
- Advanced analytics dashboard
- SSO for enterprise

### Phase 4 (24+ months, 100k+ users)

- Multi-region deployment
- Database sharding considerations
- AI-powered program generation
- Social features
- Chaos engineering
- Full HIPAA compliance (if needed)

---

## Decision Framework

When considering adding any deferred feature:

1. **User Demand**: Are users actively requesting this?
2. **Scale Requirement**: Is current infrastructure insufficient?
3. **Business Need**: Does this unlock revenue or growth?
4. **Cost vs Benefit**: Is ROI worth the investment?
5. **Complexity**: Do we have expertise to build this?
6. **Maintenance**: Can we support this long-term?

**Prioritization**: User feedback > Scale issues > Business opportunities > Nice-to-haves
