import { describe, it, expect } from 'vitest';

import {
  flowStepConfigSchema,
  flowStepSchema,
  assessmentFlowSchema,
  createAssessmentFlowSchema,
  updateAssessmentFlowSchema,
  assessmentFlowListItemSchema,
  assessmentFlowListFiltersSchema,
  assessmentFlowWithStepsSchema,
  createFlowStepSchema,
  updateFlowStepSchema,
  reorderFlowStepsSchema,
} from '../../src/schemas/assessment-flow.schema';

// Test fixtures
const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const validPublicId = 'abcdefgh1234';

const validIntroStep = {
  publicId: validPublicId,
  order: 1,
  type: 'intro' as const,
  config: {
    title: 'Welcome',
    description: 'Introduction to the assessment',
    estimatedMinutes: 20,
  },
};

const validQuestionsStep = {
  publicId: validPublicId,
  order: 2,
  type: 'questions' as const,
  templateId: validUuid,
  config: {
    title: 'Pre-Assessment Questions',
    description: 'Questions about your goals and health',
  },
};

const validTransitionStep = {
  publicId: validPublicId,
  order: 3,
  type: 'transition' as const,
  config: {
    title: 'Ready for Physical Assessment?',
    description: 'Preparing for the physical tests',
    safetyNotes: ['Stop if you feel pain', 'Use support if needed'],
  },
};

const validVideoAssessmentStep = {
  publicId: validPublicId,
  order: 4,
  type: 'video-assessment' as const,
  templateId: validUuid,
  config: {
    title: 'Strength Assessment',
    description: 'Evaluate your strength levels',
    instructions: ['Watch the video', 'Perform the exercise', 'Rate your performance'],
  },
};

const validResultsStep = {
  publicId: validPublicId,
  order: 5,
  type: 'results' as const,
  config: {
    title: 'Assessment Complete!',
    description: 'Here are your results',
  },
};

const validProgrammeOverviewStep = {
  publicId: validPublicId,
  order: 6,
  type: 'programme-overview' as const,
  config: {
    title: 'Your Personalised Programme',
    description: 'Based on your assessment results',
  },
};

