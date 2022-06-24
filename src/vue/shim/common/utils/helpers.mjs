/**
 * @module helpers
 */

/**
 * Benchmark the performance of a function, calling it a requested number of iterations.
 * @param {Function} func       The function to benchmark
 * @param {number} iterations   The number of iterations to test
 * @param {...any} args         Additional arguments passed to the benchmarked function
 */
export async function benchmark(func, iterations, ...args) {
  const start = performance.now();
  for ( let i=0; i<iterations; i++ ) {
    await func(...args);
  }
  const end = performance.now();
  const t = Math.round((end - start) * 100) / 100;
  const name = func.name ?? "Evaluated Function"
  console.log(`${name} | ${iterations} iterations | ${t}ms | ${t / iterations}ms per`);
}

/* -------------------------------------------- */

/**
 * Wrap a callback in a debounced timeout.
 * Delay execution of the callback function until the function has not been called for delay milliseconds
 * @param {Function} callback       A function to execute once the debounced threshold has been passed
 * @param {number} delay            An amount of time in milliseconds to delay
 * @return {Function}               A wrapped function which can be called to debounce execution
 */
export function debounce(callback, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback.apply(this, args)
    }, delay);
  }
}

/* -------------------------------------------- */

/**
 * Quickly clone a simple piece of data, returning a copy which can be mutated safely.
 * This method DOES support recursive data structures containing inner objects or arrays.
 * This method DOES NOT support advanced object types like Set, Map, or other specialized classes.
 * @param {*} original                     Some sort of data
 * @param {object} [options]               Options to configure the behaviour of deepClone
 * @param {boolean} [options.strict=false] Throw an Error if deepClone is unable to clone something instead of returning the original
 * @return {*}                             The clone of that data
 */
export function deepClone(original, {strict=false}={}) {

  // Simple types
  if ( (typeof original !== "object") || (original === null) ) return original;

  // Arrays
  if ( original instanceof Array ) return original.map(deepClone);

  // Dates
  if ( original instanceof Date ) return new Date(original);

  // Unsupported advanced objects
  if ( original.constructor !== Object ) {
    if ( strict ) throw new Error("deepClone cannot clone advanced objects");
    return original;
  }

  // Other objects
  const clone = {};
  for ( let k of Object.keys(original) ) {
    clone[k] = deepClone(original[k]);
  }
  return clone;
}

/* -------------------------------------------- */

/**
 * Deeply difference an object against some other, returning the update keys and values.
 * @param {object} original       An object comparing data against which to compare
 * @param {object} other          An object containing potentially different data
 * @param {object} [options={}]   Additional options which configure the diff operation
 * @param {boolean} [options.inner=false]  Only recognize differences in other for keys which also exist in original
 * @return {object}               An object of the data in other which differs from that in original
 */
export function diffObject(original, other, {inner=false}={}) {
  function _difference(v0, v1) {
    let t0 = getType(v0);
    let t1 = getType(v1);
    if ( t0 !== t1 ) return [true, v1];
    if ( t0 === "Array" ) return [!v0.equals(v1), v1];
    if ( t0 === "Object" ) {
      if ( isObjectEmpty(v0) !== isObjectEmpty(v1) ) return [true, v1];
      let d = diffObject(v0, v1, {inner});
      return [!isObjectEmpty(d), d];
    }
    return [v0 !== v1, v1];
  }

  // Recursively call the _difference function
  return Object.keys(other).reduce((obj, key) => {
    if ( inner && !(key in original) ) return obj;
    let [isDifferent, difference] = _difference(original[key], other[key]);
    if ( isDifferent ) obj[key] = difference;
    return obj;
  }, {});
}

/* -------------------------------------------- */

/**
 * A cheap data duplication trick which is relatively robust.
 * For a subset of cases the deepClone function will offer better performance.
 * @param {Object} original   Some sort of data
 */
export function duplicate(original) {
  return JSON.parse(JSON.stringify(original));
}

/* -------------------------------------------- */

