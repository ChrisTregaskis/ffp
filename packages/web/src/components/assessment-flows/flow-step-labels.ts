import { flowStepTypeSchema } from '@ffp/core';
import type { FlowStepType } from '@ffp/core';

import type { SelectOption } from '@web/components/select/types';

export const STEP_TYPE_LABELS: Record<FlowStepType, string> = {
  intro: 'Intro',
  questions: 'Questions',
  transition: 'Transition',
  'video-assessment': 'Movement check',
  results: 'Results',
  'programme-overview': 'Programme overview',
};

/** Shown beside the type picker. */
export const STEP_TYPE_DESCRIPTIONS: Record<FlowStepType, string> = {
  intro: 'A welcome screen setting out what the member is about to do.',
  questions: 'A set of questions drawn from an assessment template.',
  transition: 'A pause between sections, used for things to be aware of.',
  'video-assessment': 'Guided movements the member records, drawn from a template.',
  results: 'The member’s scores once the assessment is complete.',
  'programme-overview': 'A preview of the programme built from those results.',
};

export const TEMPLATE_LINKED_STEP_TYPES: FlowStepType[] = ['questions', 'video-assessment'];

export const stepTypeLinksTemplate = (type: FlowStepType): boolean =>
  TEMPLATE_LINKED_STEP_TYPES.includes(type);

/** In the order the schema declares them. */
export const STEP_TYPE_OPTIONS: SelectOption[] = flowStepTypeSchema.options.map((type) => ({
  value: type,
  label: STEP_TYPE_LABELS[type],
}));
