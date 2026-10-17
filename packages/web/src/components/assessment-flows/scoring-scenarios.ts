import type { ScoringDryRunDimension, ScoringDryRunQuestion } from '@ffp/core';

import { MAX_TALLY_LEVELS, countWord, rankNames } from './scoring-labels';

export type ScenarioAnswers = Readonly<Record<string, string>>;

export interface ScoringScenario {
  id: string;
  label: string;
  answers: ScenarioAnswers;
}

export type ScenarioPlan =
  | {
      fits: true;
      tally: ScoringDryRunDimension;
      tallyScores: number[];
      scenarios: ScoringScenario[];
    }
  | { fits: false; reasons: string[] };

const MAX_SCENARIOS = 60;

const isScoredChoice = (question: ScoringDryRunQuestion): boolean =>
  question.type === 'single-choice' &&
  (question.options ?? []).length > 0 &&
  (question.options ?? []).every((option) => option.score !== undefined);

const optionScores = (question: ScoringDryRunQuestion): number[] =>
  [...new Set((question.options ?? []).map((option) => option.score ?? 0))].sort((a, b) => a - b);

const optionValueFor = (question: ScoringDryRunQuestion, score: number): string =>
  (question.options ?? []).find((option) => option.score === score)?.value ?? '';

const answerPatterns = (scores: number[], size: number): number[][] => {
  if (size === 0) {
    return [[]];
  }

  return scores.flatMap((score, index) =>
    answerPatterns(scores.slice(index), size - 1).map((rest) => [score, ...rest])
  );
};

const describePattern = (pattern: number[], scores: number[], dimensionName: string): string => {
  const names = rankNames(scores.length) ?? [];
  const counts = scores
    .map((score, rank) => ({
      name: names[rank],
      count: pattern.filter((answered) => answered === score).length,
    }))
    .filter(({ count }) => count > 0);
  const subject = dimensionName.toLowerCase();

  if (counts.length === 1) {
    return `All ${counts[0].name} ${subject}`;
  }

  const highest = Math.max(...counts.map(({ count }) => count));
  const leaders = counts.filter(({ count }) => count === highest);

  if (leaders.length > 1) {
    const split =
      counts.length === scores.length && highest === 1
        ? 'one of each'
        : counts.map(({ count, name }) => `${countWord(count)} ${name}`).join(' and ');

    return `Evenly mixed ${subject}, ${split}`;
  }

  const others = counts
    .filter(({ count }) => count !== highest)
    .map(({ count, name }) => `${countWord(count)} ${name}`)
    .join(' and ');

  return `Mostly ${leaders[0].name} ${subject}, ${others}`;
};

interface Band {
  question: ScoringDryRunQuestion;
  label: string;
  value: string;
}

const bandsOf = (dimension: ScoringDryRunDimension): Band[] => {
  const [question] = dimension.questions;
  const groups = new Map<number, string[]>();

  for (const option of question.options ?? []) {
    const score = option.score ?? 0;
    groups.set(score, [...(groups.get(score) ?? []), option.label]);
  }

  return [...groups.entries()].map(([score, labels]) => ({
    question,
    label: `${dimension.displayName} ${labels.length === 1 ? labels[0] : `${labels[0]} to ${labels.at(-1) ?? ''}`}`,
    value: optionValueFor(question, score),
  }));
};

const misfits = (dimensions: ScoringDryRunDimension[]): string[] => {
  const reasons: string[] = [];
  const tallies = dimensions.filter((dimension) => dimension.scoringMode === 'modal');

  if (tallies.length !== 1) {
    reasons.push(
      `Scenarios are built from one tally, a score taken from the most frequent answer to a set of questions. This flow’s scoring has ${countWord(tallies.length)}.`
    );
  }

  for (const dimension of dimensions) {
    if (dimension.unresolvedQuestionCount > 0) {
      reasons.push(
        `The ${dimension.displayName} score reads ${countWord(dimension.unresolvedQuestionCount)} question${dimension.unresolvedQuestionCount === 1 ? '' : 's'} this flow does not show, or that ${dimension.unresolvedQuestionCount === 1 ? 'is' : 'are'} inactive.`
      );
    }

    if (dimension.questions.length === 0) {
      reasons.push(`The ${dimension.displayName} score has no questions in this flow.`);
    }

    for (const question of dimension.questions.filter((each) => !isScoredChoice(each))) {
      reasons.push(
        `“${question.questionText}” is not a single-choice question with a score on every answer.`
      );
    }

    if (dimension.scoringMode !== 'modal' && dimension.questions.length > 1) {
      reasons.push(
        `The ${dimension.displayName} score reads ${countWord(dimension.questions.length)} questions; scenarios vary one question for each score beside the tally.`
      );
    }
  }

  const [tally] = tallies;

  if (tallies.length === 1 && tally.questions.every(isScoredChoice)) {
    const levels = tally.questions.map((question) => optionScores(question).join(','));

    if (new Set(levels).size > 1) {
      reasons.push(
        `The ${tally.displayName} questions do not all offer the same answer scores, so their answers cannot be counted against each other.`
      );
    } else if (tally.questions.length > 0) {
      const count = optionScores(tally.questions[0]).length;

      if (count < 2 || count > MAX_TALLY_LEVELS) {
        reasons.push(
          `The ${tally.displayName} questions offer ${countWord(count)} answer score${count === 1 ? '' : 's'}; scenarios are named for two or three.`
        );
      }
    }
  }

  return reasons;
};

export const planScenarios = (dimensions: ScoringDryRunDimension[]): ScenarioPlan => {
  const reasons = misfits(dimensions);

  if (reasons.length > 0) {
    return { fits: false, reasons };
  }

  const tally = dimensions.find((dimension) => dimension.scoringMode === 'modal');

  if (!tally) {
    return { fits: false, reasons: [] };
  }

  const tallyScores = optionScores(tally.questions[0]);
  const patterns = answerPatterns(tallyScores, tally.questions.length);
  const bandSets = dimensions
    .filter((dimension) => dimension !== tally)
    .map(bandsOf)
    .reduce<Band[][]>(
      (combinations, bands) =>
        combinations.flatMap((chosen) => bands.map((band) => [...chosen, band])),
      [[]]
    );

  if (patterns.length * bandSets.length > MAX_SCENARIOS) {
    return {
      fits: false,
      reasons: [
        `These questions combine into ${String(patterns.length * bandSets.length)} scenarios, too many to choose between.`,
      ],
    };
  }

  const scenarios = patterns.flatMap((pattern) =>
    bandSets.map((bands): ScoringScenario => {
      const answers: Record<string, string> = {};

      tally.questions.forEach((question, index) => {
        answers[question.publicId] = optionValueFor(question, pattern[index]);
      });

      for (const band of bands) {
        answers[band.question.publicId] = band.value;
      }

      return {
        id: [pattern.join('-'), ...bands.map((band) => band.value)].join('|'),
        label: [
          describePattern(pattern, tallyScores, tally.displayName),
          ...bands.map((band) => band.label),
        ].join(' · '),
        answers,
      };
    })
  );

  return { fits: true, tally, tallyScores, scenarios };
};

export const findScenario = (
  scenarios: ScoringScenario[],
  answers: ScenarioAnswers
): ScoringScenario | undefined => {
  const keys = Object.keys(answers);

  return scenarios.find(
    (scenario) =>
      Object.keys(scenario.answers).length === keys.length &&
      keys.every((key) => scenario.answers[key] === answers[key])
  );
};
