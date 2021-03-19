import { ActorArchmageSheet } from './actor-sheet.js';
import { ArchmagePrepopulate } from '../setup/archmage-prepopulate.js';

export class ActorArchmageSheetV2 extends ActorArchmageSheet {
  /** @override */
  constructor(...args) {
    super(...args);

    console.log('tester');

    /**
     * If this Actor Sheet represents a synthetic Token actor, reference the active Token
     * @type {Token}
     */
    this.token = this.object.token;
    this._vm = null;
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: 800,
      height: 960,
      submitOnClose: false, // Avoid double submissions.
      submitOnChange: true,
      dragDrop: [{dragSelector: '.item-list .item', dropSelector: null}]
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
    return sheetData;
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  render(force=false, options={}) {
    // Grab the sheetdata for both updates and new apps.
    let sheetData = this.getData();
    // Exit if Vue has already rendered.
    if (this._vm) {
      if (sheetData.data) Vue.set(this._vm.actor, 'data', sheetData.data);
      if (sheetData.items) Vue.set(this._vm.actor, 'items', sheetData.items);
      this._updateEditors($(this.form));
      return;
    }
    // Run the normal Foundry render once.
    this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
	    console.error(err);
	    this._state = Application.RENDER_STATES.ERROR;
    })
    // Run Vue's render, assign it to our prop for tracking.
    .then(rendered => {
      // Prepare the actor data.
      let el = this.element.find('.archmage-vueport');
      // Render Vue and assign it to prevent later rendering.
      VuePort.render(null, el[0], {data: {actor: sheetData.actor, owner: this.actor.owner}}).then(vm => {
        this._vm = vm;
        let html = $(this.form);
        this.activateVueListeners(html);
      });
    })
    // Return per the overridden method.
    return this;
  }

  /** @override */
  async close(options={}) {
    // Destroy the Vue app.
    if (this._vm) {
      this._vm.$destroy();
      this._vm = null;
    }
    console.log('/////////////////////\r\nCLOSING SHEET\r\n/////////////////////');
    return super.close(options);
  }

  // Update initial content throughout all editors.
  _updateEditors(html) {
    for (let [name, editor] of Object.entries(this.editors)) {
      const data = this.object instanceof Entity ? this.object.data : this.object;
      const initialContent = getProperty(data, name);
      const div = $(this.form).find(`.editor-content[data-edit="${name}"]`)[0];
      this.editors[name].initial = initialContent;
      this.editors[name].options.target = div;
    }
  }

  /** @override */
  activateEditor(name, options={}, initialContent="") {
    const editor = this.editors[name];
    if ( !editor ) throw new Error(`${name} is not a registered editor name!`);
    options = mergeObject(editor.options, options);
    options.height = options.target.offsetHeight;
    // Override initial content to pull from the editor, to avoid stale data.
    initialContent = editor.initial;
    TextEditor.create(options, initialContent).then(mce => {
      editor.mce = mce;
      editor.changed = false;
      editor.active = true;
      mce.focus();
      mce.on('change', ev => editor.changed = true);
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  Event Listeners ------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // CRUD listeners.
    html.on('click', '.item-create', (event) => this._createItem(event));
    html.on('click', '.item-delete', (event) => this._deleteItem(event));
    html.on('click', '.item-edit', (event) => this._editItem(event));

    // Support Image updates
    if ( this.options.editable ) {
      html.on('click', 'img[data-edit]', (event) => this._onEditImage(event));
    }

    // Roll listeners.
    html.on('click', '.rollable', (event) => this._onRollable(event));

    // Other listeners.
    html.on('click', '.item-import', (event) => this._importPowers(event));
    html.on('click', '.death-save-attempts input[type="checkbox"]', (event) => this._updateDeathFails(event));
    html.on('click', '.icon-roll', (event) => this._updateIconRoll(event));
  }

  /**
   * Activate additional listeners on the rendered Vue app.
   * @param {jQuery} html
   */
  activateVueListeners(html) {
    html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));
  }

  /* ------------------------------------------------------------------------ */
  /*  Create, Update, Delete------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /**
   * Create items on the actor, such as powers or magic items.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  async _createItem(event) {
    let target = event.currentTarget;
    let dataset = duplicate(target.dataset);

    // Grab the item type from the dataset and then remove it.
    let itemType = dataset.itemType ?? 'power';
    delete dataset.itemType;

    // Default image.
    let img = CONFIG.ARCHMAGE.defaultTokens[itemType] ?? CONFIG.DEFAULT_TOKEN;

    // Initialize data.
    let data = {};
    if (typeof dataset == 'object') {
      for (let [k,v] of Object.entries(dataset)) {
        data[k] = { value: v };
      }
    }
    else {
      data = dataset;
    }

    // Create the item.
    let item = await this.actor.createOwnedItem({
      name: 'New ' + game.i18n.localize(`ARCHMAGE.${itemType}`),
      type: itemType,
      img: img,
      data: data
    });

    console.log(item);
  }

  /**
   * Delete items from the actor.
   *
   * @param {Event} event
   *   Html event that triggered the method.
   */
  async _deleteItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Delete the tiem from the actor object.
    await this.actor.deleteOwnedItem(itemId);
  }

  _editItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Render the edit form.
    const item =this.actor.getOwnedItem(itemId);
    if (item) item.sheet.render(true);
  }

  /* ------------------------------------------------------------------------ */
  /*  Handle rolls ---------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /**
   * Handle rollable clicks.
   */
  _onRollable(event) {
    event.preventDefault;
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.rollType ?? null;
    let opt = dataset.rollOpt ?? null;

    if (type == 'item' && opt) this._onItemRoll(opt);
    else if (type == 'recovery') this._onRecoveryRoll();
    else if (type == 'save' || type == 'disengage') this._onSaveRoll(opt);
    else if (type == 'init') this._onInitRoll();
    else if (type == 'ability') this._onAbilityRoll(opt);
    else if (type == 'background') this._onBackgroundRoll(opt);
    else if (type == 'icon') this._onIconRoll(opt);
    // else if (type == 'command') this._onCommandRoll(opt);

    // Fallback to a plain formula roll.
    else if (opt) this._onFormulaRoll(opt);
  }

  /**
   * Perform a basic roll and send it to chat.
   *
   * @param {string} formula
   */
  _onFormulaRoll(formula) {
    let roll = new Roll(formula, this.actor.getRollData());
    roll.roll();
    roll.toMessage();
  }

  /**
   * Perform an owned item's roll.
   *
   * @param {string} id
   */
  _onItemRoll(id) {
    let item = this.actor.getOwnedItem(id);
    if (item) item.roll();
  }

  /**
   * Roll a recovery for the actor.
   */
  async _onRecoveryRoll() {
    let actorData = this.actor.data.data;
    let attr = actorData.attributes;
    let totalRecoveries = attr.recoveries.value;
    let formula = `${attr.level.value}${attr.recoveries.dice}+${actorData.abilities.con.dmg}`;

    // Handle average results.
    if (this.actor.getFlag('archmage', 'averageRecoveries')) {
      formula = Math.floor(attr.level.value * ((Number(attr.recoveries.dice.replace('d', ''))+1) / 2)) + actorData.abilities.con.dmg;
    }
    // Handle strong recovery. Ignores average results if set!
    if (this.actor.getFlag('archmage', 'strongRecovery')) {
      formula = (attr.level.value + actorData.tier).toString() + attr.recoveries.dice + 'k' + attr.level.value.toString() + '+' + actorData.abilities.con.dmg.toString();
    }
    // Perform the roll.
    let roll = new Roll(Number(totalRecoveries) > 0 ? `${formula}` : `floor((${formula})/2)`);
    roll.roll();
    // Send to chat and reduce the number of recoveries.
    roll.toMessage({
      flavor: `<div class="archmage chat-card"><header class="card-header"><h3 class="ability-usage">Recovery Roll${Number(totalRecoveries) < 1 ? ' (Half)' : ''}</h3></header></div>`
    });
    await this.actor.update({
      'data.attributes.recoveries.value': attr.recoveries.value - 1,
      'data.attributes.hp.value': Math.min(attr.hp.max, Math.max(attr.hp.value, 0) + roll.total)
    });
  }


  /**
   * Roll a saving throw for the actor.
   *
   * @param {string} difficulty
   *   The save type, such as 'easy', 'normal', 'hard', 'death', or 'disengage'.
   */
  async _onSaveRoll(difficulty) {
    // Initialize the roll and our values.
    let actor = this.actor;
    let roll = new Roll(`d20`);
    let result = roll.roll();
    let dc = 'normal';

    // Determine the roll type.
    if (difficulty == 'easy') {
      dc = 'easy';
    }
    else if (difficulty == 'hard' || difficulty == 'death') {
      dc = 'hard';
    }
    else if (difficulty == 'disengage') {
      dc = 'disengage';
    }

    // Create the chat message title.
    let label = game.i18n.localize(`ARCHMAGE.SAVE.${difficulty}`);

    // Determine the roll result.
    let target = dc != 'disengage' ? actor.data.data.attributes.save[dc] : actor.data.data.attributes.disengage;
    let rollResult = result.total;
    let success = rollResult >= target;

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/save-card.html`
    const token = actor.token;

    // Basic chat message data
    const chatData = {
      user: game.user._id,
      type: 5,
      roll: roll,
      speaker: {
        actor: actor._id,
        token: actor.token,
        alias: actor.name,
        scene: game.user.viewedScene
      }
    };

    const templateData = {
      actor: actor,
      tokenId: token ? `${token.scene._id}.${token.id}` : null,
      saveType: label,
      success: success,
      data: chatData,
      target
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);
    ChatMessage.create(chatData, { displaySheet: false });

    // Handle recoveries or failures on death saves.
    if (difficulty == 'death') {
      if (success) {
        actor.rollRecovery({}, true);
      }
      else {
        await actor.update({
          'data.attributes.saves.deathFails.value': Math.min(4, Number(actor.data.data.attributes.saves.deathFails.value) + 1)
        });
      }
    }
  }

  /**
   * Roll initiative for the actor.
   */
  async _onInitRoll() {
    let combat = game.combat;
    // Check to see if this actor is already in the combat.
    if (!combat) return;
    let combatant = combat.combatants.find(c => c?.actor?.data?._id == this.actor._id);
    // Create the combatant if needed.
    if (!combatant) {
      await this.actor.rollInitiative({createCombatants: true});
    }
    // Otherwise, determine if the existing combatant should roll init.
    else if (!combatant.initiative && combatant.initiative !== 0) {
      await combat.rollInitiative([combatant._id]);
    }
  }

  /**
   * Roll ability check for the actor.
   */
  _onAbilityRoll(ability) {
    this.actor.rollAbility(ability);
  }

  /**
   * Roll background check for the actor.
   */
   _onBackgroundRoll(background) {
    this.actor.rollAbility(null, background);
  }

  /**
   * Roll an icon relationship for the actor.
   *
   * @param {string} iconIndex | Index, such as i1 or i2
   * @returns object | Chat message
   */
  async _onIconRoll(iconIndex) {
    let actorData = this.actor.data.data;

    if (actorData.icons[iconIndex]) {
      let icon = actorData.icons[iconIndex];
      let roll = new Roll(`${icon.bonus.value}d6`);
      let result = roll.roll();

      let fives = 0;
      let sixes = 0;
      var rollResults;

      let actorIconResults = [];

      if (!isNewerVersion(game.data.version, "0.7")) {
        rollResults = result.parts[0].rolls;
        rollResults.forEach(rollResult => {
          if (rollResult.roll == 5) {
            fives++;
            actorIconResults.push(5);
          }
          else if (rollResult.roll == 6) {
            sixes++;
            actorIconResults.push(6);
          }
          else {
            actorIconResults.push(0);
          }
        });
      }
      else {
        rollResults = result.terms[0].results;
        rollResults.forEach(rollResult => {
          if (rollResult.result == 5) {
            fives++;
            actorIconResults.push(5);
          }
          else if (rollResult.result == 6) {
            sixes++;
            actorIconResults.push(6);
          }
          else {
            actorIconResults.push(0);
          }
        });
      }

      // Update actor.
      let updateData = {};
      updateData[`data.icons.${iconIndex}.results`] = actorIconResults;
      await this.actor.update(updateData);

      // Basic template rendering data
      const template = `systems/archmage/templates/chat/icon-relationship-card.html`
      const token = this.actor.token;

      // Basic chat message data
      const chatData = {
        user: game.user._id,
        type: 5,
        roll: roll,
        speaker: {
          actor: this.actor._id,
          token: this.actor.token,
          alias: this.actor.name,
          scene: game.user.viewedScene
        }
      };

      const templateData = {
        actor: this.actor,
        tokenId: token ? `${token.scene._id}.${token.id}` : null,
        icon: icon,
        fives: fives,
        sixes: sixes,
        hasFives: fives > 0,
        hasSixes: sixes > 0,
        data: chatData
      };

      // Toggle default roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
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
          for (var deckId in decks) {
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
  }

  /* ------------------------------------------------------------------------ */
  /*  Special Listeners ----------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  async _updateDeathFails(event) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    if (dataset.opt) {
      let deathCount = Number(dataset.opt);
      if (deathCount == this.actor.data.data.attributes.saves.deathFails.value) {
        deathCount = Math.max(0, deathCount - 1);
      }
      await this.actor.update({'data.attributes.saves.deathFails.value': deathCount});
    }
  }

  async _updateIconRoll(event) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    if (dataset.roll && dataset.key && dataset.rollKey) {
      let iconIndex = dataset.key;
      let resultIndex = dataset.rollKey;
      let value = Number(dataset.roll);

      // Increment the value.
      value++;
      if (value > 6) {
        value = 0;
      }
      else if (value < 5) {
        value = 5;
      }

      // Retrieve the original results array, replace this die result.
      let results = this.actor.data.data.icons[iconIndex].results;
      results[resultIndex] = value;

      // Execute the update.
      let updates = {};
      updates[`data.icons.${iconIndex}.results`] = results;
      await this.actor.update(updates);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  Import Powers --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  async _importPowers(event) {
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
          callback: dlg => this._onImportPower(dlg, this.actor, classResults.powers)
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
  }

  _onImportPower(dlg, actor, packData) {
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
      actor.createOwnedItem(powers);
    }
  }
}

Hooks.on('deleteCombat', (combat, data, id) => {
  let combatants = combat.data.combatants;
  if (combatants) {
    let actors = combatants.filter(c => c?.actor?.data?.type == 'character');
    actors.forEach(async (actor) => {
      await actor.update({
        'data.attributes.saves.deathFails.value': 0,
      });
    });
  }
});