import Document from "./document.mjs";
import {expandObject, mergeObject} from "../utils/helpers.mjs";

/**
 * An interface shared by both the client and server-side which defines how creation, update, and deletion operations are transacted.
 * @abstract
 * @interface
 * @memberof abstract
 */
class DatabaseBackend {

  /* -------------------------------------------- */
  /*  Get Operations                              */
  /* -------------------------------------------- */

  /**
   * Retrieve Documents based on provided query parameters
   * @param {Function} documentClass        The Document definition
   * @param {object} request                The requested operation
   * @param {BaseUser} user                 The requesting User
   * @returns {Document[]}                  The created Document instances
   */
  async get(documentClass, request, user) {
    const parent = await this._getParent(request);
    request = this._getArgs(request);
    if ( parent ) return this._getEmbeddedDocuments(documentClass, parent, request, user);
    else return this._getDocuments(documentClass, request, user);
  }

  /* -------------------------------------------- */

  /**
   * Validate the arguments passed to the get operation
   * @param {object} request                The requested operation
   * @param {object} [request.query={}]     A document search query to execute
   * @param {object} [request.options={}]   Operation options
   * @param {string} [request.pack]         A Compendium pack identifier
   * @private
   */
  _getArgs({query={}, options={}, pack}={}) {
    options = mergeObject({index: false}, options);
    if ( pack && !this.getCompendiumScopes().includes(pack) ) {
      throw new Error(`Compendium pack ${pack} is not a valid Compendium identifier`);
    }
    options.broadcast = false; // never broadcast get requests
    return {query, options, pack};
  }

  /* -------------------------------------------- */

  /**
   * Get primary Document instances
   * @protected
   */
  async _getDocuments(documentClass, request, user) {}

  /* -------------------------------------------- */

  /**
   * Get embedded Document instances
   * @protected
   */
  async _getEmbeddedDocuments(documentClass, parent, request, user) {}

  /* -------------------------------------------- */

  /**
   * Get the parent Document (if any) associated with a request
   * @param {object} request                The requested operation
   * @return {Promise<Document|null>}       The parent Document, or null
   * @private
   */
  async _getParent(request) {
    if ( !request.parent ) return null;
    if ( !(request.parent instanceof Document) ) {
      throw new Error("A parent Document provided to the database operation must be a Document instance");
    }
    return request.parent;
  }

  /* -------------------------------------------- */
  /*  Create Operations                           */
  /* -------------------------------------------- */

  /**
   * Perform document creation operations
   * @param {Function} documentClass        The Document definition
   * @param {object} request                The requested operation
   * @param {BaseUser} user                 The requesting User
   * @returns {Document[]}                  The created Document instances
   */
  async create(documentClass, request, user) {
    const parent = await this._getParent(request);
    request = this._createArgs(request);
    if ( parent ) return this._createEmbeddedDocuments(documentClass, parent, request, user);
    else return this._createDocuments(documentClass, request, user);
  }

  /* -------------------------------------------- */

  /**
   * Validate the arguments passed to the create operation
   * @param {object} request                The requested operation
   * @param {object[]} request.data         An array of document data
   * @param {object} [request.options={}]   Operation options
   * @param {string} [request.pack]         A Compendium pack identifier
   * @private
   */
  _createArgs({data=[], options={}, pack}={}) {
    if ( !(data instanceof Array) ) {
      throw new Error("The data provided to the DatabaseBackend#create operation must be an array of data objects");
    }
    options = mergeObject({temporary: false, renderSheet: false, render: true}, options);
    if ( pack && !this.getCompendiumScopes().includes(pack) ) {
      throw new Error(`Compendium pack ${pack} is not a valid Compendium identifier`);
    }
    if ( options.temporary ) options.noHook = true;
    return {data, options, pack};
  }

  /* -------------------------------------------- */

  /**
   * Create primary Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _createDocuments(documentClass, request, user) {}

  /* -------------------------------------------- */

  /**
   * Create embedded Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _createEmbeddedDocuments(documentClass, parent, request, user) {}

  /* -------------------------------------------- */
  /*  Update Operations                           */
  /* -------------------------------------------- */

  /**
   * Perform document update operations
   * @param {Function} documentClass        The Document definition
   * @param {object} request                The requested operation
   * @param {BaseUser} user                 The requesting User
   * @returns {Document[]}                  The updated Document instances
   */
  async update(documentClass, request, user) {
    const parent = await this._getParent(request);
    request = this._updateArgs(request);
    if ( parent ) return this._updateEmbeddedDocuments(documentClass, parent, request, user);
    else return this._updateDocuments(documentClass, request, user);
  }

  /* -------------------------------------------- */

  /**
   * Validate the arguments passed to the update operation
   * @param {object} request                The requested operation
   * @param {object[]} request.updates      An array of document data
   * @param {object} [request.options={}]   Operation options
   * @param {string} [request.pack]         A Compendium pack identifier
   * @private
   */
  _updateArgs({updates=[], options={}, pack}={}) {
    if ( !(updates instanceof Array) ) {
      throw new Error("The updates provided to the DatabaseBackend#update operation must be an array of data objects");
    }
    options = mergeObject({diff: true, render: true}, options);
    if ( pack && !this.getCompendiumScopes().includes(pack) ) {
      throw new Error(`Compendium pack ${pack} is not a valid Compendium identifier`);
    }
    return {updates, options, pack};
  }

