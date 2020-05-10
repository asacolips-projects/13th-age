import { ArchmagePrepopulate } from '../setup/utility-classes.js';

/**
 * Override and extend the basic :class:`ItemSheet` implementation
 */
export class ItemArchmageSheet extends ItemSheet {

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['archmage', 'item', 'item-sheet']),
      template: 'systems/archmage/templates/item-power-sheet.html',
      height: 400,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-tabs-content", initial: "details" }]
    });
  }

  constructor(item, options) {
    super(item, options);
    this.mce = null;
  }

  /* -------------------------------------------- */

  /**
   * Use a type-specific template for each different item type
   */
  get template() {
    let type = this.item.type;
    // Special cases.
    if (type === 'nastierSpecial') {
      type = 'nastier-special';
    }
    // Get template.
    return `systems/archmage/templates/items/item-${type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /**
   * Prepare item sheet data
   * Start with the base item data and extending with additional properties for
   * rendering.
   *
   * @return {undefined}
   */
  getData() {
    const data = super.getData();

    // Power-specific data
    if (this.item.type === 'power') {
      data['powerSources'] = CONFIG.ARCHMAGE.powerSources;
      data['powerTypes'] = CONFIG.ARCHMAGE.powerTypes;
      data['powerUsages'] = CONFIG.ARCHMAGE.powerUsages;
      data['actionTypes'] = CONFIG.ARCHMAGE.actionTypes;
    }

    if (this.actor) {
      let powerClass = 'monster';

      if (this.actor.type === 'character') {
        // Pass general character data.
        powerClass = this.actor.data.data.details.class.value.toLowerCase();
      }

      let powerLevel = this.actor.data.data.details.level.value;
      let powerLevelString = '';

      for (let i = 1; i <= powerLevel; i++) {
        if (powerLevelString.length < 1) {
          powerLevelString = '' + i;
        }
        else {
          powerLevelString = `${powerLevelString}+${i}`;
        }

        if (i >= 10) {
          break;
        }
      }

      data['powerClass'] = powerClass;
      data['powerLevel'] = powerLevelString;
    }

    return data;
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for interactive item sheet events.
   *
   * @param {HTML} html The prepared HTML object ready to be rendered into
   *
   * @return {undefined}
   */
  activateListeners(html) {
    super.activateListeners(html);

    // // Activate tabs
    // new Tabs(html.find('.tabs'));

    $('.archmage-import-power').on('click', (event) => {
      let prepop = new ArchmagePrepopulate();
      let powerClass = $(event.target).data('class');
      let powerLevel = $(event.target).data('level');
      prepop.getPowersList(powerClass, powerLevel).then((res) => {
        var options = {
          width: 520,
          height: 640
        };

        let template = 'systems/archmage/templates/prepopulate/powers--list.html';
        renderTemplate(template, {
          powers: res.powers,
          class: powerClass
        }).then(content => {
          let d = new Dialog({
            title: "Import Power",
            content: content,
            buttons: {
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => null
              },
              submit: {
                icon: '<i class="fas fa-check"></i>',
                label: "Submit",
                callback: () => null
              }
            }
          }, options);
          d.render(true);
        });
      });
    });

    $('body').on('click', '.import-powers-link', (event) => {
      event.preventDefault();
      event.stopPropagation();
      let $self = $(event.currentTarget);
      let prepop = new ArchmagePrepopulate();
      prepop.getPowerById($self.data('uuid')).then((res) => {
      });
    });
  }
}