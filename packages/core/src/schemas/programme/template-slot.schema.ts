import { z } from 'zod';

import { publicIdSchema } from '../public-id.schema';
import { adminTagSchema, tagCategorySlugSchema } from '../tag.schema';

/** A session is meant to hold 3 to 5 slots; fewer is flagged, more is refused. */
export const SESSION_SLOT_LIMITS = { min: 3, max: 5 } as const;

/** `template_session_slots.label` is varchar(100). */
export const SLOT_LABEL_MAX_LENGTH = 100;

const slotLabelSchema = z
  .string()
  .trim()
  .max(SLOT_LABEL_MAX_LENGTH, `Label must be ${String(SLOT_LABEL_MAX_LENGTH)} characters or fewer`)
  .nullable()
  .transform((label) => (label === '' ? null : label));

/** Tag publicIds within the slot's category; none means the whole category */
const slotTagIdsSchema = z.array(publicIdSchema);

export const createSlotRequestSchema = z.object({
  category: tagCategorySlugSchema,
  tags: slotTagIdsSchema.default([]),
  isRequired: z.boolean().default(true),
  label: slotLabelSchema.optional(),
});

/** Changing the category without sending tags clears the old category's tags. */
export const updateSlotRequestSchema = z
  .object({
    category: tagCategorySlugSchema,
    tags: slotTagIdsSchema,
    isRequired: z.boolean(),
    label: slotLabelSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/** Every slot of the session, by publicId, in the new order */
export const reorderSlotsRequestSchema = z.object({
  orderedIds: z.array(publicIdSchema).min(1),
});

export const slotResponseSchema = z.object({
  publicId: publicIdSchema,
  /** Display order within the session (0-based) */
  orderIndex: z.number().int().nonnegative(),
  category: tagCategorySlugSchema,
  categoryLabel: z.string(),
  /** Inactive tags stay listed (flagged) so authors can see why a pool shrank */
  tags: z.array(adminTagSchema.omit({ category: true })),
  isRequired: z.boolean(),
  label: z.string().nullable(),
  /** Videos the slot's pool holds now; computed on read, never stored */
  poolSize: z.number().int().nonnegative(),
  isPoolEmpty: z.boolean(),
  hasInactiveTags: z.boolean(),
});

export const sessionSlotsResponseSchema = z.object({
  slots: z.array(slotResponseSchema),
  /** Fewer than `SESSION_SLOT_LIMITS.min` slots */
  hasTooFewSlots: z.boolean(),
});

export type CreateSlotRequest = z.input<typeof createSlotRequestSchema>;
export type UpdateSlotRequest = z.input<typeof updateSlotRequestSchema>;
export type ReorderSlotsRequest = z.infer<typeof reorderSlotsRequestSchema>;
export type SlotResponse = z.infer<typeof slotResponseSchema>;
export type SessionSlotsResponse = z.infer<typeof sessionSlotsResponseSchema>;
