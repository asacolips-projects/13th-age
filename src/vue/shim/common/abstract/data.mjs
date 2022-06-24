import Document from "./document.mjs";
import EmbeddedCollection from "./embedded-collection.mjs";
import {deepClone, diffObject, expandObject, getType, mergeObject, randomID} from "../utils/helpers.mjs";

/**
 * A schema entry which describes a field of DocumentData
 * @typedef {Object} DocumentField
 * @property {*} type                 An object which defines the data type of this field
 * @property {boolean} required       Is this field required to have an assigned value? Default is false.
 * @property {boolean} [nullable]     Can the field be populated by a null value? Default is true.
 * @property {Function|*} [default]   A static default value or a function which assigns a default value
 * @property {boolean} [collection]
 * @property {Function} [clean]       An optional cleaning function which sanitizes input data to this field
 * @property {Function} [validate]    A function which asserts that the value of this field is valid
 * @property {string} [validationError] An error message which is displayed if validation fails
 * @property {boolean} [isCollection] Is the field an embedded Document collection?
 */

/**
 * The schema of a Document
 * @typedef {Object<DocumentField>}   DocumentSchema
 */

/**
 * The abstract base class which defines the data schema contained within a Document.
 * @param {object} [data={}]        Initial data used to construct the data object
 * @param {Document} [document]     The document to which this data object belongs
 * @abstract
 * @interface
 * @memberof abstract
 */
class DocumentData {
  constructor(data={}, document=null) {

    /**
     * An immutable reverse-reference to the Document to which this data belongs, possibly null.
     * @type {Document|null}
     */
    Object.defineProperty(this, "document", {value: document, writable: false});

    /**
     * The source data object. The contents of this object can be updated, but the object itself may not be replaced.
     * @type {object}
     */
    Object.defineProperty(this, "_source", {value: this._initializeSource(data), writable: false});

    // Strictly validate the source data, replacing any invalid values
    this.validate({children: false, replace: true, strict: true});

    // Initialize the data
    this._initialize();
  }

  /* ---------------------------------------- */
  /*  Data Schema                             */
  /* ---------------------------------------- */

  /**
   * The primary identifier for the Document to which this data object applies.
   * This identifier is unique within the parent collection which contains the Document.
   * @type {string|null}
   * @protected
   */
  _id = null;

  /**
   * Define the data schema for documents of this type.
   * The schema is populated the first time it is accessed and cached for future reuse.
   * @returns {DocumentSchema}
   */
  static defineSchema() {
    throw new Error("A subclass of DocumentData must define its Document schema");
  }

  /**
   * Define the data schema for documents of this type.
   * @type {DocumentSchema}
   */
  static get schema() {
    if ( !this._schema ) {
      Object.defineProperty(this, "_schema", {value: this.defineSchema(), writable: false});
    }
    return this._schema;
  }

  /**
   * Define the data schema for this document instance.
   * @alias {DocumentData.schema}
   * @type {DocumentSchema}
   */
  get schema() {
    return this.constructor.schema;
  }

  /* ---------------------------------------- */
  /*  Data Initialization and Validation      */
  /* ---------------------------------------- */

  /**
   * Initialize the source data object in-place
   * @param {object} data
   * @returns {object}
   * @protected
   */
  _initializeSource(data) {
    if ( !(typeof data === "object") ) {
      logger.error(`${this.constructor.name} inside an ${this.document.documentName} document was incorrectly 
      constructed with a ${typeof data} instead of an object. Attempting to fall back to default values.`)
      data = {};
    }
    const schema = this.schema;
    if ( !("_id" in schema) ) delete this._id; // Some documents do not use _id
    else if ( !data._id ) delete data._id;     // Disallow blank _id value

    // Iterate over the document schema, updating the provided data
    for ( let [name, field] of Object.entries(schema) ) {
      let value = data[name];

      // Ensure null values are allowed
      if ( (value === null) && !field.nullable ) value = undefined;

      // Treat optional empty strings as undefined
      if ( (field.type === String) && !field.required && (value === "") ) value = field.nullable ? null : undefined;

      // Assign default values to undefined fields
      if ( value === undefined ) {
        value = DocumentData._getFieldDefaultValue(field, data);
      }

      // Clean a provided input value
      else if ( field.clean ) {
        value = field.clean(value);
      }

      // Store the source data
      data[name] = value;
    }
    return data;
  }

