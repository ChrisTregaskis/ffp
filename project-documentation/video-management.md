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
4. **Fill metadata**: Title, description, difficulty, equipment, movement and body-area tags (duration auto-detected)
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

| Method | Endpoint                   | Purpose                                                                                |
| ------ | -------------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/admin/videos/upload-url` | Get presigned S3 PUT URL for browser upload                                            |
| POST   | `/admin/videos`            | Create video record with metadata and tags                                             |
| GET    | `/admin/videos`            | List all videos (paginated, filtered, all statuses; `tags` = tag publicIds, see below) |
| GET    | `/admin/videos/{publicId}` | One video in any status, with its tags and `isEssential`                               |
| PUT    | `/admin/videos/{publicId}` | Update metadata, tags and status transitions                                           |
| GET    | `/admin/tag-categories`    | The tag categories in display order, each with every tag                               |
| POST   | `/admin/tags`              | Create a tag in a category (`{ category, slug, label }`; slug unique within it)        |
| PUT    | `/admin/tags/{publicId}`   | Change a tag's label or active flag                                                    |
| DELETE | `/admin/tags/{publicId}`   | Deactivate a tag                                                                       |

No admin response carries the S3 key or file details.

**Replacing the file.** The edit page uploads a new file, then sends its `s3Key` (with the new duration and size) on the `PUT`. The key must have the shape the upload URL issues (`library/{uuid}.mp4`), so a mistyped or placeholder key is refused before anything is touched. Once that update commits, the service deletes the superseded object from the videos bucket; a failed update deletes nothing. A failed delete does not fail the replace: it is logged at error level (`video_file_delete_failed`) with the orphaned key, and a successful one at info level (`video_file_replaced`), so every replace can be traced from the logs. The admin Lambda holds `s3:DeleteObject` on the videos bucket only.

**Tag filter.** `?tags=` takes comma-separated tag publicIds and matches AND across categories, OR within one: a video matches when, for each category a selected tag belongs to, it carries at least one of the selected tags in that category. So Goal: Posture with Movement: Strength narrows the list, while two goal tags widen it. A publicId that names no tag matches nothing. The list response carries each video's tags by category and its `isEssential` flag, which create and update both accept.

**Tag assignment** travels in the video's create or update body as tag publicIds per category, e.g. `"tags": { "movement": ["…", "…"], "body-area": [] }`. A category sent replaces that category's tags on the video; a category left out is untouched. Newly assigned tags must be active; a deactivated tag the video already carries is kept on re-save.

### Public APIs

| Method | Endpoint                  | Purpose                                                          |
| ------ | ------------------------- | ---------------------------------------------------------------- |
| GET    | `/videos/{id}`            | Get a single active video by publicId (excludes internal fields) |
| GET    | `/videos/{id}/signed-url` | Get signed CloudFront URL for playback (15-min TTL)              |

### Admin UI Pages

- **Exercises** (`/admin/videos`, under the Programmes nav group): Table with search, status and difficulty filters, one filter per tag category, Goal / Essential columns (Movement and Audience hidden by default), column visibility, quick-actions (Publish, Archive, Restore). The upload and edit forms set Goal, Body area, Movement and Audience tags and the Essential flag; an inactive tag is offered only where the video already carries it.
- **Exercise Tags** (`/admin/exercise-tags`): each category with its tags, active and inactive; add a tag (slug filled from the label, fixed once saved), rename, deactivate and reactivate. Tags are never deleted.
- **Video Upload** (`/admin/videos/upload`): Drag-and-drop upload with progress bar, metadata form
- **Video Edit** (`/admin/videos/{publicId}`): Inline video preview, metadata and tag editing, status management

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

### Typed Tags

Videos are described by typed tags: seeded categories (goal, body area, movement, audience) holding admin-authored tags, joined to videos through `video_tags`. A video may carry several tags in one category. Tags are deactivated, never deleted. The programme pool query (`tagRepository.findPoolVideos`) draws active videos carrying any of a set of tags in a category, minus videos already picked.

`equipment` stays a GIN-indexed array column, and `difficulty` a column. The older `movement_type`, `body_parts` and `tags` columns are deprecated: nothing reads or writes them, and they remain only until they are dropped. No RLS on any of these tables — system-managed content accessible to all authenticated users.

### Programme Integration

Videos are exercise demonstrations — the video catalogue effectively is the exercise library. Programme structure:

- `programme_templates` → `template_phases` → `template_sessions` → `session_exercises` (links to `videos`)
- `template_sessions` → `template_session_slots` → `template_slot_tags` (links to `tags`): each slot names a tag category and optionally tags in it, and a required or optional tier. Its pool is what `findPoolVideos` returns for those tags, or for the whole category when it names none (`templateSlotService.toSlotPoolQuery`)
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

**Replaced file still in the bucket:**

- Search the admin logs for `video_file_delete_failed`; the entry names the orphaned key
- Verify admin Lambda has `s3:DeleteObject` on the videos bucket

---

_Video transcoding pipeline (MediaConvert), adaptive streaming (HLS), thumbnail generation, and player analytics are deferred. See Jira backlog (FFP-256, FFP-268). Video file replacement tracked in FFP-438._
