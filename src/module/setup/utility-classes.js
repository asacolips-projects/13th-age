

// CONFIG.debug.hooks = true;

/**
 * Class that defines utility methods for the Archmage system.
 * IMPORTANT: May be used by modules/macros. Handle changes with care!
 * (For example, the formatting methods are used in translation modules.)
 * Available at runtime as game.archmage.ArchmageUtility.
 */
export class ArchmageUtility {
  /**
   * Helper utility function to create chat messages, handling roll mode and 3d dice.
   *
   * @param {object} chatData
   *   The chat data, as given to ChatMessage.create().
   * @param {object} context
   *   (Optional) Chat message context/options, as given to ChatMessage.create().
   * @param {boolean} waitForDice
   *   (Optional) Whether to wait for 3d dice rolls to finish before returning.
   *
   * @return {Promise<Document>} The created ChatMessage document instance.
   */
  static async createChatMessage(chatData, context = {}, waitForDice = true) {
    if (!chatData.flags) {
      chatData.flags = {};
    }
    if (!chatData.flags.core) {
      chatData.flags.core = {};
    }
    if (!foundry.utils.hasProperty(chatData.flags.core, "canPopout")) {
      chatData.flags.core.canPopout = true;
    }

    if (!context) {
      context = {};
    }

    if (!foundry.utils.hasProperty(context, "rollMode")) {
      // Default roll mode set via chat box.
      context.rollMode = game.settings.get("core", "rollMode");
    }
    chatData = ChatMessage.applyRollMode(chatData, context.rollMode);

    // Return early if we don't need to wait for the 3d dice animation.
    if (!waitForDice || !game.dice3d) {
      return ChatMessage.create(chatData, context);
    }

    // Return early if there is nothing to wait on.
    // Our own inline rolls are handled separately,
    // so we only wait for roll messages or if default DSN inline rolls are used.
    if ((!chatData.rolls || chatData.rolls.length == 0) &&
        !game.settings.get("dice-so-nice", "animateInlineRoll")) {
      return await ChatMessage.create(chatData, context);
    }

    // Try to wait for the 3d dice animation to finish.
    const msg = await ChatMessage.create(chatData, context);
    if (msg?.id) {
      await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
    }
    return msg;
  }

  static async show3DDiceForRoll(roll, chatData = null,
                                 chatMsgID = null, user = null, sync = true) {
    if (!roll || !game.dice3d) {
      return;
    }
    if (user == null) {
      user = game.user;
    }
    var hide = chatData?.whisper?.length ? chatData.whisper : null;
    if (hide && game.user.isGM &&
        game.settings.get("archmage", "showPrivateGMAttackRolls") &&
        game.settings.get("core", "rollMode") === "gmroll") {
      hide = null;
    } else if (hide && game.user.isGM && game.settings.get("dice-so-nice", "showGhostDice")) {
      hide = null;
      roll.ghost = true;
    }
    return game.dice3d.showForRoll(
              roll, game.user, sync, hide,
              chatData?.blind && !game.user.isGM,
              chatMsgID, chatData?.speaker);
  }

  /**
   * Get Escalation Die value.
   *
   * @param {object} combat
   *   (Optional) Combat to check the escalation for.
   *
   * @return {int} The escalation die value.
   */
  static getEscalation(combat = null) {
    // Get the current combat if one wasn't provided.
    if (!combat) {
      combat = game.combat;
    }

    // Assume the escalation die is 0 by default.
    let result = 0;

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.round;
      }
      // Format it for min/max values.
      if (round < 1) {
        result = 0;
      }
      else if (round > 6) {
        result = 6;
      }
      else {
        result = round - 1;
      }

