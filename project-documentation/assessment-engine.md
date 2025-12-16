# FFP - Assessment Engine Documentation

## Overview

The assessment engine is the core value proposition of FFP. It uses a **database-driven chained assessment flow** to evaluate users through pre-assessment questions and video-guided physical tests, then generates personalised workout programmes based on multi-dimensional scoring.

## Design Principles

1. **Database-driven**: Templates stored in PostgreSQL with JSONB columns (not S3 JSON files)
2. **Type-safe**: Zod schemas in `@ffp/core` validate structure at runtime
3. **Linear flow (MVP)**: Sequential questions without conditional branching
4. **Multi-dimensional scoring**: Separate scores for Strength, Balance, and Risk Level
5. **Chained assessments**: Database-driven flow linking pre-assessment → physical → results
6. **Async processing**: Scoring and programme generation via database job queue
7. **Audit trail**: Immutable history of all assessment attempts
8. **Resume capability**: Save progress on navigation (Continue/Back), continue later
9. **Video-guided**: Physical assessments include video demonstrations from S3 + CloudFront

### Post-MVP Enhancements

- Conditional logic (dynamic question trees based on previous answers)
- Visual template builder (drag-and-drop)
- A/B testing for assessment templates
- Advanced analytics (dropout points, question difficulty)
  ce

---

## Assessment Flow Architecture

FFP uses a **database-driven chained assessment** model. This allows flexible assessment flows without hardcoding specific phases.

### User Journey (from Prototype)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Assessment Flow (7 Steps)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: Introduction                                                    │
│  ├── "Physiotherapy Assessment" welcome screen                           │
│  ├── What to Expect (15-20 minutes)                                      │
│  ├── Before You Begin checklist                                          │
│  └── [Start Assessment] button                                           │
│                                                                          │
│  Steps 2-6: Pre-Assessment Questions (1/5 → 5/5)                         │
│  ├── Single-choice questions about goals, pain, history                  │
│  ├── Progress bar shows "29%" → "43%"                                    │
│  └── [Previous] [Next] navigation                                        │
│                                                                          │
│  Step 7: Transition Screen                                               │
│  ├── "Ready for Physical Assessment?"                                    │
│  ├── Physical Assessment Overview (Strength, Balance, Video Guidance)    │
│  ├── Important Safety Notes (orange warning box)                         │
│  └── [Back to Questions] [Start Physical Assessment] buttons             │
│                                                                          │
│  Steps 8-9: Video-Guided Physical Tests                                  │
│  ├── Strength Assessment (video demonstration + response)                │
│  ├── Balance Assessment (video demonstration + response)                 │
│  └── Progress bar shows "57%" → "71%"                                    │
│                                                                          │
│  Step 10: Results Screen                                                 │
│  ├── "Assessment Complete!" with scores                                  │
│  ├── Strength Score: X/10, Balance Score: X/10, Risk Level               │
│  ├── Recommended Programme card                                          │
│  └── What Happens Next (Programme Overview → Start Training → Track)     │
│                                                                          │
│  Step 11: Programme Overview                                             │
│  └── Generated programme details                                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flow Steps Configuration

Assessment flows are defined in the database, allowing different assessment types without code changes.

```typescript
// Zod schema for flow configuration
// Location: @ffp/core/src/schemas/assessment-flow.schema.ts

import { z } from 'zod';

export const flowStepTypeSchema = z.enum([
  'intro',
  'questions',
  'transition',
  'video-assessment',
  'results',
  'programme-overview',
]);

export type FlowStepType = z.infer<typeof flowStepTypeSchema>;

export const flowStepSchema = z.object({
  order: z.number().int().positive(),
  type: flowStepTypeSchema,
  templateId: z.string().uuid().optional(), // For question/video steps
  config: z.object({
    title: z.string(),
    description: z.string().optional(),
    instructions: z.array(z.string()).optional(),
    safetyNotes: z.array(z.string()).optional(),
    estimatedMinutes: z.number().optional(),
  }),
});

export type FlowStep = z.infer<typeof flowStepSchema>;

export const assessmentFlowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(flowStepSchema),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssessmentFlow = z.infer<typeof assessmentFlowSchema>;
```

### Database Schema: Assessment Flows

```typescript
// Location: @ffp/database/src/schema/assessment-flows.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const assessmentFlows = pgTable(
  'assessment_flows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    steps: jsonb('steps').notNull(), // Array of FlowStep objects
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_assessment_flows_active').on(table.isActive),
  })
);

// No RLS needed - flows are system-managed, accessible by all authenticated users
```

### Example Flow Configuration

```json
{
  "id": "physio-standard-v1",
  "name": "Standard Physiotherapy Assessment",
  "description": "Comprehensive assessment with pre-questions and physical tests",
  "steps": [
    {
      "order": 1,
      "type": "intro",
      "config": {
        "title": "Physiotherapy Assessment",
        "description": "Welcome to your personalised physiotherapy assessment.",
        "estimatedMinutes": 20
      }
    },
    {
      "order": 2,
      "type": "questions",
      "templateId": "pre-assessment-questions-v1",
      "config": {
        "title": "Pre-Assessment Questions",
        "description": "Quick questions about your goals, pain levels, and medical history"
      }
    },
    {
      "order": 3,
      "type": "transition",
      "config": {
        "title": "Ready for Physical Assessment?",
        "description": "Great job completing the initial questions! Now we'll guide you through some physical tests.",
        "safetyNotes": [
          "Stop immediately if you experience any pain or discomfort",
          "Only perform movements within your comfortable range",
          "Use support (chair, wall) if needed for balance",
          "Take breaks as needed between exercises"
        ]
      }
    },
    {
      "order": 4,
      "type": "video-assessment",
      "templateId": "strength-assessment-v1",
      "config": {
        "title": "Strength Assessment",
        "description": "Let's evaluate your current strength levels with some simple exercises.",
        "instructions": [
          "Watch the video demonstration carefully",
          "Perform the exercise to the best of your ability",
          "Stop if you feel any pain or discomfort",
          "Rate your performance based on how many repetitions you completed"
        ]
      }
    },
    {
      "order": 5,
      "type": "video-assessment",
      "templateId": "balance-assessment-v1",
      "config": {
        "title": "Balance Assessment",
        "description": "Tests to measure your stability and balance in different positions."
      }
    },
    {
      "order": 6,
      "type": "results",
      "config": {
        "title": "Assessment Complete!",
        "description": "Thank you for completing your physiotherapy assessment. Here are your results:"
      }
    },
    {
      "order": 7,
      "type": "programme-overview",
      "config": {
        "title": "Your Personalised Programme",
        "description": "Based on your assessment results, we've created a custom programme for you."
      }
    }
  ],
  "isActive": true
}
```