  /* -------------------------------------------- */

  /**
   * Update primary Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _updateDocuments(documentClass, request, user) {
    throw new Error("An implementation of the DatabaseBackend must define the _updateDocuments method");
  }

  /* -------------------------------------------- */

  /**
   * Update embedded Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _updateEmbeddedDocuments(documentClass, parent, request, user) {
    throw new Error("An implementation of the DatabaseBackend must define the _updateEmbeddedDocuments method");
  }

  /* -------------------------------------------- */
  /*  Delete Operations                           */
  /* -------------------------------------------- */

  /**
   * Perform document deletion operations
   * @param {Function} documentClass        The Document definition
   * @param {object} request                The requested operation
   * @param {BaseUser} user                 The requesting User
   * @returns {Document[]}                  The deleted Document instances
   */
  async delete(documentClass, request, user) {
    const parent = await this._getParent(request);
    request = this._deleteArgs(request);
    if ( parent ) return this._deleteEmbeddedDocuments(documentClass, parent, request, user);
    else return this._deleteDocuments(documentClass, request, user);
  }

  /* -------------------------------------------- */

  /**
   * Validate the arguments passed to the delete operation
   * @param {object} request                The requested operation
   * @param {string[]} request.ids          An array of document ids
   * @param {object} [request.options={}]   Operation options
   * @param {string} [request.pack]         A Compendium pack identifier
   * @private
   */
  _deleteArgs({ids=[], options={}, pack}={}) {
    if ( !(ids instanceof Array) ) {
      throw new Error("The document ids provided to the DatabaseBackend#delete operation must be an array of strings");
    }
    options = mergeObject({render: true}, options);
    if ( pack && !this.getCompendiumScopes().includes(pack) ) {
      throw new Error(`Compendium pack ${pack} is not a valid Compendium identifier`);
    }
    return {ids, options, pack};
  }

  /* -------------------------------------------- */

  /**
   * Delete primary Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _deleteDocuments(documentClass, request, user) {}

  /* -------------------------------------------- */

  /**
   * Delete embedded Document instances
   * @returns {Promise<Document[]>}
   * @protected
   */
  async _deleteEmbeddedDocuments(documentClass, parent, request, user) {}

  /* -------------------------------------------- */
  /*  Helper Methods                              */
  /* -------------------------------------------- */

  /**
   * Describe the scopes which are suitable as the namespace for a flag key
   * @returns {string[]}
   * @protected
   */
  getFlagScopes() {}

  /* -------------------------------------------- */

  /**
   * Describe the scopes which are suitable as the namespace for a flag key
   * @returns {string[]}
   * @protected
   */
  getCompendiumScopes() {}

  /* -------------------------------------------- */

  /**
   * Provide the Logger implementation that should be used for database operations
   * @return {Logger|Console}
   * @protected
   */
  _getLogger() {
    return globalThis?.config?.logger ?? console;
  }

  /* -------------------------------------------- */

  /**
   * Log a database operation for an embedded document, capturing the action taken and relevant IDs
   * @param {string} action                       The action performed
   * @param {string} type                         The document type
   * @param {abstract.Document[]} documents       The documents modified
   * @param {string} [level=info]                 The logging level
   * @param {abstract.Document} [parent]          A parent document
   * @param {string} [pack]                       A compendium pack within which the operation occurred
   * @protected
   */
  _logOperation(action, type, documents, {parent, pack, level="info"}={}) {
    const logger = this._getLogger();
    let msg = (documents.length === 1) ? `${action} ${type}` : `${action} ${documents.length} ${type} documents`;
    if (documents.length === 1) msg += ` with id [${documents[0].id}]`;
    else if (documents.length <= 5) msg += ` with ids: [${documents.map(d => d.id)}]`;
    msg += this._logContext({parent, pack});
    logger[level](`${vtt} | ${msg}`);
  }

  /* -------------------------------------------- */

  /**
   * Construct a standardized error message given the context of an attempted operation
   * @returns {string}
   * @protected
   */
  _logError(user, action, subject, {parent, pack}={}) {
    if ( subject instanceof Document ) {
      subject = subject.id ? `${subject.documentName} [${subject.id}]` : `a new ${subject.documentName}`;
    }
    let msg = `User ${user.name} lacks permission to ${action} ${subject}`;
    return msg + this._logContext({parent, pack});
  }

  /* -------------------------------------------- */

  /**
   * Determine a string suffix for a log message based on the parent and/or compendium context.
   * @returns {string}
   * @private
   */
  _logContext({parent, pack}={}) {
    let context = "";
    if ( parent ) {
      const parentName = parent.constructor.metadata.name;
      context += ` in parent ${parentName} [${parent.id}]`;
    }
    if ( pack ) {
      context += ` in Compendium ${pack}`;
    }
    return context;
  }
}

// Export default at the end to allow for JSDoc indexing
export default DatabaseBackend;
