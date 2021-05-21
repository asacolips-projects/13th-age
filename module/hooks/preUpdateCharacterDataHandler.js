/**
 * Actor update hook
 *
 * @return {undefined}
 */

export function archmagePreUpdateCharacterData(actor, data, options, id) {
  if (!actor.data.type == 'character'
    || !options.diff
    || data.data === undefined) {
      // Nothing to do
      return;
  }

  if (data.data.attributes?.weapon?.melee?.shield !== undefined
    || data.data.attributes?.weapon?.melee?.dualwield !== undefined
    || data.data.attributes?.weapon?.melee?.twohanded !== undefined) {
    // Here we received an update of the melee weapon checkboxes

    // Fallback for sheet closure bug
    if (typeof actor.data.data.attributes.weapon.melee.dice !== 'string') {
        actor.data.data.attributes.weapon.melee.dice = "d8";
    }

    let mWpn = parseInt(actor.data.data.attributes.weapon.melee.dice.substring(1));
    if (isNaN(mWpn)) mWpn = 8; // Fallback
    let lvl = actor.data.data.attributes.level.value;
    data.data.attributes.attackMod = {value: actor.data.data.attributes.attackMod.value};
    let wpn = {shieldPen: 0, twohandedPen: 0};
    if (actor.data.data.attributes.weapon.melee.twohanded) {
      wpn.mWpn2h = mWpn;
      wpn.mWpn1h = Math.max(mWpn - 2, 4);
    } else {
      wpn.mWpn2h = Math.min(mWpn + 2, 12);
      wpn.mWpn1h = mWpn;
    }

    // Compute penalties due to equipment (if classes known)
    if (actor.data.data.details.detectedClasses) {
      let shieldPen = new Array();
      let twohandedPen = new Array();
      let mWpn1h = new Array();
      let mWpn2h = new Array();
      let skilledWarrior = new Array();
      actor.data.data.details.detectedClasses.forEach(function(item) {
        shieldPen.push(CONFIG.ARCHMAGE.classes[item].shld_pen);
        mWpn1h.push(CONFIG.ARCHMAGE.classes[item].wpn_1h);
        mWpn2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h);
        if (CONFIG.ARCHMAGE.classes[item].wpn_2h > CONFIG.ARCHMAGE.classes[item].wpn_1h
          && CONFIG.ARCHMAGE.classes[item].wpn_2h >= CONFIG.ARCHMAGE.classes.monk.wpn_2h) {
          // Handles special case of monk MC with classes that don't benefit from 2h
          twohandedPen.push(CONFIG.ARCHMAGE.classes[item].wpn_2h_pen);
        }
        skilledWarrior.push(CONFIG.ARCHMAGE.classes[item].skilled_warrior)
      });
      wpn.shieldPen = Math.max.apply(null, shieldPen);
      if (twohandedPen.length > 0) wpn.twohandedPen = Math.max.apply(null, twohandedPen);
      mWpn1h = Math.max.apply(null, mWpn1h);
      mWpn2h = Math.max.apply(null, mWpn2h);
      if (skilledWarrior.length > 1 && !skilledWarrior.every(a => a)) {
        mWpn1h = Math.max(mWpn1h - 2, 4);
        mWpn2h = Math.max(mWpn2h - 2, 4);
      }
      // Only use class values if the current values haven't been tampered with
      if (actor.data.data.attributes.weapon.melee.twohanded && wpn.mWpn2h == mWpn2h) {
        wpn.mWpn1h = mWpn1h;
      }
      else if (!actor.data.data.attributes.weapon.melee.twohanded && wpn.mWpn1h == mWpn1h) {
        wpn.mWpn2h = mWpn2h;
      }
      else { // Values differ from rules, don't do anything
        wpn.shieldPen = 0;
        wpn.twohandedPen = 0;
      }
    }

    if (data.data.attributes.weapon.melee.shield !== undefined) {
      // Here we received an update of the shield checkbox
      if (data.data.attributes.weapon.melee.shield) {
        // Adding a shield
        data.data.attributes.ac = {base: actor.data.data.attributes.ac.base + 1};
        data.data.attributes.attackMod.value += wpn.shieldPen;
        if (actor.data.data.attributes.weapon.melee.twohanded) {
          // Can't wield both a two-handed weapon and a shield
          mWpn = wpn.mWpn1h;
          data.data.attributes.weapon.melee.twohanded = false;
          data.data.attributes.attackMod.value -= wpn.twohandedPen;
        }
        else if (actor.data.data.attributes.weapon.melee.dualwield) {
          // Can't dual-wield with a shield
          data.data.attributes.weapon.melee.dualwield = false;
        }
      } else {
        data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
        data.data.attributes.attackMod.value -= wpn.shieldPen;
      }
    }

    else if (data.data.attributes.weapon.melee.dualwield !== undefined) {
      // Here we received an update of the dual wield checkbox
      if (data.data.attributes.weapon.melee.dualwield) {
        if (actor.data.data.attributes.weapon.melee.twohanded) {
          // Can't wield two two-handed weapons
          mWpn = wpn.mWpn1h;
          data.data.attributes.weapon.melee.twohanded = false;
          data.data.attributes.attackMod.value -= wpn.twohandedPen;
        }
        else if (actor.data.data.attributes.weapon.melee.shield) {
          // Can't duel-wield with a shield
          data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
          data.data.attributes.weapon.melee.shield = false;
          data.data.attributes.attackMod.value -= wpn.shieldPen;
        }
      }
    }

    else if (data.data.attributes.weapon.melee.twohanded !== undefined) {
      // Here we received an update of the two-handed checkbox
      if (data.data.attributes.weapon.melee.twohanded) {
        mWpn = wpn.mWpn2h;
        data.data.attributes.attackMod.value += wpn.twohandedPen;
        if (actor.data.data.attributes.weapon.melee.shield) {
          // Can't wield both a two-handed weapon and a shield
          data.data.attributes.ac = {base: actor.data.data.attributes.ac.base - 1};
          data.data.attributes.weapon.melee.shield = false;
          data.data.attributes.attackMod.value -= wpn.shieldPen;
        }
        else if (actor.data.data.attributes.weapon.melee.dualwield) {
          // Can't wield two two-handed weapons
          data.data.attributes.weapon.melee.dualwield = false;
        }
      } else {
        mWpn = wpn.mWpn1h;
        data.data.attributes.attackMod.value -= wpn.twohandedPen;
      }
    }

    data.data.attributes.weapon.melee.dice = `d${mWpn}`;
    data.data.attributes.weapon.melee.value = `${lvl}d${mWpn}`;
  }

  else if (data.data.details !== undefined
    && data.data.details.class !== undefined
    && game.settings.get('archmage', 'automateBaseStatsFromClass')
    ) {
    // Here we received an update of the class name for a character

    // Find known classes
    let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    let classRegex = new RegExp(classList.join('|'), 'g');
    let classText = data.data.details.class.value;

    // Exit early if the class text is invalid.
    if (typeof classText !== 'string') return;

    classText = classText ? classText.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    let matchedClasses = classText.match(classRegex);

    if (matchedClasses !== null) {
      // Remove duplicates and Sort to avoid problems with future matches
      matchedClasses = [...new Set(matchedClasses)].sort();

      // Check that the matched classes actually changed
      if (actor.data.data.details.matchedClasses !== undefined
        && JSON.stringify(actor.data.data.details.matchedClasses) == JSON.stringify(matchedClasses)
        ) {
        return;
      }

      // Collect base stats for detected classes
      let base = {
        hp: new Array(),
        ac: new Array(),
        ac_hvy: new Array(),
        shld_pen: new Array(),
        pd: new Array(),
        md: new Array(),
        rec: new Array(),
        mWpn_1h: new Array(),
        mWpn_2h: new Array(),
        rWpn: new Array(),
        skilledWarrior: new Array()
      }

      matchedClasses.forEach(function(item) {
        base.hp.push(CONFIG.ARCHMAGE.classes[item].hp);
        base.ac.push(CONFIG.ARCHMAGE.classes[item].ac_lgt);
        if (CONFIG.ARCHMAGE.classes[item].ac_hvy_pen < 0) {base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy_pen);}
        else {base.ac_hvy.push(CONFIG.ARCHMAGE.classes[item].ac_hvy);}
        base.shld_pen.push(CONFIG.ARCHMAGE.classes[item].shld_pen);
        base.pd.push(CONFIG.ARCHMAGE.classes[item].pd);
        base.md.push(CONFIG.ARCHMAGE.classes[item].md);
        base.rec.push(CONFIG.ARCHMAGE.classes[item].rec_die);
        base.mWpn_1h.push(CONFIG.ARCHMAGE.classes[item].wpn_1h);
        if (CONFIG.ARCHMAGE.classes[item].wpn_2h_pen < 0) {base.mWpn_2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h_pen);}
        else {base.mWpn_2h.push(CONFIG.ARCHMAGE.classes[item].wpn_2h);}
        base.rWpn.push(CONFIG.ARCHMAGE.classes[item].wpn_rngd);
        base.skilledWarrior.push(CONFIG.ARCHMAGE.classes[item].skilled_warrior);
      });

      // Combine base stats based on detected classes
      if (base.skilledWarrior.length == 1) base.skilledWarrior = true;
      else base.skilledWarrior = base.skilledWarrior.every(a => a);
      base.hp = (base.hp.reduce((a, b) => a + b, 0) / base.hp.length);
      base.ac = Math.max.apply(null, base.ac);
      if (Math.min.apply(null, base.ac_hvy) > 0) base.ac = Math.max.apply(null, base.ac_hvy);
      base.shld_pen = base.shld_pen.some(a => a < 0);
      base.pd = Math.max.apply(null, base.pd);
      base.md = Math.max.apply(null, base.md);
      if (base.rec.length == 1) base.rec = base.rec[0];
      else base.rec = (Math.ceil(base.rec.reduce((a, b) => a/2 + b/2) / base.rec.length) * 2);
      base.mWpn_1h = Math.max.apply(null, base.mWpn_1h);
      base.mWpn_2h_pen = base.mWpn_2h.every(a => a < 0);
      base.mWpn_2h = Math.max.apply(null, base.mWpn_2h);
      base.rWpn = Math.max.apply(null, base.rWpn);
      let jabWpn = 6;
      let punchWpn = 8;
      let kickWpn = 10;
      if (!base.skilledWarrior) {
        base.mWpn_1h = Math.max(base.mWpn_1h - 2, 4);
        base.mWpn_2h = Math.max(base.mWpn_2h - 2, 4);
        base.rWpn = Math.max(base.rWpn - 2, 4);
        jabWpn -= 2;
        punchWpn -= 2;
        kickWpn -= 2;
      }
      let lvl = actor.data.data.attributes.level.value;
      let shield = false;
      let dualwield = false;
      let twohanded = false;
      // Pick best weapon (and possibly shield)
      base.mWpn = base.mWpn_1h;
      if (matchedClasses.includes("monk")) {
        dualwield = true;
      }
      else if (!base.shld_pen) {
        base.ac += 1;
        shield = true;
      }
      else if (!base.mWpn_2h_pen && base.mWpn_2h > base.mWpn_1h) {
        base.mWpn = base.mWpn_2h;
        twohanded = true;
      }

      // Assign computed values
      data.data.attributes = {
        hp: {base: base.hp},
        ac: {base: base.ac},
        pd: {base: base.pd},
        md: {base: base.md},
        recoveries: {dice: `d${base.rec}`},
        weapon: {
          melee: {
            dice: `d${base.mWpn}`,
            value: `${lvl}d${base.mWpn}`,
            shield: shield,
            dualwield: dualwield,
            twohanded: twohanded
          },
          ranged: {dice: `d${base.rWpn}`, value: `${lvl}d${base.rWpn}`},
          jab: {dice: `d${jabWpn}`, value: `${lvl}d${jabWpn}`},
          punch: {dice: `d${punchWpn}`, value: `${lvl}d${punchWpn}`},
          kick: {dice: `d${kickWpn}`, value: `${lvl}d${kickWpn}`}
        }
      };
    }
    // Store matched classes for future reference
    data.data.details.detectedClasses = matchedClasses;
  }
}
