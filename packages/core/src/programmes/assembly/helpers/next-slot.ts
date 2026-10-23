import type { AssemblySlot } from '../assembly.types';

/** How many of the slot's candidates are still free to pick */
function countEligible(slot: AssemblySlot, picked: ReadonlySet<string>): number {
  return slot.candidates.filter((candidate) => !picked.has(candidate.videoId)).length;
}

/**
 * The most-constrained slot: the fewest eligible candidates, then required before optional, then
 * the slot's order. Filling it first stops a late slot stranding once earlier picks drain its pool.
 */
export function findNextSlot(slots: AssemblySlot[], picked: ReadonlySet<string>): AssemblySlot {
  return slots
    .map((slot) => ({ slot, eligible: countEligible(slot, picked) }))
    .reduce((best, current) => {
      if (current.eligible !== best.eligible) {
        return current.eligible < best.eligible ? current : best;
      }

      if (current.slot.isRequired !== best.slot.isRequired) {
        return current.slot.isRequired ? current : best;
      }

      return current.slot.orderIndex < best.slot.orderIndex ? current : best;
    }).slot;
}
