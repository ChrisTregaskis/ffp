import { z } from 'zod';

import { programmeDetailResponseSchema } from './programme-detail.schema';

/** One question the programme was shaped by, with the member's chosen answers as labels */
const keyAreaSchema = z.object({
  questionId: z.guid(),
  question: z.string(),
  answers: z.array(z.string()),
});

/**
 * A member's programme as a system admin sees it: every phase in full, plus the level and the
 * answers that shaped the programme. The member's own read stays on the tiered detail schema.
 */
export const adminProgrammeDetailResponseSchema = programmeDetailResponseSchema.extend({
  level: z.number().int().nullable(),
  keyAreas: z.array(keyAreaSchema),
});

export type ProgrammeKeyArea = z.infer<typeof keyAreaSchema>;
export type AdminProgrammeDetailResponse = z.infer<typeof adminProgrammeDetailResponseSchema>;
