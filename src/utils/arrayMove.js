/**
 * Moves an item in an array from one position to another
 * @param {Array} array - The array to modify
 * @param {number} from - The index to move from
 * @param {number} to - The index to move to
 * @returns {Array} New array with item moved
 */
export const arrayMove = (array, from, to) => {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
};

/**
 * Finds the target index for a dragging item based on position
 * @param {number} currentIndex - Current index of dragging item
 * @param {number} dragOffset - Current drag offset (x position)
 * @param {Array} positions - Array of position data for all items
 * @returns {number} Target index where item should move
 */
export const findDragIndex = (currentIndex, dragOffset, positions) => {
  let targetIndex = currentIndex;
  const currentPosition = positions[currentIndex];
  
  if (!currentPosition) return currentIndex;

  // Moving right
  for (let i = currentIndex + 1; i < positions.length; i++) {
    if (!positions[i]) continue;
    const { left, width } = positions[i];
    // If dragged past the midpoint of next item
    if (dragOffset > left + width / 2) {
      targetIndex = i;
    }
  }

  // Moving left
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!positions[i]) continue;
    const { left, width } = positions[i];
    // If dragged past the midpoint of previous item
    if (dragOffset < left + width / 2) {
      targetIndex = i;
    }
  }

  return targetIndex;
};