/**
 * Test whether some class is a subclass of a parent.
 * @param {Function} cls        The class to test
 * @param {Function} parent     Some other class which may be a parent
 * @returns {boolean}           Is the class a subclass of the parent?
 */
export function isSubclass(cls, parent) {
  return getParentClasses(cls).includes(parent);
}

/* -------------------------------------------- */

/**
 * Encode a url-like string by replacing any characters which need encoding
 * @param {string} path     A fully-qualified URL or url component (like a relative path)
 * @return {string}         An encoded URL string
 */
export function encodeURL(path) {

  // Determine whether the path is a well-formed URL
  let isURL = false;
  let url = {};
  try {
    url = new URL(path);
    isURL = true;
  } catch(err) {}

  // If URL, remove the initial protocol
  if ( isURL ) path = path.replace(url.protocol, "");

  // Split and encode each URL part
  path = path.split("/").map(p => encodeURIComponent(p).replace(/'/g, "%27")).join("/");

  // Return the encoded URL
  return isURL ? url.protocol + path : path;
}

/* -------------------------------------------- */

/**
 * Expand a flattened object to be a standard multi-dimensional nested Object by converting all dot-notation keys to
 * inner objects.
 *
 * @param {object} obj      The object to expand
 * @param {Number} [_d=0]   Track the recursion depth to prevent overflow
 * @return {object}         An expanded object
 */
export function expandObject(obj, _d=0) {
  const expanded = {};
  if ( _d > 100 ) {
    throw new Error("Maximum depth exceeded");
  }
  for ( let [k, v] of Object.entries(obj) ) {
    if ( v instanceof Object && !Array.isArray(v) ) v = expandObject(v, _d+1);
    setProperty(expanded, k, v);
  }
  return expanded;
}

/* -------------------------------------------- */

/**
 * Filter the contents of some source object using the structure of a template object.
 * Only keys which exist in the template are preserved in the source object.
 *
 * @param {object} source           An object which contains the data you wish to filter
 * @param {object} template         An object which contains the structure you wish to preserve
 * @param {object} [options={}]     Additional options which customize the filtration
 * @param {boolean} [options.keepSpecial=false]     Whether to keep special tokens like deletion keys
 * @param {boolean} [options.templateValues=false]  Instead of keeping values from the source, instead draw values from the template
 *
 * @example
 * const source = {foo: {number: 1, name: "Tim", topping: "olives"}, bar: "baz"};
 * const template = {foo: {number: 0, name: "Mit", style: "bold"}, other: 72};
 * filterObject(source, template); // {foo: {number: 1, name: "Tim"}};
 * filterObject(source, template, {templateValues: true}); // {foo: {number: 0, name: "Mit"}};
 */
export function filterObject(source, template, {keepSpecial=false, templateValues=false}={}) {

  // Validate input
  const ts = getType(source);
  const tt = getType(template);
  if ( (ts !== "Object") || (tt !== "Object")) throw new Error("One of source or template are not Objects!");

  // Define recursive filtering function
  const _filter = function(s, t, filtered) {
    for ( let [k, v] of Object.entries(s) ) {
      let has = t.hasOwnProperty(k);
      let x = t[k];

      // Case 1 - inner object
      if ( has && (getType(v) === "Object") && (getType(x) === "Object") ) {
        filtered[k] = _filter(v, x, {});
      }

      // Case 2 - inner key
      else if ( has ) {
        filtered[k] = templateValues ? x : v;
      }

      // Case 3 - special key
      else if ( keepSpecial && k.startsWith("-=") ) {
        filtered[k] = v;
      }
    }
    return filtered;
  };

  // Begin filtering at the outer-most layer
  return _filter(source, template, {});
}

/* -------------------------------------------- */

/**
 * Flatten a possibly multi-dimensional object to a one-dimensional one by converting all nested keys to dot notation
 * @param {object} obj        The object to flatten
 * @param {number} [_d=0]     Track the recursion depth to prevent overflow
 * @return {object}           A flattened object
 */
export function flattenObject(obj, _d=0) {
  const flat = {};
  if ( _d > 100 ) {
    throw new Error("Maximum depth exceeded");
  }
  for ( let [k, v] of Object.entries(obj) ) {
    let t = getType(v);
    if ( t === "Object" ) {
      if ( isObjectEmpty(v) ) flat[k] = v;
      let inner = flattenObject(v, _d+1);
      for ( let [ik, iv] of Object.entries(inner) ) {
        flat[`${k}.${ik}`] = iv;
      }
    }
    else flat[k] = v;
  }
  return flat;
}

/* -------------------------------------------- */

/**
 * Obtain references to the parent classes of a certain class.
 * @param {Function} cls      An ES6 Class definition
 * @return {Function[]}       An array of parent Classes which the provided class extends
 */
export function getParentClasses(cls) {
  if ( typeof cls !== "function" ) {
    throw new Error("The provided class is not a type of Function");
  }
  const parents = [];
  while ( !!cls.name ) {
    cls = Object.getPrototypeOf(cls);
    if ( cls.name ) parents.push(cls);
  }
  return parents;
}

/* -------------------------------------------- */

/**
 * A helper function which searches through an object to retrieve a value by a string key.
 * The string key supports the notation a.b.c which would return object[a][b][c]
 * @param {object} object   The object to traverse
 * @param {string} key      An object property with notation a.b.c
 * @return {*}              The value of the found property
 * @throws {Error}          Throws an Error if the object is not in fact an object
 */
export function getProperty(object, key) {
  if ( !key ) return undefined;
  let target = object;
  for ( let p of key.split('.') ) {
    target = target || {};
    if ( p in target ) target = target[p];
    else return undefined;
  }
  return target;
}

/* -------------------------------------------- */

/**
 * Get the URL route for a certain path which includes a path prefix, if one is set
 * @param {string} path             The Foundry URL path
 * @param {string|null} [prefix]    A path prefix to apply
 * @returns {string}                The absolute URL path
 */
export function getRoute(path, {prefix=null}={}) {
  if ( !prefix ) {
    try {
      if ( ROUTE_PREFIX ) prefix = ROUTE_PREFIX;
    } catch(err) {}
  }
  path = path.replace(/(^[\/]+)|([\/]+$)/g, ""); // Strip leading and trailing slashes
  let paths = [""];
  if ( prefix ) paths.push(prefix);
  paths = paths.concat([path.replace(/(^\/)|(\/$)/g, "")]);
  return paths.join("/");
}

/* -------------------------------------------- */

/**
 * Learn the named type of a token - extending the functionality of typeof to recognize some core Object types
 * @param {*} token     Some passed token
 * @return {string}     The named type of the token
 */
export function getType(token) {
  const tof = typeof token;
  if ( tof === "object" ) {
    if ( token === null ) return "null";
    let cn = token.constructor?.name;
    if ( ["String", "Number", "Boolean", "Array", "Set"].includes(cn)) return cn;
    else if ( /^HTML/.test(cn) ) return "HTMLElement";
    else return "Object";
  }
  return tof;
}

/* -------------------------------------------- */

/**
 * A helper function which tests whether an object has a property or nested property given a string key.
 * The string key supports the notation a.b.c which would return true if object[a][b][c] exists
 * @param {object} object   The object to traverse
 * @param {string} key      An object property with notation a.b.c
 * @returns {boolean}       An indicator for whether the property exists
 */
export function hasProperty(object, key) {
  if ( !key ) return false;
  let target = object;
  for ( let p of key.split('.') ) {
    target = target || {};
    if ( p in target ) target = target[p];
    else return false;
  }
  return true;
}

/* -------------------------------------------- */

/**
 * Invert an object by assigning its values as keys and its keys as values.
 * @param {object} obj    The original object to invert
 * @returns {object}      The inverted object with keys and values swapped
 */
export function invertObject(obj) {
  const inverted = {};
  for ( let [k, v] of Object.entries(obj) ) {
    if ( v in inverted ) throw new Error("The values of the provided object must be unique in order to invert it.");
    inverted[v] = k;
  }
  return inverted;
}

/* -------------------------------------------- */

/**
 * Return whether or not a target version (v1) is more advanced than some other reference version (v0).
 * Supports either numeric or string version comparison with version parts separated by periods.
 * @param {number|string} v1    The target version
 * @param {number|string} v0    The reference version
 * @return {boolean}            Is v1 a more advanced version than v0?
 */
export function isNewerVersion(v1, v0) {

  // Handle numeric versions
  if ( (typeof v1 === "number") && (typeof v0 === "number") ) return v1 > v0;

  // Handle string parts
  let v1Parts = String(v1).split(".");
  let v0Parts = String(v0).split(".");

  // Iterate over version parts
  for ( let [i, p1] of v1Parts.entries() ) {
    let p0 = v0Parts[i];

    // If the prior version doesn't have a part, v1 wins
    if ( p0 === undefined ) return true;

    // If both parts are numbers, use numeric comparison to avoid cases like "12" < "5"
    if ( Number.isNumeric(p0) && Number.isNumeric(p1) ) {
      if ( Number(p1) !== Number(p0) ) return Number(p1) > Number(p0);
    }

    // Otherwise, compare as strings
    else if ( p1 < p0 ) return false;
  }

  // If there are additional parts to v0, it is not newer
  if ( v0Parts.length > v1Parts.length ) return false;

  // If we have not returned false by now, its either newer or the same
  return !v1Parts.equals(v0Parts);
}

/* -------------------------------------------- */

/**
 * A simple function to test whether or not an Object is empty
 * @param {object} obj    The object to test
 * @return {boolean}      Is the object empty?
 */
export function isObjectEmpty(obj) {
  if ( getType(obj) !== "Object" ) {
    throw new Error("The provided data is not an object!");
  }
  return Object.keys(obj).length === 0;
}

/* -------------------------------------------- */

/**
 * Update a source object by replacing its keys and values with those from a target object.
 *
 * @param {object} original       The initial object which should be updated with values from the target
 * @param {object} [other={}]     A new object whose values should replace those in the source
 * @param {object} [options={}]   Additional options which configure the merge
 * @param {boolean} [options.insertKeys=true]     Control whether to insert new top-level objects into the resulting structure which do not previously exist in the original object.
 * @param {boolean} [options.insertValues=true]   Control whether to insert new nested values into child objects in the resulting structure which did not previously exist in the original object.
 * @param {boolean} [options.overwrite=true]      Control whether to replace existing values in the source, or only merge values which do not already exist in the original object.
 * @param {boolean} [options.recursive=true]      Control whether to merge inner-objects recursively (if true), or whether to simply replace inner objects with a provided new value.
 * @param {boolean} [options.inplace=true]        Control whether to apply updates to the original object in-place (if true), otherwise the original object is duplicated and the copy is merged.
 * @param {boolean} [options.enforceTypes=false]  Control whether strict type checking requires that the value of a key in the other object must match the data type in the original data to be merged.
 * @param {number} [_d=0]         A privately used parameter to track recursion depth.
 * @returns {object}              The original source object including updated, inserted, or overwritten records.
 *
 * @example <caption>Control how new keys and values are added</caption>
 * mergeObject({k1: "v1"}, {k2: "v2"}, {insertKeys: false}); // {k1: "v1"}
 * mergeObject({k1: "v1"}, {k2: "v2"}, {insertKeys: true});  // {k1: "v1", k2: "v2"}
 * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {insertValues: false}); // {k1: {i1: "v1"}}
 * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {insertValues: true}); // {k1: {i1: "v1", i2: "v2"}}
 *
 * @example <caption>Control how existing data is overwritten</caption>
 * mergeObject({k1: "v1"}, {k1: "v2"}, {overwrite: true}); // {k1: "v2"}
 * mergeObject({k1: "v1"}, {k1: "v2"}, {overwrite: false}); // {k1: "v1"}
 *
 * @example <caption>Control whether merges are performed recursively</caption>
 * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {recursive: false}); // {k1: {i1: "v2"}}
 * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {recursive: true}); // {k1: {i1: "v1", i2: "v2"}}
 *
 * @example <caption>Deleting an existing object key</caption>
 * mergeObject({k1: "v1", k2: "v2"}, {"-=k1": null});   // {k2: "v2"}
 */
export function mergeObject(original, other={}, {
    insertKeys=true, insertValues=true, overwrite=true, recursive=true, inplace=true, enforceTypes=false
  }={}, _d=0) {
  other = other || {};
  if (!(original instanceof Object) || !(other instanceof Object)) {
    throw new Error("One of original or other are not Objects!");
  }
  const options = {insertKeys, insertValues, overwrite, recursive, inplace, enforceTypes};

  // Special handling at depth 0
  if ( _d === 0 ) {
    if ( !inplace ) original = deepClone(original);
    if ( Object.keys(original).some(k => /\./.test(k)) ) original = expandObject(original);
    if ( Object.keys(other).some(k => /\./.test(k)) ) other = expandObject(other);
  }

  // Iterate over the other object
  for ( let k of Object.keys(other) ) {
    const v = other[k];
    if ( original.hasOwnProperty(k) ) _mergeUpdate(original, k, v, options, _d+1);
    else _mergeInsert(original, k, v, options, _d+1);
  }
  return original;
}

/**
 * A helper function for merging objects when the target key does not exist in the original
 * @private
 */
function _mergeInsert(original, k, v, {insertKeys, insertValues}={}, _d) {
  // Delete a key
  if ( k.startsWith("-=") ) {
    delete original[k.slice(2)];
    return;
  }

  const canInsert = ((_d <= 1) && insertKeys) || ((_d > 1) && insertValues);
  if ( !canInsert ) return;

  // Recursively create simple objects
  if ( v?.constructor === Object ) {
    original[k] = mergeObject({}, v, {insertKeys: true, inplace: true});
    return;
  }

  // Insert a key
  original[k] = v;
}

/**
 * A helper function for merging objects when the target key exists in the original
 * @private
 */
function _mergeUpdate(original, k, v, {insertKeys, insertValues, enforceTypes, overwrite, recursive}={}, _d) {
  const x = original[k];
  const tv = getType(v);
  const tx = getType(x);

  // Recursively merge an inner object
  if ( (tv === "Object") && (tx === "Object") && recursive) {
    return mergeObject(x, v, {
      insertKeys: insertKeys,
      insertValues: insertValues,
      overwrite: overwrite,
      inplace: true,
      enforceTypes: enforceTypes
    }, _d);
  }

  // Overwrite an existing value
  if ( overwrite ) {
    if ( (tx !== "undefined") && (tv !== tx) && enforceTypes ) {
      throw new Error(`Mismatched data types encountered during object merge.`);
    }
    original[k] = v;
  }
}

/* -------------------------------------------- */

/**
 * Generate a random string ID of a given requested length.
 * @param {number} length    The length of the random ID to generate
 * @return {string}          Return a string containing random letters and numbers
 */
export function randomID(length=16) {
  const rnd = () => Math.random().toString(36).substr(2);
  let id = "";
  while (id.length < length)
    id += rnd();
  return id.substr(0, length);
}

/* -------------------------------------------- */

/**
 * A helper function which searches through an object to assign a value using a string key
 * This string key supports the notation a.b.c which would target object[a][b][c]
 * @param {object} object   The object to update
 * @param {string} key      The string key
 * @param {*} value         The value to be assigned
 * @return {boolean}        Whether the value was changed from its previous value
 */
export function setProperty(object, key, value) {
  let target = object;
  let changed = false;

  // Convert the key to an object reference if it contains dot notation
  if ( key.indexOf('.') !== -1 ) {
    let parts = key.split('.');
    key = parts.pop();
    target = parts.reduce((o, i) => {
      if ( !o.hasOwnProperty(i) ) o[i] = {};
      return o[i];
    }, object);
  }

  // Update the target
  if ( target[key] !== value ) {
    changed = true;
    target[key] = value;
  }

  // Return changed status
  return changed;
}

/* -------------------------------------------- */

/**
 * Express a timestamp as a relative string
 * @param {Date|string} timeStamp   A timestamp string or Date object to be formatted as a relative time
 * @return {string}                 A string expression for the relative time
 */
export function timeSince(timeStamp) {
  timeStamp = new Date(timeStamp);
  const now = new Date();
  const secondsPast = (now - timeStamp) / 1000;
  let since = "";

  // Format the time
  if (secondsPast < 60) {
    since = secondsPast;
    if ( since < 1 ) return game.i18n.localize("TIME.Now");
    else since = Math.round(since) + game.i18n.localize("TIME.SecondsAbbreviation");
  }
  else if (secondsPast < 3600) since = Math.round(secondsPast / 60) + game.i18n.localize("TIME.MinutesAbbreviation");
  else if (secondsPast <= 86400) since = Math.round(secondsPast / 3600) + game.i18n.localize("TIME.HoursAbbreviation");
  else {
    const hours = Math.round(secondsPast / 3600);
    const days = Math.floor(hours / 24);
    since = `${days}${game.i18n.localize("TIME.DaysAbbreviation")} ${hours % 24}${game.i18n.localize("TIME.HoursAbbreviation")}`;
  }

  // Return the string
  return game.i18n.format("TIME.Since", {since: since});
}

/* -------------------------------------------- */
/*  Colors
/* -------------------------------------------- */

/**
 * Converts an RGB color value to HSV. Conversion formula adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 1] and returns h, s, and v in the set [0, 1].
 * @param {number} r       The red color value
 * @param {number} g       The green color value
 * @param {number} b       The blue color value
 * @return {number[]}      The HSV representation
 */
export function rgbToHsv(r, g, b) {
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) h = 0; // achromatic
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
}

/* -------------------------------------------- */

/**
 * Converts an HSV color value to RGB. Conversion formula adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and returns r, g, and b in the set [0, 1].
 * @param {number} h    The hue
 * @param {number} s    The saturation
 * @param {number} v    The value
 * @return {number[]}   The RGB representation
 */
export function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [r, g, b];
}

