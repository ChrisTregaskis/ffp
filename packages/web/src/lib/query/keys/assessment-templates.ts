import { createEntityKeys } from './create-entity-keys';

const entityKeys = createEntityKeys('assessment-templates');

/**
 * Query keys for the assessment template admin surface. Separate from
 * `assessmentFlowKeys`; a flow or step write refreshes templates through
 * `invalidateTemplateUsage`, because a template carries the flows using it.
 *
 * `catalogue` (every template, for resolving a step's link) and `assignable`
 * (the questions a template can still take) sit under `lists()`, so any write
 * that refreshes the lists refreshes them too.
 */
export const assessmentTemplateKeys = {
  ...entityKeys,
  catalogue: () => [...entityKeys.lists(), 'catalogue'] as const,
  assignable: (publicId: string) => [...entityKeys.lists(), 'assignable', publicId] as const,
};
