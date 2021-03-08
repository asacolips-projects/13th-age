import { ActorArchmageSheet } from './actor-sheet.js';

export class ActorArchmageSheetV2 extends ActorArchmageSheet {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: 800,
      height: 960
    });
    return options;
  }

  /** @override */
  get template() {
    const type = this.actor.data.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-v2.html`;
  }

  /** @override */
  getData() {
    const sheetData = super.getData();
    sheetData.actorJSON = JSON.stringify(sheetData.actor);
    console.log(sheetData);
    return sheetData;
  }

  // /** @override */
  activateListeners(html) {
    // super.activateListeners(html);

    // Disable input fields if the form is not editable
    // if ( !this.isEditable ) {
    //   this._disableFields(this.form);
    //   return
    // }

    // Rebind the Vue form.
    this.form = $(`form[data-actor-id="${this.actor.data._id}"]`)[0];

    // Process form submission
    this.form.onsubmit = this._onSubmit.bind(this, {preventRender: false});

    // Process changes to input fields
    html.on("change", "input,select,textarea", this._onChangeInput.bind(this));

    // // Detect and activate TinyMCE rich text editors
    // html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));

    // // Detect and activate file-picker buttons
    // html.find('button.file-picker').each((i, button) => this._activateFilePicker(button));

    // // Support Image updates
    // if ( this.options.editable ) {
    //   html.find('img[data-edit]').click(ev => this._onEditImage(ev));
    // }
  }

  /**
   * Customize how inner HTML is replaced when the application is refreshed
   * @param {HTMLElement|jQuery} element  The original HTML element
   * @param {HTMLElement|jQuery} html     New updated HTML
   * @private
   */
  _replaceHTML(element, html, options) {
    console.log('Rendering replacement...');
    let sheetData = this.getData();
    if ( !element.length ) return;

    // For pop-out windows update the inner content and the window title
    if ( this.popOut ) {
      // TODO: Replace this with Vue render.
      // element.find('.window-content').html(html);
      element.find('.window-title').text(this.title);
    }

    // For regular applications, replace the whole thing
    else {
      // TODO: Replace this with Vue render.
      // element.replaceWith(html);
      this._element = html;
    }
  }

  /** @override */
  _updateObject(event, formData) {
    const diffData = diffObject(this.actor.data, expandObject(formData));
    return super._updateObject(event, diffData);
  }
}