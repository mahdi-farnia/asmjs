/**
 * Transform array of ranges to sliced source strings
 * @type {string} source
 * @type {import("../src/helpers/Range").default[]} ranges
 */
export function dataRangeArrayToString(source, ranges) {
  return ranges.map(({ symbol, data }) => [symbol.slice(source), data.slice(source)]);
}
