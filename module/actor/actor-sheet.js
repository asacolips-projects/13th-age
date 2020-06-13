import { ActorSheetFlags } from './actor-flags.js';
import { ArchmagePrepopulate } from '../setup/utility-classes.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class ActorArchmageSheet extends ActorSheet {

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: super.defaultOptions.classes.concat(['archmage', 'actor-sheet']),
      template: 'systems/archmage/templates/actor-sheet.html',
      width: 800,
      height: 960,
      tabs: [
        { navSelector: ".tabs-primary", contentSelector: ".tabs-primary-content", initial: "powers" },
        { navSelector: ".tabs-sidebar", contentSelector: ".tabs-sidebar-content", initial: "abilities" }
      ]
    });
  }

  /* -------------------------------------------- */

  // get actorType() {
  //   return this.actor.data.type;
  // }

  /* -------------------------------------------- */

  /**
   * Add some extra data when rendering the sheet to reduce the amount of logic
   * required within the template.
   *
   * @return {Object} sheetData
   */
  getData() {
    const sheetData = super.getData();

    this._prepareCharacterItems(sheetData);

    // Return data to the sheet
    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Powers
    const powers = [];
    const equipment = [];

    // // Classes
    // const classes = [];

    // // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Feats
      if (i.type === 'power') {
        // Add labels.
        i.data.powerSource.label = CONFIG.ARCHMAGE.powerSources[i.data.powerSource.value];
        i.data.powerType.label = CONFIG.ARCHMAGE.powerTypes[i.data.powerType.value];
        i.data.powerUsage.label = CONFIG.ARCHMAGE.powerUsages[i.data.powerUsage.value];
        if (i.data.action) {
          i.data.actionTypes.label = CONFIG.ARCHMAGE.actionTypes[i.data.action.value];
        }
        powers.push(i);
      }

      if (i.type === 'tool' || i.type === 'loot' || i.type === 'equipment') {
        equipment.push(i);
      }
    }

    // Assign and return
    actorData.powers = powers;
    actorData.equipment = equipment;
    
    actorData.data.resources.perCombat.anyEnabled = actorData.data.resources.perCombat.momentum.enabled || actorData.data.resources.perCombat.commandPoints.enabled;
    actorData.data.resources.spendable.anyEnabled = actorData.data.resources.spendable.ki.enabled || actorData.data.resources.spendable.custom1.enabled || actorData.data.resources.spendable.custom2.enabled || actorData.data.resources.spendable.custom3.enabled;
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param {HTML} html The prepared HTML object ready to be rendered into
   * the DOM.
   *
   * @return {undefined}
   */
  activateListeners(html) {
    super.activateListeners(html);
    let that = this;

    // Activate tabs
    // html.find('.tabs').each((_, el) => {
    //   let tabs = $(el);
    //   let initial = this.actor.data.flags['_sheetTab-' + tabs.attr('data-tab-container')];
    //   new Tabs(tabs, initial, clicked => {
    //     this.actor.data.flags['_sheetTab-' + clicked.parent().attr('data-tab-container')] = clicked.attr('data-tab');
    //   });
    // });

    // Configure Special Flags
    html.find('.configure-flags').click(this._onConfigureFlags.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) {
      return;
    }

    // // Activate MCE
    // let editor = html.find('.editor-content');
    // createEditor({
    //   target: editor[0],
    //   height: this.position.height - 260,
    //   setup: ed => {
    //     this._mce = ed;
    //   },
    //   // eslint-disable-next-line camelcase
    //   save_onsavecallback: ed => {
    //     let target = editor.attr('data-edit');
    //     this.actor.update({[target]: ed.getContent()}, true);
    //   }
    // }).then(ed => {
    //   this.mce = ed[0];
    //   // this.mce.focus();
    // });

    // Ability Checks
    html.find('.ability-name').click(ev => {
      let abl = ev.currentTarget.parentElement.getAttribute('data-ability');
      this.actor.rollAbility(abl);
    });

    // Weapon Attacks
    html.find('.weapon.rollable').click(ev => {
      let weapon = $(ev.currentTarget).data();
      var templateData = {
        actor: this.actor,
        item: { name: weapon.label },
        data: {
          powerUsage: { value: 'at-will' },
          attack: { value: `[[d20 + ${weapon.atk} + @attributes.escalation.value]]` },
          hit: { value: `[[${weapon.dmg}]]` },
          miss: { value: `${weapon.miss}` }
        }
      };

      let template = 'systems/archmage/templates/chat/action-card.html';
      renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
          user: game.user._id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: content
        });
      });
    });

    // Recoveries.
    html.find('.recovery-roll.rollable').click(ev => {
      let actorData = this.actor.data.data;
      let totalRecoveries = actorData.attributes.recoveries.value;
      let recovery = $(ev.currentTarget).data();
      let formula = recovery.roll;

      // Handle average results.
      if (this.actor.getFlag('archmage', 'averageRecoveries')) {
        formula = actorData.attributes.level.value * (Number(actorData.attributes.recoveries.dice.replace('d', '')) / 2) + actorData.abilities.con.mod;
      }
      // Perform the roll.
      let roll = new Roll(Number(totalRecoveries) > 0 ? `${formula}` : `floor((${formula})/2)`);
      roll.roll();
      // Send to chat and reduce the number of recoveries.
      roll.toMessage({ flavor: `<div class="archmage chat-card"><header class="card-header"><h3 class="ability-usage">Recovery Roll${Number(totalRecoveries) < 1 ? ' (Half)' : ''}</h3></header></div>` });
      this.actor.update({
        'data.attributes.recoveries.value': Math.max(this.actor.data.data.attributes.recoveries.value - 1, 0),
        'data.attributes.hp.value': Math.min(this.actor.data.data.attributes.hp.max, this.actor.data.data.attributes.hp.value + roll.total)
      });
    });

    html.find('.icon__item.rollable').click(ev => {
      let actorData = this.actor.data.data;
      let item = $(ev.currentTarget).parents('.icon');
      let iconIndex = item.data('icon');

      if (actorData.icons[iconIndex]) {
        let icon = actorData.icons[iconIndex];
        let roll = new Roll(`${icon.bonus.value}d6cs>=5`);
        roll.roll().toMessage({
          flavor: `<div class="archmage chat-card"><header class="card-header"><h3 class="ability-usage ability-usage--recharge">Icon Roll</h3></header><div class="card-content"><div class="card-row"><div class="card-prop"><strong>${icon.name.value}:</strong> +${icon.bonus.value} ${icon.relationship.value}</div></div></div></div>`
        });
      }
    });

    html.find('.item-quantity.rollable').click(ev => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.getOwnedItem(li.dataset.itemId);
      let quantity = item.data.data.quantity;
      quantity.value = Number(quantity.value) + 1;
      let that = this;
      item.update({ "data.quantity": quantity }).then(item => {
        html.find('input[name="data.attributes.hp.max"]').trigger('change');
        that.render();
      });
    });

    html.find('.item-quantity.rollable').contextmenu(ev => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.getOwnedItem(li.dataset.itemId);
      let quantity = item.data.data.quantity;
      quantity.value = Number(quantity.value) - 1;
      quantity.value = quantity.value < 0 ? 0 : quantity.value;
      let that = this;
      item.update({ "data.quantity": quantity }).then(item => {
        html.find('input[name="data.attributes.hp.max"]').trigger('change');
        that.render();
      });
    });

    /* -------------------------------------------- */
    /*  Rollable Items                              */
    /* -------------------------------------------- */

    // html.find('.item .rollable').click(ev => {
    //   let itemId = Number($(ev.currentTarget).parents('.item').attr('data-item-id'));
    //   let Item = CONFIG.Item.entityClass;
    //   let item = new Item(this.actor.items.find(i => i.id === itemId), this.actor);
    //   item.roll();
    // });

    // Item summaries
    html.find('.item .item-name h4').click(event => this._onItemSummary(event));

    // Item Rolling
    html.find('.item .item-image').click(event => this._onItemRoll(event));
    html.find('.item--action h4').click(event => this._onItemRoll(event));
    html.find('.item--trait h4').click(event => this._onItemRoll(event));
    html.find('.item--nastier-special h4').click(event => this._onItemRoll(event));

    /* -------------------------------------------- */
    /*  Inventory
    /* -------------------------------------------- */

    // Create New Item
    html.find('.item-create').click(ev => {
      let header = event.currentTarget;
      let type = ev.currentTarget.getAttribute('data-item-type');
      let img = CONFIG.ARCHMAGE.defaultTokens[type] ? CONFIG.ARCHMAGE.defaultTokens[type] : CONFIG.DEFAULT_TOKEN;
      this.actor.createOwnedItem({
        name: 'New ' + type.capitalize(),
        type: type,
        img: img,
        data: duplicate(header.dataset)
      });
    });

    // html.find('.powers .item-create').on('contextmenu', ev => {
    html.find('.item-import').click(ev => {
      var itemType = ev.currentTarget.getAttribute('data-item-type');

      let validClasses = [
        'barbarian',
        'bard',
        'cleric',
        'commander',
        'fighter',
        'paladin',
        'ranger',
        'rogue',
        'sorcerer',
        'wizard'
      ];

      let allClasses = [
        'barbarian',
        'bard',
        'cleric',
        'fighter',
        'paladin',
        'ranger',
        'rogue',
        'sorcerer',
        'wizard',
        'chaosmage',
        'commander',
        'druid',
        'monk',
        'necromancer',
        'occultist'
      ];

      let classRegex = new RegExp(allClasses.join('|'), 'g');

      let cleanClassName = this.actor.data.data.details.class.value.toLowerCase().replace(/[^a-zA-z\d]/g, '');
      let powerLevel = this.actor.data.data.details.level;

      let characterClasses = cleanClassName.match(classRegex);

      // Import from toolkit13.com
      if (characterClasses.length > 0) {
        let offset = 250;
        characterClasses.forEach(powerClass => {
          if (validClasses.includes(powerClass)) {
            let prepop = new ArchmagePrepopulate();

            prepop.getPowersList(powerClass, powerLevel).then((res) => {
              var options = {
                width: 720,
                height: 640,
                left: offset,
                top: offset,
                classes: ['archmage-prepopulate']
              };

              offset += 25;

              for (let i = 0; i < res.powers.length; i++) {
                if (res.powers[i].usage !== null) {
                  res.powers[i].usageClass = _getPowerClasses(res.powers[i].usage)[0];
                }
                else {
                  res.powers[i].usageClass = 'other';
                }
              }

              var templateData = {
                powers: res.powers,
                class: powerClass,
                itemType: 'power' // @TODO: Make this not hardcoded.
              }

              let template = 'systems/archmage/templates/prepopulate/powers--list.html';
              renderTemplate(template, templateData).then(content => {
                let d = new Dialog({
                  title: `Import Powers (${powerClass})`,
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
                      callback: dlg => _onImportPower(dlg, this.actor, {})
                    }
                  }
                }, options);
                d.render(true);
              });
            });
          }
          // Import from compendiums.
          else {
            // let powers = game.items.entities.filter(item => item.type == 'power');
            let compendium = game.packs.filter(p => p.metadata.name == powerClass);
            if (compendium.length > 0) {
              compendium[0].getContent().then(res => {
                var options = {
                  width: 720,
                  height: 640,
                  classes: ['archmage-prepopulate']
                };

                let powers = res.sort((a, b) => {
                  function sortTest(a, b) {
                    if (a < b) {
                      return -1;
                    }
                    if (a > b) {
                      return 1;
                    }
                    return 0;
                  }
                  let aSort = [
                    a.data.data.powerLevel.value,
                    a.data.data.powerType.value,
                    a.data.name
                  ];
                  let bSort = [
                    b.data.data.powerLevel.value,
                    b.data.data.powerType.value,
                    b.data.name
                  ];
                  return sortTest(aSort[0], bSort[0]) || sortTest(aSort[1], bSort[1]) || sortTest(aSort[2], bSort[2]);
                }).map(p => {
                  return {
                    uuid: p.data._id,
                    title: p.data.name,
                    usage: p.data.data.powerUsage.value,
                    usageClass: p.data.data.powerUsage.value ? _getPowerClasses(p.data.data.powerUsage.value)[0] : 'other',
                    powerType: p.data.data.powerType.value,
                    level: p.data.data.powerLevel.value,
                  };
                });

                var templateData = {
                  powers: powers,
                  class: powerClass,
                  itemType: 'power' // @TODO: Make this not hardcoded.
                }

                let dlgData = {
                  powers: res
                };


                let template = 'systems/archmage/templates/prepopulate/powers--list.html';
                renderTemplate(template, templateData).then(content => {
                  let d = new Dialog({
                    title: `Import Powers (${powerClass})`,
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
                        callback: dlg => _onImportPower(dlg, this.actor, dlgData)
                      }
                    }
                  }, options);
                  d.render(true);
                });
              });
            }
            else {
              ui.notifications.error(`Class "${powerClass}" is not yet available for import.`);
            }
          }
        });
      }
    });

    function _getPowerClasses(inputString) {
      // Get the appropriate usage.
      let usage = 'other';
      let recharge = 0;
      let usageString = inputString !== null ? inputString.toLowerCase() : '';
      if (usageString.includes('will')) {
        usage = 'at-will';
      }
      else if (usageString.includes('recharge')) {
        usage = 'recharge';
        if (usageString.includes('16')) {
          recharge = 16;
        }
        else if (usageString.includes('11')) {
          recharge = 11;
        }
        else if (usageString.includes('6')) {
          recharge = 6;
        }
      }
      else if (usageString.includes('battle')) {
        usage = 'once-per-battle';
      }
      else if (usageString.includes('daily')) {
        usage = 'daily';
      }

      return [usage, recharge];
    }

    /**
     * Helper function to process relative links.
     *
     * This helper function processes relative links and replaces them as
     * external links to www.toolkit13.com.
     *
     * @param {String} inputString
     * @return {String}
     */
    function _replaceLinks(inputString) {
      var outputString = inputString;
      if (inputString !== undefined && inputString !== null) {
        if (inputString.includes('"/srd')) {
          outputString = inputString.replace(/\/srd/g, 'https://www.toolkit13.com/srd');
        }
      }
      return outputString;
    }

    function _onImportPower(dlg, actor, dlgData) {
      let $selected = $(dlg[0]).find('input[type="checkbox"]:checked');

      if ($selected.length <= 0) {
        return;
      }

      if (!dlgData.powers) {
        let prepop = new ArchmagePrepopulate();
        for (let input of $selected) {
          let $powerInput = $(input);
          var type = $powerInput.data('item-type');
          prepop.getPowerById($powerInput.data('uuid')).then((res) => {
            if (res.powers.length > 0) {
              let power = res.powers[0];
              let attack = {
                label: "Attack",
                type: "String",
                value: power.attack
              };
              // Get the appropriate usage.
              let usageArray = _getPowerClasses(power.usage);
              let usage = usageArray[0];
              let recharge = usageArray[1];
              // Get the appropriate action.
              let action = 'standard';
              let actionString = power.action !== null ? power.action.toLowerCase() : '';
              if (actionString.includes('move')) {
                action = 'move';
              }
              else if (actionString.includes('quick')) {
                action = 'quick';
              }
              else if (actionString.includes('interrupt')) {
                action = 'interrupt';
              }
              else if (actionString.includes('free')) {
                action = 'free';
              }
              actor.createOwnedItem({
                name: power.title,
                data: {
                  'powerUsage.value': usage,
                  'actionType.value': action,
                  'powerType.value': Object.entries(CONFIG.ARCHMAGE.powerTypes).find(p => p[1] == power.powerType)[0],
                  'powerLevel.value': power.level,
                  'range.value': power.type,
                  'trigger.value': power.trigger,
                  'target.value': power.target,
                  'attack.value': power.attack,
                  'hit.value': power.hit,
                  'miss.value': power.miss,
                  'missEven.value': power.missEven,
                  'missOdd.value': power.missOdd,
                  'cost.value': power.cost,
                  'castBroadEffect.value': power.castBroadEffect,
                  'castPower.value': power.castPower,
                  'sustainedEffect.value': power.sustainedEffect,
                  'finalVerse.value': power.finalVerse,
                  'effect.value': _replaceLinks(power.effect),
                  'special.value': _replaceLinks(power.special),
                  'spellLevel3.value': power.spellLevel3,
                  'spellLevel5.value': power.spellLevel5,
                  'spellLevel7.value': power.spellLevel7,
                  'spellLevel9.value': power.spellLevel9,
                  'spellChain.value': power.spellChain,
                  'breathWeapon.value': power.breathWeapon,
                  'recharge.value': recharge,
                  'feats.adventurer.description.value': power.featAdventurer,
                  'feats.champion.description.value': power.featChampion,
                  'feats.epic.description.value': power.featEpic,
                },
                type: type
              });
              return;
            }
          });
        }
      }
      else {
        // Get the selected powers.
        let powerIds = [];
        $selected.each((index, element) => {
          powerIds.push(element.dataset.uuid);
        });

        // Retrieve the item entities.
        let powers = dlgData.powers
          // Filter down the power items by id.
          .filter(p => {
            return powerIds.includes(p.data._id)
          })
          // Prepare the items for saving.
          .map(p => {
            return duplicate(p);
          });

        // Create the owned items.
        actor.createOwnedItem(powers);
      }
    }

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      let itemId = $(ev.currentTarget).parents('.item').attr('data-item-id');
      let Item = CONFIG.Item.entityClass;
      // const item = new Item(this.actor.items.find(i => i.id === itemId), {actor: this.actor});
      const item = this.actor.getOwnedItem(itemId);
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      let li = $(ev.currentTarget).parents('.item');
      let itemId = li.attr('data-item-id');
      this.actor.deleteOwnedItem(itemId);
      li.slideUp(200, () => this.render(false));
    });

    /* -------------------------------------------- */
    /*  Miscellaneous
    /* -------------------------------------------- */

    /* Item Dragging */
    // Core handlers from foundry.js
    let dragHandler = ev => this._onDragItemStart(ev);
    // Custom handlers.
    // let dragHandlerArchmage = ev => this._onDragItemStartArchmage(ev);
    // let dragOverHandlerArchmage = ev => this._onDragOverArchmage(ev);
    // let dropHandlerArchmage = ev => this._onDropArchmage(ev);
    html.find('.item').each((i, li) => {
      li.setAttribute('draggable', true);
      li.addEventListener('dragstart', dragHandler, false);
      // li.addEventListener('dragstart', dragHandlerArchmage, false);
      // li.addEventListener('ondragover', dragOverHandlerArchmage, false);
      // li.addEventListener('ondrop', dropHandlerArchmage, false);
    });
  }

  _onDragItemStartArchmage(ev) {
    // @TODO: Remove this if obsolete.
    // Get the source item's array index.
    // let $self = $(ev.target);
    // ev.dataTransfer.dropEffect = 'move';
    // ev.dataTransfer.setData('itemIndex', $self.data('index'));
  }

  _onDragOverArchmage(ev) {
    // @TODO: Add class on hover.
  }

  _onDropArchmage(ev) {
    // @TODO: Remove class on drop.
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for the Traits tab button to configure special Character Flags
   */
  _onConfigureFlags(event) {
    event.preventDefault();
    new ActorSheetFlags(this.actor).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id"),
      item = this.actor.getOwnedItem(itemId);
    item.roll();
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemSummary(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let item = this.actor.getOwnedItem(li.attr("data-item-id"));
    let chatData = item.getChatData({ secrets: this.actor.owner });

    // Toggle summary
    if (li.hasClass('item--power')) {
      if (li.hasClass("expanded")) {
        let summary = li.children(".item-summary");
        summary.slideUp(200, () => summary.remove());
      } else {
        let div = $(`<div class="item-summary"></div>`);
        let descrip = $(`<div class="item-description">${chatData.description.value}</div>`);
        let tags = $(`<div class="item-tags"></div>`);
        let props = $(`<div class="item-properties"></div>`);
        let effects = $(`<div class="item-effects"></div>`);
        chatData.tags.forEach(t => tags.append(`<span class="tag tag--${t.label.safeCSSId()}">${t.value}</span>`));
        if (chatData.range.value !== null) {
          props.append(`<div class="tag tag--property tag--${chatData.range.value.safeCSSId()}"><em>${chatData.range.value}</em></div>`)
        }
        chatData.properties.forEach(p => props.append(`<span class="tag tag--property tag--${p.label.safeCSSId()}"><strong>${p.label}:</strong> ${p.value}</span>`));
        chatData.effects.forEach(e => props.append(`<div class="tag tag--property tag--${e.label.safeCSSId()}"><strong>${e.label}:</strong> ${e.value}</div>`));
        chatData.feats.forEach(f => {
          props.append(`<div class="tag tag--feat tag--${f.isActive ? 'active' : 'inactive'} ${!f.isActive && game.settings.get("archmage", "hideInsteadOfOpaque") ? 'hide' : ''} tag--${f.label.safeCSSId()}"><strong>${f.label}:</strong><div class="description">${f.description}</div></div>`);
        });
        div.append(tags);
        div.append(props);
        div.append(effects);
        div.append(descrip);
        li.append(div.hide());
        div.slideDown(200);
      }
      li.toggleClass("expanded");
    }
  }
}