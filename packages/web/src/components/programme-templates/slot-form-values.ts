import type {
  CreateSlotRequest,
  SlotResponse,
  TagCategorySlug,
  UpdateSlotRequest,
} from '@ffp/core';

export interface SlotFormValues {
  /** Empty until a category is chosen */
  category: TagCategorySlug | '';
  /** Tag publicIds in the category; none means the whole category */
  tags: string[];
  isRequired: boolean;
  label: string;
}

export const EMPTY_SLOT_VALUES: SlotFormValues = {
  category: '',
  tags: [],
  isRequired: true,
  label: '',
};

export const slotToFormValues = (slot: SlotResponse): SlotFormValues => ({
  category: slot.category,
  tags: slot.tags.map((tag) => tag.publicId),
  isRequired: slot.isRequired,
  label: slot.label ?? '',
});

/** A blank label is stored as null. The form requires a category, so it is never empty here. */
export const toCreateSlotRequest = (values: SlotFormValues): CreateSlotRequest => ({
  category: values.category as TagCategorySlug,
  tags: values.tags,
  isRequired: values.isRequired,
  label: values.label || null,
});

const sameTags = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((publicId) => b.includes(publicId));

/**
 * Only the fields that differ from the stored slot; an empty object means nothing changed.
 * A new category always carries its tags, since the old category's tags can't follow it.
 */
export const toUpdateSlotRequest = (
  values: SlotFormValues,
  slot: SlotResponse
): UpdateSlotRequest => {
  const fields = toCreateSlotRequest(values);
  const payload: UpdateSlotRequest = {};
  const storedTags = slot.tags.map((tag) => tag.publicId);

  if (fields.category !== slot.category) {
    payload.category = fields.category;
    payload.tags = fields.tags;
  } else if (!sameTags(values.tags, storedTags)) {
    payload.tags = fields.tags;
  }

  if (fields.isRequired !== slot.isRequired) {
    payload.isRequired = fields.isRequired;
  }

  if (fields.label !== slot.label) {
    payload.label = fields.label;
  }

  return payload;
};
