import { describe, it, expect } from 'vitest';

import {
  isAnswerProvided,
  questionIdFromErrorPath,
  answerErrorPath,
  resolveEffectiveValidation,
  validateAnswer,
  type AnswerRuleQuestion,
} from '../../src/schemas/question-answer.schema';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

const codes = (
  question: AnswerRuleQuestion,
  value: Parameters<typeof validateAnswer>[1]
): string[] => validateAnswer(question, value).map((issue) => issue.code);

describe('isAnswerProvided', () => {
  it.each([
    [undefined, false],
    [null, false],
    ['', false],
    ['   ', false],
    [[], false],
    ['x', true],
    [0, true],
    [false, true],
    [['a'], true],
  ])('%j → %s', (value, expected) => {
    expect(isAnswerProvided(value)).toBe(expected);
  });
});

describe('validateAnswer', () => {
  describe('required', () => {
    const required: AnswerRuleQuestion = { type: 'multi-choice', options };

    it.each([[undefined], [null], [[]]])('treats %j as unanswered', (value) => {
      expect(codes(required, value)).toEqual(['required']);
    });

    it('treats blank text as unanswered', () => {
      expect(codes({ type: 'text' }, '  ')).toEqual(['required']);
    });

    it('lets an optional question stay empty', () => {
      expect(codes({ type: 'text', validation: { required: false } }, '')).toEqual([]);
      expect(codes({ ...required, validation: { required: false } }, [])).toEqual([]);
    });

    it('words the message for the member', () => {
      expect(validateAnswer(required, [])[0]?.message).toBe('Please answer this question.');
    });
  });

  describe('single-choice', () => {
    const question: AnswerRuleQuestion = { type: 'single-choice', options };

    it('accepts an offered option', () => {
      expect(codes(question, 'b')).toEqual([]);
    });

    it('rejects an option not offered', () => {
      expect(codes(question, 'z')).toEqual(['invalid_option']);
    });

    it('rejects the wrong type', () => {
      expect(codes(question, ['a'])).toEqual(['invalid_type']);
      expect(codes(question, 3)).toEqual(['invalid_type']);
    });
  });

  describe('multi-choice', () => {
    const question: AnswerRuleQuestion = {
      type: 'multi-choice',
      options,
      validation: { maxSelections: 2 },
    };

    it('accepts up to the cap', () => {
      expect(codes(question, ['a', 'c'])).toEqual([]);
    });

    it('rejects a selection over the cap', () => {
      expect(validateAnswer(question, ['a', 'b', 'c'])).toEqual([
        { code: 'too_many_selections', message: 'Choose up to 2 options.' },
      ]);
    });

    it('rejects an unknown or repeated option', () => {
      expect(codes(question, ['a', 'z'])).toEqual(['invalid_option']);
      expect(codes(question, ['a', 'a'])).toEqual(['invalid_option']);
    });

    it('rejects the wrong type', () => {
      expect(codes(question, 'a')).toEqual(['invalid_type']);
    });

    it('prefers the question’s custom message', () => {
      const custom = { ...question, validation: { maxSelections: 1, customError: 'Pick one.' } };

      expect(validateAnswer(custom, ['a', 'b'])[0]?.message).toBe('Pick one.');
    });
  });

  describe.each(['numeric', 'video-response'] as const)('%s', (type) => {
    const question: AnswerRuleQuestion = { type, validation: { min: 0, max: 300 } };

    it('accepts a number in range, including the bounds', () => {
      expect(codes(question, 0)).toEqual([]);
      expect(codes(question, 300)).toEqual([]);
    });

    it('rejects out of range', () => {
      expect(codes(question, -1)).toEqual(['too_small']);
      expect(codes(question, 301)).toEqual(['too_big']);
    });

    it('rejects the wrong type', () => {
      expect(codes(question, '12')).toEqual(['invalid_type']);
      expect(codes(question, true)).toEqual(['invalid_type']);
    });
  });

  describe('scale', () => {
    it('defaults to 1 to 10', () => {
      const question: AnswerRuleQuestion = { type: 'scale' };

      expect(codes(question, 1)).toEqual([]);
      expect(codes(question, 10)).toEqual([]);
      expect(codes(question, 0)).toEqual(['too_small']);
      expect(codes(question, 11)).toEqual(['too_big']);
    });

    it('uses the question’s own range', () => {
      const question: AnswerRuleQuestion = { type: 'scale', validation: { min: 0, max: 5 } };

      expect(codes(question, 0)).toEqual([]);
      expect(codes(question, 6)).toEqual(['too_big']);
    });

    it('rejects a value between the points', () => {
      expect(codes({ type: 'scale' }, 2.5)).toEqual(['invalid_type']);
    });
  });

  describe('text', () => {
    const question: AnswerRuleQuestion = { type: 'text', validation: { min: 3, max: 5 } };

    it('checks the length', () => {
      expect(codes(question, 'abcd')).toEqual([]);
      expect(codes(question, 'ab')).toEqual(['too_small']);
      expect(codes(question, 'abcdef')).toEqual(['too_big']);
    });

    it('rejects the wrong type', () => {
      expect(codes(question, 4)).toEqual(['invalid_type']);
    });
  });
});

describe('resolveEffectiveValidation', () => {
  it('lets a template override replace the question’s rules whole', () => {
    expect(
      resolveEffectiveValidation({
        validation: { required: true, maxSelections: 3 },
        configOverrides: { validation: { required: false } },
      })
    ).toEqual({ required: false });
  });

  it('falls back to the question’s rules, then to none', () => {
    expect(resolveEffectiveValidation({ validation: { max: 4 }, configOverrides: {} })).toEqual({
      max: 4,
    });
    expect(resolveEffectiveValidation({ validation: null, configOverrides: null })).toBeNull();
  });
});

describe('answer error paths', () => {
  const questionId = '550e8400-e29b-41d4-a716-446655440000';

  it('round-trips a question ID', () => {
    expect(questionIdFromErrorPath(answerErrorPath(questionId))).toBe(questionId);
  });

  it('reads a request parse failure under an answer', () => {
    expect(questionIdFromErrorPath(`answers.${questionId}.answerValue`)).toBe(questionId);
  });

  it('ignores a path outside the answers', () => {
    expect(questionIdFromErrorPath('currentStep')).toBeNull();
    expect(questionIdFromErrorPath('answers')).toBeNull();
  });
});