  /* ---------------------------------------- */

  /**
   * Get the default value for a schema field, conditional on the provided data
   * @param {DocumentField} field   The configured data field
   * @param {object} data           The provided data object
   * @returns {undefined|*}         The default value for the field
   * @protected
   */
  static _getFieldDefaultValue(field, data) {
    if ( field.default === undefined ) return undefined;
    if ( field.default instanceof Function ) return field.default(data);
    return deepClone(field.default);
  }

  /* ---------------------------------------- */

  /**
   * Initialize the instance by copying data from the source object to instance attributes.
   * @protected
   */
  _initialize() {
    const schema = this.schema;
    for ( let [name, field] of Object.entries(schema) ) {
      const t = field.type;
      let value = this._source[name];

      // No further actions for ignored values
      if ( IGNORED_VALUES.includes(value) ) {
        this[name] = value;
        continue;
      }

      // Object collections
      const mt = getType(t);
      if ( mt === "Object" ) {
        let cls = Object.values(t).shift();
        const current = this[name];
        if ( current instanceof EmbeddedCollection ) {
          for ( let e of current ) {
            e.data._initialize();
          }
        }
        else {
          if ( !(value instanceof Array) ) {
            logger.warn(`Cannot initialize the ${name} EmbeddedCollection from source data which is not an Array`);
            value = [];
          }
          this[name] = new EmbeddedCollection(this, value, cls.implementation);
        }
        continue;
      }

      // Arrays of values
      if ( mt === "Array" ) {
        const cls = t[0];
        const arr = value || [];
        this[name] = arr.map(v => this._initializeType(cls, v));
        continue;
      }

      // Single value
      this[name] = this._initializeType(t, value);
    }
  }

  /* ---------------------------------------- */

  /**
   * Initialize the value for a given data type
   * @param {*} type    The type of the data field
   * @param {*} value   The un-initialized value
   * @returns {*}       The initialized value
   * @protected
   */
  _initializeType(type, value) {

    // Untyped data can be any value
    if ( type === undefined ) return;

    // Native data types
    if ( type === Object ) return deepClone(value);
    if ( PRIMITIVE_TYPES.includes(type) ) return value instanceof type ? value : type(value);
    if ( INSTANCE_TYPES.includes(type) ) return value instanceof type ? value : new type(value);
    if ( DATE_TYPES.includes(type) ) return typeof value === "number" ? value : Date.parse(value);

    // Single Document
    if (type.prototype instanceof Document) {
      return new type.implementation(value, {parent: this.document});
    }

    // Embedded Data
    if ( type.prototype instanceof DocumentData ) {
      return new type(value, this.document);
    }

    // Throw errors for un-handled types
    throw new Error(`Unhandled schema data type ${type}`);
  }

  /* ---------------------------------------- */

