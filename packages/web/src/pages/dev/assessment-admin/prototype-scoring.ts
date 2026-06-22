/**
 * A faithful, prototype-local re-implementation of the real scoring engine
 * (packages/core/src/assessments/scoring). Pure functions — used to power the
 * Test panel's live simulation and the static coverage check.
 *
 * Rules mirrored from the engine:
 *  - single-choice → selected option's score; multi-choice → sum of selected scores
 *  - numeric / scale → the entered number (clamped ≥ 0); text / video-response → 0
 *  - dimension rawScore = Σ question scores; normalised = round(raw / maxScore × 100)
 *  - programme-mapping conditions compare the RAW score; riskThresholds band the NORMALISED %
 */
import { DIMENSION_LABELS } from './prototype-labels';

import type {
  ComparisonOperator,
  DimensionConfig,
  ProgrammeMappingCondition,
  PrototypeQuestion,
  ScoringConfig,
} from './prototype-types';

/** A sample answer for one question (single-choice value, multi values, or a number). */
export type SampleAnswer = string | number | string[];
export type SampleAnswers = Record<string, SampleAnswer>;

export type ScoreBand = 'strong' | 'building' | 'support';

export interface DimensionResult {
  name: string;
  label: string;
  rawScore: number;
  /** The most the dimension's questions could actually score */
  maxRaw: number;
  maxScore: number;
  normalised: number;
  band: ScoreBand;
}

export interface ConditionResult extends ProgrammeMappingCondition {
  actual: number;
  pass: boolean;
}

export interface MappingResult {
  index: number;
  programmeTemplateId: string;
  operator: 'and' | 'or';
  priority: number;
  conditions: ConditionResult[];
  matched: boolean;
}

export interface SimulationResult {
  dimensions: DimensionResult[];
  mappings: MappingResult[];
  /** Index into config.programmeMappings of the winning rule, or null for the default */
  winnerIndex: number | null;
  programmeTemplateId: string | null;
}

/** The most a single question can contribute to a dimension. */
export const questionMaxScore = (question: PrototypeQuestion): number => {
  switch (question.type) {
    case 'single-choice':
      return Math.max(0, ...(question.options ?? []).map((option) => option.score ?? 0));
    case 'multi-choice':
      return (question.options ?? []).reduce(
        (sum, option) => sum + Math.max(0, option.score ?? 0),
        0
      );
    case 'numeric':
    case 'scale':
      return question.validation?.max ?? 0;
    default:
      return 0; // text, video-response
  }
};

/** The score a single answer earns for its question. */
export const scoreQuestion = (
  question: PrototypeQuestion,
  answer: SampleAnswer | undefined
): number => {
  if (answer === undefined) {
    return 0;
  }

  switch (question.type) {
    case 'single-choice': {
      if (typeof answer !== 'string') {
        return 0;
      }

      return question.options?.find((option) => option.value === answer)?.score ?? 0;
    }
    case 'multi-choice': {
      if (!Array.isArray(answer)) {
        return 0;
      }

      return answer.reduce(
        (sum, value) => sum + (question.options?.find((o) => o.value === value)?.score ?? 0),
        0
      );
    }
    case 'numeric':
    case 'scale':
      return typeof answer === 'number' ? Math.max(0, answer) : 0;
    default:
      return 0; // text, video-response
  }
};

const bandFor = (normalised: number, thresholds?: { low: number; moderate: number }): ScoreBand => {
  const low = thresholds?.low ?? 70;
  const moderate = thresholds?.moderate ?? 40;

  if (normalised >= low) {
    return 'strong';
  }

  if (normalised >= moderate) {
    return 'building';
  }

  return 'support';
};

const compare = (actual: number, operator: ComparisonOperator, value: number): boolean => {
  switch (operator) {
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'eq':
      return actual === value;
    default:
      return false;
  }
};

const dimensionMaxRaw = (dimension: DimensionConfig, questions: PrototypeQuestion[]): number =>
  dimension.questionIds.reduce((sum, id) => {
    const question = questions.find((q) => q.id === id);

    return sum + (question ? questionMaxScore(question) : 0);
  }, 0);

