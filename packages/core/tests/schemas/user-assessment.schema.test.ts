import { describe, it, expect } from 'vitest';

import { dimensionalScoreSchema } from '../../src/schemas/job.schema';
import {
  userAssessmentStatusSchema,
  userAnswerSchema,
  userAssessmentAnswersSchema,
  userAssessmentScoresSchema,
  userAssessmentSchema,
  createUserAssessmentSchema,
  updateUserAssessmentSchema,
  statusTransitionSchema,
  isValidStatusTransition,
  getAllowedTransitions,
  submitAssessmentSchema,
  startAssessmentRequestSchema,
  startAssessmentResponseSchema,
} from '../../src/schemas/user-assessment.schema';

// Test fixtures
const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const validUuid2 = '660e8400-e29b-41d4-a716-446655440001';
const validUuid3 = '770e8400-e29b-41d4-a716-446655440002';

const _validAnswer = {
  questionId: validUuid,
  answerValue: 4,
  answerId: validUuid2,
  answeredAt: new Date(),
};

const validDimensionalScore = {
  dimensionId: 'mobility',
  dimensionName: 'Mobility',
  rawScore: 75,
  normalisedScore: 80,
  category: 'moderate',
};

const validScores = {
  dimensions: [validDimensionalScore],
  overallScore: 80,
  riskLevel: 'moderate' as const,
  scoredAt: new Date(),
};