  /**
   * Validate the data contained in the document to check for type and content
   * This function throws an error if data within the document is not valid
   *
   * @param {object} options          Optional parameters which customize how validation occurs.
   * @param {object} [options.changes]    Only validate the keys of an object that was changed.
   * @param {boolean} [options.children]  Validate the data of child embedded documents? Default is true.
   * @param {boolean} [options.clean]     Apply field-specific cleaning functions to the provided value.
   * @param {boolean} [options.replace]   Replace any invalid values with valid defaults? Default is false.
   * @param {boolean} [options.strict]    If strict, will throw errors for any invalid data. Default is false.
   * @return {boolean}                An indicator for whether or not the document contains valid data
   */
  validate({changes, children=true, clean=false, replace=false, strict=false}={}) {
    const source = changes || this._source;
    let isValid = true;

    // Individual field-level validations
    for (let [name, field] of Object.entries(this.schema)) {
      if ( !source.hasOwnProperty(name) ) continue;

      // Scrub the current value
      let value = source[name];
      if ( clean ) {
        if ( field.clean ) source[name] = value = field.clean(value);
        if ( !value ) {
          if ( !field.required ) value = undefined;
          else if ( field.nullable ) value = null;
        }
      }

      // Validate the candidate value
      try {
        this._validateField(name, field, value, {children});
      } catch(err) {
        let cured = false;

        // Replace invalid values with valid ones
        if ( replace) {
          if ( !field.required ) { // Remove non-required values
            source[name] = undefined;
            cured = true;
          }
          else if ( field.default !== undefined ) { // Fall-back to default value
            source[name] = DocumentData._getFieldDefaultValue(field, this);
            cured = true;
          }
        }

        // If the failure was not cured, mark the data as invalid. Throw an error, or warn
        if ( !cured ) {
          isValid = false;
          if ( strict ) throw err;
        }
        logger.warn(err.message);
      }
    }

    // Holistic document-level validation tests
    if ( !changes ) {
      try {
        this._validateDocument();
      } catch (err) {
        isValid = false;
        if (strict) throw err;
        else logger.error(err);
      }
    }
    return isValid;
  }

  /* ---------------------------------------- */

  /**
   * Build and return the error message for a Missing Field
   * @param {string} name             The named field that is missing
   * @param {DocumentField} field     The configured DocumentField from the Schema
   * @returns {string}                The error message
   * @protected
   */
  _getMissingFieldErrorMessage(name, field) {
    let msg = `Required field "${name}" not present in ${this.constructor.name}`;
    if ( this._id ) msg = `[${this._id}] ` + msg;
    return msg;
  }

  /**
   * Build and return the error message for an Invalid Field Value
   * @param {string} name             The named field that is invalid
   * @param {DocumentField} field     The configured DocumentField from the Schema
   * @param value                     The value that is invalid
   * @returns {string}                The error message
   * @protected
   */
  _getInvalidFieldValueErrorMessage(name, field, value) {
    let msg = field.validationError;
    if ( msg ) msg = msg.replace("{name}", this.constructor.name).replace("{field}", name).replace("{value}", value);
    else msg = `${this.constructor.name} field "${name}" failed provided validation rule.`;
    if ( this._id ) msg = `[${this._id}] ${msg}`;

    return msg;
  }

  /**
   * Validate a single field in the data object.
   * Assert that required fields are present and that each value passes it's validator function if one is provided.
   * @param {string} name             The named field being validated
   * @param {DocumentField} field     The configured DocumentField from the Schema
   * @param {*} value                 The current field value
   * @param {boolean} [children]      Validate the data of child embedded documents? Default is true.
   * @protected
   */
  _validateField(name, field, value, {children=true}={}) {

    // Allow nulls
    if ( field.nullable && (value === null) ) return true;

    // Ensure required fields are present
    if ( (value === undefined) || (value === null) ) {
      if ( (name === "_id") || !field.required ) return true;
      else {
        throw new Error(this._getMissingFieldErrorMessage(name, field));
      }
    }

    // Validate inner documents
    if ( value instanceof Document ) {
      return children ? value.data.validate() : true;
    }

    // Apply field validator function
    const fn = field.validate;
    if ( !fn ) return true;
    let isValid;
    try {
      isValid = fn(value);
    } catch (err) {
      isValid = false;
    }

    // Throw errors if invalid
    if (!isValid) {
      throw new Error(this._getInvalidFieldValueErrorMessage(name, field, value));
    }
  }

  /* ---------------------------------------- */

  /**
   * Jointly validate the overall document after each field has been individually validated.
   * Throw an Error if any issue is encountered.
   * @protected
   */
  _validateDocument() {}

  /* ---------------------------------------- */

  /**
   * Reset the state of this data instance back to mirror the contained source data, erasing any changes.
   */
  reset() {
    this._initialize();
  }

  /* ---------------------------------------- */

