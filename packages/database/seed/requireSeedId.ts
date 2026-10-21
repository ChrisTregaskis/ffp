/**
 * Returns a seed record's fixed id. The seeds look each record up by id to stay idempotent,
 * so a record without one is a mistake in the seed data.
 */
export const requireSeedId = (record: { id?: string }, description: string): string => {
  if (!record.id) {
    throw new Error(`Seed data error: ${description} has no id`);
  }

  return record.id;
};
