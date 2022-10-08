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
      { key: "data.attributes.ac.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      { key: "data.attributes.pd.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      { key: "data.attributes.md.value", value: 2, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ];

    // Check for previous effects
    const aes = actor.effects.filter(e => e.label == label);
    if (aes.length > 0) {
      let effectsToDelete = [];
      aes.forEach(e => {effectsToDelete.push(e.id)});
      await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete)
      archmage.suppressMessage = true;
      ui.notifications.info("");
    } else {
      const effectData = {label: label, changes: effects, icon: archmage.item.img};
      actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
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
    const hasFeat = archmage.item.system.feats.champion.isActive.value;
    const isEven = (archmage.hitEval.$rolls[0].d20result % 2 == 0);
    const bonus = (hasFeat && isEven) ? 2 : 1;
    const cp = actor?.system.resources.perCombat.commandPoints.current;
    if (archmage.hitEval.hasHit) {
      await actor.update({'system.resources.perCombat.commandPoints.current': cp+bonus});
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
    const hasFeat = archmage.item.system.feats.champion.isActive.value;
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
      changes: [{ key: "system.attributes.critMod.atk.value", value: bonus + prev, mode: CONST.ACTIVE_EFFECT_MODES.ADD }],
      icon: archmage.item.img};
    actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

  /**
   * Defensive Fighting.
   */
  static async fighterDefensiveFighting(speaker, actor, token, character, archmage) {
    if (!actor) return;

    const label = archmage.item.name;

    let bonus = 2;
    if (archmage.item.system.feats.champion.isActive.value) bonus = 3;
    let effects = [{ key: "data.attributes.ac.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD }];
    if (archmage.item.system.feats.adventurer.isActive.value) effects.push({ key: "data.attributes.pd.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD });
    if (archmage.item.system.feats.epic.isActive.value) effects.push({ key: "data.attributes.md.value", value: bonus, mode: CONST.ACTIVE_EFFECT_MODES.ADD });

    let effectData = {label: label, changes: effects, icon: archmage.item.img};

    // Set duration

    const duration = {
      combat: undefined,
      rounds: 1,
      seconds: undefined,
      startRound: 0,
      startTime: 0,
      startTurn: 0,
      turns: 1
    }
    const flag = "turnEnd"
    effectData['flags.dae.specialDuration'] = flag;
    effectData.duration = duration;

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
    const radiusDim = 6
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