/* -------------------------------------------- */

/**
 * Converts a color as an [R, G, B] array of normalized floats to a hexadecimal number.
 * @param {number[]} rgb      Array of numbers where all values are normalized floats from 0.0 to 1.0.
 * @return {number}           The numeric color as hexadecimal
 */
export function rgbToHex(rgb) {
  return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
}

/* ----------------------------------------- */

/**
 * Convert a hex color code to an RGB array
 * @param {number} hex    A hex color number
 * @return {number[]}     An array of [r,g,b] colors normalized on the range of [0,1]
 */
export function hexToRGB(hex) {
  return [
    ((hex >> 16) & 0xFF) / 255,
    ((hex >> 8) & 0xFF) / 255,
    (hex & 0xFF) / 255
  ];
}

/* ----------------------------------------- */

/**
 * Convert a hex color code to an RGBA color string which can be used for CSS styling
 * @param {number} hex          A hex color number
 * @param {number} [alpha=1.0]  An optional level of transparency
 * @return {string}             An rgba style string
 */
export function hexToRGBAString(hex, alpha=1.0) {
  const rgb = hexToRGB(hex).map(h => h * 255);
  rgb.push(alpha);
  return `rgba(${rgb.join(", ")})`;
}

/* ----------------------------------------- */

/**
 * Convert a string color to a hex integer
 * @param {string} color    The string color
 * @return {number|null}    The hexadecimal color code
 */
export function colorStringToHex(color) {
  if ( !color ) return null;
  color = color.startsWith("#") ? color.substr(1) : color;
  return parseInt(color, 16);
}
