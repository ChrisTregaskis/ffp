import { describe, it, expect } from 'vitest';

import {
  flowStepTypeSchema,
  flowStepConfigSchema,
  flowStepSchema,
  assessmentFlowSchema,
  createAssessmentFlowSchema,
  updateAssessmentFlowSchema,
} from '../../src/schemas/assessment-flow.schema';

// Test fixtures
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const validConfig = {
  title: 'Test Step',
  description: 'A test step description',
};

const validIntroStep = {
  order: 1,
  type: 'intro' as const,
  config: {
    title: 'Welcome',
    description: 'Introduction to the assessment',
    estimatedMinutes: 20,
  },
};

const validQuestionsStep = {
  order: 2,
  type: 'questions' as const,
  templateId: validUuid,
  config: {
    title: 'Pre-Assessment Questions',
    description: 'Questions about your goals and health',
  },
};

const validTransitionStep = {
  order: 3,
  type: 'transition' as const,
  config: {
    title: 'Ready for Physical Assessment?',
    description: 'Preparing for the physical tests',
    safetyNotes: ['Stop if you feel pain', 'Use support if needed'],
  },
};

const validVideoAssessmentStep = {
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
  order: 5,
  type: 'results' as const,
  config: {
    title: 'Assessment Complete!',
    description: 'Here are your results',
  },
};

const validProgrammeOverviewStep = {
  order: 6,
  type: 'programme-overview' as const,
  config: {
    title: 'Your Personalised Programme',
    description: 'Based on your assessment results',
  },
};

const validFlow = {
  id: validUuid,
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

describe('flowStepTypeSchema', () => {
  describe('valid step types', () => {
    it.each([
      'intro',
      'questions',
      'transition',
      'video-assessment',
      'results',
      'programme-overview',
    ])('accepts valid step type: %s', (type) => {
      const result = flowStepTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid step types', () => {
    it('rejects invalid step type', () => {
      const result = flowStepTypeSchema.safeParse('invalid-type');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = flowStepTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = flowStepTypeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});

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

    it('accepts config with optional fields omitted', () => {
      const result = flowStepConfigSchema.safeParse(validConfig);
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

    it('rejects negative estimatedMinutes', () => {
      const result = flowStepConfigSchema.safeParse({
        title: 'Test',
        estimatedMinutes: -5,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('flowStepSchema', () => {
  describe('valid steps', () => {
    it('accepts valid intro step', () => {
      const result = flowStepSchema.safeParse(validIntroStep);
      expect(result.success).toBe(true);
    });

    it('accepts valid questions step with templateId', () => {
      const result = flowStepSchema.safeParse(validQuestionsStep);
      expect(result.success).toBe(true);
    });

    it('accepts valid transition step with safetyNotes', () => {
      const result = flowStepSchema.safeParse(validTransitionStep);
      expect(result.success).toBe(true);
    });

    it('accepts valid video-assessment step with instructions', () => {
      const result = flowStepSchema.safeParse(validVideoAssessmentStep);
      expect(result.success).toBe(true);
    });

    it('accepts valid results step', () => {
      const result = flowStepSchema.safeParse(validResultsStep);
      expect(result.success).toBe(true);
    });

    it('accepts valid programme-overview step', () => {
      const result = flowStepSchema.safeParse(validProgrammeOverviewStep);
      expect(result.success).toBe(true);
    });

    it('accepts step without templateId (optional)', () => {
      const result = flowStepSchema.safeParse({
        order: 1,
        type: 'intro',
        config: { title: 'Welcome' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('order validation', () => {
    it('accepts positive integer order', () => {
      const result = flowStepSchema.safeParse({
        ...validIntroStep,
        order: 1,
      });
      expect(result.success).toBe(true);
    });

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
    it('accepts valid UUID templateId', () => {
      const result = flowStepSchema.safeParse({
        ...validQuestionsStep,
        templateId: validUuid,
      });
      expect(result.success).toBe(true);
    });

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

  describe('type validation', () => {
    it('rejects invalid step type', () => {
      const result = flowStepSchema.safeParse({
        order: 1,
        type: 'invalid-type',
        config: { title: 'Test' },
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

  describe('isActive validation', () => {
    it('accepts true', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts false', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-boolean', () => {
      const result = assessmentFlowSchema.safeParse({
        ...validFlow,
        isActive: 'true',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('createAssessmentFlowSchema', () => {
  const validCreateFlow = {
    name: 'New Assessment Flow',
    description: 'A new flow',
    steps: [validIntroStep, validResultsStep],
    isActive: true,
  };

  it('accepts valid create input', () => {
    const result = createAssessmentFlowSchema.safeParse(validCreateFlow);
    expect(result.success).toBe(true);
  });

  it('ignores id if provided (omit strips it)', () => {
    const result = createAssessmentFlowSchema.safeParse({
      ...validCreateFlow,
      id: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('id' in result.data).toBe(false);
    }
  });

  it('ignores timestamps if provided', () => {
    const result = createAssessmentFlowSchema.safeParse({
      ...validCreateFlow,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('createdAt' in result.data).toBe(false);
      expect('updatedAt' in result.data).toBe(false);
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

  it('rejects empty steps array', () => {
    const result = createAssessmentFlowSchema.safeParse({
      ...validCreateFlow,
      steps: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateAssessmentFlowSchema', () => {
  it('accepts partial update with just name', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with just isActive', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with just description', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with new steps', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      steps: [validIntroStep, validResultsStep],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no updates)', () => {
    const result = updateAssessmentFlowSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates fields when provided - empty name rejected', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('validates fields when provided - empty steps rejected', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates fields when provided - invalid step rejected', () => {
    const result = updateAssessmentFlowSchema.safeParse({
      steps: [{ order: -1, type: 'intro', config: { title: 'Test' } }],
    });
    expect(result.success).toBe(false);
  });
});
