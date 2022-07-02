import { ArchmagePrepopulate } from '../setup/archmage-prepopulate.js';
// Import Vue dependencies.
import { createApp } from "../../scripts/lib/vue.esm-browser.js";
import { ArchmageCharacterSheet } from "../../vue/components.vue.es.js";

export class ActorArchmageSheetV2 extends ActorSheet {
  /** @override */
  constructor(...args) {
    super(...args);

    // Properties that we'll use for the Vue app.
    this.vueApp = null;
    this.vueRoot = null;
    this.vueComponents = {
      'character-sheet': ArchmageCharacterSheet
    };
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    mergeObject(options, {
      classes: options.classes.concat(['archmage-v2', 'actor', 'character-sheet']).filter(c => c !== 'archmage'),
      width: 960,
      height: 960,
      submitOnClose: true,
      submitOnChange: true,
      dragDrop: [{dragSelector: '.item-list .item', dropSelector: null}]
    });
    return options;
  }

  /** @override */
  get template() {
    const type = this.actor.data.type;
    return `systems/archmage/templates/actors/actor-${type}-sheet-vue.html`;
  }

  /** @override */
  getData(options) {

    // Basic data
    let isOwner = this.actor.isOwner;
    const context = {
      owner: isOwner,
      limited: this.actor.limited,
      options: this.options,
      editable: this.isEditable,
      cssClass: isOwner ? "editable" : "locked",
      isCharacter: this.actor.type === "character",
      isNPC: this.actor.type === "npc",
      config: CONFIG.DND5E,
      rollData: this.actor.getRollData.bind(this.actor)
    };

    // Convert the actor data into a more usable version.
    let actorData = this.actor.data.toObject(false);

    // Add to our data object that the sheet will use.
    context.actor = actorData;
    context.data = actorData.data;
    context.actor.owner = context.owner;
    context.actor._source = foundry.utils.deepClone(this.actor.data._source.data);
    context.actor.overrides = foundry.utils.flattenObject(this.actor.overrides);

    // Add token info if needed.
    if (this.actor?.token?.id) {
      if (!this.actor.token.actorLink && this.actor?.token?.id) {
        context.actor.token.id = this.actor.token.id;
        context.actor.token.sceneId = this.actor.token?.parent?.id;
      }
    }

    // Add pack info if needed.
    if (this.actor?.pack) {
      context.actor.pack = this.actor.pack;
    }

    // Sort items.
    context.actor.items = actorData.items;
    context.actor.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Sort effects.
    context.actor.effects = actorData.effects;
    context.actor.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Retrieve a list of locked fields due to AEs.
    context.actor.lockedFields = [];
    this.actor.effects.forEach(ae => {
      const changes = ae.data.changes.map(c => c.key);
      context.actor.lockedFields = context.actor.lockedFields.concat(changes);
    });

    return context;
  }

