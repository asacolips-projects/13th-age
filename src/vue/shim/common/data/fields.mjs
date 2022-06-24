/** @module fields */
import {DOCUMENT_PERMISSION_LEVELS} from "../constants.mjs";
import {
  hasImageExtension,
  isColorString,
  isValidId,
  isJSON,
  hasAudioExtension,
  hasVideoExtension
} from "./validators.mjs";
import {deepClone, mergeObject} from "../utils/helpers.mjs";

/* ---------------------------------------- */
/*  Standard Data Types                     */
/* ---------------------------------------- */

/**
 * A required boolean field which may be used in a Document.
 * @type {DocumentField}
 */
export const BOOLEAN_FIELD = {
  type: Boolean,
  required: true,
  default: false
};

/**
 * A standard string color field which may be used in a Document.
 * @type {DocumentField}
 */
export const COLOR_FIELD = {
  type: String,
  required: false,
  nullable: true,
  validate: isColorString,
  validationError: '{name} {field} "{value}" is not a valid hexadecimal color string'
};

/**
 * A standard string field for an image file path which may be used in a Document.
 * @type {DocumentField}
 */
export const IMAGE_FIELD = {
  type: String,
  required: false,
  nullable: true,
  validate: hasImageExtension,
  validationError: '{name} {field} "{value}" does not have a valid image file extension'
};

/**
 * A standard string field for a video or image file path may be used in a Document.
 * @type {DocumentField}
 */
export const VIDEO_FIELD = {
  type: String,
  required: false,
  nullable: true,
  validate: src => hasImageExtension(src) || hasVideoExtension(src),
  validationError: '{name} {field} "{value}" does not have a valid image or video file extension'
};

/**
 * A standard string field for an audio file path which may be used in a Document.
 * @type {DocumentField}
 */
export const AUDIO_FIELD = {
  type: String,
  required: false,
  nullable: true,
  validate: src => (src === null) || hasAudioExtension(src),
  validationError: '{name} {field} "{value}" does not have a valid audio file extension'
};

/**
 * A standard integer field which may be used in a Document.
 * @type {DocumentField}
 */
export const INTEGER_FIELD = {
  type: Number,
  required: false,
  validate: Number.isInteger,
  validationError: '{name} {field} "{value}" does not have an integer value'
};

/**
 * A string field which contains serialized JSON data that may be used in a Document.
 * @type {DocumentField}
 */
export const JSON_FIELD = {
  type: String,
  required: false,
  clean: s => typeof s === "string" ? s : JSON.stringify(s),
  validate: isJSON,
  validationError: '{name} {field} "{value}" is not a valid JSON string'
};

/**
 * A non-negative integer field which may be used in a Document.
 * @type {DocumentField}
 */
export const NONNEGATIVE_INTEGER_FIELD = {
  type: Number,
  required: false,
  validate: n => Number.isInteger(n) && (n >= 0),
  validationError: '{name} {field} "{value}" does not have an non-negative integer value'
};

/**
 * A non-negative integer field which may be used in a Document.
 * @type {DocumentField}
 */
export const POSITIVE_INTEGER_FIELD = {
  type: Number,
  required: false,
  validate: n => Number.isInteger(n) && (n > 0),
  validationError: '{name} {field} "{value}" does not have an non-negative integer value'
};

/**
 * A template for a required inner-object field which may be used in a Document.
 * @type {DocumentField}
 */
export const OBJECT_FIELD = {
  type: Object,
  default: {},
  required: true
};

/**
 * An optional string field which may be included by a Document.
 * @type {DocumentField}
 */
export const STRING_FIELD = {
  type: String,
  required: false,
  nullable: false
};

/**
 * An optional numeric field which may be included in a Document.
 * @type {DocumentField}
 */
export const NUMERIC_FIELD = {
  type: Number,
  required: false,
  nullable: true
};

/**
 * A required numeric field which may be included in a Document and may not be null.
 * @type {DocumentField}
 */
export const REQUIRED_NUMBER = {
  type: Number,
  required: true,
  nullable: false,
  default: 0
};

/**
 * A field used to designate a non-negative number
 * @type {DocumentField}
 */
export const NONNEGATIVE_NUMBER_FIELD = {
  type: Number,
  required: true,
  nullable: false,
  default: 0,
  validate: n => Number.isFinite(n) && n >= 0,
  validationError: '{name} {field} "{value}" must be a non-negative number'
}

/**
 * A required numeric field which must be a positive finite value that may be included in a Document.
 * @type {DocumentField}
 */
export const REQUIRED_POSITIVE_NUMBER = {
  type: Number,
  required: true,
  nullable: false,
  validate: n => Number.isFinite(n) && n > 0,
  validationError: '{name} {field} "{value}" is not a positive number'
};

