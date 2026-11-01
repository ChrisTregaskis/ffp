import type { CreatePhaseRequest, TemplatePhaseWithSessions, UpdatePhaseRequest } from '@ffp/core';

import type { PhaseFormValues } from './PhaseForm';

type StoredPhase = Pick<TemplatePhaseWithSessions, 'name' | 'description'>;

export const phaseToFormValues = (phase: StoredPhase): PhaseFormValues => ({
  name: phase.name ?? '',
  description: phase.description ?? '',
});

/** A blank field is stored as null */
export const toCreatePhaseRequest = (values: PhaseFormValues): CreatePhaseRequest => ({
  name: values.name || null,
  description: values.description || null,
});

/** Only the fields that differ from the stored phase; an empty object means nothing changed. */
export const toUpdatePhaseRequest = (
  values: PhaseFormValues,
  phase: StoredPhase
): UpdatePhaseRequest => {
  const fields = toCreatePhaseRequest(values);
  const payload: UpdatePhaseRequest = {};

  if (fields.name !== phase.name) {
    payload.name = fields.name;
  }

  if (fields.description !== phase.description) {
    payload.description = fields.description;
  }

  return payload;
};
