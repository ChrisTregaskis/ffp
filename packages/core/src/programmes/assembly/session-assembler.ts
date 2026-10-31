import { createSeededRandom } from '../../lib/random';

import { findNextSlot, orderCandidates } from './helpers';

import type {
  AssembleSessionInput,
  AssembleSessionResult,
  AssemblySlot,
  EmphasisWeights,
} from './assembly.types';

interface Fill {
  videoBySlot: Map<string, string>;
  unfilledRequired: string[];
  skippedOptional: string[];
}

/**
 * Fill the remaining slots, most-constrained first, each trying its candidates in seeded order.
 * A pick that strands a later slot is undone and the next candidate tried, so a required slot
 * goes unfilled only when no choice of the others would leave it something; an optional slot is
 * skipped only when filling it would. Sessions hold at most five slots, so the search stays small.
 */
function fill(
  remaining: AssemblySlot[],
  picked: Set<string>,
  emphasis: EmphasisWeights,
  random: () => number
): Fill | null {
  if (remaining.length === 0) {
    return { videoBySlot: new Map(), unfilledRequired: [], skippedOptional: [] };
  }

  const slot = findNextSlot(remaining, picked);
  const rest = remaining.filter((other) => other !== slot);
  const eligible = slot.candidates.filter((candidate) => !picked.has(candidate.videoId));

  for (const { videoId } of orderCandidates(eligible, emphasis, random)) {
    picked.add(videoId);
    const filled = fill(rest, picked, emphasis, random);
    picked.delete(videoId);

    if (filled) {
      filled.videoBySlot.set(slot.slotId, videoId);

      return filled;
    }
  }

  if (slot.isRequired) {
    return null;
  }

  const filled = fill(rest, picked, emphasis, random);
  filled?.skippedOptional.push(slot.slotId);

  return filled;
}

/** One pick per slot with no undoing, used to name the slots left empty once no full fill exists */
function fillGreedily(
  slots: AssemblySlot[],
  emphasis: EmphasisWeights,
  random: () => number
): Fill {
  const picked = new Set<string>();
  const result: Fill = { videoBySlot: new Map(), unfilledRequired: [], skippedOptional: [] };
  let remaining = slots;

  while (remaining.length > 0) {
    const slot = findNextSlot(remaining, picked);
    remaining = remaining.filter((other) => other !== slot);

    const eligible = slot.candidates.filter((candidate) => !picked.has(candidate.videoId));

    if (eligible.length > 0) {
      const [choice] = orderCandidates(eligible, emphasis, random);
      picked.add(choice.videoId);
      result.videoBySlot.set(slot.slotId, choice.videoId);
    } else {
      (slot.isRequired ? result.unfilledRequired : result.skippedOptional).push(slot.slotId);
    }
  }

  return result;
}

/**
 * Fill a session's slots from their pools. Pure: no database, logging or clock.
 *
 * An exercise fills at most one slot. Every required slot is filled whenever some choice of
 * exercises allows it; otherwise the slots left empty are reported.
 */
export function assembleSession(input: AssembleSessionInput): AssembleSessionResult {
  const result =
    fill(input.slots, new Set(), input.emphasis, createSeededRandom(input.seed)) ??
    fillGreedily(input.slots, input.emphasis, createSeededRandom(input.seed));

  const picks = [...input.slots]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap(({ slotId }) => {
      const videoId = result.videoBySlot.get(slotId);

      return videoId ? [{ slotId, videoId }] : [];
    });

  return {
    picks,
    unfilledRequired: result.unfilledRequired,
    skippedOptional: result.skippedOptional,
  };
}
