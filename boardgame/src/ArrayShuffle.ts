/**
 * Shuffles array in-place and returns the shuffled array
 */
export const arrayShuffle = function <T>(array: Array<T>): Array<T> {
  let currentIndex = array.length;
  while (0 !== currentIndex) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
};
