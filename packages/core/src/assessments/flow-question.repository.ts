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
 * Scoring, the dry-run, answer validation, save-time branching and programme emphasis all
 * read the flow's questions here, so a change to the rule lands once. The submit's safety
 * gate deliberately reads every stored answer instead.
 */
export async function findActiveFlowQuestions(
  db: DbQueryClient,
  activeSteps: readonly FlowStepWithConfig[]
): Promise<TemplateQuestionWithConfig[]> {
  return await findByTemplateIds(db, [...new Set(findTemplateIdsOfSteps(activeSteps))]);
}