---

## Question Schema

### Core Question Types

```typescript
// Location: @ffp/core/src/schemas/assessment-question.schema.ts

import { z } from 'zod';

export const questionTypeSchema = z.enum([
  'single-choice',
  'multi-choice',
  'numeric',
  'text',
  'scale',
  'video-response',
]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

export const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  score: z.number().optional(), // For scoring calculations
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const questionValidationSchema = z.object({
  required: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(), // Regex for text validation
  customError: z.string().optional(),
});

export type QuestionValidation = z.infer<typeof questionValidationSchema>;

export const assessmentQuestionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  question: z.string().min(1),
  description: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
  validation: questionValidationSchema.optional(),
  videoId: z.string().uuid().optional(), // For video-response type
  scoreDimension: z.enum(['strength', 'balance', 'mobility', 'pain', 'general']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;

// NOTE: conditionalLogic is deferred to post-MVP
// MVP uses linear question flow only
```

### Question Template Schema

```typescript
// Location: @ffp/core/src/schemas/assessment-template.schema.ts

import { z } from 'zod';
import { assessmentQuestionSchema } from './assessment-question.schema';
import { scoringConfigSchema } from './scoring-config.schema';

export const assessmentTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().positive(),
  questions: z.array(assessmentQuestionSchema),
  scoringConfig: scoringConfigSchema,
  isActive: z.boolean(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;

export const createTemplateSchema = assessmentTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
```

---

## Video-Guided Assessment Questions

Physical assessments use video demonstrations to guide users through exercises. Videos are self-hosted on S3 with CloudFront delivery.

### Video Response Question Type

```typescript
// Extended schema for video-guided questions
export const videoResponseConfigSchema = z.object({
  videoId: z.string().uuid(), // References videos table
  instructions: z.array(z.string()),
  responseType: z.enum(['repetitions', 'duration', 'pass-fail', 'scale']),
  responseConfig: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      unit: z.string().optional(), // 'reps', 'seconds', etc.
      scaleLabels: z
        .object({
          low: z.string(),
          high: z.string(),
        })
        .optional(),
    })
    .optional(),
});

export type VideoResponseConfig = z.infer<typeof videoResponseConfigSchema>;
```

### Example Video-Guided Question

```json
{
  "id": "strength-squat-test",
  "type": "video-response",
  "question": "How many squats can you complete with proper form?",
  "description": "Watch the demonstration, then perform as many squats as you can comfortably complete.",
  "videoId": "550e8400-e29b-41d4-a716-446655440001",
  "scoreDimension": "strength",
  "validation": {
    "required": true,
    "min": 0,
    "max": 50
  },
  "metadata": {
    "instructions": [
      "Watch the video demonstration carefully",
      "Perform the exercise to the best of your ability",
      "Stop if you feel any pain or discomfort",
      "Rate your performance based on how many repetitions you completed"
    ],
    "responseType": "repetitions",
    "responseConfig": {
      "min": 0,
      "max": 50,
      "unit": "reps"
    }
  }
}
```

### Video Hosting (S3 + CloudFront)

Videos are self-hosted (agreed decision #9), not using third-party services.

```typescript
// Video table schema
// Location: @ffp/database/src/schema/videos.ts

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    s3Key: varchar('s3_key', { length: 500 }).notNull().unique(),
    thumbnailS3Key: varchar('thumbnail_s3_key', { length: 500 }),
    durationSeconds: integer('duration_seconds').notNull(),
    category: varchar('category', { length: 100 }), // 'assessment', 'exercise', 'instruction'
    bodyParts: text('body_parts').array(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('idx_videos_category').on(table.category),
    activeIdx: index('idx_videos_active').on(table.isActive),
  })
);

// No RLS - videos are system content, accessible by all authenticated users
```

### Video URL Generation

```typescript
// Location: @ffp/core/src/videos/video.service.ts

import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

export const generateVideoUrl = (s3Key: string, expiresInSeconds = 3600): string => {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  const url = `https://${cloudfrontDomain}/${s3Key}`;

  return getSignedUrl({
    url,
    keyPairId,
    privateKey,
    dateLessThan: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  });
};
```

---

## Scoring Engine

### Multi-Dimensional Scoring

FFP uses multi-dimensional scoring (agreed decision #5) rather than a single total score. The prototype shows three dimensions:

- **Strength Score**: 0-10 scale
- **Balance Score**: 0-10 scale
- **Risk Level**: Low / Moderate / High

```typescript
// Location: @ffp/core/src/schemas/scoring-config.schema.ts

import { z } from 'zod';

export const scoreDimensionSchema = z.enum(['strength', 'balance', 'mobility', 'pain', 'general']);

export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;

export const riskLevelSchema = z.enum(['low', 'moderate', 'high']);

