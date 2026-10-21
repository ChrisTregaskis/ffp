import { describe, it, expect } from 'vitest';

import {
  userAnswerSchema,
  userAssessmentAnswersSchema,
  userAssessmentScoresSchema,
  statusTransitionSchema,
  isValidStatusTransition,
  getAllowedTransitions,
  startAssessmentRequestSchema,
  startAssessmentResponseSchema,
  saveProgressRequestSchema,
  submitAssessmentRequestSchema,
} from '../../src/schemas/user-assessment/user-assessment.schema';

// Test fixtures
const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const validUuid2 = '660e8400-e29b-41d4-a716-446655440001';

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

  // The services read each answer's questionId, not its key, so this check is what stops
  // an answer filed under one question's key being stored against another question
  it.each([
    [
      'save',
      (answers: unknown) => saveProgressRequestSchema.safeParse({ answers, currentStep: 1 }),
    ],
    ['submit', (answers: unknown) => submitAssessmentRequestSchema.safeParse({ answers })],
  ])('refuses a %s body whose answer is keyed by another question', (_body, parse) => {
    const result = parse({
      [validUuid]: { questionId: validUuid2, answerValue: 4 },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        code: 'custom',
        message: 'An answer must be keyed by its own questionId',
        path: ['answers', validUuid, 'questionId'],
      }),
    ]);
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
    safetyGate: null,
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
