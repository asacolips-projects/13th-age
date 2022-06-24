import DocumentData from "./abstract/data.mjs";
import * as fields from "./data/fields.mjs";
import {PACKAGE_TYPES, COMPENDIUM_DOCUMENT_TYPES, PACKAGE_AVAILABILITY_CODES} from "./constants.mjs";
import {isNewerVersion} from "./utils/helpers.mjs";

/**
 * A helper field used for string arrays
 * @type {DocumentField}
 */
const STRING_ARRAY_FIELD = {
  type: [String],
  required: true,
  default: [],
  clean: v => {
    if ( typeof v === "string" ) return [v];
    return v instanceof Array ? v : []
  }
}

/**
 * A helper field used for arrays of package include objects
 * @type {Function}
 */
const INCLUDE_ARRAY_FIELD = type => {
  return {
    type: [type],
    required: true,
    default: [],
    clean: v => v instanceof Array ? v : []
  };
}

/* -------------------------------------------- */

/**
 * Checks a package against its availability code to see if it requires a compability warning, and if so, updates the pkg
 * @param pkg           The package
 * @private
 */
function tagPackageAvailability(pkg) {
  const ac = CONST.PACKAGE_AVAILABILITY_CODES;
  switch(pkg.availability) {
    case ac.REQUIRES_SYSTEM:
      pkg.unavailable = game.i18n.localize("SETUP.RequireSystem");
      break;
    case ac.REQUIRES_DEPENDENCY:
      pkg.unavailable = game.i18n.localize("SETUP.RequireDep");
      break;
    case ac.REQUIRES_CORE:
      pkg.unavailable = game.i18n.localize("SETUP.RequireCore");
      break;
    case ac.REQUIRES_UPDATE:
      if (pkg.type === "world") {
        pkg.incompatible = game.i18n.format("SETUP.CompatibilityRisk");
      }
      else {
        pkg.incompatible = game.i18n.format("SETUP.CompatibilityRiskWithVersion", {version: pkg.data.compatibleCoreVersion});
      }
      break;
    case ac.UNKNOWN:
      pkg.incompatible = game.i18n.localize("SETUP.CompatibilityUnknown");
      break;
  }
}

/* ----------------------------------------- */

/**
 * An inner data object which represents a single package author in the authors array.
 * @extends {DocumentData}
 * @property {string} name          The author name
 * @property {string} [email]       The author email address
 * @property {string} [url]         A website url for the author
 * @property {string} [discord]     A Discord username for the author
 */
class PackageAuthorData extends DocumentData {
  constructor(data, context) {
    data = typeof data === "string" ? {name: data} : data;  // Backwards-compatible support for arrays of string names
    super(data, context)
  }
  static defineSchema() {
    return {
      name: fields.REQUIRED_STRING,
      email: fields.STRING_FIELD,
      url: fields.STRING_FIELD,
      discord: fields.STRING_FIELD
    }
  }
}

/* ----------------------------------------- */

/**
 * An inner data object which represents a single package dependency in the dependencies array.
 * @extends {DocumentData}
 * @property {string} name          The dependency package name
 * @property {string} type          The dependency package type, from CONST.PACKAGE_TYPES
 * @property {string} [manifest]    An explicit manifest URL, otherwise learned from the Foundry web server
 */
class PackageDependencyData extends DocumentData {
  static defineSchema() {
    return {
      name: fields.REQUIRED_STRING, // The package name
      type: fields.field(fields.REQUIRED_STRING, {
        default: "module",
        validate: v => PACKAGE_TYPES.includes(v),
        validationError: "Invalid package type \"{value}\" which must be a value from CONST.PACKAGE_TYPES"
      }),
      manifest: fields.STRING_FIELD
    }
  }

  _getMissingFieldErrorMessage(name, field) {
    let message = super._getMissingFieldErrorMessage(name, field);
    message += ` for dependency "${this.name}"`;
    return message;
  }

