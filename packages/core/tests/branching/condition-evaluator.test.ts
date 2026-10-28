/**
 * Unit tests for condition-evaluator
 *
 * Tests the evaluation logic for branch conditions including:
 * - answer_value conditions (string matching)
 * - conditions of any other type, which never match
 *
 * @module tests/branching/condition-evaluator.test
 */

import { describe, it, expect } from 'vitest';

import type { BranchCondition } from '@ffp/database';

import { evaluateConditions, type BranchEvaluationContext } from '../../src/assessments/branching';

describe('Condition Evaluator', () => {
  /**
   * Helper to create a minimal evaluation context
   */
  function createContext(
    answers: Record<string, string | string[] | number>
  ): BranchEvaluationContext {
    return {
      currentStepId: '55555555-5555-5555-8555-555555550001',
      allSteps: [],
      answers: new Map(Object.entries(answers)),
    };
  }

  describe('evaluateConditions - Empty conditions', () => {
    it('should return true for empty conditions array (fallback rule)', () => {
      const conditions: BranchCondition[] = [];
      const context = createContext({});

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });
  });

  describe('evaluateConditions - answer_value type', () => {
    it('should match single string answer', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'back' },
      ];
      const context = createContext({ 'pain-location': 'back' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when answer differs', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'back' },
      ];
      const context = createContext({ 'pain-location': 'shoulder' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should not match when question not answered', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'back' },
      ];
      const context = createContext({});

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should match if any of expected values match (array expected)', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: ['back', 'neck'] },
      ];
      const context = createContext({ 'pain-location': 'neck' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match if none of expected values match', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: ['back', 'neck'] },
      ];
      const context = createContext({ 'pain-location': 'shoulder' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should match array answer containing expected value', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'symptoms', answerValue: 'numbness' },
      ];
      const context = createContext({ symptoms: ['pain', 'numbness', 'weakness'] });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should match array answer against array expected (intersection)', () => {
      const conditions: BranchCondition[] = [
        {
          type: 'answer_value',
          questionSlug: 'symptoms',
          answerValue: ['numbness', 'incontinence'],
        },
      ];
      const context = createContext({ symptoms: ['pain', 'numbness'] });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when required fields missing', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value' }, // Missing questionSlug and answerValue
      ];
      const context = createContext({ 'some-question': 'yes' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should handle numeric answer values (converted to string)', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'pain-level', answerValue: '8' },
      ];
      const context = createContext({ 'pain-level': 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });
  });

  describe('evaluateConditions - Unknown condition type', () => {
    it('should return false for unknown condition type', () => {
      const conditions = [{ type: 'unknown_type' as BranchCondition['type'] }];
      const context = createContext({ 'some-question': 'yes' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('refuses the removed score-based types and never matches one a stored rule carries', () => {
      const stored: BranchCondition[] = [
        // @ts-expect-error dimension_score is no longer a condition type
        { type: 'dimension_score', questionSlug: 'radiating-pain', answerValue: 'yes' },
        // @ts-expect-error aggregate is no longer a condition type
        { type: 'aggregate', questionSlug: 'radiating-pain', answerValue: 'yes' },
      ];
      const context = createContext({ 'radiating-pain': 'yes' });

      expect(stored.map((condition) => evaluateConditions([condition], context))).toEqual([
        false,
        false,
      ]);
    });
  });

  describe('evaluateConditions - Multiple conditions (AND logic)', () => {
    it('should match when all conditions pass', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'answer_value', questionSlug: 'pain-level', answerValue: ['7', '8'] },
      ];
      const context = createContext({ 'radiating-pain': 'yes', 'pain-level': 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when any condition fails', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'answer_value', questionSlug: 'pain-level', answerValue: ['7', '8'] },
      ];
      const context = createContext({ 'radiating-pain': 'no', 'pain-level': 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should not match when second condition fails', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'answer_value', questionSlug: 'pain-level', answerValue: ['7', '8'] },
      ];
      const context = createContext({ 'radiating-pain': 'yes', 'pain-level': 3 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });
  });
});
