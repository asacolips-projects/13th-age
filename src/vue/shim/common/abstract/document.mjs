import DocumentData from "./data.mjs";
import {mergeObject, getProperty} from "../utils/helpers.mjs";
import * as CONST from "../constants.mjs";

/**
 * The abstract base class shared by both client and server-side which defines the model for a single document type.
 * @abstract
 * @interface
 * @memberof abstract
 */
class Document {
  /**
   * Create a new Document by providing an initial data object.
   * @param {object} [data={}]        Initial data provided to construct the Document
   * @param {object} [context={}]     Additional parameters which define Document context
   * @param {Document} [context.parent]   A parent document within which this Document is embedded
   * @param {string} [context.pack]       A named compendium pack within which this Document exists
   */
  constructor(data={}, context={}) {

    /**
     * An immutable reverse-reference to the parent Document to which this embedded Document belongs.
     * @type {Document|null}
     * @name abstract.Document#parent
     */
    Object.defineProperty(this, "parent", {
      value: context.parent || null,
      writable: false
    });

    /**
     * An immutable reference to a containing Compendium collection to which this Document belongs.
     * @type {string|null}
     * @name abstract.Document#pack
     */
    Object.defineProperty(this, "pack", {
      value: context.pack || this.parent?.pack || null,
      writable: false
    });

    /**
     * The base data object for this Document which persists both the original source and any derived data.
     * @type {DocumentData}
     * @name abstract.Document#data
     */
    Object.defineProperty(this, "data", {
      value: new this.constructor.schema(data, this),
      writable: false
    });

    // Initialization tasks
    this._initialize();
  }

	/* -------------------------------------------- */

  /**
   * Perform one-time initialization tasks which only occur when the Document is first constructed.
   * @protected
   */
  _initialize() {}

  /* -------------------------------------------- */
  /*  Configuration                               */
  /* -------------------------------------------- */

  /**
   * Every document must define an object which represents its data schema.
   * This must be a subclass of the DocumentData interface.
   * @interface
   * @type {Function}
   */
  static get schema() {
    throw new Error("Each Document subclass must define a reference to their DocumentData schema");
    // noinspection UnreachableCodeJS
    return DocumentData;
  }

  /**
   * Default metadata which applies to each instance of this Document type.
   * @type {object}
   */
  static get metadata() {
    return {
      name: "Document",
      collection: "documents",
      label: "DOCUMENT.Document",
      types: [],
      embedded: {},
      hasSystemData: false,
      permissions: {
        create: "ASSISTANT",
        update: "ASSISTANT",
        delete: "ASSISTANT"
      },
      pack: null
    }
  }

  /* -------------------------------------------- */

  /**
   * The database backend used to execute operations and handle results
   * @type {DatabaseBackend}
   */
  static get database() {
    const backend = globalThis.CONFIG?.DatabaseBackend || globalThis.db?.DatabaseBackend;
    if ( !backend ) {
      throw new Error(`No DatabaseBackend implementation is configured to be used by the ${this.documentName} Document`);
    }
    return backend;
  }

  /* -------------------------------------------- */

  /**
   * Return a reference to the implemented subclass of this base document type.
   * @type {Function}
   */
  static get implementation() {
    const cfg = globalThis.CONFIG?.[this.metadata.name];
    if ( cfg ) return cfg.documentClass;
    const db = globalThis.db;
    if ( db ) return db[this.metadata.name];
    return this;
  }

  /* -------------------------------------------- */

  /**
   * The named collection to which this Document belongs.
   * @type {string}
   */
  static get collectionName() {
    return this.metadata.collection;
  }

  /* -------------------------------------------- */

