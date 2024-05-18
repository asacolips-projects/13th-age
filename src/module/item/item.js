import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import { MacroUtils } from '../setup/utility-classes.js';
import preCreateChatMessageHandler from "../hooks/preCreateChatMessageHandler.mjs";

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class ItemArchmage extends Item {

  prepareDerivedData() {
    super.prepareDerivedData();
    if (!this.img || this.img == CONFIG.DEFAULT_TOKEN) {
      if (CONFIG.ARCHMAGE.defaultTokens[this.type]) {
        this.img = CONFIG.ARCHMAGE.defaultTokens[this.type];
      }
      else {
        this.img = CONST.DEFAULT_TOKEN;
      }
    }

    if (this.type == 'loot' || this.type == 'tool') {
      let model = game.system.model.Item[this.type];
      if (!this.system.quantity) this.system.quantity = model.quantity;
    }
  }

  /**
   * Roll the item to Chat, creating a chat card.
   * @return {Promise}
   */
  async roll() {
    let itemUpdateData = {};
    let actorUpdateData = {};

    // Understand what the user is trying to do
    let usageMode = await this._rollUsageMode()

    // First check remaining uses.
    let early_exit = await this._rollUsesCheck(itemUpdateData, usageMode);
    if (early_exit) return;

    // Make an ephemeral clone of the item which we can dirty during processing.
    let itemToRender = this.clone({}, {"save": false, "keepId": true});

    // Then check resources.
    early_exit = await this._rollResourceCheck(itemUpdateData, actorUpdateData, itemToRender);
    if (early_exit) return;

    // Check targets.
    let targets = await this._rollMultiTargets(itemToRender);

    // Prepare roll data now.
    let rollData = itemToRender.actor.getRollData(this);

    // Handle roll table.
    await this._rollHandleRollTable(itemToRender, rollData);

    // Get token.
    let token = this._rollGetToken(itemToRender);

    // Render the chat card.
    let chatData = await this._rollRender(itemUpdateData, actorUpdateData, itemToRender, rollData, token);

    // Evaluate outcomes and prepare animations.
    let [ sequencerAnim, hitEvalRes ] = preCreateChatMessageHandler.handle(chatData, {
      targets: targets,
      type: this.type,
      actor: this.actor,
      item: this,
      token: token,
      powerLevel: this.system.powerLevel?.value,
      sequencer: this.system.sequencer,
      usageMode: usageMode
    }, null);

    // Handle special class triggers
    await this._handleMonkFormAC(itemToRender);
    await this._handleSong(itemToRender, usageMode);
    await this._handleBreathSpell(itemToRender);

    // Run embedded macro.
    let macro = await this._rollExecuteMacro(itemToRender, itemUpdateData, actorUpdateData, chatData, hitEvalRes, sequencerAnim, token, usageMode);
    // Unpack macro data in case a sloppy macro replaces instead of modifying variables
    itemToRender = macro.item;
    itemUpdateData = macro.itemUpdates;
    actorUpdateData = macro.actorUpdates;
    chatData = macro.chat;
    hitEvalRes = macro.hitEvalRes;
    sequencerAnim = macro.seqAnim;
    let suppressMessage = macro.suppressMessage;

    // Perform animations.
    await this._rollAnimate(chatData, sequencerAnim);

    // Perform updates.
    if (!foundry.utils.isEmpty(itemUpdateData)) this.update(itemUpdateData, {});
    if (!foundry.utils.isEmpty(actorUpdateData)) this.actor.update(actorUpdateData);

    if (suppressMessage) {
      return undefined;
    }

    return await game.archmage.ArchmageUtility.createChatMessage(chatData);
  }

  async rollFeat(featId) {
    let feat = this.system.feats[featId];
    if (!feat || !feat.isActive.value) return;

    // Process uses
    let updateData = {};
    if (feat.quantity?.value != undefined && feat.quantity?.value != null) {
      let path = `system.feats.${featId}.quantity.value`;
      updateData[path] = feat.quantity.value - 1;

      if (updateData[path] < 0) {
        let stop = false;
        await Dialog.confirm({
          title: game.i18n.localize("ARCHMAGE.CHAT.NoUses"),
          content: game.i18n.localize("ARCHMAGE.CHAT.NoUsesMsg"),
          yes: () => {updateData[path] = 0},
          no: () => {stop = true;},
          defaultYes: false
        });
        if (stop) return;
      }
    }

    const template = `systems/archmage/templates/chat/feat-card.html`;
    const templateData = {
      actor: this.actor,
      tokenId: null, //token ? `${token.scene.id}.${token.id}` : null,
      item: this,
      feat: feat,
      featName: game.i18n.localize(`ARCHMAGE.CHAT.${feat.tier.value}`)
    };
    // Basic chat message data
    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.actor.id,
        token: null,
        alias: this.actor.name,
        scene: game.user.viewedScene
      }
    };

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Enrich the message to parse inline rolls.
    let rollData = this.actor.getRollData(this);
    chatData.content = await TextEditor.enrichHTML(chatData.content, { rolls: true, rollData: rollData, async: true });

    // Perform updates.
    if (!foundry.utils.isEmpty(updateData)) this.update(updateData, {});

    return game.archmage.ArchmageUtility.createChatMessage(chatData);;
  }

  async _rollUsageMode() {
    let retVal = "";

    // If we have a song sustain reminder check what we want to do
    if (this.type == "power"
        && this.system.sustainedEffect.value
        && this.system.finalVerse.value) {
      let hasReminder = false;
      const name = game.i18n.format("ARCHMAGE.CHAT.sustainPower", {power: this.name, target: this.system.sustainOn.value});
      this.actor.effects.forEach(e => {
        if (e.label == name) hasReminder = true;
      });

      if (!hasReminder) return "openingEffect";

      await Dialog.confirm({
        title: game.i18n.localize("ARCHMAGE.CHAT.sustainedOrFinalTitle"),
        content: game.i18n.localize("ARCHMAGE.CHAT.sustainedOrFinal"),
        yes: () => {retVal = "finalverse";},
        no: () => {retVal = "sustainedEffect";},
        defaultYes: false
      });
    }

    return retVal;
  }

  async _rollUsesCheck(updateData, usageMode) {
    // If we have a special usage mode skip this check
    if (!["", "openingEffect"].includes(usageMode)) return false;
    // Update uses left
    let uses = this.system.quantity?.value;
    if (uses == null) return false;
    if (this.system.powerUsage?.value == 'cyclic'
      && this.actor.system.attributes.escalation.value > 0
      && this.actor.system.attributes.escalation.value % 2 == 0
      && uses > 0) {
      // Cyclic power, E.D. even, do not consume uses
      return false;
    }
    updateData["system.quantity.value"] = Math.max(uses - 1, 0);
    if (uses == 0 && !event.shiftKey && ["power", "equipment", "loot", "tool"].includes(this.type)
      && this.system.powerUsage?.value != 'at-will') {
      let use = false;
      await Dialog.confirm({
        title: game.i18n.localize("ARCHMAGE.CHAT.NoUses"),
        content: game.i18n.localize("ARCHMAGE.CHAT.NoUsesMsg"),
        yes: () => {use = true;},
        no: () => {},
        defaultYes: false
      });
      return !use;
    }
    return false;
  }

  async _rollResourceCheck(itemUpdateData, actorUpdateData, itemToRender, usageMode) {
    // Updates resources if field is set
    let resStr = this.system.resources?.value;
    if (!resStr) return false;

    let resources = resStr.split(",").map(item => item.trim());
    let res = this.actor.system.resources;
    let filter = /^([\+-]*)([0-9]*)\s*(.+)$/;
    let newResStr = [];
    for (let resource of resources) {

      // Handle inline rolls
      let ir = /(\[\[.+?\]\])/.exec(resource);
      let rolls;
      let origResource = resource;
      if (ir) {
        rolls = ArchmageRolls.getInlineRolls(resource, itemToRender.actor.getRollData(itemToRender))
        ArchmageRolls.rollAll(rolls, itemToRender.actor);
        resource = resource.replace(ir[1], rolls[0].total);
      }

      // Then process the item
      let parsed = filter.exec(resource);
      if (parsed) {
        let sign = parsed[1]
        let num = parsed[2] ? Number(parsed[2]) : null;
        if (num) num = (sign == "-") ? num * -1 : num;
        let str = parsed[3].toLowerCase();

        // Command points
        if (res.perCombat.commandPoints.enabled && num &&
            (str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.commandPoints").toLowerCase()
            || str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.commandPoint").toLowerCase()
            )) {
          let path = 'system.resources.perCombat.commandPoints.current';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughCP");
          let resObj = res.perCombat.commandPoints;
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, num, resObj, msg);
          if (stop) return true;
        }

        // Ki
        else if (res.spendable.ki.enabled && num &&
            str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.ki").toLowerCase()) {
          let path = 'system.resources.spendable.ki.current';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughKi");
          let resObj = res.spendable.ki;
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, num, resObj, msg);
          if (stop) return true;
        }

        // Momentum
        else if (res.perCombat.momentum.enabled &&
            str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.momentum").toLowerCase()) {
          let path = 'system.resources.perCombat.momentum.current';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNoMomentum");
          let resObj = res.perCombat.momentum;
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, null, resObj, msg);
          if (stop) return true;
        }

        // Focus
        else if (res.perCombat.focus.enabled &&
            str == (game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.focus").toLowerCase())) {
          let path = 'system.resources.perCombat.focus.current';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNoFocus");
          let resObj =  res.perCombat.focus;
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, null, resObj, msg);
          if (stop) return true;
        }

        // Combat Rhythm
        else if (res.perCombat.rhythm?.enabled &&
            (str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense").toLowerCase()
            || str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense").toLowerCase())) {
          let path = 'system.resources.perCombat.rhythm.current';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNoRhythm");
          let resObj =  res.perCombat.rhythm;
          let opt = (str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense").toLowerCase()) ? "offense" : "defense";
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, null, resObj, msg, opt);
          if (stop) return true;
        }

        // Recoveries
        else if ((str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.recoveries").toLowerCase()
            || str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.recovery").toLowerCase()) && num) {
          let path = 'system.attributes.recoveries.value';
          let msg = game.i18n.localize("ARCHMAGE.UI.errNoRecoveries");
          let resObj =  this.actor.system.attributes.recoveries;
          let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, num, resObj, msg);
          if (stop) return true;
        }

        // Custom resources
        else {
          for (let idx of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
            let resourcePathName = "custom"+idx;
            let resourceName = res.spendable[resourcePathName].label;
            if (!resourceName) continue; // Skip unnamed resources
            let resNm = resourceName.toLowerCase();
            if (res.spendable[resourcePathName].enabled && (str.includes(resNm) || resNm.includes(str))) {
              let path = `system.resources.spendable.${resourcePathName}.current`;
              let msg = game.i18n.format("ARCHMAGE.UI.errNoCustomResource", {res: resourceName});
              let resObj =  res.spendable[resourcePathName];
              let stop = await this._rollProcessResource(actorUpdateData, itemUpdateData, path, sign, num, resObj, msg);
              if (stop) return true;
            }
          }
        }
      }

      // If there were inline rolls, replace formula with rolled value
      if (ir) resource = origResource.replace(ir[1], rolls[0].inlineRoll.outerHTML);
      newResStr.push(resource);
    }

    // Reconstruct the processed value
    itemToRender.system.resources.value = newResStr.join(", ");

    return false;
  }

  async _rollProcessResource(actorUpdateData, itemUpdateData, path, sign, num, resObj, msg, opt=null) {
    let stop = false;
    let curr = resObj.current;
    // Recoveries are stored as 'value'
    if (curr == undefined) curr = resObj.value;

    // Number resource case
    if (num != null) {
      // No sign means override
      actorUpdateData[path] = sign ? curr + num : num;
      if (actorUpdateData[path] < 0) {
        await Dialog.confirm({
         title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
         content: msg,
         yes: () => {},
         no: () => {stop = true;},
         defaultYes: false
        });
        if (path != 'system.attributes.recoveries.value') actorUpdateData[path] = 0;
      }
    }

    // Binary (and rhythm) case
    else {
      if (sign) {
        // Resource update case
        if (sign == "+") {
          let val = (typeof curr == 'number') ? 1 : true;
          actorUpdateData[path] = opt ? opt : val;
        }
        else {
          if (!curr) {
            await Dialog.confirm({
             title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
             content: msg,
             yes: () => {},
             no: () => {stop = true;},
             defaultYes: false
            });
          }
          let val = (typeof curr == 'number') ? 0 : false;
          actorUpdateData[path] = opt ? "none" : val;
        }
      } else {
        // Resource test case
        if (!curr || curr == "none" || curr == 0) {
          await Dialog.confirm({
           title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
           content: msg,
           yes: () => {},
           no: () => {stop = true;},
           defaultYes: false
          });
        }
      }
    }

    // Handle maximum
    let resMax = resObj.max;
    if (resMax && actorUpdateData[path] > resMax) actorUpdateData[path] = resMax;

    return stop;
  }

  async _rollMultiTargets(itemToRender) {
    // Replicate attack rolls as needed for attacks
    let numTargets = {targets: 1, rolls: []};
    if (this.type == "power" || this.type == "action") {
      let attackLine = ArchmageRolls.addAttackMod(this);
      itemToRender.system.attack.value = attackLine;
      if (game.settings.get("archmage", "multiTargetAttackRolls")){
        numTargets = await ArchmageRolls.rollItemTargets(this);
        itemToRender.system.attack.value = ArchmageRolls.rollItemAdjustAttacks(this, attackLine, numTargets);
        if (numTargets.targetLine) itemToRender.system.target.value = numTargets.targetLine;
      }
    }
    return numTargets.targets;
  }

  async _rollHandleRollTable(itemToRender, rollData) {
    // Handle rollTable
    if (this.system.rollTable?.value) {
      let table;
      // Try to interpret input as UUID
      let uuid = this.system.rollTable.value.match(/^@UUID\[([^\s]+)\]/);
      if (uuid) table = await fromUuid(uuid[1]);
      if (table && table.documentName != "RollTable") {
        table = undefined;
        ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.errNotTable"));
      }
      if (!table) {
        // Treat as plain text, and load table from world first
        table = game.tables.find(t => t.name === this.system.rollTable.value);
      }
      if (!table) {
        // If not present in world, load system's from compendium
        let pack = await game.packs.get("archmage.system-rolltables").getDocuments();
        table = pack.find(t => t.name === this.system.rollTable.value);
      }
      if (table) {
        // If we do have a table, roll on it
        let roll = new Roll(table.formula, rollData);
        let res = await table.draw({roll: roll, displayChat: false});
        // Now override system.rollTable with rolled result
        try {
          itemToRender.system.rollTable.label = itemToRender.system.rollTable.value;
          itemToRender.system.rollTable.value = res.results[0].text;
        } catch(ex) {
          ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errOnlyTextRolltables"));
        }
      }
    }
  }

  _rollGetToken(itemToRender) {
    let tokens = canvas.tokens.controlled;
    let token = tokens ? tokens[0] : null;
    if (!token || token.actor != itemToRender.actor) {
      tokens = itemToRender.actor.getActiveTokens(true);
      token = tokens.length > 0 ? tokens[0] : null;
    }
    return token;
  }

  _getUsageClass(item) {
    let use = item.system.powerUsage?.value ? item.system.powerUsage.value : 'other';
    if (['daily', 'daily-desperate'].includes(use)) use = 'daily';
    else if (use == 'cyclic') {
      if (item.actor.system.attributes.escalation.value > 0
        && item.actor.system.attributes.escalation.value % 2 == 0) {
        // Cyclic power, E.D. even, at-will
        use = 'at-will';
      } else use = 'once-per-battle';
    }
    return use;
  }

  async _rollRender(itemUpdateData, actorUpdateData, itemToRender, rollData, token) {

    // Basic template rendering data
    const template = `systems/archmage/templates/chat/${this.type.toLowerCase()}-card.html`
    const templateData = {
      actor: itemToRender.actor,
      tokenId: null, //token ? `${token.scene.id}.${token.id}` : null,
      item: itemToRender,
      data: itemToRender.getChatData({ rollData: rollData }, true),
      usageClass: this._getUsageClass(itemToRender)
    };

    // Basic chat message data
    let chatData = {
      user: game.user.id,
      speaker: game.archmage.ArchmageUtility.getSpeaker(itemToRender.actor)
    };

    // Toggle default roll mode
    let rollMode = game.settings.get("core", "rollMode");
    chatData = ChatMessage.applyRollMode(chatData, rollMode);

    // Render the template
    chatData["content"] = await renderTemplate(template, templateData);

    // Enrich the message to parse inline rolls.
    chatData.content = await TextEditor.enrichHTML(chatData.content, { rolls: true, rollData: rollData, async: true });

    return chatData;
  }

  async _rollAnimate(chatData, sequencerAnim) {
    // If 3d dice are enabled, handle them first.
    if (game.dice3d && !game.settings.get("dice-so-nice", "animateInlineRoll")) {
      let contentHtml = $(chatData.content);
      let rolls = [];
      let damageRolls = [];

      if (contentHtml.length > 0) {
        // Find all property rows.
        let $rows = contentHtml.find('.card-prop');
        if ($rows.length > 0) {
          // Iterate over properties.
          $rows.each(function(index) {
            let $row_self = $(this);
            let row_text = $row_self.html();
            // Attack or Target rows - keep all, in right order
            const triggerAttack = game.i18n.localize("ARCHMAGE.CHAT.attack") + ':';
            const triggerTarget = game.i18n.localize("ARCHMAGE.CHAT.target") + ':';
            const triggerHit = game.i18n.localize("ARCHMAGE.CHAT.hit") + ':';
            const triggerLevelSpell = game.i18n.localize("ARCHMAGE.CHAT.spellLevelTrigger") + ':';
            if (row_text.includes(triggerAttack) ||
                row_text.includes(triggerTarget)) {
              let $roll_html = $row_self.find('.inline-result');
              if ($roll_html.length > 0) {
                $roll_html.each(function(i, e){
                  let roll = Roll.fromJSON(unescape(e.dataset.roll));
                  if (row_text.includes(triggerAttack) && roll.terms[0].faces != 20) {
                    // Not an attack roll, usually a target roll, roll first
                    rolls.unshift(roll);
                  } else rolls.push(roll);
                });
              }
            }
            // Hit or Spell level rows - keep only the last
            else if (row_text.includes(triggerHit) || row_text.includes(triggerLevelSpell)) {
              let newDamageRolls = [];
              let $roll_html = $row_self.find('.inline-result');
              if ($roll_html.length > 0) {
                $roll_html.each(function(i, e){
                  let roll = Roll.fromJSON(unescape(e.dataset.roll));
                  newDamageRolls.push(roll);
                });
              }
              if (newDamageRolls.length > 0) damageRolls = newDamageRolls; // Animate only relevant rolls
            }
          });
        }

        // If we have roll data, handle a 3d roll.
        rolls = rolls.concat(damageRolls);
        if (rolls.length > 0) {
          for (let roll of rolls) {
            await game.archmage.ArchmageUtility.show3DDiceForRoll(roll, chatData);
          }
        }
      }
    }

    // Play sequencer animation after the dice, if we got any
    if(sequencerAnim) sequencerAnim.play();
  }



  /**
   * Check if we are rolling a monk form, add related AC active effect
   */
  async _handleMonkFormAC(itemToRender) {
    if (itemToRender.type != "power") return;
    if (!itemToRender.actor.system.details.detectedClasses?.includes("monk")) return;

    let effects = itemToRender.actor.effects;
    let group = itemToRender.system.group.value.toLowerCase();
    let bonusMagnitudeMap = {};
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.opening")] = 1;
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.flow")] = 2;
    bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.finishing")] = 3;
    if (!Object.keys(bonusMagnitudeMap).includes(group)) return;
    let bonusMagnitude = bonusMagnitudeMap[group];

    // Check for other monk AC bonuses
    let effectsToDelete = [];
    let alreadyHasBetterBonus = false;
    effects.forEach(e => {
      if (e.data.label == game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel")) {
        if (Number(e.data.changes[0].value) <= bonusMagnitude) {
          effectsToDelete.push(e.id);
        }
        else alreadyHasBetterBonus = true;
      }
    });
    await itemToRender.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);

    if (alreadyHasBetterBonus) return;

    // Now create new AC bonus effect
    let effectData = {
      label: game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel"),
      icon: "icons/svg/shield.svg",
      changes: [{
        key: "data.attributes.ac.value",
        value: bonusMagnitude,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      }]
    }
    MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn)
    await itemToRender.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  async _handleSong(itemToRender, usageMode) {
    if (itemToRender.type != "power") return;
    if (!itemToRender.system.sustainedEffect.value) return;

    const name = game.i18n.format("ARCHMAGE.CHAT.sustainPower",
      {power: itemToRender.name, target: itemToRender.system.sustainOn.value});

    if (usageMode == "finalverse") {
      // Remove reminder if present
      let effectsToDelete = [];
      itemToRender.actor.effects.forEach(e => {
        if (e.data.label == name) effectsToDelete.push(e.id);
      });
      await itemToRender.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
    } else {
      // Check if we already have the reminder
      let alreadyHasEffect = false;
      itemToRender.actor.effects.forEach(e => {
        if (e.data.label == name) alreadyHasEffect = true;
      });
      if (!alreadyHasEffect) {
        //Create the reminder
        let effectData = {
          label: name,
          icon: itemToRender.img ? itemToRender.img : "icons/svg/sound.svg",
          flags: {
            archmage: {
              tooltip: name
            }
          }
        };
        MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfEachTurn);
        await itemToRender.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
      }
    }
  }

  async _handleBreathSpell(itemToRender){
    // This is only relevant for 1e
    if (game.settings.get("archmage", "secondEdition")) return;

    if (itemToRender.type != "power") return;
    if (!itemToRender.system.breathWeapon.value) return;

    const name = game.i18n.format("ARCHMAGE.CHAT.reuseBreath", {power: itemToRender.name});

    // Check if we already have the effect
    let alreadyHasEffect = false;
    itemToRender.actor.effects.forEach(e => {
      if (e.data.label == name) alreadyHasEffect = true;
    });
    if (!alreadyHasEffect) {
      let effectData = {
        label: name,
        icon: itemToRender.img ? itemToRender.img : "icons/svg/sound-off.svg",
        flags: {
          archmage: {
            tooltip: name
          }
        }
      };
      MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfEachTurn);
      await itemToRender.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
  }

  async _rollExecuteMacro(itemToRender, itemUpdateData, actorUpdateData, chatData, hitEvalRes, sequencerAnim, token, usageMode) {
    // Extra data accessible as "archmage" in embedded macros
    let macro_data = {
      item: itemToRender,
      itemUpdates: itemUpdateData,
      actorUpdates: actorUpdateData,
      chat: chatData,
      hitEval: hitEvalRes,
      seqAnim: sequencerAnim,
      suppressMessage: false,
      usageMode: usageMode
    };
    // If there is an embedded macro attempt to execute it
    if (itemToRender.system.embeddedMacro?.value.length > 0) {

      if (!game.user.hasPermission("MACRO_SCRIPT")) {
        ui.notifications.warn(game.i18n.localize("ARCHMAGE.CHAT.embeddedMacroPermissionError"));
        return false;
      }

      // Add variables to the evaluation scope
      const speaker = ChatMessage.implementation.getSpeaker();
      const character = game.user.character;
      const actor = itemToRender.actor;

      // Run our own function to bypass macro parameters limitations - based on Foundry's _executeScript
      const AsyncFunction = (async function(){}).constructor;
      const fn = new AsyncFunction("speaker", "actor", "token", "character", "archmage", itemToRender.system.embeddedMacro.value);
      // Attempt script execution
      try {
        await fn.call(this, speaker, actor, token, character, macro_data);
      } catch(ex) {
        ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errMacroSyntax"));
        console.error(`Embedded macro for '${this.name}' failed with: ${ex}`, ex);
      }
    }

    return macro_data;
  }


  /**
   * Roll an item's recharge, and update its quantity based on the maxQuantity.
   *
   * @param {Object} options      Options to pass during execution.
   * @param {Boolean} options.createMessage  Whether or not to render chat messages.
   * @returns {Promise.<Object>}  A promise resolving to an object with roll results.
   */
  async recharge({createMessage=true}={}) {
    // Only update for recharge powers/items.
    if (!this.system?.powerUsage?.value == 'recharge') return;

    // And only if recharge is feasible
    // if (recharge <= 0 || recharge > 20) return;

    // If a recharge power does not have a recharge value, assume 16+
    let recharge = Number(this.system?.recharge?.value) || 16;

    let actor = this.actor;
    let maxQuantity = this.system?.maxQuantity?.value ?? 1;
    let currQuantity = this.system?.quantity?.value ?? 0;
    if (maxQuantity - currQuantity <= 0) return;
    let rechAttempts = this.system?.rechargeAttempts?.value ?? 0;

    let roll = new Roll('d20');
    await roll.roll();

    let rechargeSuccessful = roll.total >= Number(recharge);

    if (createMessage) {
      // Basic template rendering data
      const template = `systems/archmage/templates/chat/recharge-card.html`
      const token = actor.token;

      // Basic chat message data
      const chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: roll,
        speaker: game.archmage.ArchmageUtility.getSpeaker(actor)
      };

      const templateData = {
        actor: actor,
        title: this.name,
        tokenId: token ? `${token.id}` : null,
        success: rechargeSuccessful,
        data: chatData,
      };

      // Render the template
      chatData["content"] = await renderTemplate(template, templateData);

      await game.archmage.ArchmageUtility.createChatMessage(chatData);
    }

    // Update the item.
    if (rechargeSuccessful) {
      await this.update({
        system: { quantity: { value: Number(currQuantity) + 1 } }
      });
    } else {
      // Record recharge attempt
      await this.update({
        system: { rechargeAttempts: { value: Number(rechAttempts) + 1 } }
      });
    }

    return {
      roll: roll,
      total: roll.total,
      target: recharge,
      success: rechargeSuccessful
    };
  }

  /* -------------------------------------------- */
  /*  Chat Card Data
  /* -------------------------------------------- */

  getChatData(htmlOptions, skipInlineRolls) {
    const data = this[`_${this.type}ChatData`]();
    if (!skipInlineRolls) {
      htmlOptions = foundry.utils.mergeObject(htmlOptions ?? {}, { async: false});
      data.description.value = data.description.value !== undefined ? TextEditor.enrichHTML(data.description.value, htmlOptions) : '';
    }
    return data;
  }


  _powerChatData() {
    const data = foundry.utils.duplicate(this.system);
    const tags = [
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.actionType'),
        value: CONFIG.ARCHMAGE.actionTypes[data.actionType.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerUsage'),
        value: CONFIG.ARCHMAGE.powerUsages[data.powerUsage.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerSource'),
        value: CONFIG.ARCHMAGE.powerSources[data.powerSource.value]
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHAT.powerType'),
        value: CONFIG.ARCHMAGE.powerTypes[data.powerType.value]
      },
      {
        label: data.powerLevel !== undefined ? data.powerLevel.label : 'Level',
        value: game.i18n.localize('ARCHMAGE.level') + ' ' + (data.powerLevel !== undefined ? data.powerLevel.value : this.actor.system.details.level.value)
      }
    ];

    const propKeys = [
      'recharge',
      'sustainOn',
      'trigger',
      'target',
      'always',
      'attack',
      'hit',
      'hitEven',
      'hitOdd',
      'crit',
      'miss',
      'missEven',
      'missOdd',
      'resources',
    ];
    const properties = propKeys.map(k => {
      return {
        label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
        value: data[k] ? data[k].value : null,
      };
    })

    let feats = [];
    if (data.feats) {
      feats = Object.values(data.feats).map(f => {
        return {
          label: f.tier ? f.tier.value : null,
          description: f.description ? f.description.value : null,
          isActive: f.isActive ? f.isActive.value : null,
        };
      });
    }

    let effectKeys = [
      'effect',
      'castBroadEffect',
      'castPower',
      'sustainedEffect',
      'finalVerse',
      'spellLevel2',
      'spellLevel3',
      'spellLevel4',
      'spellLevel5',
      'spellLevel6',
      'spellLevel7',
      'spellLevel8',
      'spellLevel9',
      'spellLevel10',
      'spellChain',
      'breathWeapon',
      'special',
    ];

    // Add spell level entries only if the current spell level is high enough
    [2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => {
      if (Number(data.powerLevel.value) < i) {
        effectKeys = effectKeys.filter(x => x != `spellLevel${i}`)
      }
    })

    const effects = effectKeys.map(k => {
      return {
        label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
        value: data[k] ? data[k].value : null,
      };
    });

    data.tags = tags.filter(t => t.value !== null && t.value !== undefined && t.value != '');
    data.properties = properties.filter(p => p.value !== null && p.value !== undefined && p.value != '');
    data.feats = feats.filter(f => f.description !== null && f.description !== undefined && f.description !== '');
    data.effects = effects.filter(e => e.value !== null && e.value !== undefined && e.value != '');
    data.effect = {
      label: game.i18n.localize(`ARCHMAGE.CHAT.effect`),
      value: data.effect.value
    };
    data.special = {
      label: game.i18n.localize(`ARCHMAGE.CHAT.special`),
      value: data.special.value
    };
    return data;
  }

  _equipmentChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

  _actionChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

  _traitChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

  _nastierSpecialChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

  _toolChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

  _lootChatData() {
    const data = foundry.utils.duplicate(this.system);
    return data;
  }

/*   static chatListeners(html) {

    // Chat card actions
    html.on('click', '.card-buttons button', ev => {
      ev.preventDefault();

      // Extract card data
      const button = $(ev.currentTarget),
        messageId = button.parents('.message').attr("data-message-id"),
        senderId = game.messages.get(messageId).user.id,
        card = button.parents('.chat-card');

      // Confirm roll permission
      if (!game.user.isGM && (game.user.id !== senderId)) return;

      // Get the Actor from a synthetic Token
      let actor;
      const tokenKey = card.attr("data-token-id");
      if (tokenKey) {
        const [sceneId, tokenId] = tokenKey.split(".");
        let token;
        if (sceneId === canvas.scene.id) token = canvas.tokens.get(tokenId);
        else {
          const scene = game.scenes.get(sceneId);
          if (!scene) return;
          let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
          if (tokenData) token = new Token(tokenData);
        }
        if (!token) return;
        actor = Actor.fromToken(token);
      } else actor = game.actors.get(card.attr('data-actor-id'));

      // Get the Item
      if (!actor) return;
      const itemId = card.attr("data-item-id");
      let itemData = actor.items.find(i => i.id === itemId);
      if (!itemData) return;
      const item = new CONFIG.Item.documentClass(itemData, { actor: actor });

      // Get the Action
      const action = button.attr("data-action");

      // Weapon attack
      if (action === "weaponAttack") item.rollWeaponAttack(ev);
      else if (action === "weaponDamage") item.rollWeaponDamage(ev);
      else if (action === "weaponDamage2") item.rollWeaponDamage(ev, true);

      // Spell actions
      else if (action === "spellAttack") item.rollSpellAttack(ev);
      else if (action === "spellDamage") item.rollSpellDamage(ev);

      // Feat actions
      else if (action === "featAttack") item.rollFeatAttack(ev);
      else if (action === "featDamage") item.rollFeatDamage(ev);

      // Consumable usage
      else if (action === "consume") item.rollConsumable(ev);

      // Tool usage
      else if (action === "toolCheck") item.rollToolCheck(ev);
    });
  } */
}