const validUserAssessment = {
  id: validUuid,
  tenantId: validUuid,
  userId: validUuid2,
  flowId: validUuid3,
  currentStep: 1,
  status: 'not_started' as const,
  answers: {},
  scores: null,
  programmeId: null,
  startedAt: null,
  submittedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// userAssessmentStatusSchema tests
// ============================================================================

describe('userAssessmentStatusSchema', () => {
  it('should accept valid status values', () => {
    const validStatuses = [
      'not_started',
      'in_progress',
      'submitted',
      'scored',
      'completed',
      'abandoned',
    ];

    validStatuses.forEach((status) => {
      const result = userAssessmentStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid status values', () => {
    const invalidStatuses = ['pending', 'active', 'done', 'cancelled', ''];

    invalidStatuses.forEach((status) => {
      const result = userAssessmentStatusSchema.safeParse(status);
      expect(result.success).toBe(false);
    });
  });

  it('should reject non-string values', () => {
    const result = userAssessmentStatusSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// userAnswerSchema tests
// ============================================================================

describe('userAnswerSchema', () => {
  it('should accept valid answer with numeric value', () => {
    const answer = {
      questionId: validUuid,
      answerValue: 5,
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(true);
  });

  it('should accept valid answer with string value', () => {
    const answer = {
      questionId: validUuid,
      answerValue: 'Free text response',
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(true);
  });

  it('should accept answer with optional answerId', () => {
    const answer = {
      questionId: validUuid,
      answerValue: 3,
      answerId: validUuid2,
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(true);
  });

  it('should accept answer with optional answeredAt timestamp', () => {
    const answer = {
      questionId: validUuid,
      answerValue: 4,
      answeredAt: new Date().toISOString(),
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(true);
  });

  it('should reject answer without questionId', () => {
    const answer = {
      answerValue: 3,
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(false);
  });

  it('should reject answer with invalid questionId format', () => {
    const answer = {
      questionId: 'not-a-uuid',
      answerValue: 3,
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(false);
  });

  it('should reject answer without answerValue', () => {
    const answer = {
      questionId: validUuid,
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(false);
  });

  it('should reject answer with invalid answerId format', () => {
    const answer = {
      questionId: validUuid,
      answerValue: 3,
      answerId: 'not-a-uuid',
    };
    const result = userAnswerSchema.safeParse(answer);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// userAssessmentAnswersSchema tests
// ============================================================================

describe('userAssessmentAnswersSchema', () => {
  it('should accept empty answers object', () => {
    const result = userAssessmentAnswersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept answers keyed by questionId', () => {
    const answers = {
      [validUuid]: {
        questionId: validUuid,
        answerValue: 4,
      },
      [validUuid2]: {
        questionId: validUuid2,
        answerValue: 'Text answer',
      },
    };
    const result = userAssessmentAnswersSchema.safeParse(answers);
    expect(result.success).toBe(true);
  });

  it('should reject answers with invalid key format', () => {
    const answers = {
      'not-a-uuid': {
        questionId: validUuid,
        answerValue: 4,
      },
    };
    const result = userAssessmentAnswersSchema.safeParse(answers);
    expect(result.success).toBe(false);
  });

  it('should reject answers with invalid value structure', () => {
    const answers = {
      [validUuid]: {
        questionId: validUuid,
        // missing answerValue
      },
    };
    const result = userAssessmentAnswersSchema.safeParse(answers);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// dimensionalScoreSchema tests
// ============================================================================

describe('dimensionalScoreSchema', () => {
  it('should accept valid dimensional score', () => {
    const result = dimensionalScoreSchema.safeParse(validDimensionalScore);
    expect(result.success).toBe(true);
  });

  it('should accept score without optional category', () => {
    const score = {
      dimensionId: 'strength',
      dimensionName: 'Strength',
      rawScore: 60,
      normalisedScore: 70,
    };
    const result = dimensionalScoreSchema.safeParse(score);
    expect(result.success).toBe(true);
  });

  it('should reject score without dimensionId', () => {
    const score = {
      dimensionName: 'Strength',
      rawScore: 60,
      normalisedScore: 70,
    };
    const result = dimensionalScoreSchema.safeParse(score);
    expect(result.success).toBe(false);
  });

  it('should reject score with non-numeric rawScore', () => {
    const score = {
      dimensionId: 'strength',
      dimensionName: 'Strength',
      rawScore: 'high',
      normalisedScore: 70,
    };
    const result = dimensionalScoreSchema.safeParse(score);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// userAssessmentScoresSchema tests
// ============================================================================

describe('userAssessmentScoresSchema', () => {
  it('should accept valid scores object', () => {
    const result = userAssessmentScoresSchema.safeParse(validScores);
    expect(result.success).toBe(true);
  });

  it('should accept scores without optional fields', () => {
    const scores = {
      dimensions: [validDimensionalScore],
      scoredAt: new Date(),
    };
    const result = userAssessmentScoresSchema.safeParse(scores);
    expect(result.success).toBe(true);
  });

  it('should accept scores with ISO date string', () => {
    const scores = {
      dimensions: [validDimensionalScore],
      scoredAt: new Date().toISOString(),
    };
    const result = userAssessmentScoresSchema.safeParse(scores);
    expect(result.success).toBe(true);
  });

  it('should reject scores without dimensions', () => {
    const scores = {
      scoredAt: new Date(),
    };
    const result = userAssessmentScoresSchema.safeParse(scores);
    expect(result.success).toBe(false);
  });

  it('should reject scores with invalid riskLevel', () => {
    const scores = {
      dimensions: [validDimensionalScore],
      riskLevel: 'critical',
      scoredAt: new Date(),
    };
    const result = userAssessmentScoresSchema.safeParse(scores);
    expect(result.success).toBe(false);
  });

  it('should accept valid riskLevel values', () => {
    const riskLevels = ['low', 'moderate', 'high'] as const;

    riskLevels.forEach((riskLevel) => {
      const scores = {
        dimensions: [validDimensionalScore],
        riskLevel,
        scoredAt: new Date(),
      };
      const result = userAssessmentScoresSchema.safeParse(scores);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// userAssessmentSchema tests
// ============================================================================

describe('userAssessmentSchema', () => {
  it('should accept valid user assessment', () => {
    const result = userAssessmentSchema.safeParse(validUserAssessment);
    expect(result.success).toBe(true);
  });

  it('should accept assessment with populated answers', () => {
    const assessment = {
      ...validUserAssessment,
      status: 'in_progress' as const,
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 4,
        },
      },
      startedAt: new Date(),
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(true);
  });

  it('should accept completed assessment with scores', () => {
    const assessment = {
      ...validUserAssessment,
      status: 'completed' as const,
      scores: validScores,
      programmeId: validUuid3,
      startedAt: new Date(),
      submittedAt: new Date(),
      completedAt: new Date(),
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(true);
  });

  it('should reject assessment without required fields', () => {
    const assessment = {
      id: validUuid,
      tenantId: validUuid,
      // missing userId, flowId, etc.
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(false);
  });

  it('should reject assessment with invalid UUID fields', () => {
    const assessment = {
      ...validUserAssessment,
      userId: 'not-a-uuid',
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(false);
  });

  it('should reject assessment with non-positive currentStep', () => {
    const assessment = {
      ...validUserAssessment,
      currentStep: 0,
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(false);
  });

  it('should reject assessment with invalid status', () => {
    const assessment = {
      ...validUserAssessment,
      status: 'invalid_status',
    };
    const result = userAssessmentSchema.safeParse(assessment);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// createUserAssessmentSchema tests
// ============================================================================

describe('createUserAssessmentSchema', () => {
  it('should accept valid create input', () => {
    const input = {
      tenantId: validUuid,
      userId: validUuid2,
      flowId: validUuid3,
    };
    const result = createUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject input without tenantId', () => {
    const input = {
      userId: validUuid2,
      flowId: validUuid3,
    };
    const result = createUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject input without userId', () => {
    const input = {
      tenantId: validUuid,
      flowId: validUuid3,
    };
    const result = createUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject input without flowId', () => {
    const input = {
      tenantId: validUuid,
      userId: validUuid2,
    };
    const result = createUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject input with invalid UUID format', () => {
    const input = {
      tenantId: 'not-a-uuid',
      userId: validUuid2,
      flowId: validUuid3,
    };
    const result = createUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// updateUserAssessmentSchema tests
// ============================================================================

describe('updateUserAssessmentSchema', () => {
  it('should accept update with currentStep', () => {
    const input = {
      currentStep: 2,
    };
    const result = updateUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept update with answers', () => {
    const input = {
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 5,
        },
      },
    };
    const result = updateUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept update with both fields', () => {
    const input = {
      currentStep: 3,
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 5,
        },
      },
    };
    const result = updateUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept empty update object', () => {
    const result = updateUserAssessmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject update with non-positive currentStep', () => {
    const input = {
      currentStep: 0,
    };
    const result = updateUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject update with non-integer currentStep', () => {
    const input = {
      currentStep: 2.5,
    };
    const result = updateUserAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// statusTransitionSchema tests
// ============================================================================

describe('statusTransitionSchema', () => {
  describe('valid transitions', () => {
    it('should allow not_started → in_progress', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'not_started',
        toStatus: 'in_progress',
      });
      expect(result.success).toBe(true);
    });

    it('should allow in_progress → submitted', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'in_progress',
        toStatus: 'submitted',
      });
      expect(result.success).toBe(true);
    });

    it('should allow in_progress → abandoned', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'in_progress',
        toStatus: 'abandoned',
      });
      expect(result.success).toBe(true);
    });

    it('should allow submitted → scored', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'submitted',
        toStatus: 'scored',
      });
      expect(result.success).toBe(true);
    });

    it('should allow scored → completed', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'scored',
        toStatus: 'completed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('should reject not_started → submitted (skip in_progress)', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'not_started',
        toStatus: 'submitted',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid status transition');
      }
    });

    it('should reject in_progress → completed (skip intermediate)', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'in_progress',
        toStatus: 'completed',
      });
      expect(result.success).toBe(false);
    });

    it('should reject completed → in_progress (backwards)', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'completed',
        toStatus: 'in_progress',
      });
      expect(result.success).toBe(false);
    });

    it('should reject abandoned → in_progress (terminal state)', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'abandoned',
        toStatus: 'in_progress',
      });
      expect(result.success).toBe(false);
    });

    it('should reject submitted → abandoned (not allowed)', () => {
      const result = statusTransitionSchema.safeParse({
        fromStatus: 'submitted',
        toStatus: 'abandoned',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// isValidStatusTransition tests
// ============================================================================

describe('isValidStatusTransition', () => {
  it('should return true for valid transition', () => {
    expect(isValidStatusTransition('not_started', 'in_progress')).toBe(true);
    expect(isValidStatusTransition('in_progress', 'submitted')).toBe(true);
    expect(isValidStatusTransition('in_progress', 'abandoned')).toBe(true);
    expect(isValidStatusTransition('submitted', 'scored')).toBe(true);
    expect(isValidStatusTransition('scored', 'completed')).toBe(true);
  });

  it('should return false for invalid transition', () => {
    expect(isValidStatusTransition('not_started', 'submitted')).toBe(false);
    expect(isValidStatusTransition('completed', 'in_progress')).toBe(false);
    expect(isValidStatusTransition('abandoned', 'completed')).toBe(false);
  });
});

// ============================================================================
// getAllowedTransitions tests
// ============================================================================

describe('getAllowedTransitions', () => {
  it('should return correct transitions for not_started', () => {
    const transitions = getAllowedTransitions('not_started');
    expect(transitions).toEqual(['in_progress']);
  });

  it('should return correct transitions for in_progress', () => {
    const transitions = getAllowedTransitions('in_progress');
    expect(transitions).toEqual(['submitted', 'abandoned']);
  });

  it('should return correct transitions for submitted', () => {
    const transitions = getAllowedTransitions('submitted');
    expect(transitions).toEqual(['scored']);
  });

  it('should return correct transitions for scored', () => {
    const transitions = getAllowedTransitions('scored');
    expect(transitions).toEqual(['completed']);
  });

  it('should return empty array for completed (terminal)', () => {
    const transitions = getAllowedTransitions('completed');
    expect(transitions).toEqual([]);
  });

  it('should return empty array for abandoned (terminal)', () => {
    const transitions = getAllowedTransitions('abandoned');
    expect(transitions).toEqual([]);
  });
});

// ============================================================================
// submitAssessmentSchema tests
// ============================================================================

describe('submitAssessmentSchema', () => {
  it('should accept valid submit input', () => {
    const input = {
      assessmentId: validUuid,
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 5,
        },
      },
    };
    const result = submitAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept submit with empty answers', () => {
    const input = {
      assessmentId: validUuid,
      answers: {},
    };
    const result = submitAssessmentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject submit without assessmentId', () => {
    const input = {
      answers: {},
    };
    const result = submitAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject submit without answers', () => {
    const input = {
      assessmentId: validUuid,
    };
    const result = submitAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject submit with invalid assessmentId format', () => {
    const input = {
      assessmentId: 'not-a-uuid',
      answers: {},
    };
    const result = submitAssessmentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// startAssessmentRequestSchema tests
// ============================================================================

describe('startAssessmentRequestSchema', () => {
  it('should accept valid flowId as UUID', () => {
    const input = {
      flowId: validUuid,
    };
    const result = startAssessmentRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject missing flowId', () => {
    const input = {};
    const result = startAssessmentRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID format with clear error message', () => {
    const input = {
      flowId: 'not-a-uuid',
    };
    const result = startAssessmentRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('flowId must be a valid GUID');
    }
  });

  it('should reject empty string flowId', () => {
    const input = {
      flowId: '',
    };
    const result = startAssessmentRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject non-string flowId', () => {
    const input = {
      flowId: 12345,
    };
    const result = startAssessmentRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// startAssessmentResponseSchema tests
// ============================================================================

describe('startAssessmentResponseSchema', () => {
  const validStepSummary = {
    id: validUuid,
    order: 1,
    type: 'intro',
    config: { title: 'Welcome' },
    templateId: null,
    hasBranchingRules: false,
    defaultNextStepId: null,
  };

  const validResponse = {
    assessmentId: validUuid,
    currentStep: 1,
    status: 'not_started' as const,
    answers: {},
    flowId: validUuid2,
    isResumed: false,
    steps: [validStepSummary],
  };

  it('should accept valid response for new assessment', () => {
    const result = startAssessmentResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('should accept valid response for resumed assessment', () => {
    const response = {
      ...validResponse,
      status: 'in_progress' as const,
      currentStep: 3,
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 4,
        },
      },
      isResumed: true,
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should require isResumed boolean field', () => {
    const { isResumed: _, ...responseWithoutIsResumed } = validResponse;
    const result = startAssessmentResponseSchema.safeParse(responseWithoutIsResumed);
    expect(result.success).toBe(false);
  });

  it('should reject invalid assessmentId format', () => {
    const response = {
      ...validResponse,
      assessmentId: 'not-a-uuid',
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject invalid flowId format', () => {
    const response = {
      ...validResponse,
      flowId: 'not-a-uuid',
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject non-positive currentStep', () => {
    const response = {
      ...validResponse,
      currentStep: 0,
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject invalid status', () => {
    const response = {
      ...validResponse,
      status: 'invalid_status',
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject non-boolean isResumed', () => {
    const response = {
      ...validResponse,
      isResumed: 'true',
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should accept response with populated answers', () => {
    const response = {
      ...validResponse,
      answers: {
        [validUuid]: {
          questionId: validUuid,
          answerValue: 5,
          answeredAt: new Date().toISOString(),
        },
        [validUuid2]: {
          questionId: validUuid2,
          answerValue: 'Text response',
        },
      },
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should reject response with invalid answers structure', () => {
    const response = {
      ...validResponse,
      answers: {
        [validUuid]: {
          // missing required fields
          invalidField: 'value',
        },
      },
    };
    const result = startAssessmentResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});
