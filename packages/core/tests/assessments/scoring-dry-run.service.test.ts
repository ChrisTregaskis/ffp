import { randomUUID } from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type * as ffpDatabase from '@ffp/database';
import {
  AGE_BRACKET_OPTIONS,
  LEVEL_PROGRAMME_SLUGS,
  LEVEL_QUESTION_IDS,
  LEVEL_SCORING_CONFIG,
} from '@ffp/database/constants';

import * as flowRepository from '../../src/assessments/flow.repository';
import { dryRunFlowScoringService } from '../../src/assessments/scoring-dry-run.service';
import { NotFoundError, ValidationError } from '../../src/lib/errors';
import * as programmeTemplateRepository from '../../src/programme-templates/programme-template.repository';
import * as questionRepository from '../../src/questions/question.repository';
import { createAbcQuestion, createQuestion } from '../scoring/scoring-fixtures';

import type { AssessmentFlow } from '../../src/assessments/flow.repository';
import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { TemplateQuestionWithConfig } from '../../src/questions/question.repository';

type FFPDatabaseModule = typeof ffpDatabase;
type QuestionWithConfig = ffpDatabase.QuestionWithConfig;

vi.mock('../../src/assessments/flow.repository');
vi.mock('../../src/questions/question.repository');
vi.mock('../../src/programme-templates/programme-template.repository');
vi.mock('@ffp/database', async (importOriginal) => {
  const actual = await importOriginal<FFPDatabaseModule>();

  return {
    ...actual,
    getDb: vi.fn(() => ({}) as unknown as ReturnType<FFPDatabaseModule['getDb']>),
  };
});

const mockedFlowRepo = vi.mocked(flowRepository);
const mockedQuestionRepo = vi.mocked(questionRepository);
const mockedProgrammeRepo = vi.mocked(programmeTemplateRepository);

const FLOW_PUBLIC_ID = 'flowABCDE123';
const TEMPLATE_ID = randomUUID();

const createContext = (): OrganisationContext => ({
  actor: {
    type: 'user',
    userId: randomUUID(),
    userRole: 'system_admin',
    email: 'admin@example.com',
  } as UserActor,
  organisationId: randomUUID(),
  locationId: randomUUID(),
  requestId: randomUUID(),
  timestamp: new Date(),
});

const createFlow = (scoringConfig: AssessmentFlow['scoringConfig']): AssessmentFlow =>
  ({
    id: randomUUID(),
    publicId: FLOW_PUBLIC_ID,
    name: 'Wellness check',
    scoringConfig,
  }) as AssessmentFlow;

const inTemplate = (question: QuestionWithConfig): TemplateQuestionWithConfig => ({
  ...question,
  templateId: TEMPLATE_ID,
});

const ACTIVITY = [
  LEVEL_QUESTION_IDS.weeklyActivity,
  LEVEL_QUESTION_IDS.exerciseTolerance,
  LEVEL_QUESTION_IDS.jointComfort,
].map((id) => inTemplate(createAbcQuestion(id)));
const AGE = inTemplate(
  createQuestion(LEVEL_QUESTION_IDS.ageBracket, 'single-choice', AGE_BRACKET_OPTIONS)
);

const answer = (
  question: { publicId: string },
  answerValue: string
): { questionPublicId: string; answerValue: string } => ({
  questionPublicId: question.publicId,
  answerValue,
});

