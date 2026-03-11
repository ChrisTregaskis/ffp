# FFP - Video Management

## Overview

Exercise video library delivered via S3 + CloudFront CDN with Origin Access Control (OAC). Admin UI for uploading and managing videos, signed URLs for secure playback.

## Phase 1 Approach

| Decision       | Choice                                 | Rationale                                  |
| -------------- | -------------------------------------- | ------------------------------------------ |
| Quality        | Single (1080p)                         | No transcoding pipeline needed             |
| Uploads        | Admin UI (browser-to-S3 presigned PUT) | Full workflow via `/admin/videos/upload`   |
| Thumbnails     | Manual or placeholder                  | Automated generation deferred              |
| Delivery       | CloudFront CDN with OAC + signed URLs  | Secure, global distribution                |
| Access Control | OAC (Origin Access Control)            | S3 direct access blocked, signed URLs only |
| Signed URL TTL | 15 minutes                             | Balance between UX and security            |
| Metadata       | PostgreSQL (videos table)              | Tagging, filtering, relationships          |

## S3 Bucket Structure

```
s3://ffp-{stage}-videosbucketbucket-{hash}/
├── videos/                       # Exercise video library
│   ├── {uuid}.mp4
│   └── ...
└── thumbnails/                   # Video thumbnails (future)
    └── ...
```

## Video Upload Workflow (Admin UI)

1. **Navigate** to `/admin/videos/upload` in the admin UI
2. **Select video**: Drag-and-drop or file picker (MP4, H.264, 1080p, max 500MB)
3. **Upload to S3**: Browser uploads directly to S3 via presigned PUT URL (`POST /admin/videos/upload-url`)
4. **Fill metadata**: Title, description, movement type, difficulty, body parts, equipment, tags (duration auto-detected)
5. **Create record**: `POST /admin/videos` creates the video record (status: `draft`)
6. **Activate**: Change status to `active` via edit page or list quick-action to make available for programmes

### Video Status Lifecycle

```
draft → active → archived
                    ↓
              draft / active (restore)
```

- **Draft**: Uploaded but not yet available. Default status on creation.
- **Active**: Available for inclusion in programmes and playback via signed URLs.
- **Archived**: Removed from active use. Can be restored to draft or active.

## Admin Video Management

### Admin APIs

| Method | Endpoint                   | Purpose                                             |
| ------ | -------------------------- | --------------------------------------------------- |
| POST   | `/admin/videos/upload-url` | Get presigned S3 PUT URL for browser upload         |
| POST   | `/admin/videos`            | Create video record with metadata                   |
| GET    | `/admin/videos`            | List all videos (paginated, filtered, all statuses) |
| PUT    | `/admin/videos/{id}`       | Update metadata and status transitions              |

### Public APIs

| Method | Endpoint                  | Purpose                                                      |
| ------ | ------------------------- | ------------------------------------------------------------ |
| GET    | `/videos`                 | List active videos (filtered by body parts, equipment, etc.) |
| GET    | `/videos/{id}`            | Get single video (excludes internal fields)                  |
| GET    | `/videos/{id}/signed-url` | Get signed CloudFront URL for playback (15-min TTL)          |

### Admin UI Pages

- **Video Library** (`/admin/videos`): Table with search, status/difficulty filters, column visibility, quick-actions (Publish, Archive, Restore)
- **Video Upload** (`/admin/videos/upload`): Drag-and-drop upload with progress bar, metadata form
- **Video Edit** (`/admin/videos/{id}`): Inline video preview, metadata editing, status management

## Key Patterns

### CloudFront OAC (Origin Access Control)

S3 bucket is **not publicly accessible**. All video access goes through CloudFront with OAC:

- **Direct S3 URL** → 403 AccessDenied
- **Unsigned CloudFront URL** → 403 MissingKey
- **Signed CloudFront URL** → 200 (video served)

OAC is configured in SST (`sst.config.ts`) with a CloudFront Key Group and RSA 2048 key pair stored as SST secrets.

**Verification script**: `bash scripts/verify-cloudfront-oac.sh {stage}` — tests direct S3 and unsigned CloudFront access are blocked.

### Signed URLs

CloudFront signed URLs (15-minute TTL) for secure video access:

- `video-signing.service.ts` generates signed URLs via `@aws-sdk/cloudfront-signer`
- Canned policy with `keyPairId` and `privateKey` from SST secrets
- URL format: `https://{distribution}.cloudfront.net/{s3Key}?...signature`
- Verify video is `active` before generating URL
- Log video access for audit trail

### Video Filtering

The `videos` table uses PostgreSQL array columns (`body_parts`, `equipment`, `tags`) with GIN indexes for efficient filtering. No RLS — system-managed content accessible to all authenticated users.

### Programme Integration

Videos are exercise demonstrations — the video catalogue effectively is the exercise library. Programme structure:

- `programme_templates` → `template_phases` → `template_sessions` → `session_exercises` (links to `videos`)
- Exercise prescription (sets, reps, duration, rest) will be added to `videos` as default fields (FFP-441)
- Prescription pre-populates from video defaults when adding to a session, overridable per-session

## Troubleshooting

**Video playback fails:**

1. Check CloudFront distribution is deployed
2. Verify OAC is configured (run `bash scripts/verify-cloudfront-oac.sh {stage}`)
3. Ensure video file exists at S3 path
4. Check signed URL hasn't expired (15-minute TTL)
5. Verify video status is `active` (signed URLs only generated for active videos)

**Slow loading:**

- Keep video files under 500MB
- Check CloudFront cache hit ratio
- Consider lower resolution for slow connections

**Upload fails:**

- Check CORS is configured on VideosBucket (PUT allowed)
- Verify admin Lambda has `s3:PutObject` permission
- Check presigned URL hasn't expired

---

_Video transcoding pipeline (MediaConvert), adaptive streaming (HLS), thumbnail generation, and player analytics are deferred. See Jira backlog (FFP-256, FFP-268). Video file replacement tracked in FFP-438._