/** Run the full scoring pipeline for a set of sample answers. */
export const simulateScoring = (
  config: ScoringConfig,
  questions: PrototypeQuestion[],
  answers: SampleAnswers
): SimulationResult => {
  const dimensions: DimensionResult[] = config.dimensions.map((dimension) => {
    const rawScore = dimension.questionIds.reduce((sum, id) => {
      const question = questions.find((q) => q.id === id);

      return sum + (question ? scoreQuestion(question, answers[id]) : 0);
    }, 0);
    const normalised =
      dimension.maxScore > 0 ? Math.round((rawScore / dimension.maxScore) * 100) : 0;

    return {
      name: dimension.name,
      label: DIMENSION_LABELS[dimension.name],
      rawScore,
      maxRaw: dimensionMaxRaw(dimension, questions),
      maxScore: dimension.maxScore,
      normalised,
      band: bandFor(normalised, dimension.riskThresholds),
    };
  });

  const rawByDimension = new Map(dimensions.map((d) => [d.name, d.rawScore]));

  const mappings: MappingResult[] = config.programmeMappings.map((mapping, index) => {
    const operator = mapping.operator ?? 'and';
    const conditions: ConditionResult[] = mapping.conditions.map((condition) => {
      const actual = rawByDimension.get(condition.dimension) ?? 0;

      return { ...condition, actual, pass: compare(actual, condition.operator, condition.value) };
    });
    const matched =
      conditions.length > 0 &&
      (operator === 'and' ? conditions.every((c) => c.pass) : conditions.some((c) => c.pass));

    return {
      index,
      programmeTemplateId: mapping.programmeTemplateId,
      operator,
      priority: mapping.priority ?? index + 1,
      conditions,
      matched,
    };
  });

  // Lowest priority number wins; first match in that order.
  const winner = [...mappings].sort((a, b) => a.priority - b.priority).find((m) => m.matched);

  return {
    dimensions,
    mappings,
    winnerIndex: winner?.index ?? null,
    programmeTemplateId: winner?.programmeTemplateId ?? null,
  };
};

export type CoverageSeverity = 'warning' | 'info';

export interface CoverageIssue {
  severity: CoverageSeverity;
  message: string;
  /** Mapping index the issue relates to, if any (for jump-to) */
  mappingIndex?: number;
}

/** Static analysis of the config — flags unreachable rules and dead dimensions. */
export const checkCoverage = (
  config: ScoringConfig,
  questions: PrototypeQuestion[],
  programmeLabels: Map<string, string>
): CoverageIssue[] => {
  const issues: CoverageIssue[] = [];
  const maxRawByName = new Map(
    config.dimensions.map((d) => [d.name, dimensionMaxRaw(d, questions)])
  );

  // Dimensions that can only ever score 0
  for (const dimension of config.dimensions) {
    if ((maxRawByName.get(dimension.name) ?? 0) === 0) {
      issues.push({
        severity: 'warning',
        message: `“${DIMENSION_LABELS[dimension.name]}” can only score 0 — it has no scored questions.`,
      });
    }
  }

  // Conditions that can never be satisfied within a dimension's raw range [0, maxRaw]
  const conditionReachable = (condition: ProgrammeMappingCondition): boolean => {
    const maxRaw = maxRawByName.get(condition.dimension);

    if (maxRaw === undefined) {
      return false;
    } // dimension not scored in this flow

    switch (condition.operator) {
      case 'lt':
        return condition.value > 0;
      case 'lte':
        return condition.value >= 0;
      case 'gt':
        return condition.value < maxRaw;
      case 'gte':
        return condition.value <= maxRaw;
      case 'eq':
        return condition.value >= 0 && condition.value <= maxRaw;
      default:
        return false;
    }
  };

  config.programmeMappings.forEach((mapping, index) => {
    for (const condition of mapping.conditions) {
      const maxRaw = maxRawByName.get(condition.dimension);

      if (maxRaw === undefined) {
        issues.push({
          severity: 'warning',
          mappingIndex: index,
          message: `Rule ${String(index + 1)} checks “${DIMENSION_LABELS[condition.dimension]}”, which isn’t scored in this flow — it will never match.`,
        });
      } else if (!conditionReachable(condition)) {
        issues.push({
          severity: 'warning',
          mappingIndex: index,
          message: `Rule ${String(index + 1)} can never match: needs ${DIMENSION_LABELS[condition.dimension]} ${condition.operator} ${String(condition.value)}, but it only ranges 0–${String(maxRaw)}.`,
        });
      }
    }
  });

  // Programmes in the picker that no rule ever recommends
  const usedProgrammes = new Set(config.programmeMappings.map((m) => m.programmeTemplateId));
  for (const [slug, label] of programmeLabels) {
    if (!usedProgrammes.has(slug)) {
      issues.push({
        severity: 'info',
        message: `“${label}” isn’t recommended by any rule${
          slug.includes('default') ? ' (it’s the fallback, so that’s fine)' : '.'
        }`,
      });
    }
  }

  return issues;
};

