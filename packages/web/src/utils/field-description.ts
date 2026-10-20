export interface FieldDescriptionIds {
  hintId: string;
  errorId: string;
  /** Names whichever of the hint and the error is showing */
  describedBy: string | undefined;
}

/** Ids for a field's hint and error, and the `aria-describedby` that ties them to the control. */
export const getFieldDescriptionIds = (
  inputId: string,
  { hint, error }: { hint?: string; error?: string }
): FieldDescriptionIds => {
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined]
    .filter((id): id is string => id !== undefined)
    .join(' ');

  return { hintId, errorId, describedBy: describedBy || undefined };
};