  _getInvalidFieldValueErrorMessage(name, field, value) {
    let message = super._getInvalidFieldValueErrorMessage(name, field, value);
    message += ` for dependency "${this.name}"`;
    return message;
  }
}

/* ----------------------------------------- */

/**
 * An inner data object which represents a single language specification provided by a package in the languages array.
 * @extends {DocumentData}
 * @property {string} lang        A string language code which is validated by Intl.getCanonicalLocales
 * @property {string} name        The human-readable language name
 * @property {string} path        The relative path to included JSON translation strings
 * @property {string} [system]    Only apply this set of translations when a specific system is being used
 */
class PackageLanguageData extends DocumentData {
  static defineSchema() {
    return {
      lang: fields.field(fields.REQUIRED_STRING, {
        validate: PackageLanguageData.validateLocale,
        validationError: "Invalid language code provided which is not supported by Intl.getCanonicalLocales"
      }),
      name: fields.STRING_FIELD,
      path: fields.REQUIRED_STRING,
      system: fields.STRING_FIELD,
      module: fields.STRING_FIELD
    }
  }

  /** @inheritdoc */
  _initialize() {
    super._initialize();
    this.name = this.name ?? this.lang;
  }

  /**
   * Validate that a language code is supported as a canonical locale
   * @param {string} lang   The candidate language to validate
   * @returns {boolean}     Is it valid?
   */
  static validateLocale(lang) {
    try {
      Intl.getCanonicalLocales(lang);
      return true;
    } catch(err) {
      return false;
    }
  }
}

/* ----------------------------------------- */

/**
 * An inner data object which represents a single compendium pack definition provided by a package in the packs array.
 * @extends {DocumentData}
 * @property {string} name      The canonical compendium name. This should contain no spaces or special characters.
 * @property {string} label     The human-readable compendium name.
 * @property {string} path      The local relative path to the compendium source .db file. The filename should match the
 *                              name attribute.
 * @property {string} type      The specific document type that is contained within this compendium pack
 * @property {string} [system]  Denote that this compendium pack requires a specific game system to function properly.
 */
class PackageCompendiumData extends DocumentData {
  static defineSchema() {
    return {
      name: fields.field(fields.REQUIRED_STRING, {
        validate: name => !name.includes("."),
        validationError: "Invalid compendium name '{value}'. Compendium names cannot contain dots."
      }),
      label: fields.REQUIRED_STRING,
      path: fields.REQUIRED_STRING,
      private: fields.field(fields.BOOLEAN_FIELD, {default: false}),
      entity: fields.STRING_FIELD,
      type: fields.field(fields.REQUIRED_STRING, {
        validate: v => COMPENDIUM_DOCUMENT_TYPES.includes(v),
        validationError: "Invalid package compendium document type provided which must be a value in CONST.COMPENDIUM_DOCUMENT_TYPES"
      }),
      system: fields.STRING_FIELD
    }
  }

  /** @inheritdoc */
  _initializeSource(data) {
    if ( data.entity && !data.type ) data.type = data.entity;
    data.entity = data.type;
    return super._initializeSource(data);
  }
}

/* ----------------------------------------- */