  /**
   * The canonical name of this Document type, for example "Actor".
   * @type {string}
   */
	static get documentName() {
	  return this.metadata.name;
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * The named collection to which this Document belongs.
   * @type {string}
   */
	get collectionName() {
	  return this.constructor.collectionName;
  }

  /**
   * The canonical name of this Document type, for example "Actor".
   * @type {string}
   */
	get documentName() {
	  return this.constructor.documentName;
  }

  /**
   * The canonical identifier for this Document
   * @type {string|null}
   */
  get id() {
    return this.data._id;
  }

  /**
   * Test whether this Document is embedded within a parent Document
   * @type {boolean}
   */
  get isEmbedded() {
    return (this.parent !== null) && (this.documentName in this.parent.constructor.metadata.embedded);
  }

  /**
   * The name of this Document, if it has one assigned
   * @type {string|null}
   */
  get name() {
    return this.data.name ?? null;
  }

  /* ---------------------------------------- */
  /*  Methods                                 */
  /* ---------------------------------------- */

  /**
   * Test whether a given User has a sufficient role in order to create Documents of this type in general.
   * @param {documents.BaseUser} user       The User being tested
   * @return {boolean}                      Does the User have a sufficient role to create?
   */
  static canUserCreate(user) {
    const perm = this.metadata.permissions.create;
    if ( perm instanceof Function ) throw new Error('Document.canUserCreate is not supported for this document type. Use Document#canUserModify(user, "create") to test whether a user is permitted to create a specific document instead.');
    return user.hasPermission(perm) || user.hasRole(perm, {exact: false});
  }

  /* -------------------------------------------- */

  /**
   * Clone a document, creating a new document by combining current data with provided overrides.
   * The cloned document is ephemeral and not yet saved to the database.
   * @param {Object} [data={}]                Additional data which overrides current document data at the time of creation
   * @param {boolean} [save=false]            Save the clone to the World database?
   * @param {DocumentModificationContext} [context={}] Additional context options passed to the create method
   * @returns {Document|Promise<Document>}    The cloned Document instance
   */
  clone(data={}, {save=false, ...context}={}) {
    data = mergeObject(this.toObject(), data, {inplace: false});
    if ( !context.keepId ) delete data._id
    context.parent = this.parent;
    context.pack = this.pack;
    if ( save ) return this.constructor.create(data, context);
    else return new this.constructor(data, context);
  }

  /* ---------------------------------------- */

  /**
   * Get the permission level that a specific User has over this Document, a value in CONST.DOCUMENT_PERMISSION_LEVELS.
   * @param {documents.BaseUser} user     The User being tested
   * @returns {number|null}               A numeric permission level from CONST.DOCUMENT_PERMISSION_LEVELS or null
   */
  getUserLevel(user) {
    user = user || game.user;
    const perms = this.data.permission;
    if ( !perms ) return null;
    return perms[user.id] ?? perms["default"] ?? null;
  }

  /* ---------------------------------------- */

  /**
   * Test whether a certain User has a requested permission level (or greater) over the Document
   * @param {documents.BaseUser} user       The User being tested
   * @param {string|number} permission      The permission level from DOCUMENT_PERMISSION_LEVELS to test
   * @param {object} options                Additional options involved in the permission test
   * @param {boolean} [options.exact=false]     Require the exact permission level requested?
   * @return {boolean}                      Does the user have this permission level over the Document?
   */
  testUserPermission(user, permission, {exact=false}={}) {

    // Get user permission
    const perms = CONST.DOCUMENT_PERMISSION_LEVELS;
    const level = this.getUserLevel(user);

    // Test against the target permission
    const target = (typeof permission === "string") ? (perms[permission] ?? perms.OWNER) : permission;
    if ( exact ) return level === target;   // Exact match
    else if ( user.isGM ) return true;      // Game-masters can do anything
    return level >= target;                 // Same level or higher
  }

  /* ---------------------------------------- */

  /**
   * Test whether a given User has permission to perform some action on this Document
   * @param {documents.BaseUser} user   The User attempting modification
   * @param {string} action             The attempted action
   * @param {object} [data]             Data involved in the attempted action
   * @return {boolean}                  Does the User have permission?
   */
  canUserModify(user, action, data={}) {
    const permissions = this.constructor.metadata.permissions;
    const perm = permissions[action];

    // Specialized permission test function
    if ( perm instanceof Function ) return perm(user, this, data);

    // User-level permission
    else if ( perm in CONST.USER_PERMISSIONS ) return user.hasPermission(perm);

    // Document-level permission
    const isOwner = this.testUserPermission(user, "OWNER");
    const hasRole = (perm in CONST.USER_ROLES) && user.hasRole(perm);
    return isOwner || hasRole;
  }

  /* -------------------------------------------- */
  /*  Database Operations                         */
  /* -------------------------------------------- */

  /**
   * @typedef {Object} DocumentModificationContext
   * @property {Document} [parent]              A parent Document within which these Documents should be embedded
   * @property {string} [pack]                  A Compendium pack identifier within which the Documents should be modified
   * @property {boolean} [noHook=false]         Block the dispatch of preCreate hooks for this operation
   * @property {boolean} [index=false]          Return an index of the Document collection, used only during a get operation.
   * @property {string[]} [indexFields]         An array of fields to retrieve when indexing the collection
   * @property {boolean} [keepId=false]         When performing a creation operation, keep the _id of the document being created instead of generating a new one.
   * @property {boolean} [keepEmbeddedIds=true] When performing a creation operation, keep existing _id values of documents embedded within the one being created instead of generating new ones.
   * @property {boolean} [temporary=false]      Create a temporary document which is not saved to the database. Only used during creation.
   * @property {boolean} [render=true]          Automatically re-render existing applications associated with the document.
   * @property {boolean} [renderSheet=false]    Automatically create and render the Document sheet when the Document is first created.
   * @property {boolean} [diff=true]            Difference each update object against current Document data to reduce the size of the transferred data. Only used during update.
   * @property {boolean} [recursive=true]       Merge objects recursively. If false, inner objects will be replaced explicitly. Use with caution!
   * @property {boolean} [isUndo]               Is the operation undoing a previous operation, only used by embedded Documents within a Scene
   * @property {boolean} [deleteAll]            Whether to delete all documents of a given type, regardless of the array of ids provided. Only used during a delete operation.
   */

  /**
   * Create multiple Documents using provided input data.
   * Data is provided as an array of objects where each individual object becomes one new Document.
   *
   * @param {object[]} data                     An array of data objects used to create multiple documents
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the creation workflow
   * @return {Promise<Document[]>}              An array of created Document instances
   *
   * @example <caption>Create a single Document</caption>
   * const data = [{name: "New Actor", type: "character", img: "path/to/profile.jpg"}];
   * const created = await Actor.createDocuments(data);
   *
   * @example <caption>Create multiple Documents</caption>
   * const data = [{name: "Tim", type: "npc"], [{name: "Tom", type: "npc"}];
   * const created = await Actor.createDocuments(data);
   *
   * @example <caption>Create multiple embedded Documents within a parent</caption>
   * const actor = game.actors.getName("Tim");
   * const data = [{name: "Sword", type: "weapon"}, {name: "Breastplate", type: "equipment"}];
   * const created = await Item.createDocuments(data, {parent: actor});
   *
   * @example <caption>Create a Document within a Compendium pack</caption>
   * const data = [{name: "Compendium Actor", type: "character", img: "path/to/profile.jpg"}];
   * const created = await Actor.createDocuments(data, {pack: "mymodule.mypack"});
   */
  static async createDocuments(data=[], context={}) {
    if ( context.parent?.pack ) context.pack = context.parent.pack;
    const {parent, pack, ...options} = context;
    const created = await this.database.create(this.implementation, {data, options, parent, pack});
    await this._onCreateDocuments(created, context);
    return created;
  }

  /* -------------------------------------------- */

  /**
   * Update multiple Document instances using provided differential data.
   * Data is provided as an array of objects where each individual object updates one existing Document.
   *
   * @param {object[]} updates                  An array of differential data objects, each used to update a single Document
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the update workflow
   * @return {Promise<Document[]>}              An array of updated Document instances
   *
   * @example <caption>Update a single Document</caption>
   * const updates = [{_id: "12ekjf43kj2312ds", name: "Timothy"}];
   * const updated = await Actor.updateDocuments(updates);
   *
   * @example <caption>Update multiple Documents</caption>
   * const updates = [{_id: "12ekjf43kj2312ds", name: "Timothy"}, {_id: "kj549dk48k34jk34", name: "Thomas"}]};
   * const updated = await Actor.updateDocuments(updates);
   *
   * @example <caption>Update multiple embedded Documents within a parent</caption>
   * const actor = game.actors.getName("Timothy");
   * const updates = [{_id: sword.id, name: "Magic Sword"}, {_id: shield.id, name: "Magic Shield"}];
   * const updated = await Item.updateDocuments(updates, {parent: actor});
   *
   * @example <caption>Update Documents within a Compendium pack</caption>
   * const actor = await pack.getDocument(documentId);
   * const updated = await Actor.updateDocuments([{_id: actor.id, name: "New Name"}], {pack: "mymodule.mypack"});
   */
  static async updateDocuments(updates=[], context={}) {
    if ( context.parent?.pack ) context.pack = context.parent.pack;
    const {parent, pack, ...options} = context;
    const updated = await this.database.update(this.implementation, {updates, options, parent, pack});
    await this._onUpdateDocuments(updated, context);
    return updated;
  }

  /* -------------------------------------------- */

  /**
   * Delete one or multiple existing Documents using an array of provided ids.
   * Data is provided as an array of string ids for the documents to delete.
   *
   * @param {string[]} ids                      An array of string ids for the documents to be deleted
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the deletion workflow
   * @return {Promise<Document[]>}              An array of deleted Document instances
   *
   * @example <caption>Delete a single Document</caption>
   * const tim = game.actors.getName("Tim");
   * const deleted = await Actor.deleteDocuments([tim.id]);
   *
   * @example <caption>Delete multiple Documents</caption>
   * const tim = game.actors.getName("Tim");
   * const tom = game.actors.getName("Tom");
   * const deleted = await Actor.deleteDocuments([tim.id, tom.id]);
   *
   * @example <caption>Delete multiple embedded Documents within a parent</caption>
   * const tim = game.actors.getName("Tim");
   * const sword = tim.items.getName("Sword");
   * const shield = tim.items.getName("Shield");
   * const deleted = await Item.deleteDocuments([sword.id, shield.id], parent: actor});
   *
   * @example <caption>Delete Documents within a Compendium pack</caption>
   * const actor = await pack.getDocument(documentId);
   * const deleted = await Actor.deleteDocuments([actor.id], {pack: "mymodule.mypack"});
   */
  static async deleteDocuments(ids=[], context={}) {
    if ( context.parent?.pack ) context.pack = context.parent.pack;
    const {parent, pack, ...options} = context;
    const deleted = await this.database.delete(this.implementation, {ids, options, parent, pack});
    await this._onDeleteDocuments(deleted, context);
    return deleted;
  }

  /* -------------------------------------------- */

  /**
   * Create a new Document using provided input data, saving it to the database.
   * @see {@link Document.createDocuments}
   * @param {object} [data={}]                  Initial data used to create this Document
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the creation workflow
   * @return {Promise<Document>}                The created Document instance
   *
   * @example <caption>Create a World-level Item</caption>
   * const data = [{name: "Special Sword", type: "weapon"}];
   * const created = await Item.create(data);
   *
   * @example <caption>Create an Actor-owned Item</caption>
   * const data = [{name: "Special Sword", type: "weapon"}];
   * const actor = game.actors.getName("My Hero");
   * const created = await Item.create(data, {parent: actor});
   *
   * @example <caption>Create an Item in a Compendium pack</caption>
   * const data = [{name: "Special Sword", type: "weapon"}];
   * const created = await Item.create(data, {pack: "mymodule.mypack"});
   */
  static async create(data, context={}) {
    const createData = data instanceof Array ? data : [data];
    const created = await this.createDocuments(createData, context);
    return data instanceof Array ? created : created.shift();
  }

  /* -------------------------------------------- */

  /**
   * Update this Document using incremental data, saving it to the database.
   * @see {@link Document.updateDocuments}
   * @param {object} [data={}]                  Differential update data which modifies the existing values of this document data
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the update workflow
   * @returns {Promise<Document>}               The updated Document instance
   */
  async update(data={}, context={}) {
    data._id = this.id;
    context.parent = this.parent;
    context.pack = this.pack;
    const updates = await this.constructor.updateDocuments([data], context);
    return updates.shift();
  }

  /* -------------------------------------------- */

  /**
   * Delete this Document, removing it from the database.
   * @see {@link Document.deleteDocuments}
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the deletion workflow
   * @returns {Promise<Document>}               The deleted Document instance
   */
  async delete(context={}) {
    context.parent = this.parent;
    context.pack = this.pack;
    const deleted = await this.constructor.deleteDocuments([this.id], context);
    return deleted.shift();
  }

  /* -------------------------------------------- */
  /*  Embedded Operations                         */
  /* -------------------------------------------- */

  /**
   * Obtain a reference to the Array of source data within the data object for a certain embedded Document name
   * @param {string} embeddedName   The name of the embedded Document type
   * @return {Collection}           The Collection instance of embedded Documents of the requested type
   */
  getEmbeddedCollection(embeddedName) {
    const cls = this.constructor.metadata.embedded[embeddedName];
    if ( !cls ) {
      throw new Error(`${embeddedName} is not a valid embedded Document within the ${this.documentName} Document`);
    }
    return this[cls.collectionName];
  }

	/* -------------------------------------------- */

  /**
   * Get an embedded document by it's id from a named collection in the parent document.
   * @param {string} embeddedName   The name of the embedded Document type
   * @param {string} id             The id of the child document to retrieve
   * @param {object} [options]      Additional options which modify how embedded documents are retrieved
   * @param {boolean} [options.strict=false] Throw an Error if the requested id does not exist. See Collection#get
   * @return {Document}             The retrieved embedded Document instance, or undefined
   */
  getEmbeddedDocument(embeddedName, id, {strict=false}={}) {
    const collection = this.getEmbeddedCollection(embeddedName);
    return collection.get(id, {strict});
  }

	/* -------------------------------------------- */

  /**
   * Create multiple embedded Document instances within this parent Document using provided input data.
   * @see {@link Document.createDocuments}
   * @param {string} embeddedName               The name of the embedded Document type
   * @param {object[]} data                     An array of data objects used to create multiple documents
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the creation workflow
   * @return {Promise<Document[]>}              An array of created Document instances
   */
  async createEmbeddedDocuments(embeddedName, data=[], context={}) {
    this.getEmbeddedCollection(embeddedName); // Validation only
    context.parent = this;
    context.pack = this.pack;
    const cls = this.constructor.metadata.embedded[embeddedName]?.implementation;
    return cls.createDocuments(data, context);
  }

	/* -------------------------------------------- */

  /**
   * Update multiple embedded Document instances within a parent Document using provided differential data.
   * @see {@link Document.updateDocuments}
   * @param {string} embeddedName               The name of the embedded Document type
   * @param {object[]} updates                  An array of differential data objects, each used to update a single Document
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the update workflow
   * @return {Promise<Document[]>}              An array of updated Document instances
   */
  async updateEmbeddedDocuments(embeddedName, updates=[], context={}) {
    this.getEmbeddedCollection(embeddedName); // Validation only
    context.parent = this;
    context.pack = this.pack;
    const cls = this.constructor.metadata.embedded[embeddedName]?.implementation;
    return cls.updateDocuments(updates, context);
  }

	/* -------------------------------------------- */

  /**
   * Delete multiple embedded Document instances within a parent Document using provided string ids.
   * @see {@link Document.deleteDocuments}
   * @param {string} embeddedName               The name of the embedded Document type
   * @param {string[]} ids                      An array of string ids for each Document to be deleted
   * @param {DocumentModificationContext} [context={}] Additional context which customizes the deletion workflow
   * @return {Promise<Document[]>}              An array of deleted Document instances
   */
  async deleteEmbeddedDocuments(embeddedName, ids, context={}) {
    this.getEmbeddedCollection(embeddedName); // Validation only
    context.parent = this;
    context.pack = this.pack;
    const cls = this.constructor.metadata.embedded[embeddedName]?.implementation;
    return cls.deleteDocuments(ids, context);
  }

  /* -------------------------------------------- */
  /*  Flag Operations                             */
  /* -------------------------------------------- */

  /**
   * Get the value of a "flag" for this document
   * See the setFlag method for more details on flags
   *
   * @param {string} scope        The flag scope which namespaces the key
   * @param {string} key          The flag key
   * @return {*}                  The flag value
   */
  getFlag(scope, key) {
    const scopes = this.constructor.database.getFlagScopes();
    if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
    key = `${scope}.${key}`;
    return getProperty(this.data.flags, key);
  }

  /* -------------------------------------------- */

  /**
   * Assign a "flag" to this document.
   * Flags represent key-value type data which can be used to store flexible or arbitrary data required by either
   * the core software, game systems, or user-created modules.
   *
   * Each flag should be set using a scope which provides a namespace for the flag to help prevent collisions.
   *
   * Flags set by the core software use the "core" scope.
   * Flags set by game systems or modules should use the canonical name attribute for the module
   * Flags set by an individual world should "world" as the scope.
   *
   * Flag values can assume almost any data type. Setting a flag value to null will delete that flag.
   *
   * @param {string} scope        The flag scope which namespaces the key
   * @param {string} key          The flag key
   * @param {*} value             The flag value
   * @return {Promise<Document>}  A Promise resolving to the updated document
   */
  async setFlag(scope, key, value) {
    const scopes = this.constructor.database.getFlagScopes();
    if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
    key = `flags.${scope}.${key}`;
    return this.update({[key]: value});
  }

  /* -------------------------------------------- */

  /**
   * Remove a flag assigned to the document
   * @param {string} scope        The flag scope which namespaces the key
   * @param {string} key          The flag key
   * @return {Promise<Document>}  The updated document instance
   */
  async unsetFlag(scope, key) {
    const scopes = this.constructor.database.getFlagScopes();
    if ( !scopes.includes(scope) ) throw new Error(`Invalid scope for flag ${key}`);
    const head = key.split('.');
    const tail = `-=${head.pop()}`;
    key = ['flags', scope, ...head, tail].join('.');
    return this.update({[key]: null});
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /**
   * Perform preliminary operations before a Document of this type is created.
   * Pre-creation operations only occur for the client which requested the operation.
   * @param {object} data               The initial data object provided to the document creation request
   * @param {object} options            Additional options which modify the creation request
   * @param {documents.BaseUser} user   The User requesting the document creation
   * @protected
   */
  async _preCreate(data, options, user) {}

  /**
   * Perform preliminary operations before a Document of this type is updated.
   * Pre-update operations only occur for the client which requested the operation.
   * @param {object} changed            The differential data that is changed relative to the documents prior values
   * @param {object} options            Additional options which modify the update request
   * @param {documents.BaseUser} user   The User requesting the document update
   * @protected
   */
  async _preUpdate(changed, options, user) {}

  /**
   * Perform preliminary operations before a Document of this type is deleted.
   * Pre-delete operations only occur for the client which requested the operation.
   * @param {object} options            Additional options which modify the deletion request
   * @param {documents.BaseUser} user   The User requesting the document deletion
   * @protected
   */
  async _preDelete(options, user) {}

  /**
   * Perform follow-up operations after a Document of this type is created.
   * Post-creation operations occur for all clients after the creation is broadcast.
   * @param {object} data               The initial data object provided to the document creation request
   * @param {object} options            Additional options which modify the creation request
   * @param {string} userId             The id of the User requesting the document update
   * @protected
   */
  _onCreate(data, options, userId) {}

  /**
   * Perform follow-up operations after a Document of this type is updated.
   * Post-update operations occur for all clients after the update is broadcast.
   * @param {object} changed            The differential data that was changed relative to the documents prior values
   * @param {object} options            Additional options which modify the update request
   * @param {string} userId             The id of the User requesting the document update
   * @protected
   */
  _onUpdate(changed, options, userId) {}

  /**
   * Perform follow-up operations after a Document of this type is deleted.
   * Post-deletion operations occur for all clients after the deletion is broadcast.
   * @param {object} options            Additional options which modify the deletion request
   * @param {string} userId             The id of the User requesting the document update
   * @protected
   */
  _onDelete(options, userId) {}

  /**
   * Perform follow-up operations when a set of Documents of this type are created.
   * This is where side effects of creation should be implemented.
   * Post-creation side effects are performed only for the client which requested the operation.
   * @param {Document[]} documents                    The Document instances which were created
   * @param {DocumentModificationContext} context     The context for the modification operation
   * @protected
   */
  static async _onCreateDocuments(documents, context) {}

  /**
   * Perform follow-up operations when a set of Documents of this type are updated.
   * This is where side effects of updates should be implemented.
   * Post-update side effects are performed only for the client which requested the operation.
   * @param {Document[]} documents                    The Document instances which were updated
   * @param {DocumentModificationContext} context     The context for the modification operation
   * @protected
   */
  static async _onUpdateDocuments(documents, context) {}

  /**
   * Perform follow-up operations when a set of Documents of this type are deleted.
   * This is where side effects of deletion should be implemented.
   * Post-deletion side effects are performed only for the client which requested the operation.
   * @param {Document[]} documents                    The Document instances which were deleted
   * @param {DocumentModificationContext} context     The context for the modification operation
   * @protected
   */
  static async _onDeleteDocuments(documents, context) {}

  /* ---------------------------------------- */
  /*  Serialization and Storage               */
  /* ---------------------------------------- */

  /**
   * Transform the Document instance into a plain object.
   * The created object is an independent copy of the original data.
   * See DocumentData#toObject
   * @param {boolean} [source=true]     Draw values from the underlying data source rather than transformed values
   * @returns {object}                  The extracted primitive object
   */
  toObject(source=true) {
    return this.data.toObject(source);
  }

  /* ---------------------------------------- */

  /**
   * Convert the Document instance to a primitive object which can be serialized.
   * See DocumentData#toJSON
   * @returns {object}                  The document data expressed as a plain object
   */
  toJSON() {
    return this.data.toJSON();
  }

  /* ---------------------------------------- */
  /*  Data Migration                          */
  /* ---------------------------------------- */

  /**
   * For Documents which include game system data, migrate the system data object to conform to its latest data model.
   * The data model is defined by the template.json specification included by the game system.
   * @returns {object}                  The migrated system data object
   */
  migrateSystemData() {
    if ( !this.constructor.metadata.hasSystemData ) {
      throw new Error(`The ${this.documentName} Document does not include a System data object.`);
    }
    const model = game.system.model[this.documentName]?.[this.data.type] || {};
    return mergeObject(model, this.data.data, {
      insertKeys: false,
      insertValues: true,
      enforceTypes: false,
      overwrite: true,
      inplace: false
    });
  }
}

// Export default at the end to allow for JSDoc indexing
export default Document;