export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const dimensionConfigSchema = z.object({
  name: scoreDimensionSchema,
  questionIds: z.array(z.string()),
  maxScore: z.number().positive(),
  weight: z.number().positive().default(1),
  riskThresholds: z
    .object({
      low: z.number(), // Score >= this = low risk
      moderate: z.number(), // Score >= this = moderate risk
      // Score < moderate threshold = high risk
    })
    .optional(),
});

export type DimensionConfig = z.infer<typeof dimensionConfigSchema>;

export const programMappingConditionSchema = z.object({
  dimension: scoreDimensionSchema,
  operator: z.enum(['lt', 'lte', 'gt', 'gte', 'eq']),
  value: z.number(),
});

export const programMappingSchema = z.object({
  conditions: z.array(programMappingConditionSchema),
  operator: z.enum(['and', 'or']).default('and'),
  programTemplateId: z.string(),
  priority: z.number().int().default(0), // Higher priority = checked first
});

export type ProgramMapping = z.infer<typeof programMappingSchema>;

export const scoringConfigSchema = z.object({
  dimensions: z.array(dimensionConfigSchema),
  programMappings: z.array(programMappingSchema),
});

export type ScoringConfig = z.infer<typeof scoringConfigSchema>;
```

### Assessment Score Result

```typescript
// Location: @ffp/core/src/schemas/assessment-score.schema.ts

import { z } from 'zod';
import { scoreDimensionSchema, riskLevelSchema } from './scoring-config.schema';

export const dimensionScoreSchema = z.object({
  dimension: scoreDimensionSchema,
  score: z.number(),
  maxScore: z.number(),
  percentage: z.number(), // 0-100
});

export type DimensionScore = z.infer<typeof dimensionScoreSchema>;

export const assessmentScoreSchema = z.object({
  dimensions: z.array(dimensionScoreSchema),
  riskLevel: riskLevelSchema,
  breakdown: z.record(z.string(), z.number()), // questionId -> score
  programRecommendation: z.string().optional(), // programTemplateId
  calculatedAt: z.date(),
});

export type AssessmentScore = z.infer<typeof assessmentScoreSchema>;
```

### Scoring Service

```typescript
// Location: @ffp/core/src/assessments/scoring.service.ts

import type { AssessmentScore, DimensionScore } from '@ffp/core';
import type { AssessmentTemplate } from '@ffp/core';

export const calculateScores = (
  answers: Record<string, unknown>,
  template: AssessmentTemplate
): AssessmentScore => {
  const { scoringConfig } = template;
  const breakdown: Record<string, number> = {};
  const dimensionScores: DimensionScore[] = [];

  // Calculate score per dimension
  for (const dimension of scoringConfig.dimensions) {
    let dimensionTotal = 0;

    for (const questionId of dimension.questionIds) {
      const answer = answers[questionId];
      const question = template.questions.find((q) => q.id === questionId);

      if (!question || answer === undefined) continue;

      const questionScore = calculateQuestionScore(question, answer);
      breakdown[questionId] = questionScore;
      dimensionTotal += questionScore * dimension.weight;
    }

    const percentage = (dimensionTotal / dimension.maxScore) * 100;

    dimensionScores.push({
      dimension: dimension.name,
      score: Math.round(dimensionTotal * 10) / 10, // Round to 1 decimal
      maxScore: dimension.maxScore,
      percentage: Math.round(percentage),
    });
  }

  // Calculate risk level based on lowest dimension score
  const riskLevel = calculateRiskLevel(dimensionScores, scoringConfig.dimensions);

  // Determine programme recommendation
  const programRecommendation = findMatchingProgram(dimensionScores, scoringConfig.programMappings);

  return {
    dimensions: dimensionScores,
    riskLevel,
    breakdown,
    programRecommendation,
    calculatedAt: new Date(),
  };
};

const calculateQuestionScore = (question: AssessmentQuestion, answer: unknown): number => {
  switch (question.type) {
    case 'single-choice': {
      const option = question.options?.find((o) => o.value === answer);
      return option?.score ?? 0;
    }
    case 'multi-choice': {
      if (!Array.isArray(answer)) return 0;
      return answer.reduce((sum, val) => {
        const option = question.options?.find((o) => o.value === val);
        return sum + (option?.score ?? 0);
      }, 0);
    }
    case 'scale':
    case 'numeric':
    case 'video-response':
      return typeof answer === 'number' ? answer : 0;
    default:
      return 0;
  }
};

const calculateRiskLevel = (scores: DimensionScore[], dimensions: DimensionConfig[]): RiskLevel => {
  // Find the lowest percentage score across dimensions
  const lowestPercentage = Math.min(...scores.map((s) => s.percentage));

  // Use thresholds from config, or default values
  if (lowestPercentage >= 70) return 'low';
  if (lowestPercentage >= 40) return 'moderate';
  return 'high';
};

