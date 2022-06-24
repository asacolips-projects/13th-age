import Collection from "../utils/collection.mjs";
import {randomID} from "../utils/helpers.mjs";

/**
 * An extension of the Collection.
 * Used for the specific task of containing embedded Document instances within a parent Document.
 * @param {DocumentData} documentData The parent DocumentData instance to which this collection belongs
 * @param {object[]} sourceArray      The source data array for the collection in the parent Document data
 * @param {Function} documentClass    The Document class implementation contained by the collection
 */
class EmbeddedCollection extends Collection {
  constructor(documentData, sourceArray, documentClass) {
    super();

    /**
     * The parent DocumentData to which this EmbeddedCollection instance belongs.
     * @type {DocumentData}
     */
    Object.defineProperty(this, "parent", {
      value: documentData,
      writable: false
    });

    /**
     * The parent Document to which this EmbeddedCollection instance belongs.
     * @type {DocumentData}
     */
    Object.defineProperty(this, "document", {
      value: documentData.document,
      writable: false
    });

    /**
     * The Document implementation used to construct instances within this collection
     * @type {Function}
     */
    Object.defineProperty(this, "documentClass", {
      value: documentClass,
      writable: false
    });

    /**
     * The source data array from which the embedded collection is created
     * @type {object[]}
     * @private
     */
    Object.defineProperty(this, "_source", {
      value: sourceArray,
      writable: false
    });

    // Initialize the collection contents
    this._initialize();
  }

  /* -------------------------------------------- */

  /**
   * Initialize the EmbeddedCollection object by constructing its contained Document instances
   * @private
   */
  _initialize() {
    this.clear();
    for ( let d of this._source ) {
      if ( !d._id ) d._id = randomID(16);
      let doc;
      try {
        doc = new this.documentClass(d, {parent: this.document});
        this.set(doc.id, doc, {modifySource:false});
      } catch(err) {
        err.message = `Failed to initialized ${this.documentClass.documentName} [${d._id}] in ${this.document.documentName} [${this.parent._id}]: ${err.message}`;
        globalThis.logger.error(err);
        if ( globalThis.Hooks ) {
          Hooks.onError("EmbeddedCollection#_initialize", err, {id: d._id, documentName: this.document.documentName});
        }
      }
    }
  }

  /* ---------------------------------------- */

  /** @inheritdoc */
  set(key, value, {modifySource=true}={}) {
    if ( modifySource && !this.has(key) ) this._source.push(value.data._source);
    return super.set(key, value);
  }

  /* ---------------------------------------- */

  /** @inheritdoc */
  delete(key, {modifySource=true}={}) {
    if ( modifySource && this.has(key) ) this._source.findSplice(d => d._id === key);
    return super.delete(key);
  }

  /* ---------------------------------------- */

  /**
   * Convert the EmbeddedCollection to an array of simple objects.
   * @param {boolean} [source=true]     Draw data for contained Documents from the underlying data source?
   * @returns {object[]}                The extracted array of primitive objects
   */
  toObject(source=true) {
    const arr = [];
    for ( let doc of this.values() ) {
      arr.push(doc.data.toObject(source));
    }
    return arr;
  }
}

// Export default at the end to allow for JSDoc indexing
export default EmbeddedCollection;
