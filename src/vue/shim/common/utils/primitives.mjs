
/* -------------------------------------------- */
/*  Math Functions                              */
/* -------------------------------------------- */

/**
 * Bound a number between some minimum and maximum value, inclusively.
 * @memberof Math
 * @param {number} num    The current value
 * @param {number} min    The minimum allowed value
 * @param {number} max    The maximum allowed value
 * @return {number}       The clamped number
 */
Math.clamped = function(num, min, max) {
  return Math.min(max, Math.max(num, min));
};

/**
 * Transform an angle in degrees to be bounded within the domain [0, 360]
 * @memberof Math
 * @param {number} degrees  An angle in degrees
 * @return {number}         The same angle on the range [0, 360]
 */
Math.normalizeDegrees = function(degrees) {
  const d = degrees % 360;
  return d < 0 ? d + 360 : d;
};

/**
 * Transform an angle in radians to be bounded within the domain [-PI, PI]
 * @memberof Math
 * @param {number} radians  An angle in degrees
 * @return {number}         The same angle on the range [-PI, PI]
 */
Math.normalizeRadians = function(radians) {
  let pi2 = 2 * Math.PI;
  while ( radians < -Math.PI ) radians += pi2;
  while ( radians > Math.PI ) radians -= pi2;
  return radians;
};

/**
 * Round a floating point number to a certain number of decimal places
 * @memberof Math
 * @param {number} number  A floating point number
 * @param {number} places  An integer number of decimal places
 */
Math.roundDecimals = function(number, places) {
  places = Math.max(Math.trunc(places), 0);
  let scl = Math.pow(10, places);
  return Math.round(number * scl) / scl;
};

/**
 * Transform an angle in radians to a number in degrees
 * @memberof Math
 * @param {number} angle    An angle in radians
 * @return {number}         An angle in degrees
 */
Math.toDegrees = function(angle) {
  return angle * (180 / Math.PI);
};

/**
 * Transform an angle in degrees to an angle in radians
 * @memberof Math
 * @param {number} angle    An angle in degrees
 * @return {number}         An angle in radians
 */
Math.toRadians = function(angle) {
  return (angle % 360) * (Math.PI / 180);
};

/* -------------------------------------------- */
/* Set Methods                                  */
/* -------------------------------------------- */

/**
 * Test whether this set is equal to some other set.
 * Sets are equal if they share the same members, independent of order
 * @memberof Set.prototype
 * @param {Set} other       Some other set to compare against
 * @returns {boolean}       Are the sets equal?
 */
Set.prototype.equals = function(other) {
  if ( !(other instanceof Set ) ) return false;
  if ( other.size !== this.size ) return false;
  for ( let element of this ) {
    if ( !other.has(element) ) return false;
  }
  return true;
}

/**
 * Return the first value from the set.
 * @memberof Set.prototype
 * @returns {any}           The first element in the set, or undefined
 */
Set.prototype.first = function() {
  return this.values().next().value;
}

/**
 * Return the intersection of two sets.
 * @memberof Set.prototype
 * @param {Set} other       Some other set to compare against
 * @returns {Set}           The intersection of both sets
 */
Set.prototype.intersection = function(other) {
  const n = new Set();
  for ( let element of this ) {
    if ( other.has(element) ) n.add(element);
  }
  return n;
}

/**
 * Test whether this set has an intersection with another set.
 * @memberof Set.prototype
 * @param {Set} other       Another set to compare against
 * @returns {boolean}       Do the sets intersect?
 */
Set.prototype.intersects = function(other) {
  for ( let element of this ) {
    if ( other.has(element) ) return true;
  }
  return false;
}

/**
 * Test whether this set is a subset of some other set.
 * A set is a subset if all its members are also present in the other set.
 * @memberof Set.prototype
 * @param {Set} other       Some other set that may be a subset of this one
 * @returns {boolean}       Is the other set a subset of this one?
 */
Set.prototype.isSubset = function(other) {
  if ( !(other instanceof Set ) ) return false;
  if ( other.size < this.size ) return false;
  for ( let element of this ) {
    if ( !other.has(element) ) return false;
  }
  return true;
}

/* -------------------------------------------- */
/* String Methods                               */
/* -------------------------------------------- */

/**
 * Capitalize a string, transforming it's first character to a capital letter
 * @memberof String.prototype
 * @returns {string}
 */
