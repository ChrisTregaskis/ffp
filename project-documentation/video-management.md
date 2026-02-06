# FFP - Video Management

## Overview

Exercise video library delivered via S3 + CloudFront CDN. Phase 1 uses a simplified approach — single quality, manual uploads, signed URLs for secure access.

## Phase 1 Approach

| Decision   | Choice                          | Rationale                             |
| ---------- | ------------------------------- | ------------------------------------- |
| Quality    | Single (1080p or 720p)          | No transcoding pipeline needed        |
| Uploads    | Manual (S3 console or CLI)      | Saves 2-3 weeks vs automated pipeline |
| Thumbnails | Manual or placeholder           | Automated generation deferred         |
| Delivery   | CloudFront CDN with signed URLs | Secure, global distribution           |
| Metadata   | PostgreSQL (videos table)       | Tagging, filtering, relationships     |

## S3 Bucket Structure

```
s3://ffp-videos-{env}/
├── library/                      # Exercise video library
│   ├── exercise-001.mp4
│   ├── exercise-001-thumb.jpg
│   └── ...
└── tenant-{uuid}/               # Future: custom uploads per tenant
    └── custom/
```

## Video Upload Workflow (Manual)

1. **Prepare video**: MP4 (H.264), 1080p/720p, 30fps, AAC audio 128kbps
2. **Upload to S3**: `aws s3 cp exercise.mp4 s3://ffp-videos-prod/library/exercise-001.mp4`
3. **Add metadata**: Insert record into `videos` table (title, s3_key, duration, difficulty, body_parts, equipment, tags)

## Key Patterns

### Signed URLs

CloudFront signed URLs (5-minute TTL) for secure video access:

- Verify user has access (video is in their active programme)
- Generate time-limited signed URL via `@aws-sdk/cloudfront-signer`
- Log video access for audit trail

### Video Filtering

The `videos` table uses PostgreSQL array columns (`body_parts`, `equipment`, `tags`) with GIN indexes for efficient filtering. No RLS — system-managed content accessible to all authenticated users.

## Troubleshooting

**Video playback fails:**

1. Check CloudFront distribution is deployed
2. Verify S3 bucket permissions (OAI has read access)
3. Ensure video file exists at S3 path: `aws s3 ls s3://ffp-videos-prod/library/exercise-001.mp4`
4. Check signed URL hasn't expired (5-minute default)

**Slow loading:**

- Keep video files under 100MB
- Check CloudFront cache hit ratio
- Consider lower resolution for slow connections

**Progress not saving:**

- Verify tenant_id RLS context is set
- Check unique constraint (tenant, user, session, video)

---

_Video transcoding pipeline (MediaConvert), adaptive streaming (HLS), thumbnail generation, and player analytics are deferred. See Jira backlog (FFP-256, FFP-268)._