const validFlow = {
  id: validUuid,
  publicId: validPublicId,
  name: 'Standard Physiotherapy Assessment',
  description: 'Comprehensive assessment with physical tests',
  steps: [
    validIntroStep,
    validQuestionsStep,
    validTransitionStep,
    validVideoAssessmentStep,
    validResultsStep,
    validProgrammeOverviewStep,
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('flowStepConfigSchema', () => {
  describe('valid configs', () => {
    it('accepts config with just title', () => {
      const result = flowStepConfigSchema.safeParse({ title: 'Test' });
      expect(result.success).toBe(true);
    });

    it('accepts config with all fields', () => {
      const result = flowStepConfigSchema.safeParse({
        title: 'Full Config',
        description: 'A description',
        instructions: ['Step 1', 'Step 2'],
        safetyNotes: ['Note 1', 'Note 2'],
        estimatedMinutes: 15,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('rejects empty title', () => {
      const result = flowStepConfigSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('rejects missing title', () => {
      const result = flowStepConfigSchema.safeParse({
        description: 'No title',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-positive estimatedMinutes', () => {
      const result = flowStepConfigSchema.safeParse({
        title: 'Test',
        estimatedMinutes: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('flowStepSchema', () => {
  describe('order validation', () => {
    it('rejects zero order', () => {
      const result = flowStepSchema.safeParse({
        ...validIntroStep,
        order: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Order must be a positive integer');
      }
    });

    it('rejects negative order', () => {
      const result = flowStepSchema.safeParse({
        ...validIntroStep,
        order: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer order', () => {
      const result = flowStepSchema.safeParse({
        ...validIntroStep,
        order: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('templateId validation', () => {
    it('rejects invalid UUID templateId', () => {
      const result = flowStepSchema.safeParse({
        ...validQuestionsStep,
        templateId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid template ID format');
      }
    });

    it('rejects empty string templateId', () => {
      const result = flowStepSchema.safeParse({
        ...validQuestionsStep,
        templateId: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('assessmentFlowSchema', () => {
  describe('valid flows', () => {
    it('accepts valid flow with all step types', () => {
      const result = assessmentFlowSchema.safeParse(validFlow);
      expect(result.success).toBe(true);
    });

    it('accepts flow with single step', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        steps: [validIntroStep],
      });
      expect(result.success).toBe(true);
    });

    it('accepts flow with null description', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        description: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('coerces date strings to Date objects', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('id validation', () => {
    it('rejects invalid UUID id', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        name: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    it('rejects missing name', () => {
      const { name: _, ...flowWithoutName } = validFlow;
      const result = assessmentFlowSchema.safeParse(flowWithoutName);
      expect(result.success).toBe(false);
    });
  });

  describe('steps validation', () => {
    it('rejects empty steps array', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        steps: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one step is required');
      }
    });

    it('rejects missing steps', () => {
      const { steps: _, ...flowWithoutSteps } = validFlow;
      const result = assessmentFlowSchema.safeParse(flowWithoutSteps);
      expect(result.success).toBe(false);
    });

    it('validates each step in array', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        steps: [
          validIntroStep,
          { ...validQuestionsStep, order: -1 }, // Invalid order
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('createAssessmentFlowSchema', () => {
  // Admin create is metadata-only — steps are authored separately, not inline.
  const validCreateFlow = {
    name: 'New Assessment Flow',
    description: 'A new flow',
    isActive: true,
  };

  it('accepts valid create input', () => {
    const result = createAssessmentFlowSchema.safeParse(validCreateFlow);
    expect(result.success).toBe(true);
  });

  it('accepts create input without a description', () => {
    const result = createAssessmentFlowSchema.safeParse({
      name: 'Minimal Flow',
    });
    expect(result.success).toBe(true);
  });

  it('strips steps if provided (metadata-only create)', () => {
    const result = createAssessmentFlowSchema.safeParse({
      ...validCreateFlow,
      steps: [validIntroStep, validResultsStep],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('steps' in result.data).toBe(false);
    }
  });

  it('defaults isActive to true when omitted', () => {
    const { isActive: _, ...flowWithoutActive } = validCreateFlow;
    const result = createAssessmentFlowSchema.safeParse(flowWithoutActive);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = createAssessmentFlowSchema.safeParse({
      ...validCreateFlow,
      name: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateAssessmentFlowSchema', () => {
  it('validates fields when provided - empty name rejected', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('createFlowStepSchema', () => {
  it('accepts a valid step without a template link', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'intro',
      config: { title: 'Welcome' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid step with a template link', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'questions',
      templateId: validUuid,
      config: { title: 'Pre-assessment questions' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown step type', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'not-a-real-type',
      config: { title: 'Welcome' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing config title', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'intro',
      config: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid template ID format', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'questions',
      templateId: 'not-a-uuid',
      config: { title: 'Questions' },
    });
    expect(result.success).toBe(false);
  });

  it('does not accept branching fields (they are stripped, never authored)', () => {
    const result = createFlowStepSchema.safeParse({
      type: 'intro',
      config: { title: 'Welcome' },
      nextStepRules: [{ priority: 1 }],
      defaultNextStepId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('nextStepRules');
      expect(result.data).not.toHaveProperty('defaultNextStepId');
    }
  });
});

describe('updateFlowStepSchema', () => {
  it('validates fields when provided - unknown type rejected', () => {
    const result = updateFlowStepSchema.safeParse({ type: 'bogus' });
    expect(result.success).toBe(false);
  });
});

describe('reorderFlowStepsSchema', () => {
  it('accepts a non-empty array of public IDs', () => {
    const result = reorderFlowStepsSchema.safeParse({
      orderedStepPublicIds: [validPublicId, 'anotherId123'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty array', () => {
    const result = reorderFlowStepsSchema.safeParse({ orderedStepPublicIds: [] });
    expect(result.success).toBe(false);
  });

  it('rejects public IDs of the wrong length', () => {
    const result = reorderFlowStepsSchema.safeParse({ orderedStepPublicIds: ['tooShort'] });
    expect(result.success).toBe(false);
  });
});

describe('updateAssessmentFlowSchema — description clearing', () => {
  it('accepts an explicit null so an author can clear the description', () => {
    const result = updateAssessmentFlowSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
    expect(result.success && result.data.description).toBeNull();
  });

  it('leaves description absent when omitted, so a partial update preserves it', () => {
    const result = updateAssessmentFlowSchema.safeParse({ name: 'Wellness baseline' });
    expect(result.success).toBe(true);
    expect(result.success && 'description' in result.data).toBe(false);
  });
});

describe('assessmentFlowListItemSchema', () => {
  const listRow = {
    id: '11111111-1111-4111-8111-111111111111',
    publicId: validPublicId,
    name: 'Wellness baseline',
    description: null,
    isActive: true,
    stepCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('accepts a row whose description is null, as the column stores it', () => {
    const result = assessmentFlowListItemSchema.safeParse(listRow);
    expect(result.success).toBe(true);
  });

  it('rejects a negative step count', () => {
    const result = assessmentFlowListItemSchema.safeParse({ ...listRow, stepCount: -1 });
    expect(result.success).toBe(false);
  });
});

describe('assessmentFlowListFiltersSchema', () => {
  it('coerces the isActive query string to a boolean', () => {
    expect(assessmentFlowListFiltersSchema.parse({ isActive: 'true' }).isActive).toBe(true);
    expect(assessmentFlowListFiltersSchema.parse({ isActive: 'false' }).isActive).toBe(false);
  });

  it('leaves isActive undefined when absent, so the filter is not applied', () => {
    expect(assessmentFlowListFiltersSchema.parse({}).isActive).toBeUndefined();
  });

  it('rejects an isActive value outside true/false', () => {
    expect(assessmentFlowListFiltersSchema.safeParse({ isActive: '' }).success).toBe(false);
    expect(assessmentFlowListFiltersSchema.safeParse({ isActive: 'yes' }).success).toBe(false);
  });
});

describe('assessmentFlowWithStepsSchema', () => {
  const flow = {
    id: '44444444-4444-4444-8444-444444440001',
    publicId: 'c6413330f48e',
    name: 'Standard assessment',
    description: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    steps: [],
  };

  it('accepts a step with a null templateId and a bare config', () => {
    const result = assessmentFlowWithStepsSchema.safeParse({
      ...flow,
      steps: [
        {
          publicId: '192dfcbb7b15',
          order: 1,
          type: 'intro',
          templateId: null,
          config: { title: 'Welcome' },
          branchingRuleCount: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  // The endpoint returns the whole row, branching columns included
  it('ignores the stored branching columns rather than rejecting them', () => {
    const result = assessmentFlowWithStepsSchema.safeParse({
      ...flow,
      steps: [
        {
          publicId: '383e85f6d4b3',
          order: 4,
          type: 'questions',
          templateId: '11111111-1111-1111-8111-111111111105',
          config: { title: 'Health screening', description: 'A few questions' },
          branchingRuleCount: 6,
          nextStepRules: [{ priority: 1 }],
          defaultNextStepId: null,
          isActive: true,
          flowId: '44444444-4444-4444-8444-444444440001',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.steps[0]).not.toHaveProperty('nextStepRules');
  });
});
