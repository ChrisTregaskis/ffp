import { assertDistinctIds } from '../lib/distinct-ids';
import { ValidationError } from '../lib/errors';

/** A child addressable by public identifier and stored against its UUID. */
interface AddressableChild {
  id: string;
  publicId: string;
}

/**
 * Check a reorder payload against the children currently in the sequence and
 * resolve it to the internal identifiers the repository reorders by. The
 * payload must be the whole sequence — a short one leaves gaps behind.
 *
 * @param noun - Capitalised singular for the messages, e.g. `Question`, `Step`
 * @param strangerMessage - Message for an identifier outside the sequence; the
 *   parent's own wording, since "not assigned to this template" and "does not
 *   belong to this flow" describe different relationships
 */
export function resolveOrderedChildIds(
  orderedPublicIds: string[],
  children: readonly AddressableChild[],
  { noun, strangerMessage }: { noun: string; strangerMessage: string }
): string[] {
  assertDistinctIds(orderedPublicIds, noun);

  if (orderedPublicIds.length !== children.length) {
    throw new ValidationError(
      `Expected ${String(children.length)} ${noun.toLowerCase()} IDs but received ${String(orderedPublicIds.length)}`
    );
  }

  const idByPublicId = new Map(children.map((child) => [child.publicId, child.id]));

  return orderedPublicIds.map((publicId) => {
    const id = idByPublicId.get(publicId);

    if (!id) {
      throw new ValidationError(strangerMessage, { publicId });
    }

    return id;
  });
}
