/**
 * lower..<upper
 */
class Range {
  /**
   * @type {number}
   */
  #lower;

  get lower() {
    return this.#lower;
  }

  /**
   * @type {number}
   */
  #upper;

  get upper() {
    return this.#upper;
  }

  /**
   * new Range(lower, upper)
   *
   * new Range([lower, upper])
   */
  constructor(lower, upper) {
    if (Array.isArray(lower)) {
      this.#lower = Number(lower[0]);
      this.#upper = Number(lower[1]);
    } else {
      this.#lower = Number(lower);
      this.#upper = Number(upper);
    }
  }

  extendUpperBound(upper) {
    this.#upper = Number(upper);
  }

  /**
   * lower < upper or one of them are NaN
   * @returns {never | void}
   */
  validate() {
    if (this.#lower < this.#upper) return;

    throw new RangeError('lower bound exceeded to upper bound');
  }

  /**
   * @returns {[number, number]}
   */
  toArray() {
    return [this.#lower, this.#upper];
  }

  /**
   * @template T
   * @param {T} container
   * @return {T}
   */
  slice(container) {
    return container.slice(this.#lower, this.#upper);
  }
}

export default Range;