/**
 * The data schema used to define a Package manifest.
 * Specific types of packages extend this schema with additional fields.
 * @extends {DocumentData}
 * @property {string} name            The canonical package name, should be lower-case with no spaces or special characters
 * @property {string} title           The human-readable package title, containing spaces and special characters
 * @property {string} [description]   An optional package description, may contain HTML
 * @property {string} [author]        A singular package author; this is an old field staged for later deprecation, please use authors
 * @property {PackageAuthorData[]} [authors]  An array of author objects who are co-authors of this package. Preferred to the singular author field.
 * @property {string} [url]           A web url where more details about the package may be found
 * @property {string} [license]       A web url or relative file path where license details may be found
 * @property {string} [readme]        A web url or relative file path where readme instructions may be found
 * @property {string} [bugs]          A web url where bug reports may be submitted and tracked
 * @property {string} [changelog]     A web url where notes detailing package updates are available
 * @property {string} version         The current package version
 * @property {string} [minimumCoreVersion]  A minimum version of the core Foundry software which is required to use this package
 * @property {string} [compatibleCoreVersion] A maximum version of the core Foundry software beyond which compatibility is not guaranteed
 * @property {string[]} [scripts]     An array of urls or relative file paths for JavaScript files which should be included
 * @property {string[]} [esmodules]   An array of urls or relative file paths for ESModule files which should be included
 * @property {string[]} [styles]      An array of urls or relative file paths for CSS stylesheet files which should be included
 * @property {PackageLanguageData[]} [languages]  An array of language data objects which are included by this package
 * @property {PackageCompendiumData[]} [packs] An array of compendium packs which are included by this package
 * @property {string[]} [system]      An array of game system names which this module supports
 * @property {PackageDependencyData[]} [dependencies] An array of dependency objects which define required dependencies for using this package
 * @property {boolean} [socket]       Whether to require a package-specific socket namespace for this package
 * @property {string} [manifest]      A publicly accessible web URL which provides the latest available package manifest file. Required in order to support module updates.
 * @property {string} [download]      A publicly accessible web URL where the source files for this package may be downloaded. Required in order to support module installation.
 * @property {boolean} [protected=false] Whether this package uses the protected content access system.
 */
class PackageData extends DocumentData {
  static defineSchema() {
    return {

      // Package metadata
      name: fields.REQUIRED_STRING,
      title: fields.REQUIRED_STRING,
      description: fields.BLANK_STRING,
      author: fields.STRING_FIELD,
      authors: INCLUDE_ARRAY_FIELD(PackageAuthorData),
      url: fields.STRING_FIELD,
      license: fields.STRING_FIELD,
      readme: fields.STRING_FIELD,
      bugs: fields.STRING_FIELD,
      changelog: fields.STRING_FIELD,
      flags: fields.OBJECT_FIELD,

      // Package versioning
      version: fields.field(fields.REQUIRED_STRING, {default: "1.0.0"}),
      minimumCoreVersion: fields.STRING_FIELD,
      compatibleCoreVersion: fields.STRING_FIELD,

      // Included content
      scripts: STRING_ARRAY_FIELD,
      esmodules: STRING_ARRAY_FIELD,
      styles: STRING_ARRAY_FIELD,
      languages: INCLUDE_ARRAY_FIELD(PackageLanguageData),
      packs: INCLUDE_ARRAY_FIELD(PackageCompendiumData),

      // Package dependencies
      system: STRING_ARRAY_FIELD,
      dependencies: INCLUDE_ARRAY_FIELD(PackageDependencyData),
      socket: fields.field(fields.BOOLEAN_FIELD, {default: false}),

      // Package downloading
      manifest: fields.STRING_FIELD,
      download: fields.STRING_FIELD,
      protected: fields.field(fields.BOOLEAN_FIELD, {default: false})
    }
  }