/**
 * A required numeric field which represents an angle of rotation in degrees between 0 and 360.
 * @type {DocumentField}
 */
export const ANGLE_FIELD = {
  type: Number,
  required: true,
  nullable: false,
  default: 360,
  clean: n => Math.normalizeDegrees(n),
  validate: n => n.between(0, 360, true),
  validationError: '{name} {field} "{value}" is not a number between 0 and 360'
};

/**
 * A required numeric field which represents a uniform number between 0 and 1.
 * @type {DocumentField}
 */
export const ALPHA_FIELD = {
  type: Number,
  required: true,
  nullable: false,
  default: 1,
  validate: n => n.between(0, 1, true),
  validationError: '{name} {field} "{value}" is not a number between 0 and 1'
};


/**
 * A string field which requires a non-blank value and may not be null.
 * @type {DocumentField}
 */
export const REQUIRED_STRING = {
  type: String,
  required: true,
  nullable: false,
  clean: v => v ? String(v).trim() : undefined
};

/**
 * A string field which is required, but may be left blank as an empty string.
 * @type {DocumentField}
 */
export const BLANK_STRING = {
  type: String,
  required: true,
  nullable: false,
  clean: v => v? String(v).trim() : "",
  default: ""
};

/**
 * A field used for integer sorting of a Document relative to its siblings
 * @type {DocumentField}
 */
export const INTEGER_SORT_FIELD = {
  type: Number,
  required: true,
  default: 0,
  validate: Number.isInteger,
  validationError: '{name} {field} "{value}" is not an integer'
};

/**
 * A numeric timestamp field which may be used in a Document.
 * @type {DocumentField}
 */
export const TIMESTAMP_FIELD = {
  type: Number,
  required: false,
  default: Date.now,
  nullable: false
};

/* ---------------------------------------- */
/*  Special Document Fields                 */
/* ---------------------------------------- */

/**
 * Validate that the ID of a Document object is either null (not yet saved) or a valid string.
 * @param {string|null} id      The _id to test
 * @returns {boolean}           Is it valid?
 * @private
 */
function _validateId(id) {
  return (id === null) || isValidId(id);
}

/**
 * The standard identifier for a Document.
 * @type {DocumentField}
 */
export const DOCUMENT_ID = {
  type: String,
  required: true,
  default: null,
  nullable: false,
  validate: _validateId,
  validationError: '{name} {field} "{value}" is not a valid document ID string'
};

/**
 * The standard permissions object which may be included by a Document.
 * @type {DocumentField}
 */
export const DOCUMENT_PERMISSIONS = {
  type: Object,
  required: true,
  nullable: false,
  default: {"default": DOCUMENT_PERMISSION_LEVELS.NONE},
  validate: _validatePermissions,
  validationError: '{name} {field} "{value}" is not a mapping of user IDs and document permission levels'
};

/**
 * Validate the structure of the permissions object: all keys are valid IDs and all values are permission levels
 * @param {object} perms      The provided permissions object
 * @returns {boolean}         Is the object valid?
 * @private
 */
function _validatePermissions(perms) {
  for ( let [k, v] of Object.entries(perms) ) {
    if ((k !== "default") && !isValidId(k)) return false;
    if (!Object.values(DOCUMENT_PERMISSION_LEVELS).includes(v)) return false;
  }
  return true;
}

/* ---------------------------------------- */
/*  Dynamic Fields                          */
/* ---------------------------------------- */

/**
 * Create a foreign key field which references a primary Document id
 * @returns {DocumentField}
 */
export function foreignDocumentField(options) {
  return {
    type: String,
    required: options.required ?? false,
    nullable: options.nullable ?? true,
    default: options.default || null,
    clean: d => {
      if ( d instanceof options.type ) return d.id;
      return d || null
    },
    validate: _validateId,
    validationError: `{name} {field} "{value}" is not a valid ${options.type.documentName} id`
  }
}

/**
 * Create a special field which contains a Collection of embedded Documents
 * @param {Function} document       The Document class definition
 * @param {object} [options={}]     Additional field options
 * @returns {DocumentField}
 */
export function embeddedCollectionField(document, options={}) {
  return {
    type: {
      [document.documentName]: document
    },
    required: options.required ?? true,
    default: options.default || [],
    isCollection: true
  }
}

/**
 * A special field which contains a data object defined from the game System model.
 * @param {Function} document         The Document class definition
 * @returns {DocumentField}
 */
export function systemDataField(document) {
  return {
    type: Object,
    default: data => {
      const model = game.system?.model?.[document.documentName];
      if ( !model ) return {};
      return deepClone(model[data.type] || {});
    },
    required: true
  }
}

/**
 * Return a document field which is a modification of a static field type
 * @returns {DocumentField}
 */
export function field(field, options={}) {
  return mergeObject(options, field, {overwrite: false, recursive: false});
}