export type PresetMode = 'min' | 'moderate' | 'max' | 'random';

const buildPresetAnswers = (
  config: ScoringConfig,
  questions: PrototypeQuestion[],
  mode: PresetMode
): SampleAnswers => {
  const answers: SampleAnswers = {};
  for (const question of scoredQuestions(config, questions)) {
    answers[question.id] = presetAnswer(question, mode);
  }

  return answers;
};

/** Lowest-scoring sample answers. */
export const buildMinAnswers = (
  config: ScoringConfig,
  questions: PrototypeQuestion[]
): SampleAnswers => buildPresetAnswers(config, questions, 'min');

/** Mid-scoring sample answers. */
export const buildModerateAnswers = (
  config: ScoringConfig,
  questions: PrototypeQuestion[]
): SampleAnswers => buildPresetAnswers(config, questions, 'moderate');

/** Highest-scoring sample answers. */
export const buildMaxAnswers = (
  config: ScoringConfig,
  questions: PrototypeQuestion[]
): SampleAnswers => buildPresetAnswers(config, questions, 'max');

/** Randomised sample answers. */
export const buildRandomAnswers = (
  config: ScoringConfig,
  questions: PrototypeQuestion[]
): SampleAnswers => buildPresetAnswers(config, questions, 'random');

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const presetAnswer = (question: PrototypeQuestion, mode: PresetMode): SampleAnswer => {
  switch (question.type) {
    case 'single-choice': {
      const options = question.options ?? [];

      if (options.length === 0) {
        return '';
      }

      const sorted = [...options].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
      switch (mode) {
        case 'min':
          return sorted[0].value;
        case 'max':
          return sorted[sorted.length - 1].value;
        case 'moderate':
          return sorted[Math.floor((sorted.length - 1) / 2)].value;
        default:
          return options[randomInt(0, options.length - 1)].value;
      }
    }
    case 'multi-choice': {
      const options = question.options ?? [];
      switch (mode) {
        case 'min':
          return [];
        case 'max':
          return options.map((o) => o.value);
        case 'moderate':
          return options.slice(0, Math.ceil(options.length / 2)).map((o) => o.value);
        default:
          return options.filter(() => Math.random() < 0.5).map((o) => o.value);
      }
    }
    case 'numeric':
    case 'scale': {
      const min = question.validation?.min ?? 0;
      const max = question.validation?.max ?? 10;
      switch (mode) {
        case 'min':
          return min;
        case 'max':
          return max;
        case 'moderate':
          return Math.round((min + max) / 2);
        default:
          return randomInt(min, max);
      }
    }
    default:
      return '';
  }
};

/** The questions that actually feed any scoring dimension (deduped, in config order). */
export const scoredQuestions = (
  config: ScoringConfig,
  questions: PrototypeQuestion[]
): PrototypeQuestion[] => {
  const ids = new Set<string>();
  for (const dimension of config.dimensions) {
    for (const id of dimension.questionIds) {
      ids.add(id);
    }
  }

  return [...ids]
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is PrototypeQuestion => Boolean(q));
};
