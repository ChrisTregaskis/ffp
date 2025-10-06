# FFP - Video Management Documentation

## Overview

FFP's video library is central to the user experience. Phase 1 focuses on simple, reliable video delivery with room for future optimization.

## Phase 1 Approach (Simplified)

### Design Decisions

- **Single quality**: 1080p or 720p videos only (no transcoding)
- **Manual uploads**: Direct S3 uploads via console or script
- **Static thumbnails**: Manual creation or placeholder images
- **CloudFront CDN**: Global distribution with signed URLs
- **Metadata in PostgreSQL**: Video details, tagging, relationships

### Why This Approach

- **Time savings**: ~2-3 weeks vs building transcode pipeline
- **Lower complexity**: Fewer moving parts, easier debugging
- **Good enough**: Users expect workout videos, not Netflix quality
- **Easy upgrade path**: Add transcoding when needed (Phase 2)

## S3 Bucket Structure

```
s3://ffp-videos-{env}/
├── library/                      # Exercise video library
│   ├── exercise-001.mp4
│   ├── exercise-001-thumb.jpg
│   ├── exercise-002.mp4
│   ├── exercise-002-thumb.jpg
│   └── ...
└── tenant-{uuid}/               # Future: Custom uploads per tenant
    └── custom/
        └── ...
```

### Bucket Configuration

```typescript
// stacks/StorageStack.ts
import { StackContext, Bucket } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  const videosBucket = new Bucket(stack, "Videos", {
    cors: [
      {
        allowedMethods: ["GET", "HEAD"],
        allowedOrigins: ["*"], // Restrict in production
        allowedHeaders: ["*"],
      },
    ],
    cdk: {
      bucket: {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: false, // Phase 1: No versioning
        lifecycleRules: [
          {
            id: "archive-old-versions",
            enabled: false, // Enable when adding transcoding
          },
        ],
      },
    },
  });

  return { videosBucket };
}
```

## CloudFront Distribution

### Configuration

```typescript
// stacks/StorageStack.ts (continued)
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

const oai = new OriginAccessIdentity(stack, "VideoOAI");
videosBucket.bucket.grantRead(oai);

const distribution = new Distribution(stack, "VideoDistribution", {
  defaultBehavior: {
    origin: new S3Origin(videosBucket.bucket, {
      originAccessIdentity: oai,
    }),
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    cachedMethods: CachedMethods.CACHE_GET_HEAD,
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  },
  priceClass: PriceClass.PRICE_CLASS_100, // North America + Europe
});
```

### Signed URLs

Generate time-limited URLs for secure video access:

```typescript
// services/video.service.ts
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

export class VideoService {
  async getStreamingUrl(
    videoId: string,
    context: TenantContext
  ): Promise<string> {
    // Verify user has access
    const video = await this.videoRepo.getById(videoId);
    if (!video || !video.is_active) {
      throw new NotFoundError("Video");
    }

    // Check if user's program includes this video
    const hasAccess = await this.checkUserAccess(context.userId, videoId);
    if (!hasAccess) {
      throw new ForbiddenError("Video access denied");
    }

    // Generate CloudFront signed URL (5 minutes)
    const cloudFrontUrl = `${process.env.CLOUDFRONT_DOMAIN}/${video.s3_key}`;
    const signedUrl = getSignedUrl({
      url: cloudFrontUrl,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
      dateLessThan: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    // Track video access
    await this.logVideoAccess(videoId, context);

    return signedUrl;
  }

  private async checkUserAccess(
    userId: string,
    videoId: string
  ): Promise<boolean> {
    // Check if video is in any of user's active programs
    const result = await db.query(
      `
      SELECT 1 FROM session_exercises se
      JOIN program_sessions ps ON ps.id = se.session_id
      JOIN programs p ON p.id = ps.program_id
      WHERE p.user_id = $1 AND se.video_id = $2
      LIMIT 1
    `,
      [userId, videoId]
    );

    return result.rows.length > 0;
  }

  private async logVideoAccess(videoId: string, context: TenantContext) {
    await db.query(
      `
      INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, created_at)
      VALUES ($1, $2, 'video.access', 'video', $3, NOW())
    `,
      [context.tenantId, context.userId, videoId]
    );
  }
}
```