  /**
   * Update the data by applying a new data object. Data is compared against and merged with the existing data.
   * Updating data which already exists is strict - it must pass validation or else the update is rejected.
   * An object is returned which documents the set of changes which were applied to the original data.
   * @see utils.mergeObject
   * @param {object} data     New values with which to update the Data object
   * @param {object} options  Options which determine how the new data is merged
   * @returns {object}        The changed keys and values which are different than the previous data
   */
  update(data={}, options={}) {

    // Expand the object, if dot-notation keys are provided
    if ( Object.keys(data).some(k => /\./.test(k)) ) data = expandObject(data);

    // Iterate over fields which have been changed relative to the original
    const changes = options.diff ? diffObject(this._source, data) : data;
    const backup = {};
    const collections = {};

    // Backup each change, withholding collections for specialized updating
    for ( let k of Object.keys(changes) ) {
      backup[k] = deepClone(this._source[k]);
      if ( this[k] instanceof EmbeddedCollection ) {
        this.updateCollection(this[k], changes[k], options);
        collections[k] = changes[k];
        delete changes[k];
      }
    }

    // Merge changes into the source object
    mergeObject(this._source, changes, {
      insertValues: options.insertValues ?? true,
      insertKeys: options.insertKeys ?? true,
      recursive: options.recursive ?? true,
      enforceTypes: options.enforceTypes ?? false,
      overwrite: true,
      inplace: true
    });

    // Restore collections to the set of changes
    for ( let k of Object.keys(collections) ) {
      changes[k] = collections[k];
    }

    // Validate the updated document or roll-back to the prior state
    try {
      this.validate({changes: data, clean: true, strict: true});
      this.reset();
    } catch(err) {
      if ( !options.rollback ) this.update(backup, {rollback: true});
      throw err;
    }
    return changes;
  }

  /* ---------------------------------------- */

  /**
   * Update an EmbeddedCollection using an array of provided document data
   * @param {EmbeddedCollection} collection       The EmbeddedCollection to update
   * @param {DocumentData[]} documentData         An array of provided Document data
   * @param {object} [options={}]                 Additional options which modify how the collection is updated
   */
  updateCollection(collection, documentData, options) {
    const currentIds = Array.from(collection.keys());
    const updated = new Set();

    // Create or update documents within the collection
    for ( let data of documentData ) {
      if ( !data._id ) data._id = randomID(16);
      const current = collection.get(data._id);
      if ( current ) current.data.update(data, options);
      else {
        const doc = new collection.documentClass(data, {parent: this.document});
        collection.set(doc.id, doc);
      }
      updated.add(data._id);
    }

    // If the update was not recursive, remove all non-updated documents
    if ( options.recursive === false ) {
      for ( let id of currentIds ) {
        if ( !updated.has(id) ) collection.delete(id);
      }
    }
  }

  /* ---------------------------------------- */
  /*  Serialization and Storage               */
  /* ---------------------------------------- */

  /**
   * Copy and transform the DocumentData into a plain object.
   * Draw the values of the extracted object from the data source (by default) otherwise from its transformed values.
   * @param {boolean} [source=true]     Draw values from the underlying data source rather than transformed values
   * @returns {object}                  The extracted primitive object
   */
  toObject(source=true) {
    const data = {};
    for ( let k of Object.keys(this.schema) ) {
      const v = source ? this._source[k] : this[k];
      if ( v instanceof Object ) {
        data[k] = v.toObject ? v.toObject(source) : deepClone(v);
      }
      else data[k] = v;
    }
    return data;
  }

  /* ---------------------------------------- */

  /**
   * Extract the source data for the DocumentData into a simple object format that can be serialized.
   * @returns {object}          The document source data expressed as a plain object
   */
  toJSON() {
    return this.toObject(true);
  }

  /* ---------------------------------------- */

  /**
   * Create a DocumentData instance using a provided serialized JSON string.
   * @param {string} json       Serialized document data in string format
   * @returns {DocumentData}    A constructed data instance
   */
  static fromJSON(json) {
    const data = JSON.parse(json);
    return new this(data);
  }
}

const PRIMITIVE_TYPES = [String, Number, Boolean];
const INSTANCE_TYPES = [Array];
const DATE_TYPES = [Date];
const IGNORED_VALUES = [undefined, null];

// Export default at the end to allow for JSDoc indexing
export default DocumentData;
