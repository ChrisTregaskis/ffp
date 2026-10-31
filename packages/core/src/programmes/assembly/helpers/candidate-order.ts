import type { AssemblyCandidate, EmphasisWeights } from '../assembly.types';

/** 1, plus the emphasis weight of every tag the candidate carries */
function candidateWeight(candidate: AssemblyCandidate, emphasis: EmphasisWeights): number {
  return candidate.tagKeys.reduce((weight, tagKey) => weight + (emphasis.get(tagKey) ?? 0), 1);
}

const byVideoId = (a: AssemblyCandidate, b: AssemblyCandidate): number =>
  a.videoId < b.videoId ? -1 : a.videoId > b.videoId ? 1 : 0;

/** Repeated weighted draws without replacement: likelier candidates tend to come first */
function weightedOrder(
  candidates: AssemblyCandidate[],
  emphasis: EmphasisWeights,
  random: () => number
): AssemblyCandidate[] {
  const remaining = [...candidates].sort(byVideoId);
  const order: AssemblyCandidate[] = [];

  while (remaining.length > 0) {
    const weights = remaining.map((candidate) => candidateWeight(candidate, emphasis));
    let target = random() * weights.reduce((total, weight) => total + weight, 0);
    let index = weights.findIndex((weight) => (target -= weight) < 0);

    if (index === -1) {
      index = remaining.length - 1;
    }

    order.push(...remaining.splice(index, 1));
  }

  return order;
}

/**
 * The order a slot tries its candidates in: essential ones first, then the rest, each tier a
 * seeded draw weighted by emphasis. Candidates are sorted by id before drawing, so the order
 * doesn't depend on the order the pool arrived in.
 */
export function orderCandidates(
  candidates: AssemblyCandidate[],
  emphasis: EmphasisWeights,
  random: () => number
): AssemblyCandidate[] {
  return [
    ...weightedOrder(
      candidates.filter((candidate) => candidate.isEssential),
      emphasis,
      random
    ),
    ...weightedOrder(
      candidates.filter((candidate) => !candidate.isEssential),
      emphasis,
      random
    ),
  ];
}
