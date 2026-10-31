import type {
  CreateSessionRequest,
  TemplatePhaseWithSessions,
  UpdateSessionRequest,
} from '@ffp/core';

import { fieldToNumber, numberToField } from '@web/utils/form-number';

import type { SessionFormValues } from './SessionForm';

type StoredSession = TemplatePhaseWithSessions['sessions'][number];

export const sessionToFormValues = (session: StoredSession): SessionFormValues => ({
  name: session.name ?? '',
  description: session.description ?? '',
  estimatedDurationMinutes: numberToField(session.estimatedDurationMinutes),
});

/** A blank field is stored as null */
export const toCreateSessionRequest = (values: SessionFormValues): CreateSessionRequest => ({
  name: values.name || null,
  description: values.description || null,
  estimatedDurationMinutes: fieldToNumber(values.estimatedDurationMinutes) ?? null,
});

/** Only the fields that differ from the stored session; an empty object means nothing changed. */
export const toUpdateSessionRequest = (
  values: SessionFormValues,
  session: StoredSession
): UpdateSessionRequest => {
  const fields = toCreateSessionRequest(values);
  const payload: UpdateSessionRequest = {};

  if (fields.name !== session.name) {
    payload.name = fields.name;
  }

  if (fields.description !== session.description) {
    payload.description = fields.description;
  }

  if (fields.estimatedDurationMinutes !== session.estimatedDurationMinutes) {
    payload.estimatedDurationMinutes = fields.estimatedDurationMinutes;
  }

  return payload;
};
