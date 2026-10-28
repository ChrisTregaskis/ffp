import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { DbClient } from '@ffp/database';

import {
  findChangedAnswers,
  findSaveErrors,
  findSubmitErrors,
  loadFlowQuestions,
} from '../../src/assessments/answer-validation';
import * as questionRepository from '../../src/questions/question.repository';

import type { FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { TemplateQuestionWithConfig } from '../../src/questions/question.repository';

vi.mock('../../src/questions/question.repository');

const mockedQuestionRepo = vi.mocked(questionRepository);
const db = {} as DbClient;

const step = (
  type: FlowStepWithConfig['type'],
  templateId: string | null,
  order: number
): FlowStepWithConfig => ({
  id: randomUUID(),
  publicId: 'flowstep0001',
  flowId: randomUUID(),
  templateId,
  order,
  type,
  config: { title: type },
  nextStepRules: null,
  defaultNextStepId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const question = (
  id: string,
  templateId: string,
  overrides: Partial<TemplateQuestionWithConfig> = {}
): TemplateQuestionWithConfig => ({
  id,
  publicId: 'question0001',
  slug: `question-${id.slice(0, 8)}`,
  type: 'numeric',
  questionText: 'How many?',
  description: null,
  options: null,
  validation: { required: true, max: 10 },
  videoId: null,
  scoreDimension: null,
  isActive: true,
  displayOrder: 1,
  configOverrides: null,
  templateId,
  ...overrides,
});

describe('loadFlowQuestions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads the templates of template-linked steps, in step order', async () => {
    const first = randomUUID();
    const second = randomUUID();

    mockedQuestionRepo.findByTemplateIds.mockResolvedValue([]);

    await loadFlowQuestions(db, [
      step('intro', null, 1),
      step('questions', first, 2),
      step('video-assessment', second, 3),
      step('questions', first, 4),
    ]);

    expect(mockedQuestionRepo.findByTemplateIds).toHaveBeenCalledWith(db, [first, second]);
  });

  it('applies a template override', async () => {
    const templateId = randomUUID();
    const overridden = randomUUID();

    mockedQuestionRepo.findByTemplateIds.mockResolvedValue([
      question(overridden, templateId, { configOverrides: { validation: { max: 3 } } }),
    ]);

    const flowQuestions = await loadFlowQuestions(db, [step('questions', templateId, 1)]);

    expect(flowQuestions.get(overridden)?.rules.validation).toEqual({ max: 3 });
  });

  it('keeps the first step’s rules for a question two templates share, and lists both', async () => {
    const shared = randomUUID();
    const first = randomUUID();
    const second = randomUUID();

    // The repository orders by template ID, not by step
    mockedQuestionRepo.findByTemplateIds.mockResolvedValue([
      question(shared, second, { validation: { max: 99 } }),
      question(shared, first, { validation: { max: 1 } }),
    ]);

    const flowQuestions = await loadFlowQuestions(db, [
      step('questions', first, 1),
      step('questions', second, 2),
    ]);

    expect(flowQuestions.get(shared)).toEqual({
      templateIds: [first, second],
      rules: expect.objectContaining({ validation: { max: 1 } }) as unknown,
    });
  });
});

describe('findSubmitErrors', () => {
  const reached = randomUUID();
  const skipped = randomUUID();
  const flowQuestions = new Map([
    ['q-reached-1', { templateIds: [reached], rules: { type: 'numeric' as const } }],
    ['q-reached-2', { templateIds: [reached], rules: { type: 'numeric' as const } }],
    ['q-skipped', { templateIds: [skipped], rules: { type: 'numeric' as const } }],
  ]);

  it('requires only the templates the member reached', () => {
    const errors = findSubmitErrors(new Map([['q-reached-1', 2]]), new Map(), flowQuestions);

    expect(errors.map((error) => error.path)).toEqual(['answers.q-reached-2']);
  });

  it('ignores a stored answer to a question since removed from the flow', () => {
    const errors = findSubmitErrors(
      new Map<string, number>([
        ['q-reached-1', 1],
        ['q-reached-2', 1],
        ['q-removed', 1],
      ]),
      new Map(),
      flowQuestions
    );

    expect(errors).toEqual([]);
    expect(findSaveErrors(new Map([['q-removed', 1]]), flowQuestions)).toHaveLength(1);
  });
});

describe('findSubmitErrors with a shared question', () => {
  const skippedTemplate = randomUUID();
  const takenTemplate = randomUUID();
  const flowQuestions = new Map([
    [
      'q-shared',
      { templateIds: [skippedTemplate, takenTemplate], rules: { type: 'numeric' as const } },
    ],
    ['q-skipped-only', { templateIds: [skippedTemplate], rules: { type: 'numeric' as const } }],
    ['q-taken-only', { templateIds: [takenTemplate], rules: { type: 'numeric' as const } }],
  ]);

  it('does not let a shared answer mark a skipped template as reached', () => {
    const errors = findSubmitErrors(
      new Map([
        ['q-shared', 1],
        ['q-taken-only', 1],
      ]),
      new Map(),
      flowQuestions
    );

    expect(errors).toEqual([]);
  });

  it('still requires a shared question on a template the member reached', () => {
    const errors = findSubmitErrors(new Map([['q-taken-only', 1]]), new Map(), flowQuestions);

    expect(errors.map((error) => error.path)).toEqual(['answers.q-shared']);
  });
});

describe('findChangedAnswers', () => {
  it('drops answers sent back exactly as stored', () => {
    const changed = findChangedAnswers(
      new Map<string, string | string[]>([
        ['same-list', ['a', 'b']],
        ['same-text', 'x'],
        ['new', 'y'],
        ['edited', ['a']],
      ]),
      new Map<string, string | string[]>([
        ['same-list', ['a', 'b']],
        ['same-text', 'x'],
        ['edited', ['a', 'b']],
      ])
    );

    expect([...changed.keys()]).toEqual(['new', 'edited']);
  });
});

describe('findSubmitErrors with a blank answer', () => {
  const emptied = randomUUID();
  const flowQuestions = new Map([
    [
      'q-emptied',
      {
        templateIds: [emptied],
        rules: { type: 'multi-choice' as const, validation: { required: false } },
      },
    ],
    ['q-other', { templateIds: [emptied], rules: { type: 'numeric' as const } }],
  ]);

  it('does not count a blank answer as reaching its template', () => {
    expect(findSubmitErrors(new Map(), new Map([['q-emptied', []]]), flowQuestions)).toEqual([]);
  });
});
