/** @module validators */

import {IMAGE_FILE_EXTENSIONS, VIDEO_FILE_EXTENSIONS, AUDIO_FILE_EXTENSIONS} from "../constants.mjs";

/**
 * Test whether a string is a valid 16 character UID
 * @param {string} id
 * @return {boolean}
 */
export function isValidId(id) {
  return /^[a-zA-Z0-9]{16}$/.test(id);
}

/**
 * Test whether a file path has an extension in a list of provided extensions
 * @param {string} path
 * @param {string[]} extensions
 * @return {boolean}
 * @private
 */
export function _hasFileExtension(path, extensions) {
  const xts = extensions.map(ext => `\\.${ext}`).join("|");
  const rgx = new RegExp(`(${xts})(\\?.*)?$`, "i");
  return !!path && rgx.test(path);
}

/**
 * Test whether a file path has a valid image file extension or is base64 PNG data
 * @param {String} path     The image path to test
 * @return {boolean}        Is the path valid?
 */
export function hasImageExtension(path) {
  return _hasFileExtension(path, Object.keys(IMAGE_FILE_EXTENSIONS)) || isBase64Image(path);
}

/**
 * Test whether a data blob represents a base64 image
 * @param {string} data       A base64 data string
 * @return {boolean}          Is it a base64 image?
 */
export function isBase64Image(data) {
  return /^data:image\/(png|jpeg|webp);base64,/.test(data);
}

/**
 * Test whether an input represents a valid 6-character color string
 * @param {string} color      The input string to test
 * @return {boolean}          Is the string a valid color?
 */
export function isColorString(color) {
  return /#[0-9A-Fa-f]{6}/.test(color);
}

/**
 * Test whether a file path has a valid audio file extension
 * @param {string} path       The image path to test
 * @return {boolean}          Is the path valid?
 */
export function hasVideoExtension(path) {
  return _hasFileExtension(path, Object.keys(VIDEO_FILE_EXTENSIONS));
}

/**
 * Test whether a file path has a valid video file extension
 * @param {string} path       The image path to test
 * @return {boolean}          Is the path valid?
 */
export function hasAudioExtension(path) {
  return _hasFileExtension(path, Object.keys(AUDIO_FILE_EXTENSIONS));
}

/**
 * Assert that the given value is in an array of allowed options
 * @param {any} val           The value to test
 * @param {any[]} array       The set of allowed options
 * @return {boolean}          Is the valid included?
 */
export function valueInArray(val, array) {
  return array.includes(val);
}

/**
 * Assert that the given value parses as a valid JSON string
 * @param {string} val        The value to test
 * @return {boolean}          Is the String valid JSON?
 */
export function isJSON(val) {
  try {
    JSON.parse(val);
    return true;
  } catch(err) {
    return false;
  }
}