  /** @inheritdoc */
  _initializeSource(data) {
    data = super._initializeSource(data);
    if ( data.systems instanceof Array ) {
      global.logger.warn(`Package ${data.name} is using the old "systems" manifest key where a "system" key is expected`);
      data.system = data.systems;
      delete data.systems;
    }
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Determine the availability a package based on the version numbers of its dependencies.
   */
  static checkAvailability(minimumCoreVersion, compatibleCoreVersion) {

    // Available unless proven otherwise
    let availability = PACKAGE_AVAILABILITY_CODES.AVAILABLE;

    // Compare the package's designated compatibility against the core version
    if ( compatibleCoreVersion ) {
      let compatible;
      // If compatibleCoreVersion is just 9 or "9", we compare just to generation
      const isGeneration = Number.isInteger(Number(compatibleCoreVersion));
      if ( isGeneration ) compatible = Number(compatibleCoreVersion) >= global.release.generation;
      else compatible = !isNewerVersion(global.release.version, compatibleCoreVersion);
      if ( !compatible ) availability = PACKAGE_AVAILABILITY_CODES.REQUIRES_UPDATE;
    } else {
      availability = PACKAGE_AVAILABILITY_CODES.UNKNOWN;
    }

    // Flag (more strongly) packages which require a core update to function
    const mcv = minimumCoreVersion || null;
    // noinspection JSCheckFunctionSignatures
    if ( mcv && isNewerVersion(mcv, global.release.version) ) {
      availability = PACKAGE_AVAILABILITY_CODES.REQUIRES_CORE;
    }

    return availability;
  }
}

/* ----------------------------------------- */

/**
 * The data schema used to define World manifest files.
 * Extends the basic PackageData schema with some additional world-specific fields.
 * @extends {PackageData}
 * @property {string} system            The game system name which this world relies upon
 * @property {string} [background]      A web URL or local file path which provides a background banner image
 * @property {string} coreVersion       The version of the core software for which this world has been migrated
 * @property {string} systemVersion     The version of the game system for which this world has been migrated
 * @property {string} [nextSession]     An ISO datetime string when the next game session is scheduled to occur
 */
class WorldData extends PackageData {
  static defineSchema() {
    return Object.assign({}, super.defineSchema(), {
      system: fields.REQUIRED_STRING,
      background: fields.STRING_FIELD,
      coreVersion: fields.REQUIRED_STRING,
      nextSession: fields.STRING_FIELD,
      resetKeys: fields.BOOLEAN_FIELD,
      safeMode: fields.BOOLEAN_FIELD,
      systemVersion: fields.field(fields.REQUIRED_STRING, {default: "0"})
    });
  }
}

/* ----------------------------------------- */

/**
 * The data schema used to define System manifest files.
 * Extends the basic PackageData schema with some additional system-specific fields.
 * @extends {PackageData}
 * @property {number} [gridDistance]      A default distance measurement to use for Scenes in this system
 * @property {string} [gridUnits]         A default unit of measure to use for distance measurement in this system
 * @property {string} [primaryTokenAttribute] An Actor data attribute path to use for Token primary resource bars
 * @property {string} [primaryTokenAttribute] An Actor data attribute path to use for Token secondary resource bars
 */
class SystemData extends PackageData {
  static defineSchema() {
    return Object.assign({}, super.defineSchema(), {
      background: fields.STRING_FIELD,
      initiative: fields.STRING_FIELD,
      gridDistance: fields.NUMERIC_FIELD,
      gridUnits: fields.STRING_FIELD,
      primaryTokenAttribute: fields.STRING_FIELD,
      secondaryTokenAttribute: fields.STRING_FIELD
    });
  }
}
/* ----------------------------------------- */

/**
 * The data schema used to define Module manifest files.
 * Extends the basic PackageData schema with some additional module-specific fields.
 * @extends {PackageData}
 * @property {boolean} [coreTranslation]     Does this module provide a translation for the core software?
 * @property {string} [minimumSystemVersion] A minimum version number of the game system that this module requires
 * @property {boolean} [library]             A library module provides no user-facing functionality and is solely for
 *                                           use by other modules. Loaded before any system or module scripts.
 */
class ModuleData extends PackageData {
  static defineSchema() {
    return Object.assign({}, super.defineSchema(), {
      coreTranslation: fields.BOOLEAN_FIELD,
      minimumSystemVersion: fields.STRING_FIELD,
      library: fields.BOOLEAN_FIELD
    });
  }
}

// Module exports
export {
  tagPackageAvailability,
  PackageData,
  WorldData,
  SystemData,
  ModuleData,
  PackageAuthorData,
  PackageCompendiumData,
  PackageDependencyData,
  PackageLanguageData
}
