/**
 * Unit tests for branch-evaluator.service
 *
 * Tests the evaluation of branching rules including:
 * - goto_step actions (immediate navigation)
 * - show_warning actions (with/without continue)
 * - end_assessment actions (early termination)
 * - Default step resolution
 * - Priority ordering
 *
 * @module tests/branching/branch-evaluator.test
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

import type { FlowStepRecord, NextStepRule } from '@ffp/database';

import { evaluateNextStep, type BranchEvaluationContext } from '../../src/assessments/branching';

// The evaluator's system logger reads LOG_LEVEL once, when the module loads
vi.hoisted(() => {
  vi.stubEnv('LOG_LEVEL', 'DEBUG');
});

describe('Branch Evaluator', () => {
  // Use fake timers for consistent warning timestamps
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-12T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper to create a minimal flow step record
   */
  function createFlowStep(overrides: Partial<FlowStepRecord> = {}): FlowStepRecord {
    return {
      id: '55555555-5555-5555-8555-555555550001',
      publicId: 'flowstep0001',
      flowId: '44444444-4444-4444-8444-444444440001',
      templateId: null,
      order: 1,
      type: 'questions',
      config: { title: 'Test Step' },
      nextStepRules: null,
      defaultNextStepId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /** An active step of the flow with the given id, for a branching target to land on */
  const stepWithId = (id: string, order = 2): FlowStepRecord => createFlowStep({ id, order });

  /**
   * Helper to create a minimal evaluation context
   */
  function createContext(
    currentStep: FlowStepRecord,
    allSteps: FlowStepRecord[] = [],
    answers: Record<string, string | number> = {}
  ): BranchEvaluationContext {
    return {
      currentStepId: currentStep.id,
      allSteps: allSteps.map((s) => ({
        id: s.id,
        order: s.order,
        isActive: s.isActive,
        defaultNextStepId: s.defaultNextStepId,
      })),
      answers: new Map(Object.entries(answers)),
    };
  }

  describe('evaluateNextStep - No branching rules', () => {
    it('should return default next step when no branching rules', () => {
      const currentStep = createFlowStep({
        nextStepRules: null,
        defaultNextStepId: '55555555-5555-5555-8555-555555550002',
      });
      const context = createContext(currentStep, [
        currentStep,
        stepWithId('55555555-5555-5555-8555-555555550002', 5),
      ]);

      const result = evaluateNextStep(currentStep, context);

      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550002');
      expect(result.warnings).toHaveLength(0);
      expect(result.shouldTerminate).toBe(false);
    });

    it('should fall back to order+1 step when no default set', () => {
      const currentStep = createFlowStep({ order: 1, defaultNextStepId: null });
      const nextStep = createFlowStep({
        id: '55555555-5555-5555-8555-555555550002',
        order: 2,
      });
      const context = createContext(currentStep, [currentStep, nextStep]);

      const result = evaluateNextStep(currentStep, context);

      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550002');
    });

    it('should return null when no next step available (end of flow)', () => {
      const currentStep = createFlowStep({
        order: 3,
        nextStepRules: null,
        defaultNextStepId: null,
      });
      const context = createContext(currentStep, [currentStep]);

      const result = evaluateNextStep(currentStep, context);

      expect(result.nextStepId).toBeNull();
      expect(result.shouldTerminate).toBe(false);
    });
  });

  describe('evaluateNextStep - goto_step action', () => {
    it('should navigate to target step when conditions match', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'pain-level', answerValue: 'high' }],
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550010' },
        },
      ];
      const currentStep = createFlowStep({ nextStepRules: rules });
      const context = createContext(
        currentStep,
        [currentStep, stepWithId('55555555-5555-5555-8555-555555550010', 10)],
        { 'pain-level': 'high' }
      );

      const result = evaluateNextStep(currentStep, context);

      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550010');
      expect(result.warnings).toHaveLength(0);
      expect(result.shouldTerminate).toBe(false);
    });

    it('should fall back to default when conditions do not match', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'pain-level', answerValue: 'high' }],
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550010' },
        },
      ];
      const currentStep = createFlowStep({
        nextStepRules: rules,
        defaultNextStepId: '55555555-5555-5555-8555-555555550002',
      });
      const context = createContext(
        currentStep,
        [currentStep, stepWithId('55555555-5555-5555-8555-555555550002', 5)],
        { 'pain-level': 'low' }
      );

      const result = evaluateNextStep(currentStep, context);

      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550002');
    });
  });

  describe('evaluateNextStep - show_warning action', () => {
    it('should add warning and continue when continueAfterWarning is true', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [
            { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
          ],
          action: {
            type: 'show_warning',
            warningMessage: 'Please consult a doctor',
            warningType: 'seek_medical',
            continueAfterWarning: true,
          },
        },
      ];
      const currentStep = createFlowStep({
        nextStepRules: rules,
        defaultNextStepId: '55555555-5555-5555-8555-555555550002',
      });
      const context = createContext(
        currentStep,
        [currentStep, stepWithId('55555555-5555-5555-8555-555555550002', 5)],
        { 'radiating-pain': 'yes' }
      );

      const result = evaluateNextStep(currentStep, context);

      expect(result.warnings).toEqual([
        {
          message: 'Please consult a doctor',
          type: 'seek_medical',
          shownAt: expect.any(String) as unknown,
          stepId: currentStep.id,
          triggeredBy: 'radiating-pain',
        },
      ]);
      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550002');
      expect(result.shouldTerminate).toBe(false);
    });

    it('should terminate when continueAfterWarning is false', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'incontinence', answerValue: 'yes' }],
          action: {
            type: 'show_warning',
            warningMessage: 'Seek immediate medical attention',
            warningType: 'seek_medical',
            continueAfterWarning: false,
          },
        },
      ];
      const currentStep = createFlowStep({ nextStepRules: rules });
      const context = createContext(currentStep, [], { incontinence: 'yes' });

      const result = evaluateNextStep(currentStep, context);

      expect(result.shouldTerminate).toBe(true);
      expect(result.warnings).toEqual([
        expect.objectContaining({ stepId: currentStep.id, triggeredBy: 'incontinence' }),
      ]);
      expect(result.nextStepId).toBeNull();
    });

    it('should accumulate multiple warnings', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [
            { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
          ],
          action: {
            type: 'show_warning',
            warningMessage: 'Warning 1',
            warningType: 'caution',
            continueAfterWarning: true,
          },
        },
        {
          priority: 2,
          conditions: [{ type: 'answer_value', questionSlug: 'numbness', answerValue: 'yes' }],
          action: {
            type: 'show_warning',
            warningMessage: 'Warning 2',
            warningType: 'seek_medical',
            continueAfterWarning: true,
          },
        },
      ];
      const currentStep = createFlowStep({
        nextStepRules: rules,
        defaultNextStepId: '55555555-5555-5555-8555-555555550002',
      });
      const context = createContext(currentStep, [], {
        'radiating-pain': 'yes',
        numbness: 'yes',
      });

      const result = evaluateNextStep(currentStep, context);

      expect(result.warnings).toEqual([
        expect.objectContaining({
          message: 'Warning 1',
          stepId: currentStep.id,
          triggeredBy: 'radiating-pain',
        }),
        expect.objectContaining({
          message: 'Warning 2',
          stepId: currentStep.id,
          triggeredBy: 'numbness',
        }),
      ]);
      expect(result.shouldTerminate).toBe(false);
    });
  });

  describe('evaluateNextStep - end_assessment action', () => {
    it('should terminate with reason when conditions match', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'exclude-flag', answerValue: 'yes' }],
          action: { type: 'end_assessment', earlyTerminationReason: 'Exclusion criteria met' },
        },
      ];
      const currentStep = createFlowStep({ nextStepRules: rules });
      const context = createContext(currentStep, [], { 'exclude-flag': 'yes' });

      const result = evaluateNextStep(currentStep, context);

      expect(result.shouldTerminate).toBe(true);
      expect(result.terminationReason).toBe('Exclusion criteria met');
      expect(result.nextStepId).toBeNull();
    });
  });

  describe('evaluateNextStep - Priority ordering', () => {
    it('should evaluate rules in priority order (lower = higher priority)', () => {
      const rules: NextStepRule[] = [
        {
          priority: 10,
          conditions: [{ type: 'answer_value', questionSlug: 'test', answerValue: 'yes' }],
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550010' },
        },
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'test', answerValue: 'yes' }],
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550001' },
        },
      ];
      const currentStep = createFlowStep({ nextStepRules: rules });
      const context = createContext(
        currentStep,
        [currentStep, stepWithId('55555555-5555-5555-8555-555555550010', 10)],
        { test: 'yes' }
      );

      const result = evaluateNextStep(currentStep, context);

      // Priority 1 (higher priority) should match first
      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550001');
    });
  });

  describe('evaluateNextStep - Fallback rule (empty conditions)', () => {
    it('should match fallback rule when no other rules match', () => {
      const rules: NextStepRule[] = [
        {
          priority: 1,
          conditions: [{ type: 'answer_value', questionSlug: 'test', answerValue: 'yes' }],
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550010' },
        },
        {
          priority: 100,
          conditions: [], // Fallback - always matches
          action: { type: 'goto_step', targetStepId: '55555555-5555-5555-8555-555555550099' },
        },
      ];
      const currentStep = createFlowStep({ nextStepRules: rules });
      const context = createContext(
        currentStep,
        [
          currentStep,
          stepWithId('55555555-5555-5555-8555-555555550010', 10),
          stepWithId('55555555-5555-5555-8555-555555550099', 99),
        ],
        { test: 'no' }
      );

      const result = evaluateNextStep(currentStep, context);

      // First rule doesn't match, fallback should be used
      expect(result.nextStepId).toBe('55555555-5555-5555-8555-555555550099');
    });
  });

  describe('evaluateNextStep - a target that is not an active step of the flow', () => {
    const NEXT_IN_ORDER = '55555555-5555-5555-8555-555555550002';
    const REMOVED = '55555555-5555-5555-8555-555555550020';
    const UNKNOWN = '55555555-5555-5555-8555-555555550030';
    const OTHER_TARGET = '55555555-5555-5555-8555-555555550040';

    let consoleLog: MockInstance<typeof console.log>;

    beforeEach(() => {
      consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleLog.mockRestore();
    });

    const warningsLogged = (): unknown[] =>
      consoleLog.mock.calls
        .map(([line]) => JSON.parse(line as string) as { level: string })
        .filter((entry) => entry.level === 'WARN');

    const fallbackWarning = (
      stepId: string,
      targetStepId: string,
      link: 'default' | 'goto_step'
    ): unknown => ({
      level: 'WARN',
      message: 'Branching target is not an active step of the flow; falling back',
      service: 'branch-evaluator',
      timestamp: expect.any(String) as unknown,
      context: { stepId, targetStepId, link },
    });

    /** The current step at order 1, the next step in order, and a removed step */
    const flowWith = (currentStep: FlowStepRecord): FlowStepRecord[] => [
      currentStep,
      stepWithId(NEXT_IN_ORDER, 2),
      createFlowStep({ id: REMOVED, order: 3, isActive: false }),
      stepWithId(OTHER_TARGET, 4),
    ];

    it.each([
      ['inactive', REMOVED],
      ['missing from the flow', UNKNOWN],
    ])('falls back to the next step in order when the default next step is %s', (_case, target) => {
      const currentStep = createFlowStep({ order: 1, defaultNextStepId: target });

      const result = evaluateNextStep(
        currentStep,
        createContext(currentStep, flowWith(currentStep))
      );

      expect(result).toEqual({ nextStepId: NEXT_IN_ORDER, warnings: [], shouldTerminate: false });
      expect(warningsLogged()).toEqual([fallbackWarning(currentStep.id, target, 'default')]);
    });

    it.each([
      ['inactive', REMOVED],
      ['missing from the flow', UNKNOWN],
    ])('skips a goto_step rule whose target is %s, as if the rule were absent', (_case, target) => {
      const rules: NextStepRule[] = [
        { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: target } },
        {
          priority: 2,
          conditions: [{ type: 'answer_value', questionSlug: 'test', answerValue: 'yes' }],
          action: { type: 'goto_step', targetStepId: OTHER_TARGET },
        },
      ];
      const currentStep = createFlowStep({ order: 1, nextStepRules: rules });
      const context = createContext(currentStep, flowWith(currentStep), { test: 'yes' });

      const result = evaluateNextStep(currentStep, context);

      expect(result).toEqual({ nextStepId: OTHER_TARGET, warnings: [], shouldTerminate: false });
      expect(warningsLogged()).toEqual([fallbackWarning(currentStep.id, target, 'goto_step')]);
    });

    it('falls back to the default when the only matching goto_step rule targets an inactive step', () => {
      const rules: NextStepRule[] = [
        { priority: 1, conditions: [], action: { type: 'goto_step', targetStepId: REMOVED } },
      ];
      const currentStep = createFlowStep({
        order: 1,
        nextStepRules: rules,
        defaultNextStepId: OTHER_TARGET,
      });

      const result = evaluateNextStep(
        currentStep,
        createContext(currentStep, flowWith(currentStep))
      );

      expect(result.nextStepId).toBe(OTHER_TARGET);
      expect(warningsLogged()).toEqual([fallbackWarning(currentStep.id, REMOVED, 'goto_step')]);
    });
  });
});
