/**
 * A reusable storage concept which blends the functionality of an Array with the efficient key-based lookup of a Map.
 * This concept is reused throughout Foundry VTT where a collection of uniquely identified elements is required.
 * @extends {Map}
 * @type {Map}
 */
export class Collection extends Map {
  constructor(entries) {
    super(entries);
  }

  /* -------------------------------------------- */

  /**
   * When iterating over a Collection, we should iterate over its values instead of over its entries
   */
  [Symbol.iterator]() {
    return this.values();
  }

  /* -------------------------------------------- */

  /**
   * Return an Array of all the entry values in the Collection
   * @type {Array<*>}
   */
  get contents() {
    return Array.from(this.values());
  }

  /* -------------------------------------------- */

  /**
   * Find an entry in the Map using an functional condition.
   * @see {Array#find}
   *
   * @param {Function} condition  The functional condition to test
   * @return {*}                  The value, if found, otherwise undefined
   *
   * @example
   * let c = new Collection([["a", "A"], ["b", "B"], ["c", "C"]]);
   * let a = c.find(entry => entry === "A");
   */
  find(condition) {
    for ( let e of this.values() ) {
      if ( condition(e) ) return e;
    }
    return undefined;
  }

  /* -------------------------------------------- */

  /**
   * Filter the Collection, returning an Array of entries which match a functional condition.
   * @see {Array#filter}
   * @param {Function} condition  The functional condition to test
   * @return {Array<*>}           An Array of matched values
   *
   * @example
   * let c = new Collection([["a", "AA"], ["b", "AB"], ["c", "CC"]]);
   * let hasA = c.filters(entry => entry.slice(0) === "A");
   */
  filter(condition) {
    const entries = [];
    for ( let e of this.values() ) {
      if ( condition(e) ) entries.push(e);
    }
    return entries;
  }

  /* -------------------------------------------- */

  /**
   * Apply a function to each element of the collection
   * @see Array#forEach
   * @param {Function} fn       The function to apply
   *
   * @example
   * let c = new Collection([["a", {active: false}], ["b", {active: false}], ["c", {active: false}]]);
   * c.forEach(e => e.active = true);
   */
  forEach(fn) {
    for ( let e of this.values() ) {
      fn(e);
    }
  }

  /* -------------------------------------------- */

  /**
   * Get an element from the Collection by its key.
   * @param {string} key      The key of the entry to retrieve
   * @param {object} [options]  Additional options that affect how entries are retrieved
   * @param {boolean} [options.strict=false] Throw an Error if the requested key does not exist. Default false.
   * @return {*|undefined}    The retrieved entry value, if the key exists, otherwise undefined
   *
   * @example
   * let c = new Collection([["a", "Alfred"], ["b", "Bob"], ["c", "Cynthia"]]);
   * c.get("a"); // "Alfred"
   * c.get("d"); // undefined
   * c.get("d", {strict: true}); // throws Error
   */
  get(key, {strict=false}={}) {
    const entry = super.get(key);
    if ( strict && (entry === undefined) ) {
      throw new Error(`The key ${key} does not exist in the ${this.constructor.name} Collection`);
    }
    return entry;
  }

  /* -------------------------------------------- */

  /**
   * Get an entry from the Collection by name.
   * Use of this method assumes that the objects stored in the collection have a "name" attribute.
   * @param {string} name       The name of the entry to retrieve
   * @param {object} [options]  Additional options that affect how entries are retrieved
   * @param {boolean} [options.strict=false] Throw an Error if the requested name does not exist. Default false.
   * @return {*}                The retrieved entry value, if one was found, otherwise undefined
   *
   * @example
   * let c = new Collection([["a", "Alfred"], ["b", "Bob"], ["c", "Cynthia"]]);
   * c.getName("Alfred"); // "Alfred"
   * c.getName("D"); // undefined
   * c.getName("D", {strict: true}); // throws Error
   */
  getName(name, {strict=false} = {}) {
    const entry = this.find(e => e.name === name);
    if ( strict && (entry === undefined) ) {
      throw new Error(`An entry with name ${name} does not exist in the collection`);
    }
    return entry ?? undefined;
  }

  /* -------------------------------------------- */

  /**
   * Transform each element of the Collection into a new form, returning an Array of transformed values
   * @param {Function} transformer  The transformation function to apply to each entry value
   * @return {Array<*>}             An Array of transformed values
   */
  map(transformer) {
    const transformed = [];
    for ( let e of this.values() ) {
      transformed.push(transformer(e));
    }
    return transformed;
  }

  /* -------------------------------------------- */

  /**
   * Reduce the Collection by applying an evaluator function and accumulating entries
   * @see {Array#reduce}
   * @param {Function} evaluator    A function which mutates the accumulator each iteration
   * @param {any} initial           An initial value which accumulates with each iteration
   * @return {any}                  The accumulated result
   *
   * @example
   * let c = new Collection([["a", "A"], ["b", "B"], ["c", "C"]]);
   * let letters = c.reduce((s, l) => {
   *   return s + l;
   * }, ""); // "ABC"
   */
  reduce(evaluator, initial) {
    let accumulator = initial;
    for ( let e of this.values() ) {
      accumulator = evaluator(accumulator, e)
    }
    return accumulator;
  }

  /* -------------------------------------------- */

  /**
   * Test whether a condition is met by some entry in the Collection
   * @see {Array#some}
   * @param {Function} condition        A test condition to apply to each entry
   * @return {boolean}                  Was the test condition passed by at least one entry?
   */
  some(condition) {
    for ( let e of this.values() ) {
      const pass = condition(e);
      if ( pass ) return true;
    }
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Convert the Collection to a primitive array of its contents.
   * @returns {object[]}      An array of contained values
   */
  toJSON() {
    return this.map(e => e.toJSON ? e.toJSON() : e);
  }
}
export default Collection;
