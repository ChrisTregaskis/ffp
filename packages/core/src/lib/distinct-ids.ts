import { ValidationError } from './errors';

/**
 * A duplicate identifier fails silently otherwise: it moves one child twice and
 * strands another.
 *
 * @param noun - Capitalised singular for the message, e.g. `Question`, `Step`
 */
export function assertDistinctIds(ids: string[], noun: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new ValidationError(`${noun} IDs must be unique`);
  }
}
