export class Localization {
  constructor(serverLanguage) {
    this.lang = serverLanguage;

    this.translations = {};
    this._fallback = {};

    this.initialize();
  }

  async initialize() {
    const langFile = await fetch('/dist/languages/en.json');
    this.translations = await langFile.json();
    this._fallback = this.translations;
  }

  /**
   * Localize a string by drawing a translation from the available translations dictionary, if available
   * If a translation is not available, the original string is returned
   * @param {string} stringId     The string ID to translate
   * @return {string}             The translated string
   *
   * @example <caption>Localizing a simple string in JavaScript</caption>
   * {
   *   "MYMODULE.MYSTRING": "Hello, this is my module!"
   * }
   * game.i18n.localize("MYMODULE.MYSTRING"); // Hello, this is my module!
   *
   * @example <caption>Localizing a simple string in Handlebars</caption>
   * {{localize "MYMODULE.MYSTRING"}} <!-- Hello, this is my module! -->
   */
   localize(stringId) {
    let v = foundry.utils.getProperty(this.translations, stringId);
    if ( typeof v === "string" ) return v;
    v = foundry.utils.getProperty(this._fallback, stringId);
    return typeof v === "string" ? v : stringId;
  }

	/* -------------------------------------------- */

  /**
   * Localize a string including variable formatting for input arguments.
   * Provide a string ID which defines the localized template.
   * Variables can be included in the template enclosed in braces and will be substituted using those named keys.
   *
   * @param {string} stringId     The string ID to translate
   * @param {object} data         Provided input data
   * @return {string}             The translated and formatted string
   *
   * @example <caption>Localizing a formatted string in JavaScript</caption>
   * {
   *   "MYMODULE.GREETING": "Hello {name}, this is my module!"
   * }
   * game.i18n.format("MYMODULE.GREETING" {name: "Andrew"}); // Hello Andrew, this is my module!
   *
   * @example <caption>Localizing a formatted string in Handlebars</caption>
   * {{localize "MYMODULE.GREETING" name="Andrew"}} <!-- Hello, this is my module! -->
   */
  format(stringId, data={}) {
    let str = this.localize(stringId);
    const fmt = /\{[^\}]+\}/g;
    str = str.replace(fmt, k => {
      return data[k.slice(1, -1)];
    });
    return str;
  }
}