const findMatchingProgram = (
  scores: DimensionScore[],
  mappings: ProgramMapping[]
): string | undefined => {
  // Sort by priority (highest first)
  const sortedMappings = [...mappings].sort((a, b) => b.priority - a.priority);

  for (const mapping of sortedMappings) {
    const matches = mapping.conditions.map((condition) => {
      const dimensionScore = scores.find((s) => s.dimension === condition.dimension);
      if (!dimensionScore) return false;

      const score = dimensionScore.score;
      switch (condition.operator) {
        case 'lt':
          return score < condition.value;
        case 'lte':
          return score <= condition.value;
        case 'gt':
          return score > condition.value;
        case 'gte':
          return score >= condition.value;
        case 'eq':
          return score === condition.value;
        default:
          return false;
      }
    });

    const allMatch = mapping.operator === 'and' ? matches.every(Boolean) : matches.some(Boolean);

    if (allMatch) {
      return mapping.programTemplateId;
    }
  }

  return undefined;
};
```

### Example Scoring Configuration

```json
{
  "dimensions": [
    {
      "name": "strength",
      "questionIds": ["strength-squat-test", "strength-pushup-test"],
      "maxScore": 10,
      "weight": 1,
      "riskThresholds": {
        "low": 7,
        "moderate": 4
      }
    },
    {
      "name": "balance",
      "questionIds": ["balance-single-leg", "balance-tandem-stance"],
      "maxScore": 10,
      "weight": 1,
      "riskThresholds": {
        "low": 7,
        "moderate": 4
      }
    }
  ],
  "programMappings": [
    {
      "conditions": [
        { "dimension": "strength", "operator": "lt", "value": 4 },
        { "dimension": "balance", "operator": "lt", "value": 4 }
      ],
      "operator": "or",
      "programTemplateId": "gentle-rehabilitation",
      "priority": 10
    },
    {
      "conditions": [
        { "dimension": "strength", "operator": "gte", "value": 7 },
        { "dimension": "balance", "operator": "gte", "value": 7 }
      ],
      "operator": "and",
      "programTemplateId": "advanced-conditioning",
      "priority": 5
    },
    {
      "conditions": [],
      "operator": "and",
      "programTemplateId": "progressive-rehabilitation",
      "priority": 0
    }
  ]
}
```

---

## Async Job Processing

Assessment scoring and programme generation run asynchronously via a **database-driven job queue** (agreed decision #2).

### Why Database Queue (Not SQS)?

| Factor          | Database Queue                 | SQS                        |
| --------------- | ------------------------------ | -------------------------- |
| Simplicity      | ✅ No additional AWS service   | ❌ Extra service to manage |
| Visibility      | ✅ Jobs queryable via SQL      | ❌ Requires CloudWatch     |
| Tenant context  | ✅ RLS applies to job records  | ⚠️ Must embed in message   |
| Cost            | ✅ No additional charges       | ❌ Per-message costs       |
| MVP appropriate | ✅ Can migrate later if needed | ❌ Over-engineering        |

### Job Queue Schema

```typescript
// Location: @ffp/database/src/schema/process-jobs.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const jobTypeEnum = pgEnum('job_type', ['score_assessment', 'generate_program']);

export const processJobs = pgTable(
  'process_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').notNull().default('pending'),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('idx_process_jobs_status').on(table.status),
    typeStatusIdx: index('idx_process_jobs_type_status').on(table.type, table.status),
    scheduledIdx: index('idx_process_jobs_scheduled').on(table.scheduledFor),
    tenantIdx: index('idx_process_jobs_tenant').on(table.tenantId),
  })
);

// RLS enabled - jobs are tenant-scoped
```

### Job Types (MVP)

| Job Type           | Trigger               | Payload                            | Result                  |
| ------------------ | --------------------- | ---------------------------------- | ----------------------- |
| `score_assessment` | Assessment submission | `{ assessmentId, userId }`         | `{ scores, riskLevel }` |
| `generate_program` | Scoring complete      | `{ assessmentId, scores, userId }` | `{ programId }`         |

### Polling Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   CloudWatch     │     │   Step Function     │     │  Job Processor   │
│   EventBridge    │────▶│   (Poll + Route)    │────▶│     Lambda       │
│   (1 min rule)   │     │                     │     │                  │
└──────────────────┘     └─────────────────────┘     └────────┬─────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   process_jobs   │
                                                     │      table       │
                                                     └──────────────────┘
```

### Job Processing Service

```typescript
// Location: @ffp/core/src/jobs/job-processor.service.ts

import { db } from '@ffp/database';
import { processJobs } from '@ffp/database/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { setRLSContext } from '@ffp/database/lib/rls';

interface JobConfig {
  maxConcurrent: number;
  timeoutSeconds: number;
}

export const pollAndProcessJobs = async (
  jobType: 'score_assessment' | 'generate_program',
  config: JobConfig
): Promise<void> => {
  // Claim pending jobs (atomic operation)
  const jobs = await db.transaction(async (tx) => {
    // Find pending jobs ready for processing
    const pendingJobs = await tx
      .select()
      .from(processJobs)
      .where(
        and(
          eq(processJobs.type, jobType),
          eq(processJobs.status, 'pending'),
          lte(processJobs.scheduledFor, new Date())
        )
      )
      .limit(config.maxConcurrent)
      .for('update', { skipLocked: true }); // Skip locked rows

    // Mark as processing
    for (const job of pendingJobs) {
      await tx
        .update(processJobs)
        .set({
          status: 'processing',
          startedAt: new Date(),
          attempts: sql`${processJobs.attempts} + 1`,
        })
        .where(eq(processJobs.id, job.id));
    }

    return pendingJobs;
  });

  // Process each job
  for (const job of jobs) {
    try {
      const result = await processJob(job);

      await db
        .update(processJobs)
        .set({
          status: 'completed',
          result,
          completedAt: new Date(),
        })
        .where(eq(processJobs.id, job.id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const shouldRetry = job.attempts < job.maxAttempts;

      await db
        .update(processJobs)
        .set({
          status: shouldRetry ? 'pending' : 'failed',
          lastError: errorMessage,
          scheduledFor: shouldRetry
            ? new Date(Date.now() + Math.pow(2, job.attempts) * 1000) // Exponential backoff
            : undefined,
        })
        .where(eq(processJobs.id, job.id));
    }
  }
};

const processJob = async (job: typeof processJobs.$inferSelect): Promise<unknown> => {
  switch (job.type) {
    case 'score_assessment':
      return await processScoreAssessment(job.payload as { assessmentId: string });
    case 'generate_program':
      return await processGenerateProgram(job.payload as { assessmentId: string; scores: unknown });
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
};
```

### Concurrency Configuration

