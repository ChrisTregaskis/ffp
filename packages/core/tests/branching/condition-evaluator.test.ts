/**
 * Unit tests for condition-evaluator
 *
 * Tests the evaluation logic for branch conditions including:
 * - answer_value conditions (string matching)
 * - dimension_score conditions (numeric comparisons)
 * - aggregate conditions (reserved for future)
 *
 * @module tests/branching/condition-evaluator.test
 */

import { describe, it, expect } from 'vitest';

import type { BranchCondition, ScoreDimension } from '@ffp/database';

import { evaluateConditions, type BranchEvaluationContext } from '../../src/assessments/branching';

describe('Condition Evaluator', () => {
  /**
   * Helper to create a minimal evaluation context
   */
  function createContext(
    answers: Record<string, string | string[] | number>,
    dimensionScores?: Partial<Record<ScoreDimension, number>>
  ): BranchEvaluationContext {
    return {
      currentStepId: '55555555-5555-5555-8555-555555550001',
      allSteps: [],
      answers: new Map(Object.entries(answers)),
      dimensionScores: dimensionScores
        ? new Map(Object.entries(dimensionScores) as [ScoreDimension, number][])
        : undefined,
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

  describe('evaluateConditions - dimension_score type', () => {
    it('should match when score is less than threshold (lt)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'strength', operator: 'lt', value: 20 },
      ];
      const context = createContext({}, { strength: 15 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when score equals threshold (lt)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'strength', operator: 'lt', value: 20 },
      ];
      const context = createContext({}, { strength: 20 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should match when score equals threshold (lte)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'strength', operator: 'lte', value: 20 },
      ];
      const context = createContext({}, { strength: 20 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should match when score exceeds threshold (gt)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'pain', operator: 'gt', value: 5 },
      ];
      const context = createContext({}, { pain: 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should match when score equals threshold (gte)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'balance', operator: 'gte', value: 10 },
      ];
      const context = createContext({}, { balance: 10 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should match exact score (eq)', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'general', operator: 'eq', value: 5 },
      ];
      const context = createContext({}, { general: 5 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when dimension scores not provided', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'strength', operator: 'lt', value: 20 },
      ];
      const context = createContext({});

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should not match when specific dimension not scored', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score', dimension: 'strength', operator: 'lt', value: 20 },
      ];
      const context = createContext({}, { pain: 5 }); // No strength score

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should not match when required fields missing', () => {
      const conditions: BranchCondition[] = [
        { type: 'dimension_score' }, // Missing dimension, operator, value
      ];
      const context = createContext({}, { strength: 15 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });
  });

  describe('evaluateConditions - aggregate type', () => {
    it('should return false (not implemented)', () => {
      const conditions: BranchCondition[] = [{ type: 'aggregate', operator: 'gt', value: 50 }];
      const context = createContext({}, { strength: 30, balance: 25 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });
  });

  describe('evaluateConditions - Unknown condition type', () => {
    it('should return false for unknown condition type', () => {
      const conditions = [{ type: 'unknown_type' as BranchCondition['type'] }];
      const context = createContext({ 'some-question': 'yes' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });
  });

  describe('evaluateConditions - Multiple conditions (AND logic)', () => {
    it('should match when all conditions pass', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'dimension_score', dimension: 'pain', operator: 'gt', value: 5 },
      ];
      const context = createContext({ 'radiating-pain': 'yes' }, { pain: 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when any condition fails', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'dimension_score', dimension: 'pain', operator: 'gt', value: 5 },
      ];
      const context = createContext({ 'radiating-pain': 'no' }, { pain: 8 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should not match when second condition fails', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
        { type: 'dimension_score', dimension: 'pain', operator: 'gt', value: 5 },
      ];
      const context = createContext({ 'radiating-pain': 'yes' }, { pain: 3 });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });
  });

  describe('evaluateConditions - Red flag screening scenarios', () => {
    it('should match radiating pain red flag', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
      ];
      const context = createContext({ 'radiating-pain': 'yes' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should not match when user answers no to red flag', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' },
      ];
      const context = createContext({ 'radiating-pain': 'no' });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should match incontinence red flag', () => {
      const conditions: BranchCondition[] = [
        { type: 'answer_value', questionSlug: 'incontinence', answerValue: 'yes' },
      ];
      const context = createContext({
        'radiating-pain': 'no',
        'numbness-tingling': 'no',
        incontinence: 'yes',
      });

      const result = evaluateConditions(conditions, context);

      expect(result).toBe(true);
    });
  });
});
