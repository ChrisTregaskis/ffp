/** An exercise a slot may draw */
export interface AssemblyCandidate {
  videoId: string;
  isEssential: boolean;
  /** The exercise's tags as `category:slug`, matched against the emphasis weights */
  tagKeys: string[];
}

export interface AssemblySlot {
  slotId: string;
  orderIndex: number;
  isRequired: boolean;
  /** The slot's whole pool; exercises picked for other slots are excluded during the draw */
  candidates: AssemblyCandidate[];
}

/** Extra weight per tag (`category:slug`) for a candidate carrying it; empty for none */
export type EmphasisWeights = ReadonlyMap<string, number>;

export interface AssembleSessionInput {
  slots: AssemblySlot[];
  emphasis: EmphasisWeights;
  /** The same seed and inputs always draw the same exercises */
  seed: string;
}

export interface AssembledPick {
  slotId: string;
  videoId: string;
}

export interface AssembleSessionResult {
  /** One per filled slot, in the slots' order */
  picks: AssembledPick[];
  /** Required slots left with nothing to draw */
  unfilledRequired: string[];
  /** Optional slots left with nothing to draw */
  skippedOptional: string[];
}