Stored in S3 (not database) to allow hot-reloading without deployment:

```json
// s3://ffp-config-{env}/job-queue/config.json
{
  "score_assessment": {
    "maxConcurrent": 5,
    "timeoutSeconds": 30,
    "maxAttempts": 3
  },
  "generate_program": {
    "maxConcurrent": 3,
    "timeoutSeconds": 60,
    "maxAttempts": 3
  }
}
```

### Enqueueing Jobs

```typescript
// Location: @ffp/core/src/jobs/job-queue.service.ts

export const queueJob = async (
  type: 'score_assessment' | 'generate_program',
  payload: Record<string, unknown>,
  context: TenantContext
): Promise<string> => {
  const [job] = await db
    .insert(processJobs)
    .values({
      tenantId: context.tenantId,
      type,
      payload,
      status: 'pending',
      scheduledFor: new Date(),
    })
    .returning();

  return job.id;
};

// Usage in assessment submission
export const submitAssessment = async (
  assessmentId: string,
  answers: Record<string, unknown>,
  context: TenantContext
): Promise<void> => {
  // Update assessment with answers
  await assessmentRepository.update(
    assessmentId,
    {
      answers,
      status: 'submitted',
      submittedAt: new Date(),
    },
    context
  );

  // Enqueue scoring job
  await queueJob('score_assessment', { assessmentId, userId: context.actor.userId }, context);
};
```

---

## Frontend Implementation

### State Management Architecture

FFP uses **TanStack Query** for server state and **React Context** for multi-step form state (agreed decision #3).

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────────────────────┐    │
│  │  TanStack Query │     │       AssessmentContext         │    │
│  │  (Server State) │     │       (Form State)              │    │
│  ├─────────────────┤     ├─────────────────────────────────┤    │
│  │ • Templates     │     │ • currentStep                   │    │
│  │ • Flows         │     │ • answers (local until save)    │    │
│  │ • Assessment    │     │ • isDirty flag                  │    │
│  │ • Videos        │     │ • phase (pre/physical/results)  │    │
│  │ • Mutations     │     │ • dispatch for navigation       │    │
│  └─────────────────┘     └─────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Assessment Context

```typescript
// Location: @ffp/web/src/contexts/AssessmentContext.tsx

import { createContext, useContext, useReducer, type ReactNode } from 'react';

interface AssessmentState {
  flowId: string;
  assessmentId: string | null;
  currentStep: number;
  totalSteps: number;
  phase: 'intro' | 'pre-assessment' | 'transition' | 'physical-assessment' | 'results' | 'programme';
  answers: Record<string, unknown>;
  isDirty: boolean;
  scores: AssessmentScore | null;
}

type AssessmentAction =
  | { type: 'START_ASSESSMENT'; assessmentId: string; totalSteps: number }
  | { type: 'SET_ANSWER'; questionId: string; value: unknown }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_PHASE'; phase: AssessmentState['phase'] }
  | { type: 'MARK_SAVED' }
  | { type: 'SET_SCORES'; scores: AssessmentScore }
  | { type: 'RESET' };

const assessmentReducer = (state: AssessmentState, action: AssessmentAction): AssessmentState => {
  switch (action.type) {
    case 'START_ASSESSMENT':
      return {
        ...state,
        assessmentId: action.assessmentId,
        totalSteps: action.totalSteps,
        currentStep: 1,
        phase: 'intro',
      };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
        isDirty: true,
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'MARK_SAVED':
      return { ...state, isDirty: false };
    case 'SET_SCORES':
      return { ...state, scores: action.scores, phase: 'results' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const initialState: AssessmentState = {
  flowId: '',
  assessmentId: null,
  currentStep: 0,
  totalSteps: 0,
  phase: 'intro',
  answers: {},
  isDirty: false,
  scores: null,
};

interface AssessmentContextValue {
  state: AssessmentState;
  dispatch: React.Dispatch<AssessmentAction>;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export const AssessmentProvider: React.FC<{ flowId: string; children: ReactNode }> = ({
  flowId,
  children,
}) => {
  const [state, dispatch] = useReducer(assessmentReducer, { ...initialState, flowId });

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>{children}</AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextValue => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
};
```

### TanStack Query Hooks

```typescript
// Location: @ffp/web/src/hooks/useAssessmentQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Fetch assessment flow
export const useAssessmentFlow = (flowId: string) => {
  return useQuery({
    queryKey: ['assessment-flow', flowId],
    queryFn: () => api.get<AssessmentFlow>(`/assessment-flows/${flowId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch template
export const useAssessmentTemplate = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['assessment-template', templateId],
    queryFn: () => api.get<AssessmentTemplate>(`/assessment-templates/${templateId}`),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
};

// Start assessment
export const useStartAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { flowId: string }) =>
      api.post<{ assessmentId: string }>('/assessments/start', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assessments'] });
    },
  });
};

// Save progress (called on Continue/Back only)
export const useSaveProgress = () => {
  return useMutation({
    mutationFn: (data: { assessmentId: string; answers: Record<string, unknown> }) =>
      api.post(`/assessments/${data.assessmentId}/progress`, { answers: data.answers }),
  });
};

// Submit assessment
export const useSubmitAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { assessmentId: string; answers: Record<string, unknown> }) =>
      api.post<{ jobId: string }>(`/assessments/${data.assessmentId}/submit`, {
        answers: data.answers,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', variables.assessmentId] });
    },
  });
};

// Poll for results
export const useAssessmentResults = (assessmentId: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: () => api.get<AssessmentScore>(`/assessments/${assessmentId}/results`),
    enabled: enabled && !!assessmentId,
    refetchInterval: (query) => {
      // Poll every 2 seconds until we have results
      return query.state.data ? false : 2000;
    },
  });
};
```

### Save Behaviour: On Navigation Only

Progress is saved **only** when the user clicks Continue or Back (agreed decision #6), not on every answer change.

```typescript
// Location: @ffp/web/src/components/AssessmentNavigation.tsx

