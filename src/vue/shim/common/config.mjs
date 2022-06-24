import DocumentData from "./abstract/data.mjs";
import * as fields from "./data/fields.mjs";
import {isNewerVersion} from "./utils/helpers.mjs";

/**
 * A data object which represents the details of this Release of Foundry VTT
 * @extends {DocumentData}
 * @property {number} generation        The major generation of the Release
 * @property {string} channel           The channel the Release belongs to, such as "stable"
 * @property {string} suffix            An optional appended string display for the Release
 * @property {number} build             The internal build number for the Release
 * @property {number} time              When the Release was released
 * @property {number} [node_version]    The minimum required Node.js major version
 * @property {string} [notes]           Release notes for the update version
 * @property {string} [download]        A temporary download URL where this version may be obtained
 */
class ReleaseData extends DocumentData {
  static defineSchema() {
    return {
      generation: fields.REQUIRED_NUMBER,
      channel: fields.REQUIRED_STRING,
      suffix: fields.STRING_FIELD,
      build: fields.REQUIRED_NUMBER,
      time: fields.TIMESTAMP_FIELD,
      node_version: fields.POSITIVE_INTEGER_FIELD,
      notes: fields.BLANK_STRING,
      download: fields.BLANK_STRING
    }
  }

  /* ----------------------------------------- */

  /**
   * A formatted string for shortened display, such as "Version 9"
   * @return {string}
   */
  get shortDisplay() {
    return `Version ${this.generation}`;
  }

  /**
   * A formatted string for general display, such as "V9 Prototype 1"
   * @return {string}
   */
  get display() {
    if ( this.suffix ) return `V${this.generation} ${this.channel} ${this.suffix}`;
    return this.shortDisplay;
  }

  /**
   * A formatted string for Version compatibility checking, such as "9.150"
   * @return {string}
   */
  get version() {
    return `${this.generation}.${this.build}`;
  }

  /* ----------------------------------------- */

  /**
   * Is this ReleaseData object newer than some other version?
   * @param {string|ReleaseData} other        Some other version to compare against
   * @returns {boolean}                       Is this ReleaseData a newer version?
   */
  isNewer(other) {
    const version = other instanceof ReleaseData ? other.version : other;
    return isNewerVersion(this.version, version);
  }

  /* ----------------------------------------- */

  /**
   * Is this ReleaseData object a newer generation than some other version?
   * @param {string|ReleaseData} other        Some other version to compare against
   * @returns {boolean}                       Is this ReleaseData a newer generation?
   */
  isGenerationalChange(other) {
    let oldMajor;
    if ( (typeof other === "string") && other.includes(".") ) {
      oldMajor = other.split(".").slice(0, 2).join(".");
    }
    else oldMajor = other.generation.toString();
    const newMajor = this.generation;
    return isNewerVersion(newMajor, oldMajor);
  }
}

// Module Exports
export {
  ReleaseData
}
