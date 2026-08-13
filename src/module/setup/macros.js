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
    const name = archmage.item.name;
    const effects = [
      { key: "system.attributes.ac.value", value: 2, type: "add" },
      { key: "system.attributes.pd.value", value: 2, type: "add" },
      { key: "system.attributes.md.value", value: 2, type: "add" }
    ];

    // Check for previous effects
    const aes = actor.effects.filter(e => e.name == name);
    if (aes.length > 0) {
      archmage.suppressMessage = true;
      let effectsToDelete = [];
      aes.forEach(e => {effectsToDelete.push(e.id)});
      await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete)
      // ui.notifications.info("Halo removed");
    } else {
      const effectData = {
        name: name,
        changes: effects,
        img: archmage.item.img
      };
      game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
      await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
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
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [
        { key: "system.attributes.ac.value", value: penalty, type: "add" },
        { key: "system.attributes.pd.value", value: penalty, type: "add" }
      ]
    }
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
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
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.attackMod.value",
        value: 1,
        type: "add"
      },]
    };

    // Add extra effects for higher levels
    if (archmage.item.system.powerLevel.value >= 3) {
      effectData.changes.push({
        key: "system.attributes.saves.bonus",
        value: 1,
        type: "add"
      });
    }
    if (archmage.item.system.powerLevel.value >= 9) {
      effectData.changes.push({
        key: "system.attributes.md.value",
        value: 1,
        type: "add"
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
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.attackMod.value",
        value: bonus,
        type: "add"
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
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: bonus ,
        type: "override"
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  static async clericHammerOfFaith2e(speaker, actor, token, character, archmage) {
    let bonus = archmage.item.system.hit.value;
    if (archmage.item.system.powerLevel.value > 1) {
      bonus = archmage.item.system[`spellLevel${archmage.item.system.powerLevel.value}`].value;
    }
    const effectData = {
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: bonus,
        type: "add"
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  //TODO: StrengthoftheGods

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

    const name = archmage.item.name;

    // Compute bonus amount
    const hasFeat = game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value;
    const bonus = hasFeat ? 2 : 1;

    // Check for previous effects
    let prev = 0;
    let effectsToDelete = [];
    const aes = actor.effects.filter(e => e.name == name);
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
      name: name,
      img: archmage.item.img,
      changes: [
        { key: "system.attributes.critMod.atk.value", value: bonus + prev, type: "add" },
      ]};
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  /**
   * Defensive Fighting.
   */
  static async fighterDefensiveFighting(speaker, actor, token, character, archmage) {
    if (!actor) return;
    
    let effects = [];
    let bonus = 2;

    const is2e = game.settings.get("archmage", "secondEdition");
    const shieldEquipped = actor.system.attributes?.weapon?.melee?.shield ?? false;
    const feats = {
      adventurer: game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'adventurer')[0].isActive.value,
      champion: game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'champion')[0].isActive.value,
      epic: game.archmage.MacroUtils.getFeatsByTier(archmage.item, 'epic')[0].isActive.value,
    };
    if (is2e) {
      // Calculate bonus.
      bonus = !shieldEquipped ? 1 : 2;
      if (feats.adventurer) {
        bonus = !shieldEquipped ? 2 : 3;
      }
      // Apply to AC.
      effects.push({ key: "system.attributes.ac.value", value: bonus, type: "add" });
      // Champion and/or Epic feat applies to PD.
      if (feats.champion || feats.epic) {
        effects.push({ key: "system.attributes.pd.value", value: bonus, type: "add" });
      }
      // Epic feat applies to MD.
      if (feats.epic) {
        effects.push({ key: "system.attributes.md.value", value: bonus, type: "add" });
      }
    }
    else {
      // If the champion feat in active increase the bonus
      if (feats.champion) bonus = 3;
      effects.push({ key: "system.attributes.ac.value", value: bonus, type: "add" });
      // If the adventurer feat in active apply to PD
      if (feats.adventurer) {
        effects.push({ key: "system.attributes.pd.value", value: bonus, type: "add" });
      }
      // If the epic feat in active apply to MD
      if (feats.epic) {
        effects.push({ key: "system.attributes.md.value", value: bonus, type: "add" });
      }
    }

    let effectData = {
      name: archmage.item.name,
      img: archmage.item.img,
      changes: effects
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn);

    const existingEffect = actor.effects.getName('Defensive Fighting');
    if (existingEffect) {
      await existingEffect.update(effectData);
    }
    else {
      await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
  }

  //TODO: GritAndScrap2e

  ////////////////////////////////////////////////
  /**
   * Paladin Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Great Dragon Incarnation.
   */

  static async paladinGreatDragonIncarnation(speaker, actor, token, character, archmage) {
    if (!actor) return;
    const name = archmage.item.name;
    const dragonImg = "systems/archmage/assets/icons/tokens/monsters/dragon-gold.webp";
    const dragonScale = 3;

    // The macro may receive either a placeable or a token document.
    const doc = token?.document ?? token ?? null;

    // Toggling back: restore the token and clear the effect this macro created.
    // The stored appearance is the source of truth, so this still works if the
    // effect already expired at the end of combat. The texture check catches
    // tokens transformed before the appearance was being recorded.
    if (game.archmage.MacroUtils.isTokenTransformed(doc) || doc?.texture?.src == dragonImg) {
      archmage.suppressMessage = true;
      const aes = actor.effects.filter(e => e.name == name);
      if (aes.length > 0) {
        await actor.deleteEmbeddedDocuments("ActiveEffect", aes.map(e => e.id));
      }
      await game.archmage.MacroUtils.restoreToken(doc);
      return;
    }

    const effectData = {
      name: name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: game.archmage.MacroUtils.scaleDiceUp(actor.system.attributes.weapon.melee.dice),
        type: "override"
      }, {
        key: "system.attributes.recoveries.dice",
        value: game.archmage.MacroUtils.scaleDiceUp(actor.system.attributes.recoveries.dice),
        type: "override"
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    await game.archmage.MacroUtils.transformToken(doc, dragonImg, dragonScale);
  }

  ////////////////////////////////////////////////
  /**
   * Ranger Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Skirmisher.
   */
  static async rangerSkirmisher(speaker, actor, token, character, archmage) {
    if (!actor) return;

    // Only works during combat.
    const combat = game.combat;
    if (!combat) {
      ui.notifications.warn(game.i18n.localize("COMBAT.NoneActive"));
      return;
    }

    // Find this actor in the initiative order, counting any extra turn it already has.
    // Bail out unless there's exactly one entry and it's the real combatant, which also
    // stops the power from stacking with itself.
    const entries = combat.combatants.filter(c =>
      c.actor?.uuid === actor.uuid || c.flags.archmage?.skirmisherFor === actor.uuid);
    if (entries.length !== 1 || !entries[0].actor) return;

    const initiative = entries[0].initiative;
    if (initiative === null || initiative === undefined) return;

    // Add a pseudo-combatant rather than a copy of the real one, to avoid triggering
    // per-combatant effects (command points, turn effects, lifecycle macros) twice.
    game.archmage.MacroUtils.addPseudoCombatant({
      name: `${token?.name || actor.name} (${archmage.item.name})`,
      img: archmage.item.img,
      initiative: initiative / 2,
      flags: {archmage: {skirmisherFor: actor.uuid}}
    }, combat);
  }

  ////////////////////////////////////////////////
  /**
   * Sorcerer Macros.
   */
  ////////////////////////////////////////////////

  /**
   * Golden Shield.
   */
  static async sorcererGoldenShield(speaker, actor, token, character, archmage) {
    const filter = /\[\[(\d+)\]\]/

    let bonus = archmage.item.system.effect.value.match(filter);
    if (archmage.item.system.powerLevel.value > 3) {
      const bonus2 = archmage.item.system[`spellLevel${archmage.item.system.powerLevel.value}`].value.match(filter);
      // Double check as the paladin version has an empty 8th level value
      if (bonus2) bonus = bonus2;
    }
    bonus = Number(bonus[1]);
    const effectData = {
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.hp.extra",
        value: bonus,
        type: "add"
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

    // Also heal the extra amount
    await actor.update({
      'system.attributes.hp.value': actor.system.attributes.hp.value + bonus
    });
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
    if (!token.light) {
      let data = foundry.data.LightData.cleanData();
      data.bright = 3;
      data.dim = 4;
      data.animation.type = 'torch';
      data.animation.speed = 3;
      data.animation.intensity = 3;
      await token.document.update({light: data});
    } else {
      await token.document.update({light: undefined});
      archmage.suppressMessage = true;
    }
  }

  ////////////////////////////////////////////////
  /**
   * Item Macros.
   */
  ////////////////////////////////////////////////

  /**
   * "Flaming" weapon (2e).
   */
  static async flamingWeapon(speaker, actor, token, character, archmage) {
    const rollData = actor.getRollData();
    const effectData = {
      name: archmage.item.name,
      img: archmage.item.img,
      changes: [{
        key: "system.attributes.weapon.melee.dice",
        value: `+${rollData.lvl}-${rollData.atk.m.bonus}`, // replace item bonus with level
        type: "add"
      }]
    };
    game.archmage.MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.EndOfCombat);
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }
}