import { useAssessment } from '../contexts/AssessmentContext';
import { useSaveProgress } from '../hooks/useAssessmentQueries';

interface AssessmentNavigationProps {
  onContinue?: () => void;
  onBack?: () => void;
  showBack?: boolean;
  continueLabel?: string;
}

export const AssessmentNavigation: React.FC<AssessmentNavigationProps> = ({
  onContinue,
  onBack,
  showBack = true,
  continueLabel = 'Next',
}) => {
  const { state, dispatch } = useAssessment();
  const saveProgress = useSaveProgress();

  const handleContinue = async () => {
    // Save if there are unsaved changes
    if (state.isDirty && state.assessmentId) {
      await saveProgress.mutateAsync({
        assessmentId: state.assessmentId,
        answers: state.answers,
      });
      dispatch({ type: 'MARK_SAVED' });
    }

    if (onContinue) {
      onContinue();
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handleBack = async () => {
    // Save if there are unsaved changes
    if (state.isDirty && state.assessmentId) {
      await saveProgress.mutateAsync({
        assessmentId: state.assessmentId,
        answers: state.answers,
      });
      dispatch({ type: 'MARK_SAVED' });
    }

    if (onBack) {
      onBack();
    } else {
      dispatch({ type: 'PREV_STEP' });
    }
  };

  return (
    <div className="flex justify-between mt-8">
      {showBack && (
        <button
          onClick={handleBack}
          disabled={saveProgress.isPending}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          ← Previous
        </button>
      )}

      <button
        onClick={handleContinue}
        disabled={saveProgress.isPending}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto"
      >
        {saveProgress.isPending ? 'Saving...' : continueLabel} →
      </button>
    </div>
  );
};
```

### Progress Bar Component

```typescript
// Location: @ffp/web/src/components/AssessmentProgress.tsx

import { useAssessment } from '../contexts/AssessmentContext';

export const AssessmentProgress: React.FC = () => {
  const { state } = useAssessment();
  const percentage = Math.round((state.currentStep / state.totalSteps) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{getPhaseLabel(state.phase)}</span>
        </div>
        <span className="text-blue-600 font-semibold">
          {percentage}% <span className="text-gray-400">({state.currentStep}/{state.totalSteps})</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case 'intro':
      return 'Introduction';
    case 'pre-assessment':
      return 'Pre-Assessment';
    case 'transition':
      return 'Transition';
    case 'physical-assessment':
      return 'Physical Assessment';
    case 'results':
      return 'Results';
    case 'programme':
      return 'Programme Overview';
    default:
      return 'Assessment';
  }
};
```

---

## Storage

### Templates (Database)

Assessment templates are stored in **PostgreSQL** (agreed decision #1), not S3 JSON files.

```typescript
// Location: @ffp/database/src/schema/assessment-templates.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const assessmentTemplates = pgTable(
  'assessment_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    questions: jsonb('questions').notNull(), // Array of AssessmentQuestion
    scoringConfig: jsonb('scoring_config').notNull(), // ScoringConfig object
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_assessment_templates_active').on(table.isActive),
    nameIdx: index('idx_assessment_templates_name').on(table.name),
  })
);

// No RLS - templates are system-managed, accessible by all authenticated users
// (Agreed decision #10: NOT tenant-restricted for MVP)
```

### Assessment Responses (Database)

User assessment instances and responses are stored with full tenant isolation via RLS.

```typescript
// Location: @ffp/database/src/schema/user-assessments.ts

import { pgTable, uuid, varchar, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';
import { assessmentTemplates } from './assessment-templates';
import { assessmentFlows } from './assessment-flows';

export const assessmentStatusEnum = pgEnum('assessment_status', [
  'not_started',
  'in_progress',
  'submitted',
  'scored',
  'completed',
  'abandoned',
]);

export const userAssessments = pgTable(
  'user_assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'restrict' }),
    currentStep: integer('current_step').notNull().default(1),
    status: assessmentStatusEnum('status').notNull().default('not_started'),
    answers: jsonb('answers').default({}),
    scores: jsonb('scores'), // AssessmentScore object
    programId: uuid('program_id').references(() => programs.id),
    startedAt: timestamp('started_at'),
    submittedAt: timestamp('submitted_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: index('idx_user_assessments_tenant_user').on(table.tenantId, table.userId),
    statusIdx: index('idx_user_assessments_status').on(table.status),
    flowIdx: index('idx_user_assessments_flow').on(table.flowId),
  })
);

// Relations
export const userAssessmentsRelations = relations(userAssessments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userAssessments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userAssessments.userId],
    references: [users.id],
  }),
  flow: one(assessmentFlows, {
    fields: [userAssessments.flowId],
    references: [assessmentFlows.id],
  }),
}));

// RLS enabled - tenant-scoped access
```

### Videos (S3 + CloudFront)

Video files are stored in S3 with CloudFront delivery (agreed decision #9).

```
s3://ffp-videos-{env}/
├── assessment/           # Assessment demonstration videos
│   ├── strength/
│   │   ├── squat-demo.mp4
│   │   └── pushup-demo.mp4
│   └── balance/
│       ├── single-leg-demo.mp4
│       └── tandem-stance-demo.mp4
├── exercises/            # Exercise library videos
└── thumbnails/           # Video thumbnails
```

---

## Admin UI (Template Management)

System administrators can manage assessment templates via basic CRUD forms (agreed decision #8).

### Access Control

- **Role required**: `system_admin` only
- **Validation**: Backend Lambda validates role before any operation
- **UI**: Admin routes protected by role check in React

### MVP Scope

| Feature                  | MVP | Post-MVP |
| ------------------------ | --- | -------- |
| List templates           | ✅  |          |
| Create template          | ✅  |          |
| Edit template            | ✅  |          |
| Deactivate template      | ✅  |          |
| Duplicate template       | ✅  |          |
| Version history          | ✅  |          |
| Visual question builder  | ❌  | ✅       |
| Drag-and-drop reordering | ❌  | ✅       |
| Live preview mode        | ❌  | ✅       |

### Backend Authorisation

```typescript
// Location: @ffp/functions/src/admin/templates/create-template.ts

