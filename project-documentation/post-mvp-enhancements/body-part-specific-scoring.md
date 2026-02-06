# Body-Part-Specific Scoring Enhancement

**Status:** Post-MVP
**Complexity:** Low-Moderate (~1.5-2 hours) - reduced due to existing patterns
**Priority:** Medium
**Dependencies:** Core scoring system (MVP complete)

---

> **Implementation Note (January 2026):** The Sprint 4 branching refactor implemented a `condition-evaluator.ts` with answer-based condition evaluation patterns (`eq`, `gt`, `in` operators). This infrastructure can be reused for programme matching conditions, reducing implementation effort. See `packages/core/src/assessments/branching/condition-evaluator.ts` for the pattern to follow.

---

## Overview

Extend the programme matching system to consider **answer values** (e.g., body part selection) alongside dimension scores, enabling more targeted programme recommendations.

### Current Behaviour (MVP)

Programme matching evaluates only dimension scores:

```
IF pain_score > 50 → Recommend Pain Management Programme
```

### Enhanced Behaviour (Post-MVP)

Programme matching can also evaluate specific answer values:

```
IF pain_score > 50 AND body_part = 'right_shoulder' → Recommend Shoulder Rehabilitation Programme
IF pain_score > 50 AND body_part = 'lower_back' → Recommend Core Stability Programme
```

---

## User Story

> As a physiotherapist configuring assessments, I want programme recommendations to consider which body part the patient identified as their primary concern, so that patients receive targeted rehabilitation programmes for their specific injury location.

---

## Technical Design

### 1. Extended Condition Type

**File:** `packages/database/src/types/question.types.ts`

```typescript
// Current
interface ProgrammeMappingCondition {
  dimension: ScoreDimension;
  operator: ComparisonOperator;
  value: number;
}

// Enhanced
interface ProgrammeMappingCondition {
  // Dimension-based condition (existing)
  dimension?: ScoreDimension;

  // Answer-based condition (new)
  questionSlug?: string;

  // Extended operators for answer matching
  operator: ComparisonOperator | 'eq' | 'in' | 'contains';

  // Value can be number (dimensions) or string/array (answers)
  value: number | string | string[];
}
```

### 2. Updated Programme Matching

**File:** `packages/core/src/assessments/scoring/helpers/programme-matching.ts`

The `findMatchingProgramme` function signature changes:

```typescript
// Current
function findMatchingProgramme(
  dimensionalScores: DimensionalScore[],
  programmeMappings: ProgrammeMapping[]
): string | null;

// Enhanced
function findMatchingProgramme(
  dimensionalScores: DimensionalScore[],
  programmeMappings: ProgrammeMapping[],
  responseMap: Map<string, AnswerValue> // New parameter
): string | null;
```

Condition evaluation logic:

```typescript
function evaluateCondition(
  condition: ProgrammeMappingCondition,
  dimensionalScores: DimensionalScore[],
  responseMap: Map<string, AnswerValue>
): boolean {
  // Dimension-based condition
  if (condition.dimension) {
    const score = dimensionalScores.find((s) => s.dimensionId === condition.dimension);
    return evaluateNumericCondition(
      score?.normalisedScore ?? 0,
      condition.operator,
      condition.value
    );
  }

  // Answer-based condition
  if (condition.questionSlug) {
    const answer = responseMap.get(condition.questionSlug);
    return evaluateAnswerCondition(answer, condition.operator, condition.value);
  }

  return false;
}
```

### 3. Body Part Question

A reusable question for body part selection:

```typescript
{
  slug: 'body-part-primary',
  type: 'single-choice',
  questionText: 'Where is your primary area of concern?',
  description: 'Select the body area causing you the most difficulty',
  scoreDimension: null,  // Does not contribute to dimension scores
  options: [
    { value: 'right_shoulder', label: 'Right shoulder' },
    { value: 'left_shoulder', label: 'Left shoulder' },
    { value: 'right_knee', label: 'Right knee' },
    { value: 'left_knee', label: 'Left knee' },
    { value: 'lower_back', label: 'Lower back' },
    { value: 'upper_back', label: 'Upper back' },
    { value: 'neck', label: 'Neck' },
    { value: 'right_hip', label: 'Right hip' },
    { value: 'left_hip', label: 'Left hip' },
    { value: 'right_ankle', label: 'Right ankle' },
    { value: 'left_ankle', label: 'Left ankle' },
    { value: 'right_wrist', label: 'Right wrist' },
    { value: 'left_wrist', label: 'Left wrist' },
    { value: 'other', label: 'Other' }
  ]
}
```

---

## Example Scoring Configuration