describe('dryRunFlowScoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFlowRepo.findStepsByFlowId.mockResolvedValue([
      { type: 'questions', templateId: TEMPLATE_ID },
    ] as Awaited<ReturnType<typeof flowRepository.findStepsByFlowId>>);
    mockedQuestionRepo.findByTemplateIds.mockResolvedValue([...ACTIVITY, AGE]);
    mockedProgrammeRepo.findTemplateNamesBySlugs.mockResolvedValue([
      { slug: LEVEL_PROGRAMME_SLUGS[1], name: 'Level 1: Gentle Mobility', isActive: true },
      { slug: LEVEL_PROGRAMME_SLUGS[2], name: 'Level 2: Active Wellness', isActive: false },
    ]);
  });

  it('scores publicId-keyed answers and names the row that matched', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));

    const result = await dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
      answers: [answer(ACTIVITY[0], 'A'), answer(ACTIVITY[1], 'A'), answer(ACTIVITY[2], 'C')],
    });

    if (!result.scorable) {
      throw new Error('expected a scorable result');
    }

    // Mostly A with the age unanswered: no row can hold on age, so nothing matches
    expect(result.result.matchedMappingIndex).toBeNull();
    expect(result.result.scores.find((score) => score.dimensionId === 'age')?.answeredCount).toBe(
      0
    );

    const withAge = await dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
      answers: [
        answer(ACTIVITY[0], 'A'),
        answer(ACTIVITY[1], 'A'),
        answer(ACTIVITY[2], 'C'),
        answer(AGE, '46-55'),
      ],
    });

    if (!withAge.scorable) {
      throw new Error('expected a scorable result');
    }

    expect(withAge.result.matchedMappingIndex).toBe(0);
    expect(withAge.result.recommendedProgrammeSlug).toBe(LEVEL_PROGRAMME_SLUGS[1]);
    expect(withAge.mappings[0]).toMatchObject({
      level: 1,
      programmeName: 'Level 1: Gentle Mobility',
    });
    // A deactivated template is named but flagged; a slug no template carries has neither
    expect(withAge.mappings[1]).toMatchObject({ programmeActive: false });
    expect(withAge.mappings[5]).toMatchObject({ programmeActive: null });
    expect(withAge.mappings[5]).toMatchObject({ level: 3, programmeName: null });
  });

  it('returns the dimensions from the flow config with the questions the flow shows', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));
    mockedQuestionRepo.findByTemplateIds.mockResolvedValue([ACTIVITY[0], ACTIVITY[1], AGE]);

    const result = await dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, { answers: [] });

    if (!result.scorable) {
      throw new Error('expected a scorable result');
    }

    expect(result.dimensions.map((dimension) => dimension.name)).toEqual(['activity', 'age']);
    expect(result.dimensions[0]).toMatchObject({
      scoringMode: 'modal',
      affectsRiskLevel: false,
      unresolvedQuestionCount: 1,
    });
    expect(result.dimensions[0].questions.map((question) => question.publicId)).toEqual([
      ACTIVITY[0].publicId,
      ACTIVITY[1].publicId,
    ]);
  });

  it.each<[string, AssessmentFlow['scoringConfig']]>([
    ['no-config', null],
    ['no-dimensions', { dimensions: [], programmeMappings: [] }],
  ])('reports a flow with %s as not scorable', async (reason, scoringConfig) => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(scoringConfig));

    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, { answers: [] })
    ).resolves.toEqual({ scorable: false, reason });
    expect(mockedQuestionRepo.findByTemplateIds).not.toHaveBeenCalled();
  });

  it('refuses an answer to a question the flow does not show', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));

    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
        answers: [{ questionPublicId: 'notInFlow123', answerValue: 'A' }],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('treats a blank answer as no answer, as a member save does', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));

    const result = await dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
      answers: [answer(AGE, '')],
    });

    if (!result.scorable) {
      throw new Error('expected a scorable result');
    }

    expect(result.result.scores.find((score) => score.dimensionId === 'age')?.answeredCount).toBe(
      0
    );
  });

  it('refuses an answer outside its question’s options', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));

    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
        answers: [answer(ACTIVITY[0], 'D')],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('refuses the same question answered twice', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(createFlow(LEVEL_SCORING_CONFIG));

    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, {
        answers: [answer(ACTIVITY[0], 'A'), answer(ACTIVITY[0], 'C')],
      })
    ).rejects.toThrow('Answered question IDs must be unique');
  });

  it('refuses a malformed body before reading the flow', async () => {
    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, { answers: 'A,A,C' })
    ).rejects.toThrow(ValidationError);
    expect(mockedFlowRepo.findByPublicId).not.toHaveBeenCalled();
  });

  it('throws NotFoundError for an unknown flow', async () => {
    mockedFlowRepo.findByPublicId.mockResolvedValue(null);

    await expect(
      dryRunFlowScoringService(createContext(), FLOW_PUBLIC_ID, { answers: [] })
    ).rejects.toThrow(NotFoundError);
  });
});