## Video Metadata Management

### Video Upload Flow (Manual - Phase 1)

1. **Prepare video file**:

   - Format: MP4 (H.264 codec)
   - Resolution: 1080p or 720p
   - Frame rate: 30fps
   - Audio: AAC, 128kbps

2. **Upload to S3**:

```bash
aws s3 cp exercise-squats.mp4 s3://ffp-videos-prod/library/exercise-001.mp4
aws s3 cp exercise-squats-thumb.jpg s3://ffp-videos-prod/library/exercise-001-thumb.jpg
```

3. **Add metadata to database**:

```typescript
await db.query(
  `
  INSERT INTO videos (id, title, description, s3_key, thumbnail_url, duration_seconds, difficulty_level, body_parts, equipment, is_active)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
`,
  [
    "uuid-here",
    "Bodyweight Squats",
    "Basic squat form and technique",
    "library/exercise-001.mp4",
    "library/exercise-001-thumb.jpg",
    120, // 2 minutes
    "beginner",
    ["legs", "core"],
    ["none"],
    true,
  ]
);
```

### Video Search & Filtering

```typescript
export class VideoRepository {
  async findByFilters(filters: {
    body_parts?: string[];
    difficulty_level?: string;
    equipment?: string[];
    search?: string;
  }): Promise<Video[]> {
    let query = "SELECT * FROM videos WHERE is_active = true";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.body_parts && filters.body_parts.length > 0) {
      query += ` AND body_parts && $${paramIndex}`;
      params.push(filters.body_parts);
      paramIndex++;
    }

    if (filters.difficulty_level) {
      query += ` AND difficulty_level = $${paramIndex}`;
      params.push(filters.difficulty_level);
      paramIndex++;
    }

    if (filters.equipment && filters.equipment.length > 0) {
      query += ` AND equipment && $${paramIndex}`;
      params.push(filters.equipment);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query(query, params);
    return result.rows;
  }
}
```

## Progress Tracking

### Granular Progress States

```typescript
export enum ProgressStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
}

export interface VideoProgress {
  session_id: string;
  video_id: string;
  status: ProgressStatus;
  progress_percentage: number; // 0-100
  completed_sets: number;
  started_at?: Date;
  completed_at?: Date;
}
```

### Update Progress Endpoint

```typescript
// functions/videos/update-progress.ts
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event
) => {
  const { videoId } = event.pathParameters!;
  const body = JSON.parse(event.body!);
  const context = extractTenantContext(event);

  const UpdateProgressSchema = z.object({
    sessionId: z.string().uuid(),
    status: z.enum(["in_progress", "completed", "skipped"]),
    progressPercentage: z.number().min(0).max(100).optional(),
    completedSets: z.number().min(0).optional(),
  });

  const validated = UpdateProgressSchema.parse(body);

  await db.query(
    `
    INSERT INTO user_progress (
      tenant_id, user_id, session_id, video_id, 
      status, progress_percentage, completed_sets, 
      started_at, completed_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (tenant_id, user_id, session_id, video_id) DO UPDATE SET
      status = $5,
      progress_percentage = $6,
      completed_sets = $7,
      completed_at = CASE WHEN $5 = 'completed' THEN NOW() ELSE user_progress.completed_at END,
      updated_at = NOW()
  `,
    [
      context.tenantId,
      context.userId,
      validated.sessionId,
      videoId,
      validated.status,
      validated.progressPercentage || 0,
      validated.completedSets || 0,
      validated.status !== "not_started" ? new Date() : null,
      validated.status === "completed" ? new Date() : null,
    ]
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Progress updated" }),
  };
};
```

## Frontend Video Player

### React Component

```typescript
// components/VideoPlayer.tsx
import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  videoId: string;
  sessionId: string;
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({
  videoId,
  sessionId,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadVideo();
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId]);

  async function loadVideo() {
    try {
      const response = await fetch(`/api/videos/${videoId}/stream`);
      const data = await response.json();
      setVideoUrl(data.url);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load video:", error);
    }
  }

  function handlePlay() {
    // Track progress every 5 seconds
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const percentage =
          (videoRef.current.currentTime / videoRef.current.duration) * 100;
        onProgress?.(percentage);
        updateProgress(percentage);
      }
    }, 5000);
  }

  function handlePause() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }

  function handleEnded() {
    updateProgress(100, "completed");
    onComplete?.();
  }

  async function updateProgress(
    percentage: number,
    status: string = "in_progress"
  ) {
    await fetch(`/api/videos/${videoId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        progressPercentage: Math.floor(percentage),
        status,
      }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full rounded-lg"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  );
}
```

## Analytics & Reporting

### Video Engagement Metrics

```sql
-- Most popular videos
SELECT
  v.title,
  v.view_count,
  COUNT(DISTINCT up.user_id) as unique_viewers,
  AVG(up.progress_percentage) as avg_completion_rate
