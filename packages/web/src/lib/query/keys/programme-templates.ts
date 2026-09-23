import { createEntityKeys } from './create-entity-keys';

const base = createEntityKeys('programme-templates');

export const programmeTemplateKeys = {
  ...base,
  sessionExercises: () => [...base.all, 'session-exercises'] as const,
  sessionExerciseList: (sessionId: string) =>
    [...programmeTemplateKeys.sessionExercises(), sessionId] as const,
};