      // Get the manual offset for this combat..
      let edOffset = combat.getFlag('archmage', 'edOffset') ?? 0;
      if (edOffset) {
        result = result + edOffset;

        // If the escalation die isn't unlimited, set a min/max.
        if (!game.settings.get('archmage', 'unboundEscDie')) {
          if (result > 6) {
            result = 6;
          }
          else if (result < 0) {
            result = 0;
          }
        }
      }
    }

    // Otherwise, return 0.
    return result;
  }

  /**
   * Set the Escalation Die offset for this combat.
   *
   * @param {object} combat
   *   (Optional) Combat to set the escalation die offset for.
   * @param {Boolean} isIncrease
   *   (Optional) If true, increase the esc. die, otherwise decrease it.
   */
  static setEscalationOffset(combat = null, isIncrease = true) {
    // Get the current combat if one wasn't provided.
    if (!combat) {
      combat = game.combat;
    }

    // Get the escalation value.
    if (combat !== null) {
      // Get the current round.
      let round = combat.current.round;
      if (round == null) {
        round = combat.round;
      }

      // Establish limits on the current round.
      if (round > 6) round = 6;
      if (round < 0) round = 0;

      // Retrieve the escalation die offset for this combat.
      let edOffset = combat.getFlag('archmage', 'edOffset') ?? 0;

      // By default, limit how far the escalation die can be adjusted.
      if (!game.settings.get('archmage', 'unboundEscDie')) {
        if (isIncrease) {
          if (round + edOffset < 7) edOffset++;
        }
        else {
          if (round + edOffset > 0) edOffset--;
        }
      }
      // If it's unbound, unlimited power!
      else {
        if (isIncrease) edOffset++;
        else edOffset--;
      }

      // Update the escalation die offset flag.
      combat.setFlag('archmage', 'edOffset', edOffset);
    }
  }

  static async updateCompendiums() {
    let pack = game.packs.get('archmage.monsters-core');
    let monsters = pack ? await pack.getContent() : null;

    if (monsters) {
      for (let actor of monsters) {
        let name = actor.name.toLowerCase();
        let update = {};

        // Handle size.
        let size = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureSizes)) {
          size += size == '' ? key : `|${key}`;
        }
        let sizeRegex = new RegExp(size);
        let sizeMatch = name.match(sizeRegex);
        if (sizeMatch && sizeMatch[0]) {
          update['system.details.size.value'] = sizeMatch[0];
          if (sizeMatch[0] == 'large') {
            update['prototypeToken.width'] = 2;
            update['prototypeToken.height'] = 2;
          }
          else if (sizeMatch[0] == 'huge') {
            update['prototypeToken.width'] = 3;
            update['prototypeToken.height'] = 3;
          }
        }
        else {
          update['system.details.size.value'] = 'normal';
        }
        // Handle role.
        let role = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureRoles)) {
          role += role == '' ? key : `|${key}`;
        }
        let roleRegex = new RegExp(role);
        let roleMatch = name.match(roleRegex);
        if (roleMatch && roleMatch[0]) {
          update['system.details.role.value'] = roleMatch && roleMatch[0];
        }
        // Handle type.
        let type = '';
        for (let [key, value] of Object.entries(CONFIG.ARCHMAGE.creatureTypes)) {
          type += type == '' ? key : `|${key}`;
        }
        let typeRegex = new RegExp(type);
        let typeMatch = name.match(typeRegex);
        if (typeMatch && typeMatch[0]) {
          update['system.details.type.value'] = typeMatch[0];
        }
        if (Object.keys(update).length > 0) {
          update['_id'] = actor._id;
          update['name'] = actor.name.replace(/( |)\[.*\]/g, '');
          await pack.updateEntity(update);
        }
      };
    }
  }

  // Formats a list of matched classes like ['wizard', 'chaosmage'] for display,
  // returning a string like "Wizard, Chaos Mage"
  static formatClassList(classes) {
    if (!classes || classes.length < 1) {
      return "";
    }
    var out = [];
    for (let i = 0; i < classes.length; ++i) {
      const readable = CONFIG.ARCHMAGE.classList[classes[i]];
      if (readable) {
        out.push(readable);
      }
    }
    return out.join(", ");
  }

  // Inverts a given object/map (switching keys and values) and sorts it by key length
  static invertMapAndSortByKeyLength(map) {
    var newMap = new Map();
    // Swap keys with values
    for (const key in map) {
      const value = map[key];
      newMap.set(value, key);
    }
    // Sort by key length
    newMap = new Map([...newMap.entries()].sort((a, b) => {
      return b[0].length - a[0].length;
    }));
    return newMap;
  }

  static prepareClassInputForDetection(input) {
    if (game.i18n.lang === "en") {
      return input;
    }

    const classNames = ArchmageUtility.invertMapAndSortByKeyLength(CONFIG.ARCHMAGE.classList);
    var output = input.toLowerCase();
    for (const [key, value] of classNames) {
      output = output.replaceAll(key.toLowerCase(), value);
    }

    return output;
  }

  // Find known classes
  static detectClasses(className) {
    className = ArchmageUtility.prepareClassInputForDetection(className);
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    className = className ? className.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    let matchedClasses = className.match(classRegex);
    if (matchedClasses !== null) matchedClasses = [...new Set(matchedClasses)].sort();
    return matchedClasses;
  }

  static formatNewItemName(itemType) {
    return game.i18n.format("ARCHMAGE.newItem",
      { item: game.i18n.localize(`ARCHMAGE.${itemType}`) });
  }

  static formatLevel(number) {
    return game.i18n.format("ARCHMAGE.levelFormat",
      { level: ArchmageUtility.ordinalSuffix(number) });
  }

  static ordinalSuffix(number) {
    if (game.i18n.lang !== "en") {
      return number;
    }
    var last = number % 10,
        teens = number % 100;
    if (last == 1 && teens != 11) {
        return number + "st";
    }
    if (last == 2 && teens != 12) {
        return number + "nd";
    }
    if (last == 3 && teens != 13) {
        return number + "rd";
    }
    return number + "th";
  }

  static cleanActiveEffectLabel(label) {
    return label
      .replace("data.attributes", "")
      .replace("system.attributes", "")
      .replace("attack", game.i18n.localize("ARCHMAGE.attack"))
      .replace("AttackMod", game.i18n.localize("ARCHMAGE.attack"))
      .replace("arcane", game.i18n.localize("ARCHMAGE.EFFECT.AE.arcane"))
      .replace("divine", game.i18n.localize("ARCHMAGE.EFFECT.AE.divine"))
      .replace("ranged", game.i18n.localize("ARCHMAGE.ranged"))
      .replace("melee", game.i18n.localize("ARCHMAGE.melee"))
      .replace("bonus", game.i18n.localize("ARCHMAGE.bonus"))
      .replace("md", game.i18n.localize("ARCHMAGE.md.label"))
      .replace("pd", game.i18n.localize("ARCHMAGE.pd.label"))
      .replace("hp", game.i18n.localize("ARCHMAGE.health"))
      .replace("save", game.i18n.localize("ARCHMAGE.save"))
      .replace("disengage", game.i18n.localize("ARCHMAGE.ITEM.disengageBonus"))
      .replace("recoveries", game.i18n.localize("ARCHMAGE.recoveries"))
      .replace("critMod.atk", game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitBonus"))
      .replace("critMod.def", game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitDefense"))
      .replace("value", "")
      .replaceAll(".", " ")
      .replace("ac ", game.i18n.localize("ARCHMAGE.ac.label"));
  }

  static getActiveEffectLabelIcon(label) {

    if (label.includes(game.i18n.localize("ARCHMAGE.EFFECT.AE.arcane"))) {
      return "fas fa-magic";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.EFFECT.AE.divine"))) {
      return "fas fa-praying-hands";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.ranged"))) {
      return "fas fa-bullseye";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.melee"))) {
      return "fas fa-fist-raised";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.health"))) {
      return "fas fa-heart";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.save"))) {
      return "fas fa-dice-d20";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.ITEM.disengageBonus"))) {
      return "fas fa-running";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.recoveries"))) {
      return "fas fa-medkit";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitBonus"))) {
      return "fas fa-crosshairs";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.ac.label"))) {
      return "fas fa-shield-alt";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.md.label"))) {
      return "fas fa-shield-alt";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.pd.label"))) {
      return "fas fa-shield-alt";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.EFFECT.AE.critHitDefense"))) {
      return "fas fa-shield-alt";
    }

    // Last because they are generic and might match other labels
    if (label.includes(game.i18n.localize("ARCHMAGE.attack"))) {
      return "fas fa-sword";
    }
    if (label.includes(game.i18n.localize("ARCHMAGE.bonus"))) {
      return "fas fa-sparkles";
    }

    return "fas fa-question";
  }

  static localizeEquipmentBonus(bonusProp) {
    const keys = [
      "ARCHMAGE." + bonusProp.toLowerCase() + "Short",
      "ARCHMAGE." + bonusProp.toLowerCase(),
      "ARCHMAGE." + bonusProp.toLowerCase() + ".key"
    ];
    for (const key of keys) {
      if (game.i18n.localize(key) !== key) {
        return game.i18n.localize(key);
      }
    }
    return bonusProp;
  }

  static fixVuePopoutBug() {
    // Workaround for upstream Vue bug:
    // https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/issues/177
    // Remove once Vue fixed event handling in iframes/windows.
    Hooks.on("PopOut:popout", async function (app, popout) {
      const handler = (e) => {
        Object.defineProperty(e, "timeStamp", { get: () => performance.now() })
      }
      const events = Object.keys(window).filter(name => name.substring(0, 2) == 'on').map(name => name.substring(2));
      events.forEach((name) => popout.addEventListener(name, handler, true));
    });
  }

  /**
   * Formats localized tooltip text, taking one or more localization keys,
   * similar to game.i18n.localize(). 'ARCHMAGE.TOOLTIP.' is prepended to
   * each key.
   * If 2nd edition support is enabled, first the key with 'V2' appended is
   * looked up, if that doesn't exist, the normal key is used.
   * If multiple keys are given, the localization texts are
   * appended as separate paragraphs.
   * The last argument can be a format dict, as given to game.i18n.format(),
   * in which case that formatting data is provided for all single keys.
   * Examples:
   *
   * tooltip('charisma')
   *   "ARCHMAGE.TOOLTIP.charisma" is looked up.
   *   If 2nd edition is enabled, "ARCHMAGE.TOOLTIP.charismaV2" is used if found,
   *   falling back to the above if it doesn't exist.
   * tooltip('attributes', 'charisma')
   *   As above, but both keys are looked up and appended as paragraphs.
   * tooltip('attributes', 'charisma', {itemData: data})
   *   As above, but the given format data is inserted for each separate key.
   */
  static tooltip(...keys) {
    if (!game.settings.get("archmage", "sheetTooltips")) {
      return undefined;
    }

    const isSecondEdition = game.settings.get('archmage', 'secondEdition');
    const keyPrefix = "ARCHMAGE.TOOLTIP.";
    const secondEditionSuffix = "V2";

    var format = {};
    var out = "";

    if (!keys || !Array.isArray(keys) || keys.length < 1) {
      return out;
    }

    // Last element may be format dict, check and handle accordingly
    if (keys.length > 1 && keys[keys.length -1].constructor == Object) {
      format = keys.pop();
    }

    for (const key of keys) {
      var val = "";

      val = game.i18n.format(keyPrefix + key + secondEditionSuffix, format);
      if (!isSecondEdition || val.startsWith(keyPrefix)) {
        val = game.i18n.format(keyPrefix + key, format);
      }

      out += "\n" + val.trim();
    }

    // Some formatting for Foundry's tooltips
    out = out.trim().replaceAll("\r\n", "<br><br>").replaceAll("\n", "<br><br>");
    out = "<p style=\"text-align: left; margin: 0;\">" + out + "</p>";

    return out;
  }

  static getSpeaker(actor) {
    const speaker = ChatMessage.getSpeaker({actor});
    if (!actor) return speaker;
    let token = actor.token;
    if (!token) token = actor.getActiveTokens()[0];
    if (token) {
      speaker.alias = token.name;
    } else {
      if (actor.prototypeToken) {
        speaker.alias = actor.prototypeToken.name;
      }
    }
    return speaker
  }

  /**
   * Parses a given string and conver to an inline roll if possible.
   *
   * @param {string} pastedText String that can potentially include inline rolls,
   *   such as "+7 vs AC".
   * @param {object} options Additional options to modify the logic, such as
   *   specifying options.attack to denote this is an attack roll.
   * @returns {string} Parsed text with inline rolls, such as "[[d20+7]] vs AC"
   */
  static parseClipboardText(pastedText, options={}) {
    // Exit early for rolls that already include inline rolls.
    if (pastedText.includes('[[') || pastedText.includes(']]')) return pastedText;
    // Handle options.
    if (options.field?.includes('attack')) {
      options.attack = true;
    }
    if (options.field?.includes('hit')) {
      options.damage = true;
    }
    // Remove unnecessary newlines common to PDFs.
    let parsedText = pastedText.replace(/-[\r\n]+([^.])/g, '-$1'); // Hyphens get collapsed
    parsedText = pastedText.replace(/[\r\n]+([^.])/g, ' $1'); // Other newlines get replaced with spaces
    // Do a pass to turn rolls like "Natural 16+" or "Easy Save, 6+" into
    // "Natural __16__" and "Easy Save, __6__". It's messy, but it
    // prevents false positives in later steps.
    parsedText = parsedText.replace(/([^\dd\+\-])(\d+)(\+)/g, (match, prefix, number, suffix) => {
      // We can ignore the suffix, as we just want to make sure it exists and can
      // reconstruct it later since we know it's a "+" sign.
      return `${prefix}__${number}__`;
    });
    // Handle weapons and attributes.
    const attrs = [
      'strength','str(?![a-z\\d])',
      'dexterity','dex(?![a-z\\d])',
      'constitution','con(?![a-z\\d])',
      'intelligence','int(?![a-z\\d])',
      'wisdom','wis(?![a-z\\d])',
      'charisma','cha(?![a-z\\d])',
      'level(?!s)',
      'weapon',
      'escalation die',
    ];
    // Matches the above list, but also checks for "nth" and so on as a prefix to
    // avoid turning "4th level" and so on into "4th @lvl".
    const attrsRegex = new RegExp(`((?:(?:\\d+th)|(?:breath)|(?:triple-|double-))*\\s*)(${attrs.join('|')})`, 'gi');
    parsedText = parsedText.replace(attrsRegex, (match, prefix, attr) => {
      const cleaned = attr.trim().toLocaleLowerCase();
      if (cleaned === 'weapon') {
        return !prefix.match(/breath/gi) ? '@wpn.m.dice' : match;
      }
      if (cleaned === 'level') {
        return !prefix.match(/\d+th|\d+nd|\d+rd|\d+st/gi)
          ? (options.attack ? '@std' : '@lvl')
          : match;
      }
      if (cleaned === 'escalation die') {
        return '@ed';
      }
      if (cleaned === 'strength') {
        if (prefix.match(/triple-|double-/gi)) return match;
      }
      return options.damage
        ? `@${cleaned.slice(0,3)}.dmg`
        : `@${cleaned.slice(0,3)}.mod`;
    });
    /**
     * Do a pass to turn likely dice rolls into inline rolls.
     * 
     * This pattern basically tries to do (save rolls)* (Natural n+)* (+)* (dice formula) ( vs)*
     * 
     * The reason that works is that if we detect either a save roll or no dice roll, we
     * just exit early and return the match. If we detect a natural trigger, we place it in its
     * own group so that the dice formula doesn't pick it up. If we detected a preceding + sign,
     * we note it so that we can avoid "++" when preprending a d20 later. If we detect a dice
     * formula, we wrap the whole thing in [[diceFormula]]. If we detect " vs", this is an attack
     * roll and we need to prepend a "d20" to the front.
     * 
     * This will still have some funky aspects to it, like outputing "[[d20+9]] vs AC ( [[3]] attacks)".
     * To get around that, we'll have another pass later that tries to clean up unexpected spaces.
     */
    parsedText = parsedText.replace(/((?:Natural\s*\d+\+*)*)([\+\-]*)((?:\s*(?:(?:d*\d+(?!\d*_))|@[a-z\.]+)[x\s\+\-]*)+(?!\d*th|\d*nd|\d*rd|\d*st))((?:\s*vs)*)/gi, (
      match,
      naturalTrigger,
      startingOperator,
      diceFormula,
      vs
    ) => {
      if (!diceFormula) return match;
      let d20 = startingOperator ? 'd20' : 'd20+';
      return `${naturalTrigger} [[${vs ? d20 : ''}${startingOperator}${diceFormula.trim()}]] ${vs}`;
    });
    // Fix multiplication.
    parsedText = parsedText.replace(/(\[\[)([^\[\]]*)(\]\])/gi, (match, prefix, formula, suffix) => {
      return `${prefix}${formula.replace(/x(?:(?![a-z\.]))/gi, ' * ')}${suffix}`;
    });
    // Do a pass to restore save numbers from the "__{n}__" format.
    parsedText = parsedText.replace(/(__)(\d+)(__)/g, (match, prefix, number, suffix) => {
      return `${number}+`;
    });
    // Handle conditions.
    const conditionRegex = new RegExp(`(\\s)(${CONFIG.ARCHMAGE.statusEffects.map(c => c.id).join('|')})([^a-z\\d])`, 'gi');
    parsedText = parsedText.replace(conditionRegex, (match, prefix, condition, suffix) => {
      return `${prefix}*${condition}*${suffix}`;
    });
    // Return the trimmed and cleaned string.
    return parsedText.replace('( ', '(')
      .replace(' )', ')')
      .replace('.]]', ']].')
      .replace(/ +/g, ' ')
      .replace(/\s*\++\s*/g, '+')
      .trim();
  }
}

/**
 * Class that defines utility methods for macros.
 * IMPORTANT: this class is used in (possibly user-defined) macros, handle any changes with care.
 */
export class MacroUtils {
  /**
   * Generate durations for active effects
   */
  static setDuration(data, duration, options={}) {
    // Assign by level to avoid weird issues with str path accessor
    if (!data.flags?.archmage?.duration) data.flags = {archmage: {duration: "Unknown"}};
    switch(duration) {
      case CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn:
      case "StartOfNextTurn":
        data.flags.archmage.duration = "StartOfNextTurn";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EndOfNextTurn:
      case "EndOfNextTurn":
        data.flags.archmage.duration = "EndOfNextTurn";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextSourceTurn:
      case "StartOfNextSourceTurn":
        data.flags.archmage.duration = "StartOfNextSourceTurn";
        data.origin = options.sourceTurnUuid;
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EndOfNextSourceTurn:
      case "EndOfNextSourceTurn":
        data.flags.archmage.duration = "EndOfNextSourceTurn";
        data.origin = options.sourceTurnUuid;
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EasySaveEnds:
      case "EasySaveEnds":
        data.flags.archmage.duration = "EasySaveEnds";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.NormalSaveEnds:
      case "NormalSaveEnds":
        data.flags.archmage.duration = "NormalSaveEnds";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.HardSaveEnds:
      case "HardSaveEnds":
        data.flags.archmage.duration = "HardSaveEnds";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat:
      case "EndOfCombat":
        data.flags.archmage.duration = "EndOfCombat";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.Infinite:
      case "Infinite":
        data.flags.archmage.duration = "Infinite";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.Unknown:
      case "Unknown":
        data.flags.archmage.duration = "Unknown";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.StartOfEachTurn:
      case "StartOfEachTurn":
        data.flags.archmage.duration = "StartOfEachTurn";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EndOfArc:
      case "EndOfArc":
        data.flags.archmage.duration = "EndOfArc";
        break;
      case CONFIG.ARCHMAGE.effectDurationTypes.EndOfRound:
      case "EndOfRound":
        data.flags.archmage.duration = "EndOfRound";
        data.flags.archmage.endRound = options.round;
        break;
      default:
        console.warn("Unknown duration ", duration);
    }
    // Set Foundry core duration to make the thing appear on tokens
    if (data.flags.archmage.duration != "Infinite") {
        data['duration'] = {
          rounds: 999,
          turns: 999
        }
    }

    return data;
  }

  /**
   * Select all feats of a specific tier
   */
  static getFeatsByTier(item, tier) {
    let res = [];
    if (!item.system.feats) return res;
    for (let feat of Object.values(item.system.feats)) {
      if (feat.tier.value == tier) res.push(feat);
    }
    return res;
  }

  /**
   * Select all allies - approximated by all linked actors in combat
   * If selfUuid is set it excludes the specified actor, otherwise it includes all linked tokens
   */
  static getAllies(selfUuid="") {
    let res = [];
    if (!game.combat) return res;
    const combatants = [...game.combat.combatants.values()];
    combatants.forEach(c => {
      if ((c.token.isLinked || c.token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY) && c.token.actor.uuid != selfUuid) {
        res.push(c.token);
      }
    });
    return res;
  }

  /**
   * Create one or more AEs on a set of tokens - via a message to the GM's account to bypass
   * persmissions if needed.
   */
  static applyActiveEffectsToTokens(tokens, effects) {
    if (!game.user.isGM) {
      game.socket.emit('system.archmage', {
        type: 'createAEs',
        actorIds: tokens.map(t => t.actorId),
        effects: effects
      });
    } else {
      tokens.forEach(t => {
        t.actor.createEmbeddedDocuments("ActiveEffect", effects);
      });
    }
  }
}

/**
 * Keyboard Controls Reference Sheet
 * @type {Application}
 */
export class ArchmageReference extends Application {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "Archmage Inline Rolls Reference"
    options.id = "archmage-help";
    options.template = "systems/archmage/templates/sidebar/apps/archmage-help.html";
    options.width = 820;
    return options;
  }
}
