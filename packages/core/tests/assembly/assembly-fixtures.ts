import type { AssemblyCandidate, AssemblySlot } from '../../src/programmes/assembly';

export function candidate(
  videoId: string,
  options: { isEssential?: boolean; tagKeys?: string[] } = {}
): AssemblyCandidate {
  return { videoId, isEssential: options.isEssential ?? false, tagKeys: options.tagKeys ?? [] };
}

export function slot(
  slotId: string,
  orderIndex: number,
  candidates: AssemblyCandidate[],
  isRequired = true
): AssemblySlot {
  return { slotId, orderIndex, isRequired, candidates };
}

/** Candidates `${prefix}-1` … `${prefix}-n` */
export function pool(prefix: string, size: number): AssemblyCandidate[] {
  return Array.from({ length: size }, (_, index) => candidate(`${prefix}-${String(index + 1)}`));
}

/** Four strength slots sharing one pool of exactly four */
export const FOUR_SLOTS_ON_A_POOL_OF_FOUR: AssemblySlot[] = [0, 1, 2, 3].map((index) =>
  slot(`strength-${String(index)}`, index, pool('strength', 4))
);

export const NO_EMPHASIS: ReadonlyMap<string, number> = new Map();

/** Distinct seeds, for drawing the same session many times */
export function seeds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `seed-${String(index)}`);
}