String.prototype.capitalize = function() {
  if ( !this.length ) return this;
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Convert a string to Title Case where the first letter of each word is capitalized
 * @memberof String.prototype
 * @returns {string}
 */
String.prototype.titleCase = function() {
  if (!this.length) return this;
  return this.toLowerCase().split(' ').reduce((parts, word) => {
    if ( !word ) return parts;
    const title = word.replace(word[0], word[0].toUpperCase());
    parts.push(title);
    return parts;
  }, []).join(' ');
};

/**
 * Strip any <script> tags which were included within a provided string
 * @memberof String.prototype
 * @return {String|*}
 */
String.prototype.stripScripts = function() {
  let el = document.createElement("div");
  el.innerHTML = this;
  for ( let s of el.getElementsByTagName("script") ) {
    s.parentNode.removeChild(s);
  }
  return el.innerHTML;
};

/**
 * Transform any string into a url-viable slug string
 * @memberof String.prototype
 * @param {object} [options]      Optional arguments which customize how the slugify operation is performed
 * @param {string} [options.replacement="-"]  The replacement character to separate terms, default is '-'
 * @param {boolean} [options.strict=false]    Replace all non-alphanumeric characters, or allow them? Default false
 * @return {string}               The slugified input string
 */
String.prototype.slugify = function({replacement='-', strict=false}={}) {

  // Map characters to lower case ASCII
  const charMap = JSON.parse('{"$":"dollar","%":"percent","&":"and","<":"less",">":"greater","|":"or","¢":"cent","£":"pound","¤":"currency","¥":"yen","©":"(c)","ª":"a","®":"(r)","º":"o","À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A","Æ":"AE","Ç":"C","È":"E","É":"E","Ê":"E","Ë":"E","Ì":"I","Í":"I","Î":"I","Ï":"I","Ð":"D","Ñ":"N","Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O","Ø":"O","Ù":"U","Ú":"U","Û":"U","Ü":"U","Ý":"Y","Þ":"TH","ß":"ss","à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","æ":"ae","ç":"c","è":"e","é":"e","ê":"e","ë":"e","ì":"i","í":"i","î":"i","ï":"i","ð":"d","ñ":"n","ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o","ù":"u","ú":"u","û":"u","ü":"u","ý":"y","þ":"th","ÿ":"y","Ā":"A","ā":"a","Ă":"A","ă":"a","Ą":"A","ą":"a","Ć":"C","ć":"c","Č":"C","č":"c","Ď":"D","ď":"d","Đ":"DJ","đ":"dj","Ē":"E","ē":"e","Ė":"E","ė":"e","Ę":"e","ę":"e","Ě":"E","ě":"e","Ğ":"G","ğ":"g","Ģ":"G","ģ":"g","Ĩ":"I","ĩ":"i","Ī":"i","ī":"i","Į":"I","į":"i","İ":"I","ı":"i","Ķ":"k","ķ":"k","Ļ":"L","ļ":"l","Ľ":"L","ľ":"l","Ł":"L","ł":"l","Ń":"N","ń":"n","Ņ":"N","ņ":"n","Ň":"N","ň":"n","Ő":"O","ő":"o","Œ":"OE","œ":"oe","Ŕ":"R","ŕ":"r","Ř":"R","ř":"r","Ś":"S","ś":"s","Ş":"S","ş":"s","Š":"S","š":"s","Ţ":"T","ţ":"t","Ť":"T","ť":"t","Ũ":"U","ũ":"u","Ū":"u","ū":"u","Ů":"U","ů":"u","Ű":"U","ű":"u","Ų":"U","ų":"u","Ŵ":"W","ŵ":"w","Ŷ":"Y","ŷ":"y","Ÿ":"Y","Ź":"Z","ź":"z","Ż":"Z","ż":"z","Ž":"Z","ž":"z","ƒ":"f","Ơ":"O","ơ":"o","Ư":"U","ư":"u","ǈ":"LJ","ǉ":"lj","ǋ":"NJ","ǌ":"nj","Ș":"S","ș":"s","Ț":"T","ț":"t","˚":"o","Ά":"A","Έ":"E","Ή":"H","Ί":"I","Ό":"O","Ύ":"Y","Ώ":"W","ΐ":"i","Α":"A","Β":"B","Γ":"G","Δ":"D","Ε":"E","Ζ":"Z","Η":"H","Θ":"8","Ι":"I","Κ":"K","Λ":"L","Μ":"M","Ν":"N","Ξ":"3","Ο":"O","Π":"P","Ρ":"R","Σ":"S","Τ":"T","Υ":"Y","Φ":"F","Χ":"X","Ψ":"PS","Ω":"W","Ϊ":"I","Ϋ":"Y","ά":"a","έ":"e","ή":"h","ί":"i","ΰ":"y","α":"a","β":"b","γ":"g","δ":"d","ε":"e","ζ":"z","η":"h","θ":"8","ι":"i","κ":"k","λ":"l","μ":"m","ν":"n","ξ":"3","ο":"o","π":"p","ρ":"r","ς":"s","σ":"s","τ":"t","υ":"y","φ":"f","χ":"x","ψ":"ps","ω":"w","ϊ":"i","ϋ":"y","ό":"o","ύ":"y","ώ":"w","Ё":"Yo","Ђ":"DJ","Є":"Ye","І":"I","Ї":"Yi","Ј":"J","Љ":"LJ","Њ":"NJ","Ћ":"C","Џ":"DZ","А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ж":"Zh","З":"Z","И":"I","Й":"J","К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F","Х":"H","Ц":"C","Ч":"Ch","Ш":"Sh","Щ":"Sh","Ъ":"U","Ы":"Y","Ь":"","Э":"E","Ю":"Yu","Я":"Ya","а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ж":"zh","з":"z","и":"i","й":"j","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"c","ч":"ch","ш":"sh","щ":"sh","ъ":"u","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","ё":"yo","ђ":"dj","є":"ye","і":"i","ї":"yi","ј":"j","љ":"lj","њ":"nj","ћ":"c","ѝ":"u","џ":"dz","Ґ":"G","ґ":"g","Ғ":"GH","ғ":"gh","Қ":"KH","қ":"kh","Ң":"NG","ң":"ng","Ү":"UE","ү":"ue","Ұ":"U","ұ":"u","Һ":"H","һ":"h","Ә":"AE","ә":"ae","Ө":"OE","ө":"oe","฿":"baht","ა":"a","ბ":"b","გ":"g","დ":"d","ე":"e","ვ":"v","ზ":"z","თ":"t","ი":"i","კ":"k","ლ":"l","მ":"m","ნ":"n","ო":"o","პ":"p","ჟ":"zh","რ":"r","ს":"s","ტ":"t","უ":"u","ფ":"f","ქ":"k","ღ":"gh","ყ":"q","შ":"sh","ჩ":"ch","ც":"ts","ძ":"dz","წ":"ts","ჭ":"ch","ხ":"kh","ჯ":"j","ჰ":"h","Ẁ":"W","ẁ":"w","Ẃ":"W","ẃ":"w","Ẅ":"W","ẅ":"w","ẞ":"SS","Ạ":"A","ạ":"a","Ả":"A","ả":"a","Ấ":"A","ấ":"a","Ầ":"A","ầ":"a","Ẩ":"A","ẩ":"a","Ẫ":"A","ẫ":"a","Ậ":"A","ậ":"a","Ắ":"A","ắ":"a","Ằ":"A","ằ":"a","Ẳ":"A","ẳ":"a","Ẵ":"A","ẵ":"a","Ặ":"A","ặ":"a","Ẹ":"E","ẹ":"e","Ẻ":"E","ẻ":"e","Ẽ":"E","ẽ":"e","Ế":"E","ế":"e","Ề":"E","ề":"e","Ể":"E","ể":"e","Ễ":"E","ễ":"e","Ệ":"E","ệ":"e","Ỉ":"I","ỉ":"i","Ị":"I","ị":"i","Ọ":"O","ọ":"o","Ỏ":"O","ỏ":"o","Ố":"O","ố":"o","Ồ":"O","ồ":"o","Ổ":"O","ổ":"o","Ỗ":"O","ỗ":"o","Ộ":"O","ộ":"o","Ớ":"O","ớ":"o","Ờ":"O","ờ":"o","Ở":"O","ở":"o","Ỡ":"O","ỡ":"o","Ợ":"O","ợ":"o","Ụ":"U","ụ":"u","Ủ":"U","ủ":"u","Ứ":"U","ứ":"u","Ừ":"U","ừ":"u","Ử":"U","ử":"u","Ữ":"U","ữ":"u","Ự":"U","ự":"u","Ỳ":"Y","ỳ":"y","Ỵ":"Y","ỵ":"y","Ỷ":"Y","ỷ":"y","Ỹ":"Y","ỹ":"y","‘":"\'","’":"\'","“":"\\\"","”":"\\\"","†":"+","•":"*","…":"...","₠":"ecu","₢":"cruzeiro","₣":"french franc","₤":"lira","₥":"mill","₦":"naira","₧":"peseta","₨":"rupee","₩":"won","₪":"new shequel","₫":"dong","€":"euro","₭":"kip","₮":"tugrik","₯":"drachma","₰":"penny","₱":"peso","₲":"guarani","₳":"austral","₴":"hryvnia","₵":"cedi","₸":"kazakhstani tenge","₹":"indian rupee","₽":"russian ruble","₿":"bitcoin","℠":"sm","™":"tm","∂":"d","∆":"delta","∑":"sum","∞":"infinity","♥":"love","元":"yuan","円":"yen","﷼":"rial"}');
  let slug = this.split("").reduce((result, char) => {
    return result + (charMap[char] || char);
  }, "").trim().toLowerCase();

  // Convert any spaces to the replacement character and de-dupe
  slug = slug.replace(new RegExp('[\\s' + replacement + ']+', 'g'), replacement);

  // If we're being strict, replace anything that is not alphanumeric
  if (strict) {
    slug = slug.replace(new RegExp('[^a-zA-Z0-9' + replacement + ']', 'g'), '');
  }
  return slug;
};

/* -------------------------------------------- */
/* Number Methods                               */
/* -------------------------------------------- */

/**
 * Test for near-equivalence of two numbers within some permitted epsilon
 * @memberof Number.prototype
 * @param {number} n      Some other number
 * @param {number} e      Some permitted epsilon, by default 1e-8
 * @returns {boolean}     Are the numbers almost equal?
 */
Number.prototype.almostEqual = function(n, e=1e-8) {
  return Math.abs(this - n) < e;
}

/**
 * Transform a number to an ordinal string representation. i.e.
 * 1 => 1st
 * 2 => 2nd
 * 3 => 3rd
 * @memberof Number.prototype
 * @returns {string}
 */
Number.prototype.ordinalString = function() {
  const s = ["th","st","nd","rd"];
  const v = this % 100;
  return this + (s[(v-20)%10]||s[v]||s[0]);
};

/**
 * Return a string front-padded by zeroes to reach a certain number of numeral characters
 * @memberof Number.prototype
 * @param {number} digits     The number of characters desired
 * @returns {string}          The zero-padded number
 */
Number.prototype.paddedString = function(digits) {
  return this.toString().padStart(digits, "0");
};

/**
 * Return a string prefaced by the sign of the number (+) or (-)
 * @memberof Number.prototype
 * @returns {string}          The signed number as a string
 */
Number.prototype.signedString = function() {
  return (( this < 0 ) ? "" : "+") + this;
};

/**
 * Round a number to the nearest number which is a multiple of a given interval
 * @memberof Number.prototype
 * @param {number} interval     The interval to round the number to the nearest multiple of
 * @param {string} [method=round] The rounding method in: round, ceil, floor
 * @returns {number}            The rounded number
 *
 * @example
 * let n = 17.18;
 * n.toNearest(5); // 15
 * n.toNearest(10); // 20
 * n.toNearest(10, "floor"); // 10
 * n.toNearest(10, "ceil"); // 20
 * n.toNearest(0.25); // 17.25
 */
Number.prototype.toNearest = function(interval=1, method="round") {
  const q = 1 / interval;
  return Math[method](this  * q) / q;
};

/**
 * A faster numeric between check which avoids type coercion to the Number object
 * Since this avoids coercion, if non-numbers are passed in unpredictable results will occur. Use with caution.
 * @memberof Number
 * @param {number} num
 * @param {number} a
 * @param {number} b
 * @param {boolean} inclusive
 * @return {boolean}
 */
Number.between = function(num, a, b, inclusive=true) {
  let min = Math.min(a, b);
  let max = Math.max(a, b);
  return inclusive ? (num >= min) && (num <= max) : (num > min) && (num < max);
};

/**
 * @alias Number.between
 * @memberof Number.prototype
 */
Number.prototype.between = function(a, b, inclusive=true) {
  return Number.between(this, a, b, inclusive);
};

/**
 * Test whether a value is numeric.
 * This is the highest performing algorithm currently available, per https://jsperf.com/isnan-vs-typeof/5
 * @memberof Number
 * @param {*} n       A value to test
 * @return {boolean}  Is it a number?
 */
Number.isNumeric = function(n) {
  if ( n instanceof Array ) return false;
  else if ( [null, ""].includes(n) ) return false;
  return +n === +n;
};

/**
 * Attempt to create a number from a user-provided string.
 * @memberof Number
 * @param {string|number} n   The value to convert; typically a string, but may already be a number.
 * @return {number}           The number that the string represents, or NaN if no number could be determined.
 */
Number.fromString = function(n) {
  if ( typeof n === "number" ) return n;
  if ( (typeof n !== "string") || !n.length ) return NaN;
  n = n.replace(/\s+/g, "");
  return Number(n);
};

/* -------------------------------------------- */
/* Array Methods                                */
/* -------------------------------------------- */

/**
 * Create and initialize an array of length n with integers from 0 to n-1
 * @memberof Array
 * @param {number} n      The desired array length
 * @returns {number[]}    An array of integers from 0 to n
 */
Array.fromRange = function(n) {
  return Array.from(new Array(n).keys());
};

/**
 * Flatten nested arrays by concatenating their contents
 * @memberof Array.prototype
 * @returns {Array<*>}    An array containing the concatenated inner values
 */
Array.prototype.deepFlatten = function() {
  return this.reduce((acc, val) => Array.isArray(val) ? acc.concat(val.deepFlatten()) : acc.concat(val), []);
};

/**
 * Test equality of the values of this array against the values of some other Array
 * @memberof Array.prototype
 * @param {Array} other
 */
Array.prototype.equals = function(other) {
  if ( !(other instanceof Array) || (other.length !== this.length) ) return false;
  return this.every((v, i) => other[i] === v);
};

/**
 * Partition an original array into two children array based on a logical test
 * Elements which test as false go into the first result while elements testing as true appear in the second
 * @memberof Array.prototype
 * @param rule {Function}
 * @return {Array}    An Array of length two whose elements are the partitioned pieces of the original
 */
Array.prototype.partition = function(rule) {
  return this.reduce((acc, val) => {
    let test = rule(val);
    acc[Number(test)].push(val);
    return acc;
  }, [[], []]);
};

/**
 * Join an Array using a string separator, first filtering out any parts which return a false-y value
 * @memberof Array.prototype
 * @param {string} sep    The separator string
 * @return {string}       The joined string, filtered of any false values
 */
Array.prototype.filterJoin = function(sep) {
  return this.filter(p => !!p).join(sep);
};

/**
 * Find an element within the Array and remove it from the array
 * @memberof Array.prototype
 * @param {Function} find   A function to use as input to findIndex
 * @param {any} [replace]   A replacement for the spliced element
 * @return {any|null}       The replacement element, the removed element, or null if no element was found.
 */
Array.prototype.findSplice = function(find, replace) {
  const idx = this.findIndex(find);
  if ( idx === -1 ) return null;
  if ( replace !== undefined ) {
    this.splice(idx, 1, replace);
    return replace;
  } else {
    const item = this[idx];
    this.splice(idx, 1);
    return item;
  }
};

/* -------------------------------------------- */
/* Date Methods                                 */
/* -------------------------------------------- */

/**
 * Test whether a Date instance is valid.
 * A valid date returns a number for its timestamp, and NaN otherwise.
 * NaN is never equal to itself.
 * @memberof Date.prototype
 * @returns {boolean}
 */
Date.prototype.isValid = function() {
  return this.getTime() === this.getTime();
};

/**
 * Return a standard YYYY-MM-DD string for the Date instance.
 * @memberof Date.prototype
 * @returns {string}    The date in YYYY-MM-DD format
 */
Date.prototype.toDateInputString = function() {
  const yyyy = this.getFullYear();
  const mm = (this.getMonth() + 1).paddedString(2);
  const dd = this.getDate().paddedString(2);
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Return a standard H:M:S.Z string for the Date instance.
 * @memberof Date.prototype
 * @returns {string}    The time in H:M:S format
 */
Date.prototype.toTimeInputString = function() {
  return this.toTimeString().split(" ")[0];
};

/* -------------------------------------------- */
/*  RegExp Helpers                              */
/* -------------------------------------------- */

/**
 * Escape a given input string, prefacing special characters with backslashes for use in a regular expression
 * @memberof RegExp
 * @param {string} string     The un-escaped input string
 * @returns {string}          The escaped string, suitable for use in regular expression
 */
RegExp.escape = function(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
