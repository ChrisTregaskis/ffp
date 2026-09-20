import type { AdminFlowStepView, CreateFlowStepInput, FlowStepType } from '@ffp/core';

import { stepTypeLinksTemplate } from './flow-step-labels';

/** All strings — form inputs hold strings, so conversion happens on the way out. */
export interface FlowStepFormValues {
  type: FlowStepType;
  title: string;
  description: string;
  estimatedMinutes: string;
  /** One instruction per line */
  instructions: string;
  /** One note per line */
  safetyNotes: string;
  /** Assessment template UUID — empty when the type takes no template */
  templateId: string;
}

export const EMPTY_FLOW_STEP_VALUES: FlowStepFormValues = {
  type: 'intro',
  title: '',
  description: '',
  estimatedMinutes: '',
  instructions: '',
  safetyNotes: '',
  templateId: '',
};

const listToLines = (items: string[] | undefined): string => (items ?? []).join('\n');

/** Blank lines are formatting, not content. */
const linesToList = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export const stepToFormValues = (step: AdminFlowStepView): FlowStepFormValues => ({
  type: step.type,
  title: step.config.title,
  description: step.config.description ?? '',
  estimatedMinutes:
    step.config.estimatedMinutes === undefined ? '' : String(step.config.estimatedMinutes),
  instructions: listToLines(step.config.instructions),
  safetyNotes: listToLines(step.config.safetyNotes),
  templateId: step.templateId ?? '',
});

/**
 * `config` is replaced wholesale on update, so an omitted field clears it.
 * `templateId` is not: an omitted key leaves the column alone, so switching to
 * a type that takes no template leaves the old link on the row. It is only
 * read back for the types that link one.
 */
export const formValuesToStepInput = (values: FlowStepFormValues): CreateFlowStepInput => {
  const minutes = Number.parseInt(values.estimatedMinutes, 10);
  const description = values.description.trim();
  const instructions = linesToList(values.instructions);
  const safetyNotes = linesToList(values.safetyNotes);
  const templateId = values.templateId.trim();

  return {
    type: values.type,
    templateId: stepTypeLinksTemplate(values.type) && templateId ? templateId : undefined,
    config: {
      title: values.title.trim(),
      description: description || undefined,
      instructions: instructions.length > 0 ? instructions : undefined,
      safetyNotes: safetyNotes.length > 0 ? safetyNotes : undefined,
      estimatedMinutes: Number.isNaN(minutes) ? undefined : minutes,
    },
  };
};