  /* ------------------------------------------------------------------------ */
  /*  Vue Rendering --------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /** @override */
  render(force=false, options={}) {
    const context = this.getData();

    // Render the vue application after loading. We'll need to destroy this
    // later in the this.close() method for the sheet.
    if (!this.vueApp || !this.vueRoot) {
      this.vueRoot = null;
      this.vueApp = createApp({
        // Initialize data.
        data() {
          return {
            context: context,
          }
        },
        // Define our character sheet component.
        components: this.vueComponents,
        // Create a method to the update the data while retaining reactivity.
        methods: {
          updateContext(newContext) {
            for (let key of Object.keys(this.context)) {
              this.context[key] = newContext[key];
            }
          }
        }
      });
    }
    // Otherwise, perform update routines on the app.
    else {
      // Pass new values from this.getData() into the app.
      this.vueRoot.updateContext(context);
      this._lockEffectsFields($(this.form));
      return;
    }

    // If we don't have an active vueRoot, run Foundry's render and then mount
    // the Vue application to the form.
    this._render(force, options).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    })
    // Run Vue's render, assign it to our prop for tracking.
    .then(rendered => {
      this.vueRoot = this.vueApp.mount(`[data-appid="${this.appId}"] .archmage-vue`);
      this.activateVueListeners($(this.form), false);
    });

    // Store our app for later.
    this.object.apps[this.appId] = this;
    return this;
  }

  /** @override */
  async close(options={}) {
    // Unmount and clean up the vue app on close.
    this.vueApp.unmount();
    this.vueApp = null;
    this.vueRoot = null;
    return super.close(options);
  }

  // Update initial content throughout all editors.
  _updateEditors(html) {
    for (let [name, editor] of Object.entries(this.editors)) {
      const data = this.object instanceof Document ? this.object.data : this.object;
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

    if (!this.options.editable) return;

    // CRUD listeners.
    html.on('click', '.item-create', (event) => this._createItem(event));
    html.on('click', '.item-delete', (event) => this._deleteItem(event));
    html.on('click', '.item-edit', (event) => this._editItem(event));

    // Effects.
    html.on('click', '.effect-control', (event) => this._onManageEffect(event));

    // Support Image updates
    if ( this.options.editable ) {
      html.on('click', 'img[data-edit]', (event) => this._onEditImage(event));
    }

    // Roll listeners.
    html.on('click', '.rollable', (event) => this._onRollable(event));

    // Other listeners.
    html.on('click', '.item-import', (event) => this._importPowers(event));
    html.on('click', '.death-save-attempts input[type="checkbox"]', (event) => this._updateFails(event, "deathFails"));
    html.on('click', '.lastgasp-save-attempts input[type="checkbox"]', (event) => this._updateFails(event, "lastGaspFails"));
    html.on('click', '.icon-roll', (event) => this._updateIconRoll(event));
    html.on('click', '.rest', (event) => this._onRest(event));

    // Item listeners.
    html.on('click', '.power-uses, .equipment-quantity', (event) => this._updateQuantity(event, true));
    html.on('contextmenu', '.power-uses, .equipment-quantity', (event) => this._updateQuantity(event, false));
    html.on('click', '.feat-pip', (event) => this._updatePips(event));
  }

  /**
   * Activate additional listeners on the rendered Vue app.
   * @param {jQuery} html
   */
  activateVueListeners(html, repeat = false) {
    if (!this.options.editable) {
      html.find('input,select,textarea').attr('disabled', true);
      return;
    }

    this._dragHandler(html);

    this._lockEffectsFields(html);

    // Place one-time executions after this line.
    if (repeat) return;

    html.find('.editor-content[data-edit]').each((i, div) => this._activateEditor(div));

    // Input listeners.
    let inputs = '.section input[type="text"], .section input[type="number"]';
    html.on('focus', inputs, (event) => this._onFocus(event));
  }

  /*
   * Prevent Effects Editing
   */
  _lockEffectsFields(html) {
    // const context = this.getData();
    // html.find('input[name]').each((i, el) => {
    //   const name = el.name;
    //   // @todo improve this
    //   if (context.actor.lockedFields.includes(name)) {
    //     el.readOnly = true;
    //   }
    //   else {
    //     el.readonly = false;
    //   }
    // })
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

    // Handle the power group.
    if (dataset?.groupType && dataset?.powerType) {
      let groupType = dataset.groupType;
      let model = game.system.model.Item[itemType];
      if (model[groupType] && groupType !== 'powerType') {
        dataset[groupType] = foundry.utils.duplicate(dataset.powerType);
        delete dataset.powerType;
      }
      delete dataset.groupType;
    }

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
    let itemData = {
      name: 'New ' + game.i18n.localize(`ARCHMAGE.${itemType}`),
      type: itemType,
      img: img,
      data: data
    };
    await this.actor.createEmbeddedDocuments('Item', [itemData]);
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

    // Delete the item from the actor object.
    let del = false;
    new Dialog({
      title: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm"),
      buttons: {
        del: {
          label: game.i18n.localize("ARCHMAGE.CHAT.Delete"),
          callback: () => {del = true;}
        },
        cancel: {
          label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
          callback: () => {}
        }
      },
      default: 'cancel',
      close: html => {
        if (del) {
          let item = this.actor.items.get(itemId);
          // await item.delete();
          item.delete();
        }
      }
    }).render(true);
  }

  _editItem(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the item ID, exit if not set.
    let itemId = dataset.itemId;
    if (!itemId) return;

    // Render the edit form.
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  /* ------------------------------------------------------------------------ */
  /*  Handle effects -------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  _onManageEffect(event) {
    let target = event.currentTarget;
    let dataset = target.dataset;
    const effect = dataset.itemId ? this.actor.effects.get(dataset.itemId) : null;

    switch (dataset.action) {
      case 'create':
        return this.actor.createEmbeddedDocuments('ActiveEffect', [{
          label: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: this.actor.uuid,
          disabled: false
        }]);

      case 'edit':
        return effect.sheet.render(true);

      case 'delete':
        let del = false;
        new Dialog({
          title: game.i18n.localize("ARCHMAGE.CHAT.DeleteConfirm"),
          buttons: {
            del: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Delete"),
              callback: () => {del = true;}
            },
            cancel: {
              label: game.i18n.localize("ARCHMAGE.CHAT.Cancel"),
              callback: () => {}
            }
          },
          default: 'cancel',
          close: html => { if (del) return effect.delete(); }
        }).render(true);
        break;

      case 'toggle':
        return effect.update({disabled: !effect.data.disabled});
    }

  }

  /* ------------------------------------------------------------------------ */
  /*  Handle rolls ---------------------------------------------------------- */
  /* ------------------------------------------------------------------------ */

  /**
   * Handle rollable clicks.
   */
  async _onRollable(event) {
    event.preventDefault;
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.rollType ?? null;
    let opt = dataset.rollOpt ?? null;

    if (type == 'item' && opt) this._onItemRoll(opt);
    else if (type == 'recovery') this._onRecoveryRoll(event);
    else if (type == 'save' || type == 'disengage') this._onSaveRoll(opt);
    else if (type == 'init') this._onInitRoll();
    else if (type == 'ability') this._onAbilityRoll(opt);
    else if (type == 'background') this._onBackgroundRoll(opt);
    else if (type == 'icon') this._onIconRoll(opt);
    else if (type == 'command') this._onCommandRoll(opt);
    else if (type == 'recharge') this._onRechargeRoll(opt);

    // Fallback to a plain formula roll.
    else if (opt) await this._onFormulaRoll(opt);
  }

  /**
   * Perform a basic roll and send it to chat.
   *
   * @param {string} formula
   */
  async _onFormulaRoll(formula) {
    let roll = new Roll(formula, this.actor.getRollData());
    await roll.roll();
    roll.toMessage();
  }

  /**
   * Perform an owned item's roll.
   *
   * @param {string} id
   */
  _onItemRoll(id) {
    let item = this.actor.items.get(id);
    if (item) item.roll();
  }

  /**
   * Roll a recovery for the actor.
   */
  async _onRecoveryRoll(event) {
    this.actor.rollRecoveryDialog(event);
  }


  /**
   * Roll a saving throw for the actor.
   *
   * @param {string} difficulty
   *   The save type, such as 'easy', 'normal', 'hard', 'death', or 'disengage'.
   */
  async _onSaveRoll(difficulty) {
    this.actor.rollSave(difficulty);
  }

  /**
   * Roll initiative for the actor.
   */
  async _onInitRoll() {
    let combat = game.combat;
    // Check to see if this actor is already in the combat.
    if (!combat) return;
    let combatant = combat.data.combatants.find(c => c?.actor?.data?._id == this.actor.id);
    // Create the combatant if needed.
    if (!combatant) {
      await this.actor.rollInitiative({createCombatants: true});
    }
    // Otherwise, determine if the existing combatant should roll init.
    else if (!combatant.initiative && combatant.initiative !== 0) {
      await combat.rollInitiative([combatant.id]);
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
      let result = await roll.roll();

      let fives = 0;
      let sixes = 0;
      var rollResults;

      let actorIconResults = [];

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

      // Update actor.
      let updateData = {};
      updateData[`data.icons.${iconIndex}.results`] = actorIconResults;
      await this.actor.update(updateData);

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

  /**
   * Roll command points for an actor, and apply them.
   *
   * @param {string} dice
   *   Dice formula to roll.
   */
  async _onCommandRoll(dice) {
    let actor = this.actor;
    let roll = new Roll(dice, this.actor.getRollData());
    await roll.roll();

    let pointsOld = actor.data.data.resources.perCombat.commandPoints.current;
    let pointsNew = roll.total;

    await actor.update({'data.resources.perCombat.commandPoints.current': Number(pointsOld) + Number(pointsNew)});

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/command-card.html`
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
      data: chatData
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);
    ChatMessage.create(chatData, { displaySheet: false });
  }

  async _onRechargeRoll(itemId) {
    let item = this.actor.items.get(itemId);
    if (item) await item.recharge();
  }

  /* ------------------------------------------------------------------------ */
  /*  Special Listeners ----------------------------------------------------- */
  /* ------------------------------------------------------------------------ */
  async _updateFails(event, saveType) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;

    if (dataset.opt) {
      let count = Number(dataset.opt);
      if (count == this.actor.data.data.attributes.saves[saveType].value) {
        count = Math.max(0, count - 1);
      }
      let updateData = {};
      let path = `data.attributes.saves.${saveType}.value`;
      updateData[path] = count;
      let update = await this.actor.update(updateData);
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

  async _updateQuantity(event, increase = true) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;
    let itemId = dataset.itemId;

    if (!itemId) return;

    let item = this.actor.items.get(itemId);
    if (item) {
      if (item.data.data?.quantity?.value == null) return;
      // Update the quantity.
      let newQuantity = Number(item.data.data.quantity.value) ?? 0;
      newQuantity = increase ? newQuantity + 1 : newQuantity - 1;

      // TODO: Refactor the fallback to not be absurdly high after maxQuantity
      // has become regularly used.
      let maxQuantity = item.data.data?.maxQuantity?.value ?? 99;

      await item.update({'data.quantity.value': increase ? Math.min(maxQuantity, newQuantity) : Math.max(0, newQuantity)}, {});
    }
  }

  async _updatePips(event) {
    event.preventDefault();
    let target = event.currentTarget;
    let dataset = target.dataset;
    let itemId = dataset.itemId;

    if (!itemId) return;

    let item = this.actor.items.get(itemId);
    if (item) {
      let updateData = {};

      if (item.type == "power") {
        let tier = dataset.tier ?? null;
        if (!tier) return;
        let isActive = item.data.data.feats[tier].isActive.value;
        updateData[`data.feats.${tier}.isActive.value`] = !isActive;
      }
      else if (item.type == "equipment") {
        let isActive = item.data.data.isActive;
        updateData["data.isActive"] = !isActive;
      }

      await item.update(updateData, {});
    }
  }

  /**
   * Handle rests.
   */
   _onRest(event) {
    event.preventDefault;
    let target = event.currentTarget;
    let dataset = target.dataset;

    // Get the roll type and roll options.
    let type = dataset.restType ?? null;

    // Exit if type is invalid;
    if (type !== 'quick' && type !== 'full') return;

    // Determine if we need to skip confirmation.
    let bypass = event.shiftKey ? true : false;
    if (bypass) {
      if (type == 'quick') this.actor.restQuick();
      else if (type == 'full') this.actor.restFull();
    }
    // Otherwise, we need to make a dialog.
    else {
      let options = {
        title: null,
        confirmLabel: 'ARCHMAGE.CHAT.Rest',
        cancelLabel: 'ARCHMAGE.CHAT.Cancel',
        default: 'rest',
      };

      if (type == 'quick') {
        options.title = 'ARCHMAGE.CHAT.QuickRest';
        options.content = 'ARCHMAGE.CHAT.QuickRestBody';
      }
      else if (type == 'full') {
        options.title = 'ARCHMAGE.CHAT.FullHeal';
        options.content = 'ARCHMAGE.CHAT.FullHealBody';
      }

      // Render the rest dialog.
      let doRest = false;
      new Dialog({
        title: game.i18n.localize(options.title),
        content: game.i18n.localize(options.content),
        buttons: {
          rest: {
            label: game.i18n.localize(options.confirmLabel),
            callback: () => {doRest = true;}
          },
          cancel: {
            label: game.i18n.localize(options.cancelLabel),
            callback: () => {}
          }
        },
        default: 'rest',
        close: html => {
          if (doRest) {
            if (type == 'quick') this.actor.restQuick();
            else if (type == 'full') this.actor.restFull();
          }
        }
      }).render(true);
    }
  }

  /**
   * Apply drag events to items (powers and equipment).
   * @param {jQuery} html
   */
  _dragHandler(html) {
    let dragHandler = event => this._onDragStart(event);
    html.find('.item[data-draggable="true"]').each((i, li) => {
      li.setAttribute('draggable', true);
      li.addEventListener('dragstart', dragHandler, false);
    });
  }

  _onFocus(event) {
    let target = event.currentTarget;
    setTimeout(function() {
      if (target == document.activeElement) {
        $(target).trigger('select');
      }
    }, 100);
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
      actor.createEmbeddedDocuments('Item', powers);
    }
  }
}