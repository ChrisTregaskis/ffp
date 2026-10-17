import type { AnswerValue, FlowStepRecord, WarningType } from '@ffp/database';

import { createEvaluationContext, evaluateNextStep, type BranchingAnswers } from './branching';

import type { AssessmentSafetyTrigger } from './safety-trigger.repository';
import type { UserAssessment } from './user-assessment.repository';
import type { SafetyGate } from '../schemas/user-assessment/user-assessment.schema';

/** A warning of this type holds the member's result until they confirm they have acted on it */
export const SAFETY_GATE_WARNING_TYPE: WarningType = 'seek_medical';

export interface SafetyTriggerFinding {
  questionSlug: string | null;
  selectedOptions: string[];
  warningMessage: string;
}

/**
 * Run the flow's branching rules over a complete answer set and return the first
 * safety warning they raise, or null. The member's last step is submitted rather
 * than saved, so its rules are evaluated here rather than by a save. Every active
 * step's rules see every stored answer, including one left on a branch the member
 * backed out of, and only the first warning's advice is kept: both hold while a flow
 * carries a single safety rule on a step every member passes.
 */
export function findSafetyTrigger(
  steps: FlowStepRecord[],
  answers: BranchingAnswers
): SafetyTriggerFinding | null {
  const answersBySlug = new Map(answers.map((answer) => [answer.questionSlug, answer.value]));

  for (const step of steps) {
    if (!step.nextStepRules || step.nextStepRules.length === 0) {
      continue;
    }

    const { warnings } = evaluateNextStep(step, createEvaluationContext(step.id, steps, answers));
    const warning = warnings.find(({ type }) => type === SAFETY_GATE_WARNING_TYPE);

    if (warning) {
      const questionSlug = warning.triggeredBy ?? null;

      return {
        questionSlug,
        selectedOptions: questionSlug
          ? findWarnedOptions(step, questionSlug, answersBySlug.get(questionSlug))
          : [],
        warningMessage: warning.message,
      };
    }
  }

  return null;
}

/** The member's chosen options that the step's safety rules name: a "none" ticked alongside is left out */
function findWarnedOptions(
  step: FlowStepRecord,
  questionSlug: string,
  answer: AnswerValue | undefined
): string[] {
  if (answer === undefined) {
    return [];
  }

  const warnedValues = new Set(
    (step.nextStepRules ?? [])
      .filter(({ action }) => action.warningType === SAFETY_GATE_WARNING_TYPE)
      .flatMap(({ conditions }) => conditions)
      .filter((condition) => condition.questionSlug === questionSlug)
      .flatMap(({ answerValue }) => (answerValue === undefined ? [] : [answerValue].flat()))
  );

  return [answer]
    .flat()
    .map(String)
    .filter((value) => warnedValues.has(value));
}

export function toSafetyGate(
  trigger: AssessmentSafetyTrigger | null,
  assessment: Pick<UserAssessment, 'safetyAcknowledgedAt'>
): SafetyGate {
  return {
    required: trigger !== null,
    acknowledgedAt: assessment.safetyAcknowledgedAt?.toISOString() ?? null,
    advice: trigger?.warningMessage ?? null,
  };
}