import { APIGatewayProxyEvent } from 'aws-lambda';
import { extractTenantContext } from '@ffp/core/lib/context';
import { createTemplateService } from '@ffp/core/assessments/template.service';
import { withErrorHandling } from '@ffp/core/lib/errors';
import { ForbiddenError } from '@ffp/core/lib/errors';

export const handler = withErrorHandling(async (event: APIGatewayProxyEvent) => {
  const context = extractTenantContext(event);

  // Validate system_admin role
  if (context.actor.type !== 'user' || context.actor.userRole !== 'system_admin') {
    throw new ForbiddenError('Only system administrators can manage templates');
  }

  const body = JSON.parse(event.body || '{}');
  const template = await createTemplateService(body, context);

  return {
    statusCode: 201,
    body: JSON.stringify(template),
  };
});
```

### Template Service

```typescript
// Location: @ffp/core/src/assessments/template.service.ts

import { createTemplateSchema, type CreateTemplateInput, type AssessmentTemplate } from '@ffp/core';
import { templateRepository } from './template.repository';
import type { TenantContext } from '../lib/context';

export const createTemplateService = async (
  data: unknown,
  context: TenantContext
): Promise<AssessmentTemplate> => {
  // Validate input
  const validated = createTemplateSchema.parse(data);

  // Create template
  const template = await templateRepository.create(
    {
      ...validated,
      createdBy: context.actor.type === 'user' ? context.actor.userId : null,
    },
    context
  );

  return template;
};

export const updateTemplateService = async (
  templateId: string,
  data: unknown,
  context: TenantContext
): Promise<AssessmentTemplate> => {
  const validated = createTemplateSchema.partial().parse(data);

  // Increment version on update
  const existing = await templateRepository.findById(templateId);
  if (!existing) {
    throw new NotFoundError('Template', templateId);
  }

  const template = await templateRepository.update(templateId, {
    ...validated,
    version: existing.version + 1,
  });

  return template;
};

export const duplicateTemplateService = async (
  templateId: string,
  newName: string,
  context: TenantContext
): Promise<AssessmentTemplate> => {
  const existing = await templateRepository.findById(templateId);
  if (!existing) {
    throw new NotFoundError('Template', templateId);
  }

  const template = await templateRepository.create(
    {
      name: newName,
      description: existing.description,
      questions: existing.questions,
      scoringConfig: existing.scoringConfig,
      isActive: false, // Start as inactive
      version: 1,
      createdBy: context.actor.type === 'user' ? context.actor.userId : null,
    },
    context
  );

  return template;
};
```

---

## Assessment Service Layer

Following FFP's domain-organised architecture (Handler → Service → Entity → Repository).

### Assessment Service

```typescript
// Location: @ffp/core/src/assessments/assessment.service.ts

import { db } from '@ffp/database';
import { assessmentRepository } from './assessment.repository';
import { templateRepository } from './template.repository';
import { flowRepository } from './flow.repository';
import { queueJob } from '../jobs/job-queue.service';
import { NotFoundError, ValidationError } from '../lib/errors';
import type { TenantContext } from '../lib/context';
import type { UserAssessment } from '@ffp/core';

export const startAssessmentService = async (
  flowId: string,
  context: TenantContext
): Promise<UserAssessment> => {
  // Validate flow exists and is active
  const flow = await flowRepository.findById(flowId);
  if (!flow || !flow.isActive) {
    throw new NotFoundError('Assessment flow', flowId);
  }

  // Check for existing in-progress assessment
  const existing = await assessmentRepository.findInProgressByUser(
    context.actor.userId,
    flowId,
    context
  );

  if (existing) {
    // Return existing assessment to resume
    return existing;
  }

  // Create new assessment
  const assessment = await assessmentRepository.create(
    {
      tenantId: context.tenantId,
      userId: context.actor.userId,
      flowId,
      currentStep: 1,
      status: 'not_started',
      answers: {},
    },
    context
  );

  return assessment;
};

export const saveProgressService = async (
  assessmentId: string,
  answers: Record<string, unknown>,
  currentStep: number,
  context: TenantContext
): Promise<void> => {
  const assessment = await assessmentRepository.findById(assessmentId, context);
  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  if (assessment.status === 'completed' || assessment.status === 'submitted') {
    throw new ValidationError('Cannot modify a submitted or completed assessment');
  }

  // Merge new answers with existing
  const mergedAnswers = { ...assessment.answers, ...answers };

  await assessmentRepository.update(
    assessmentId,
    {
      answers: mergedAnswers,
      currentStep,
      status: assessment.status === 'not_started' ? 'in_progress' : assessment.status,
      startedAt: assessment.startedAt ?? new Date(),
    },
    context
  );
};

export const submitAssessmentService = async (
  assessmentId: string,
  answers: Record<string, unknown>,
  context: TenantContext
): Promise<{ jobId: string }> => {
  const assessment = await assessmentRepository.findById(assessmentId, context);
  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  if (assessment.status === 'completed' || assessment.status === 'submitted') {
    throw new ValidationError('Assessment already submitted');
  }

  // TODO: Validate all required questions answered

  // Update assessment status
  const mergedAnswers = { ...assessment.answers, ...answers };

  await assessmentRepository.update(
    assessmentId,
    {
      answers: mergedAnswers,
      status: 'submitted',
      submittedAt: new Date(),
    },
    context
  );

  // Enqueue scoring job
  const jobId = await queueJob(
    'score_assessment',
    { assessmentId, userId: context.actor.userId },
    context
  );

  return { jobId };
};

