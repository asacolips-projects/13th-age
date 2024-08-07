export class ArchmageMacros {

  ////////////////////////////////////////////////
  /**
   * Races.
   */
  ////////////////////////////////////////////////

  /**
   * Halo.
   */
  static async aasimarHalo(speaker, actor, token, character, archmage) {
    const label = archmage.item.name;
    const effects = [
      { key: "system.attributes.ac.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      { key: "system.attributes.pd.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      { key: "system.attributes.md.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ];

    // Check for previous effects
    const aes = actor.effects.filter(e => e.label == label);
    if (aes.length > 0) {
      archmage.suppressMessage = true;
      let effectsToDelete = [];
      aes.forEach(e => {effectsToDelete.push(e.id)});
      await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete)
      // ui.notifications.info("Halo removed");
    } else {
      const effectData = {label: label, changes: effects, icon: archmage.item.img};
      game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
      actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
      // ui.notifications.info("Halo applied");
    }
  }

  ////////////////////////////////////////////////
  /**
   * Barbarian Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Whirlwind.
   */
  static async barbarianWhirlwind(speaker, actor, token, character, archmage) {
    if (!actor) return;

    let penalty = -4;

    // Reduce the penalty if we have the (1e) champion feat
    if (game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value
      && !game.settings.get('archmage', 'secondEdition')) {
      penalty = -2;
    }

    let effectData = {
      label: archmage.item.name,
      icon: archmage.item.img,
      changes: [
        { key: "system.attributes.ac.value", value: penalty, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.attributes.pd.value", value: penalty, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
      ]
    }
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn);
    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  ////////////////////////////////////////////////
  /**
   * Bard Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Song of Heroes.
   */
  static async bardSongOfHeroes(speaker, actor, token, character, archmage) {
    if (!actor) return;
    if (archmage.usageMode == "finalverse") return;

    // Select target tokens
    let targets = [...game.user.targets.values()];
    if (targets.length == 0) targets = game.archmage.MacroUtils.getAllies();

    // Prepare effect data
    let effectData = {
      label: archmage.item.name,
      icon: archmage.item.img,
      changes: [{
        key: "system.attributes.attackMod.value",
        value: 1,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },]
    };

    // Add extra effects for higher levels
    if (archmage.item.system.powerLevel.value >= 3) {
      effectData.changes.push({
        key: "system.attributes.saves.bonus",
        value: 1,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      });
    }
    if (archmage.item.system.powerLevel.value >= 9) {
      effectData.changes.push({
        key: "system.attributes.md.value",
        value: 1,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      });
    }

    game.archmage.MacroUtils.setDuration(
      effectData,
      CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextSourceTurn,
      {sourceTurnUuid: actor.uuid}
    );

    // Apply effect to all targets - make the GM do it to bypass permissions
    game.archmage.MacroUtils.applyActiveEffectsToTokens(targets, [effectData]);
  }

  static async bardSongOfHeroes2e(speaker, actor, token, character, archmage) {
    if (!actor) return;
    if (archmage.usageMode == "finalverse") return;

    // Select target tokens
    let targets = [...game.user.targets.values()];
    if (targets.length == 0) targets = game.archmage.MacroUtils.getAllies();

    // Increase bonuse if we have the champion feat
    let bonus = game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value ? 2 : 1;

    // Prepare effect data
    let effectData = {
      label: archmage.item.name,
      icon: archmage.item.img,
      changes: [{
        key: "system.attributes.attackMod.value",
        value: bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },]
    };

    game.archmage.MacroUtils.setDuration(
      effectData,
      CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextSourceTurn,
      {sourceTurnUuid: actor.uuid}
    );

    // Apply effect to all targets - make the GM do it to bypass permissions
    game.archmage.MacroUtils.applyActiveEffectsToTokens(targets, [effectData]);
  }

  ////////////////////////////////////////////////
  /**
   * Cleric Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Hammer of Faith (1e).
   */
  static async clericHammerOfFaith(speaker, actor, token, character, archmage) {
    const bonus = actor.isMulticlass() ? "d10" : "d12";
    const effectData = {
      label: archmage.item.name,
      icon: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: bonus ,
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  static async clericHammerOfFaith2e(speaker, actor, token, character, archmage) {
    let bonus = archmage.item.system.hit.value;
    if (archmage.item.system.powerLevel.value > 1) {
      bonus = archmage.item.system[`spellLevel${archmage.item.system.powerLevel.value}`].value;
    }
    const effectData = {
      label: archmage.item.name,
      icon: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: bonus,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  ////////////////////////////////////////////////
  /**
   * Commander Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Outmaneuver.
   */
  static async commanderOutmaneuver(speaker, actor, token, character, archmage) {
    const hasFeat = game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value;
    const isEven = (archmage.hitEval.$rolls[0].d20result % 2 == 0);
    const bonus = (hasFeat && isEven) ? 2 : 1;
    const cp = actor?.system.resources.perCombat.commandPoints.current;
    if (archmage.hitEval.hasHit) {
      await actor.update({'system.resources.perCombat.commandPoints.current': cp + bonus});
    }
  }

  ////////////////////////////////////////////////
  /**
   * Fighter Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Carve an Opening.
   */
  static async fighterCarveAnOpening(speaker, actor, token, character, archmage) {
    if (!actor) return;

    const label = archmage.item.name;

    // Compute bonus amount
    const hasFeat = game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value;
    const bonus = hasFeat ? 2 : 1;

    // Check for previous effects
    let prev = 0;
    let effectsToDelete = [];
    const aes = actor.effects.filter(e => e.label == label);
    aes.forEach(e => {
      effectsToDelete.push(e.id);
      if (e.disabled) return;
      e.changes.forEach(c => {
        if (c.key == 'system.attributes.critMod.atk.value') prev = Math.max(prev, Number(c.value));
      });
    });
    await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete)

    // Make new effect
    let effectData = {
      label: label,
      icon: archmage.item.img,
      changes: [
        { key: "system.attributes.critMod.atk.value", value: bonus + prev, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      ]};
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  /**
   * Defensive Fighting.
   */
  static async fighterDefensiveFighting(speaker, actor, token, character, archmage) {
    if (!actor) return;

    let bonus = 2;
    // If the champion feat in active increase the bonus
    if (game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value) bonus = 3;
    let effects = [
      { key: "system.attributes.ac.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ];
    // If the adventurer feat in active apply to PD
    if (game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'adventurer')[0].isActive.value) {
      effects.push({ key: "system.attributes.pd.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD });
    }
    // If the epic feat in active apply to MD
    if (game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'epic')[0].isActive.value) {
      effects.push({ key: "system.attributes.md.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD });
    }

    let effectData = { label: archmage.item.name, icon: archmage.item.img, changes: effects };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn);

    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  ////////////////////////////////////////////////
  /**
   * Wizard Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Light cantrip.
   */
  static async wizardLight(speaker, actor, token, character, archmage) {
    if (!token) return;
    const radiusBright = 3;
    const radiusDim = 4;
    let conf = {
      alpha: 0.35,
      angle: 0,
      coloration: 1,
      gradual: true,
      luminosity: 0.5,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: {
        speed: 2,
        intensity: 2,
        reverse: false,
        type: "torch",
      },
      darkness: {
        min: 0,
        max: 1,
      },
    };
    if (token.data.light.bright != 0) {
      conf.bright = 0;
      conf.dim = 0;
      await token.document.update({light: conf});
      archmage.suppressMessage = true;
    } else {
      conf.bright = radiusBright;
      conf.dim = radiusDim;
      await token.document.update({light: conf});
    }

  }
}
