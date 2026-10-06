import { useEffect, useRef } from 'react';

import { useComposableFormContext } from '@web/components/organisms';
import { toSlug } from '@web/utils/string';

import type { FieldValues, Path, PathValue } from 'react-hook-form';

interface UseAutoSlugOptions {
  /** Off once the slug is fixed, such as when editing a saved record */
  enabled?: boolean;
  maxLength?: number;
}

/** Keeps a slug field in step with its source field until the author edits the slug. */
export const useAutoSlug = <TFieldValues extends FieldValues>(
  sourceName: Path<TFieldValues>,
  slugName: Path<TFieldValues>,
  { enabled = true, maxLength }: UseAutoSlugOptions = {}
): void => {
  const { watch, getValues, setValue } = useComposableFormContext<TFieldValues>();
  const source = String(watch(sourceName) ?? '');

  // The slug last written here; a slug that differs from it was typed by the author
  const lastAutoSlug = useRef('');

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const current = String(getValues(slugName) ?? '');

    if (current !== '' && current !== lastAutoSlug.current) {
      return;
    }

    const next = toSlug(source, maxLength);
    setValue(slugName, next as PathValue<TFieldValues, Path<TFieldValues>>);
    lastAutoSlug.current = next;
  }, [enabled, source, slugName, maxLength, getValues, setValue]);
};
