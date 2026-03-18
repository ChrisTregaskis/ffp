/**
 * Returns a new array with the target item swapped with its adjacent neighbour.
 * Returns `null` if the swap is not possible (item not found or already at boundary).
 */
export const swapAdjacentItem = (
  ids: string[],
  targetId: string,
  direction: 'up' | 'down'
): string[] | null => {
  const result = [...ids];
  const index = result.indexOf(targetId);

  if (index < 0) {
    return null;
  }

  if (direction === 'up' && index <= 0) {
    return null;
  }

  if (direction === 'down' && index >= result.length - 1) {
    return null;
  }

  const swapIndex = direction === 'up' ? index - 1 : index + 1;

  [result[swapIndex], result[index]] = [result[index], result[swapIndex]];

  return result;
};
