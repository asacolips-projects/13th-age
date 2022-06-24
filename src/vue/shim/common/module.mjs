/** @module foundry */

// Imports
import * as types from "./types.mjs";
import * as primitives from "./utils/primitives.mjs";
import * as CONST from "./constants.mjs";
import * as abstract from "./abstract/module.mjs";
import * as data from "./data/module.mjs";
import * as documents from "./documents.mjs";
import * as packages from "./packages.mjs";
import * as utils from "./utils/module.mjs";
import * as config from "./config.mjs"

/**
 * Constant definitions used throughout the Foundry Virtual Tabletop framework.
 * @name CONST
 * @type {Module}
 * @see {module:constants}
 */
export * as CONST from "./constants.mjs";

/**
 * Abstract class definitions providing fundamental interfaces used throughout the Foundry Virtual Tabletop framework.
 * @name abstract
 * @type {Module}
 * @see {abstract}
 */
export * as abstract from "./abstract/module.mjs";

/**
 * Data schema definitions providing structure for Documents used throughout the Foundry Virtual Tabletop framework.
 * @name data
 * @type {Module}
 */
export * as data from "./data/module.mjs";

/**
 * Document definitions used throughout the Foundry Virtual Tabletop framework.
 * @name documents
 * @type {Module}
 */
export * as documents from "./documents.mjs";

/**
 * Package data definitions, validations, and schema
 * @name packages
 * @type {Module}
 */
export * as packages from "./packages.mjs";

/**
 * Utility functions providing helpful functionality.
 * @name utils
 * @type {Module}
 * @see {module:helpers}
 */
export * as utils from "./utils/module.mjs";

// Window registration
globalThis.foundry = {
  CONST,
  abstract,
  data,
  utils,
  documents,
  packages,
  config
};

// Immutable constants
for ( const c of Object.values(CONST) ) {
  Object.freeze(c);
}

// Backwards compatibility
globalThis.CONST = CONST;
for ( let [k, v] of Object.entries(utils) ) {
  window[k] = v;
}

// Dispatch ready event
console.log(`${CONST.vtt} | Foundry Commons Framework Loaded`);
const ready = new Event("FoundryFrameworkLoaded");
window.dispatchEvent(ready);
