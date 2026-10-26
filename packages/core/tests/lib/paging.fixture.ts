import { randomUUID } from 'crypto';

/**
 * Ids in descending order. Rows inserted in this order come back in insertion order when
 * nothing orders them, so a check that tied rows come back in ascending id order cannot
 * pass by chance.
 */
export const descendingIds = (count: number): string[] =>
  Array.from({ length: count }, () => randomUUID())
    .sort()
    .reverse();

/** Distinct creation times one minute apart, oldest first. */
export const minutesApart = (count: number): Date[] =>
  Array.from({ length: count }, (_, index) => new Date(Date.UTC(2026, 0, 1, 9, index)));

/** The ids of pages 1..pageCount, in the order the pages returned them. */
export const idsAcrossPages = async (
  pageCount: number,
  fetchPage: (page: number) => Promise<{ id: string }[]>
): Promise<string[]> => {
  const ids: string[] = [];

  for (let page = 1; page <= pageCount; page += 1) {
    ids.push(...(await fetchPage(page)).map((row) => row.id));
  }

  return ids;
};