```json
{
  "dimensions": [
    {
      "name": "pain",
      "questionIds": ["uuid-pain-level", "uuid-pain-frequency"],
      "maxScore": 20
    },
    {
      "name": "mobility",
      "questionIds": ["uuid-range-of-motion", "uuid-flexibility"],
      "maxScore": 15
    }
  ],
  "programmeMappings": [
    {
      "conditions": [
        { "dimension": "pain", "operator": "gt", "value": 50 },
        { "questionSlug": "body-part-primary", "operator": "eq", "value": "right_shoulder" }
      ],
      "operator": "and",
      "programTemplateId": "shoulder-rehab-right",
      "priority": 1
    },
    {
      "conditions": [
        { "dimension": "pain", "operator": "gt", "value": 50 },
        { "questionSlug": "body-part-primary", "operator": "eq", "value": "left_shoulder" }
      ],
      "operator": "and",
      "programTemplateId": "shoulder-rehab-left",
      "priority": 1
    },
    {
      "conditions": [
        { "dimension": "pain", "operator": "gt", "value": 50 },
        {
          "questionSlug": "body-part-primary",
          "operator": "in",
          "value": ["right_knee", "left_knee"]
        }
      ],
      "operator": "and",
      "programTemplateId": "knee-strength-programme",
      "priority": 1
    },
    {
      "conditions": [
        { "dimension": "pain", "operator": "gt", "value": 50 },
        { "questionSlug": "body-part-primary", "operator": "eq", "value": "lower_back" }
      ],
      "operator": "and",
      "programTemplateId": "core-stability-programme",
      "priority": 1
    },
    {
      "conditions": [{ "dimension": "pain", "operator": "gt", "value": 50 }],
      "programTemplateId": "general-pain-management",
      "priority": 10
    }
  ]
}
```

**Note:** Lower priority number = higher precedence. The general fallback has priority 10, so specific body-part rules (priority 1) are evaluated first.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENHANCED PROGRAMME MATCHING                           │
└─────────────────────────────────────────────────────────────────────────┘

  Patient completes assessment
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Collected Data:                                                  │
  │  • Dimension Scores: pain=65, mobility=45, strength=80           │
  │  • Answer Values: body-part-primary = "right_shoulder"           │
  └──────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Evaluate Programme Mappings (sorted by priority)                 │
  │                                                                   │
  │  Rule 1 (priority 1):                                            │
  │    pain > 50? ✓ (65 > 50)                                        │
  │    body-part = 'right_shoulder'? ✓                               │
  │    ──────────────────────────────                                │
  │    MATCH! → shoulder-rehab-right                                 │
  │                                                                   │
  │  (Remaining rules not evaluated - first match wins)              │
  └──────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Result:                                                          │
  │  • recommendedProgrammeId: "shoulder-rehab-right"                │
  │  • Patient receives shoulder-specific exercises                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] Extend `ProgrammeMappingCondition` type to support `questionSlug` and string values
- [ ] Add `'eq' | 'in' | 'contains'` to operator types
- [ ] Update Zod validation schema for `ProgrammeMappingCondition`
- [ ] Modify `findMatchingProgramme` to accept response map parameter
- [ ] Implement `evaluateAnswerCondition` helper function
- [ ] Update `scoring.service.ts` to pass response map to programme matching
- [ ] Add unit tests for answer-based condition evaluation
- [ ] Add integration test for body-part-specific programme matching
- [ ] Create seed data for body-part selection question
- [ ] Document configuration examples for physiotherapists

---

## Benefits

| Benefit                    | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| **Backwards compatible**   | Existing assessments continue to work unchanged         |
| **Flexible**               | Any question answer can inform programme selection      |
| **No dimension explosion** | Avoids creating "shoulder-pain", "knee-pain" dimensions |
| **Configurable**           | Physiotherapists adjust mappings without code changes   |
| **Combinable**             | Mix dimension scores AND answer values in rules         |

---

## Future Extensions

This pattern enables other context-aware matching scenarios:

- **Age-based programmes:** `{ questionSlug: 'age-range', operator: 'eq', value: '65+' }`
- **Activity-level programmes:** `{ questionSlug: 'activity-level', operator: 'eq', value: 'sedentary' }`
- **Goal-based programmes:** `{ questionSlug: 'primary-goal', operator: 'in', value: ['weight_loss', 'fitness'] }`

---

## Related Files

| File                                                                  | Purpose          |
| --------------------------------------------------------------------- | ---------------- |
| `packages/database/src/types/question.types.ts`                       | Type definitions |
| `packages/core/src/assessments/scoring/helpers/programme-matching.ts` | Matching logic   |
| `packages/core/src/assessments/scoring/scoring.service.ts`            | Orchestration    |
| `packages/core/src/schemas/job.schema.ts`                             | Zod validation   |
