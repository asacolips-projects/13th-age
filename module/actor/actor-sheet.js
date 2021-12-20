import { ArchmagePrepopulate } from '../setup/archmage-prepopulate.js';
import { ItemArchmage } from "../item/item.js";

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
  getData(options) {
    let isOwner = this.document.isOwner;
    let isEditable = this.isEditable;
    let sheetData = foundry.utils.deepClone(this.object.data);

    // Copy and sort Items
    // let items = this.object.items.map(i => foundry.utils.deepClone(i.data));
    // items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    // sheetData.items = items;

    // Copy Active Effects
    // let effects = this.object.effects.map(e => foundry.utils.deepClone(e.data));
    // sheetData.effects = effects;


    this._prepareCharacterItems(sheetData);

    let powers = sheetData.powers ?? [];

    if (this.actor.data.type == 'character') {
      // Fallback to grouping by type if not specified.
      if (!sheetData.sheetGrouping) {
        sheetData.sheetGrouping = 'type';
      }

      if (sheetData.sheetGrouping == "type") {
        sheetData.byType = true;
        sheetData.features = powers.filter(power => power.data.powerType.value === "feature");
        sheetData.talents = powers.filter(power => power.data.powerType.value === "talent");
        sheetData.spells = powers.filter(power => power.data.powerType.value === "spell");
        sheetData.powers = powers.filter(power => power.data.powerType.value === "power");
        sheetData.flexible = powers.filter(power => power.data.powerType.value === "maneuver" || power.data.powerType.value === "flexible");
        sheetData.other = powers.filter(power => power.data.powerType.value == undefined || power.data.powerType.value === "" || power.data.powerType.value === "other");
      }
      else if (sheetData.sheetGrouping == "action") {
        sheetData.byAction = true;
        sheetData.class = powers.filter(power => power.data.actionType.value === "");
        sheetData.actions = powers.filter(power => power.data.actionType.value !== "");
      }
      else if (sheetData.sheetGrouping == "group") {
        sheetData.byGroup = true;
        let groups = [];
        let powerDict = {};
        powers.forEach(power => {
          let groupValue = power.data.group?.value;
          if (groupValue == undefined || groupValue == "") {
            groupValue = game.i18n.localize("ARCHMAGE.other");
          }
          if (groups.indexOf(groupValue) < 0) {
            groups.push(groupValue);
            if (powerDict[groupValue] == undefined) {
              powerDict[groupValue] = [];
            }
          }
          powerDict[groupValue].push(power);
        });
        const keys = Object.keys(powerDict);

        let namePowerPairs = [];
        for (let x = 0; x < keys.length; x++) {
          let key = keys[x];
          namePowerPairs.push({
            name: key,
            powers: powerDict[key]
          });
        }
        sheetData.namePowerPairs = namePowerPairs;
      }
    }

    // Return data to the sheet
    sheetData.actor = this.object;
    sheetData.cssClass = isEditable ? "editable" : "locked";
    sheetData.editable = isEditable;
    sheetData.limited = this.object.limited;
    sheetData.options = this.options;
    sheetData.owner = isOwner;
    sheetData.title = this.title;

    // console.log(sheetData);

    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(actorData) {

    // Powers
    const powers = [];
    const equipment = [];

    // // Classes
    // const classes = [];

    // // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let item of actorData.items) {
      let i = duplicate(item);
      i.img = i.img || CONST.DEFAULT_TOKEN;
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

    actorData.data.resources = actorData.data.resources ? actorData.data.resources : {};

    if (!actorData.data.resources.perCombat) {
      actorData.data.resources.perCombat = { anyEnabled: false };
    }
    if (!actorData.data.resources.spendable) {
      actorData.data.resources.spendable = { anyEnabled: false };
    }

    actorData.data.resources.perCombat.anyEnabled = actorData.data.resources.perCombat?.momentum?.enabled || actorData.data.resources.perCombat?.commandPoints?.enabled;
    actorData.data.resources.spendable.anyEnabled = actorData.data.resources.spendable?.ki?.enabled || actorData.data.resources.spendable?.custom1?.enabled || actorData.data.resources.spendable?.custom2?.enabled || actorData.data.resources.spendable?.custom3?.enabled;

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

    // Rests
    html.find('.quick-rest').click(ev => {
      if (event.shiftKey) {
        this.actor.restQuick();
      } else {
        let doRest = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.QuickRest"),
          buttons: {
            rest: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Rest"),
              callback: () => {doRest = true;}
            },
            cancel: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
              callback: () => {}
            }
          },
          default: 'rest',
          close: html => {
            if (doRest) {this.actor.restQuick();}
          }
        }).render(true);
      }
    });
    html.find('.full-rest').click(ev => {
      if (event.shiftKey) {
        this.actor.restFull();
      } else {
        let doRest = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.FullHeal"),
          buttons: {
            rest: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Rest"),
              callback: () => {doRest = true;}
            },
            cancel: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
              callback: () => {}
            }
          },
          default: 'rest',
          close: html => {
            if (doRest) {this.actor.restFull();}
          }
        }).render(true);
      }
    });

    // Ability Checks
    html.find('.ability-name').click(ev => {
      let abl = ev.currentTarget.parentElement.getAttribute('data-ability');
      this.actor.rollAbility(abl);
    });

    // Weapon Attacks
    html.find('.weapon.rollable').click(ev => {
      let weapon = $(ev.currentTarget).data();
      const templateData = {
        actor: this.actor,
        item: {name: weapon.label},
        data: {
          powerUsage: {value: 'at-will'},
          attack: {value: `[[d20 + ${weapon.atk} + @attributes.escalation.value]]`},
          hit: {value: `[[${weapon.dmg}]]`},
          miss: {value: `${weapon.miss}`}
        }
      };

      let template = 'systems/archmage/templates/chat/action-card.html';
      renderTemplate(template, templateData).then(content => {
        ChatMessage.create({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: content
        });
      });
    });

    // Recoveries.
    html.find('.recovery-roll.rollable').click(ev => this.actor.rollRecoveryDialog(ev));

    html.find('.icon__item.rollable').click(async ev => {
      let actorData = this.actor.data.data;
      let item = $(ev.currentTarget).parents('.icon');
      let iconIndex = item.data('icon');

      if (actorData.icons[iconIndex]) {
        let icon = actorData.icons[iconIndex];
        let roll = new Roll(`${icon.bonus.value}d6`);
        let result = roll.roll();

        let fives = 0;
        let sixes = 0;
        let rollResults;

        rollResults = result.terms[0].results;
        rollResults.forEach(rollResult => {
          if (rollResult.result == 5) {
            fives++;
          }
          else if (rollResult.result == 6) {
            sixes++;
          }
        });

        // Basic template rendering data
        const template = `systems/archmage/templates/chat/icon-relationship-card.html`
        const token = this.actor.token;

        // Basic chat message data
        const chatData = {
          user: game.user.id,
          type: 5,
          roll: roll,
          speaker: {
            actor: this.actor.id,
            token: this.actor.token,
            alias: this.actor.name,
            scene: game.user.viewedScene
          }
        };

        const templateData = {
          actor: this.actor,
          tokenId: token ? `${token.id}` : null,
          icon: icon,
          fives: fives,
          sixes: sixes,
          hasFives: fives > 0,
          hasSixes: sixes > 0,
          data: chatData
        };

        // Toggle default roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
        if (rollMode === "blindroll") chatData["blind"] = true;

        // Render the template
        chatData["content"] = await renderTemplate(template, templateData);

        let message = ChatMessage.create(chatData, { displaySheet: false });

        // Card support
        if (game.decks) {

          for (var x = 0; x < fives; x++) {
            await addIconCard(icon.name.value, 5);
          }
          for (var x = 0; x < sixes; x++) {
            await addIconCard(icon.name.value, 6);
          }

          async function addIconCard(icon, value) {
            let decks = game.decks.decks;
            for (let deckId in decks) {
              let msg = {
                type: "GETALLCARDSBYDECK",
                playerID: game.users.find(el => el.isGM && el.active).id,
                deckID: deckId
              };

              const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

              let foundCard = undefined;
              game.socket.on("module.cardsupport", async (recieveMsg) => {
                if (recieveMsg?.cards == undefined || foundCard) return;
                let card = recieveMsg.cards.find(x => x?.flags?.world?.cardData?.icon && x.flags.world.cardData.icon == icon && x.flags.world.cardData.value == value);

                if (card) {
                  await ui.cardHotbar.populator.addToPlayerHand([card]);
                  foundCard = true;
                  // Unbind
                  game.socket.off("module.cardsupport");
                }
                foundCard = false;
              });

              game.socket.emit("module.cardsupport", msg);

              await wait(200);
              // Unbind
              game.socket.off("module.cardsupport");
              if (foundCard) return;
            }
          }
        }

        return message;
      }
    });

    async function rollSave(type, target, actor) {
      let roll = new Roll(`d20`);
      let result = roll.roll();

      let rollResult = result.total;

      let success = rollResult >= target;

      // Basic template rendering data
      const template = `systems/archmage/templates/chat/save-card.html`
      const token = actor.token;

      // Basic chat message data
      const chatData = {
        user: game.user.id,
        type: 5,
        roll: roll,
        speaker: {
          actor: actor.id,
          token: actor.token,
          alias: actor.name,
          scene: game.user.viewedScene
        }
      };

      const templateData = {
        actor: actor,
        tokenId: token ? `${token.id}` : null,
        saveType: type,
        success: success,
        data: chatData,
        target
      };

      // Toggle default roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
      if (rollMode === "blindroll") chatData["blind"] = true;

      // Render the template
      chatData["content"] = await renderTemplate(template, templateData);

      let message = ChatMessage.create(chatData, { displaySheet: false });
      return message;
    }

    html.find('.easy-save.rollable').click(async ev => {
      return await rollSave(game.i18n.localize("ARCHMAGE.SAVE.easy"), this.actor.data.data.attributes.saves.easy, this.actor);
    });

    html.find('.normal-save.rollable').click(async ev => {
      return await rollSave(game.i18n.localize("ARCHMAGE.SAVE.normal"), this.actor.data.data.attributes.saves.normal, this.actor);
    });

    html.find('.hard-save.rollable').click(async ev => {
      return await rollSave(game.i18n.localize("ARCHMAGE.SAVE.hard"), this.actor.data.data.attributes.saves.hard, this.actor);
    });

    html.find('.disengage.rollable').click(async ev => {
      return await rollSave(game.i18n.localize("ARCHMAGE.SAVE.disengage"), this.actor.data.data.attributes.disengage, this.actor);
    });

    html.find('.item-quantity.rollable').click(async (event) => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);

      // Update the owned item and rerender.
      let value = Number(item.data.data.quantity.value || 0) + 1;
      if (item.data.data.maxQuantity.value) {
        value = Math.min(value, item.data.data.maxQuantity.value);
      }
      await this.actor.updateEmbeddedDocuments('Item', {
        _id: item.id,
        data: { quantity: { value: value } }
      });

      this.render();
    });

    html.find('.item-quantity.rollable').contextmenu(async (event) => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);

      // Update the owned item and rerender.
      await this.actor.updateEmbeddedDocuments('Item', {
        _id: item.id,
        data: {
          quantity: {
            value: Math.max(0, Number(item.data.data.quantity.value || 0) - 1)
          }
        }
      });

      this.render();
    });

    /* -------------------------------------------- */
    /*  Rollable Items                              */
    /* -------------------------------------------- */

    // html.find('.item .rollable').click(ev => {
    //   let itemId = Number($(ev.currentTarget).parents('.item').attr('data-item-id'));
    //   let Item = CONFIG.Item.documentClass;
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
      let dataset = header.dataset;
      let type = ev.currentTarget.getAttribute('data-item-type');
      let img = CONFIG.ARCHMAGE.defaultTokens[type] ? CONFIG.ARCHMAGE.defaultTokens[type] : CONFIG.DEFAULT_TOKEN;
      let data = {};
      if (type == 'power') {
        if (typeof dataset == 'object') {
          for (let [k,v] of Object.entries(dataset)) {
            data[k] = { value: v };
          }
        }
      }
      else {
        data = dataset;
      }
      this.actor.createEmbeddedDocuments('Item', [{
        name: 'New ' + type.capitalize(),
        type: type,
        img: img,
        data: data
      }]);
    });

    // html.find('.powers .item-create').on('contextmenu', ev => {
    html.find('.item-import').click(async ev => {
      let characterRace = this.actor.data.data.details.race.value;

      let characterClasses = this.actor.data.data.details.detectedClasses ?? [];
      let prepop = new ArchmagePrepopulate();
      let classResults = await prepop.renderDialog(characterClasses, characterRace);
      if (!classResults) {
        return;
      }

      let d = new Dialog({
        title: `Import Powers`,
        content: classResults.content,
        buttons: {
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => null
          },
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: "Submit",
            callback: dlg => _onImportPower(dlg, this.actor, classResults.powers)
          }
        },
        render: html => {
          let tabs = new Tabs(classResults.tabs);
          tabs.bind(html[0]);
          html.find('.import-powers-item').addClass('collapsed');
          html.find('.import-powers-item .item-summary').css('max-height', 0);
          html.find('.import-powers-item .ability-usage').on('click', event => {
            event.preventDefault();
            let li = $(event.currentTarget).parents(".import-powers-item");
            let summary = li.find('.item-summary');
            li.toggleClass('collapsed');
            if (li.hasClass('collapsed')) {
              summary.css('max-height', 0);
            }
            else {
              summary.css('max-height', summary.find('.card-content').outerHeight() + 40)
            }
          });
        }
      }, classResults.options);
      d.render(true);
    });

    function _onImportPower(dlg, actor, packData) {
      let $selected = $(dlg[0]).find('input[type="checkbox"]:checked');

      if ($selected.length <= 0) {
        return;
      }

      if (packData) {
        // Get the selected powers.
        let powerIds = [];
        $selected.each((index, element) => {
          powerIds.push(element.dataset.uuid);
        });

        // Retrieve the item entities.
        let powers = packData
          // Filter down the power items by id.
          .filter(p => {
            return powerIds.includes(p.data._id)
          })
          // Prepare the items for saving.
          .map(p => {
            return duplicate(p);
          });

        // Create the owned items.
        actor.createEmbeddedDocuments('Item', powers);
      }
    }

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      let itemId = $(ev.currentTarget).parents('.item').attr('data-item-id');
      let Item = CONFIG.Item.documentClass;
      // const item = new Item(this.actor.items.find(i => i.id === itemId), {actor: this.actor});
      const item = this.actor.items.get(itemId);
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      let li = $(ev.currentTarget).parents('.item');
      let itemId = li.attr('data-item-id');
      let item = this.actor.items.get(itemId);
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    /* -------------------------------------------- */
    /*  Miscellaneous
    /* -------------------------------------------- */

    /* Item Dragging */
    // Core handlers from foundry.js
    let dragHandler;
    dragHandler = ev => this._onDragStart(ev);

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
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  _onItemRoll(event) {
    event.preventDefault();
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    let item = this.actor.items.get(itemId);
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
    let item = this.actor.items.get(li.attr("data-item-id"));
    let chatData = item.getChatData({
      secrets: this.actor.isOwner,
      rollData: this.actor.getRollData(item)
      });

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