export const getAssessmentResultsService = async (
  assessmentId: string,
  context: TenantContext
): Promise<AssessmentScore | null> => {
  const assessment = await assessmentRepository.findById(assessmentId, context);
  if (!assessment) {
    throw new NotFoundError('Assessment', assessmentId);
  }

  if (assessment.status !== 'scored' && assessment.status !== 'completed') {
    return null; // Still processing
  }

  return assessment.scores as AssessmentScore;
};
```

---

## Testing

### Unit Tests for Scoring

```typescript
// Location: @ffp/core/src/assessments/__tests__/scoring.service.test.ts

import { describe, it, expect } from 'vitest';
import { calculateScores } from '../scoring.service';
import type { AssessmentTemplate } from '@ffp/core';

const mockTemplate: AssessmentTemplate = {
  id: 'test-template',
  name: 'Test Template',
  version: 1,
  isActive: true,
  questions: [
    {
      id: 'q1',
      type: 'single-choice',
      question: 'Test question',
      scoreDimension: 'strength',
      options: [
        { value: 'a', label: 'Option A', score: 2 },
        { value: 'b', label: 'Option B', score: 5 },
        { value: 'c', label: 'Option C', score: 8 },
      ],
    },
    {
      id: 'q2',
      type: 'scale',
      question: 'Rate your balance',
      scoreDimension: 'balance',
      validation: { min: 1, max: 10 },
    },
  ],
  scoringConfig: {
    dimensions: [
      { name: 'strength', questionIds: ['q1'], maxScore: 10, weight: 1 },
      { name: 'balance', questionIds: ['q2'], maxScore: 10, weight: 1 },
    ],
    programMappings: [
      {
        conditions: [{ dimension: 'strength', operator: 'lt', value: 5 }],
        operator: 'and',
        programTemplateId: 'beginner-program',
        priority: 10,
      },
    ],
  },
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('calculateScores', () => {
  it('calculates multi-dimensional scores correctly', () => {
    const answers = { q1: 'b', q2: 7 };
    const result = calculateScores(answers, mockTemplate);

    expect(result.dimensions).toHaveLength(2);
    expect(result.dimensions.find((d) => d.dimension === 'strength')?.score).toBe(5);
    expect(result.dimensions.find((d) => d.dimension === 'balance')?.score).toBe(7);
  });

  it('calculates risk level based on lowest score', () => {
    const answers = { q1: 'a', q2: 3 }; // Low scores
    const result = calculateScores(answers, mockTemplate);

    expect(result.riskLevel).toBe('high');
  });

  it('selects correct programme recommendation', () => {
    const answers = { q1: 'a', q2: 4 }; // strength = 2, below threshold
    const result = calculateScores(answers, mockTemplate);

    expect(result.programRecommendation).toBe('beginner-program');
  });
});
```

### Integration Tests for RLS

```typescript
// Location: @ffp/core/src/assessments/__tests__/assessment.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestTenant, createTestUser, cleanupTestData } from '../../test-helpers';
import { startAssessmentService, getAssessmentResultsService } from '../assessment.service';

describe('Assessment multi-tenant isolation', () => {
  let tenant1: { id: string };
  let tenant2: { id: string };
  let user1Context: TenantContext;
  let user2Context: TenantContext;

  beforeAll(async () => {
    tenant1 = await createTestTenant({ name: 'Tenant 1' });
    tenant2 = await createTestTenant({ name: 'Tenant 2' });

    const user1 = await createTestUser({ tenantId: tenant1.id });
    const user2 = await createTestUser({ tenantId: tenant2.id });

    user1Context = {
      actor: { type: 'user', userId: user1.id, userRole: 'program_user', email: user1.email },
      tenantId: tenant1.id,
      customerId: null,
      requestId: 'test-1',
      timestamp: new Date(),
    };

    user2Context = {
      actor: { type: 'user', userId: user2.id, userRole: 'program_user', email: user2.email },
      tenantId: tenant2.id,
      customerId: null,
      requestId: 'test-2',
      timestamp: new Date(),
    };
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('prevents cross-tenant assessment access', async () => {
    // User 1 starts assessment
    const assessment = await startAssessmentService('test-flow-id', user1Context);

    // User 2 should not be able to access it
    await expect(getAssessmentResultsService(assessment.id, user2Context)).rejects.toThrow(
      'not found'
    );
  });
});
```

---

## Future Enhancements

### Post-MVP Features

1. **Conditional Logic**
   - Dynamic question trees based on previous answers
   - Skip logic, show/hide rules
   - Requires visual builder for usability

2. **Visual Template Builder**
   - Drag-and-drop question ordering
   - Real-time preview
   - Conditional logic visual flow editor

3. **A/B Testing**
   - Multiple template versions
   - Random assignment
   - Completion rate comparison

4. **Advanced Analytics**
   - Question difficulty analysis
   - Dropout point identification
   - Programme outcome correlation
   - Time-to-complete metrics

5. **Assessment Reminders**
   - Email notifications for abandoned assessments
   - Resume links with progress restoration

6. **Offline Support**
   - Local storage for answers
   - Sync when back online
   - Conflict resolution

---

## Related Documentation

- `architecture.md` - Overall system architecture and AWS services
- `database-schema.md` - Full database schema with RLS policies
- `video-management.md` - S3 and CloudFront configuration for videos
- `coding-standards.md` - Domain-organised architecture patterns
- `authentication.md` - JWT and context extraction patterns