FROM videos v
LEFT JOIN user_progress up ON up.video_id = v.id
WHERE up.status = 'completed'
GROUP BY v.id, v.title, v.view_count
ORDER BY v.view_count DESC
LIMIT 10;

-- User completion rates
SELECT
  u.email,
  COUNT(DISTINCT up.session_id) as sessions_started,
  COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.session_id END) as sessions_completed,
  ROUND(
    COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.session_id END)::numeric /
    NULLIF(COUNT(DISTINCT up.session_id), 0) * 100,
    2
  ) as completion_percentage
FROM users u
JOIN user_progress up ON up.user_id = u.id
GROUP BY u.id, u.email
ORDER BY completion_percentage DESC;
```

## Common Issues & Solutions

### Issue: Video Playback Fails

**Symptom**: "Failed to load video" error

**Solutions**:

1. Check CloudFront distribution is deployed
2. Verify S3 bucket permissions (OAI has read access)
3. Ensure video file exists at S3 path
4. Check signed URL hasn't expired (5 min default)

**Debug**:

```bash
# Test S3 file exists
aws s3 ls s3://ffp-videos-prod/library/exercise-001.mp4

# Test CloudFront distribution
curl -I https://d123456789.cloudfront.net/library/exercise-001.mp4
```

### Issue: Slow Video Loading

**Symptom**: Long buffering times

**Solutions**:

1. Check video file size (keep under 100MB)
2. Verify CloudFront cache hit ratio
3. Ensure user is using correct edge location
4. Consider lower resolution videos for slow connections

### Issue: Progress Not Saving

**Symptom**: User progress resets

**Solutions**:

1. Check API endpoint returns 200 status
2. Verify tenant_id context is set correctly
3. Check RLS policies aren't blocking insert
4. Ensure unique constraint satisfied (tenant, user, session, video)

## Future Enhancements (Phase 2+)

### Video Transcoding Pipeline

- **Trigger**: S3 upload event
- **Service**: AWS MediaConvert
- **Outputs**: 360p, 720p, 1080p
- **Storage**: Separate folders per quality
- **Cost**: ~$0.015 per minute transcoded

### Adaptive Bitrate Streaming

- **Format**: HLS (HTTP Live Streaming)
- **Benefit**: Auto quality adjustment based on bandwidth
- **Implementation**: MediaConvert + CloudFront
- **Player**: video.js or HLS.js

### Thumbnail Generation

- **Trigger**: Lambda on S3 upload
- **Tool**: ffmpeg layer
- **Outputs**: Multiple timestamps (0s, 25%, 50%, 75%)
- **Usage**: Hover preview, session thumbnails

### Video Preloading

- **Strategy**: Preload next video in session
- **Implementation**: Frontend link prefetch
- **Benefit**: Instant playback on next exercise

### Offline Support (Phase 3+)

- **Technology**: Service Workers + IndexedDB
- **Sync**: Background sync when online
- **Storage**: Browser cache management
- **Complexity**: High (mobile apps easier)

### Video Analytics

- **Metrics**: Play rate, completion rate, replay rate
- **Heatmaps**: Most watched segments
- **Optimization**: Identify boring sections
- **Tools**: Custom events to CloudWatch
