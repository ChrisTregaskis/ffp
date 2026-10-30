import type { DbQueryClient } from '@ffp/database';

import {
  findByTemplateIds,
  type TemplateQuestionWithConfig,
} from '../questions/question.repository';
import { findTemplateIdsOfSteps } from '../schemas/assessment-flow.schema';

import type { FlowStepWithConfig } from './flow.repository';

/**
 * The questions a flow asks: the active questions on the templates of its template-linked
 * steps. Pass the flow's active steps, as `findStepsByFlowId` returns them. A question on two
 * of those templates comes back once per template; rows are ordered by template id, then
 * display order.
 *
 * Scoring, the dry-run, answer validation, save-time branching, programme emphasis and the
 * admin's programme key areas all read the flow's questions here, so a change to the rule
 * lands once. The submit's safety gate deliberately reads every stored answer instead.
 */
export async function findActiveFlowQuestions(
  db: DbQueryClient,
  activeSteps: readonly FlowStepWithConfig[]
): Promise<TemplateQuestionWithConfig[]> {
  return await findByTemplateIds(db, [...new Set(findTemplateIdsOfSteps(activeSteps))]);
}

/**
 * The flow's questions once each, in step order, as the first step showing each presents it:
 * a question on two of the flow's templates keeps the first step's overrides. Answer
 * validation and the dry-run both hold answers to these rules.
 */
export function firstShownQuestions(
  activeSteps: readonly FlowStepWithConfig[],
  questions: readonly TemplateQuestionWithConfig[]
): TemplateQuestionWithConfig[] {
  const shown = new Map<string, TemplateQuestionWithConfig>();

  for (const templateId of new Set(findTemplateIdsOfSteps(activeSteps))) {
    for (const question of questions) {
      if (question.templateId === templateId && !shown.has(question.id)) {
        shown.set(question.id, question);
      }
    }
  }

  return [...shown.values()];
}
