export class ActorHelpersV2 {
  /**
   * Compute derived data for an actor.
   *
   * @param {object} actorData
   *   `actor.data` object to compute derived data for.
   */
  static prepareData(actorData) {
    ActorHelpersV2._prepareCharacterData(actorData);
    ActorHelpersV2._prepareNpcData(actorData);
    return actorData;
  }

  static _prepareCharacterData(actorData) {
    ActorHelpersV2._prepareAbilityScores(actorData);
    ActorHelpersV2._prepareDefenses(actorData);
  }

  static _prepareNpcData(actorData) {
    // Pass.
  }

  static _prepareIcons(actorData) {
    // Handle icons.
    if (actorData.system?.icons) {
      for (let [k,v] of Object.entries(actorData.system.icons)) {
        if (v.results) {
          let results = {};
          for (let i = 0; i < v.bonus.value; i++) {
            results[i] = {
              // TODO: Make this dynamic.
              value: 6
            }
          }
          v.results = results;
        }
      }
    }
  }

  static _prepareAbilityScores(actorData) {
    let levelMultiplier = 1;
    if (actorData.system.attributes.level.value >= 5) {
      levelMultiplier = 2;
    }
    if (actorData.system.attributes.level.value >= 8) {
      levelMultiplier = 3;
    }

    for (let abl of Object.values(actorData.system.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = abl.mod + actorData.system.attributes.level.value;
      abl.dmg = abl.mod * levelMultiplier;
    }
  }

  static _prepareDefenses(actorData) {
    let data = actorData.system;
    let missingRecPenalty = Math.min(data.attributes.recoveries.value, 0);

    let acBonus = missingRecPenalty;
    let mdBonus = missingRecPenalty;
    let pdBonus = missingRecPenalty;

    if (actorData.items) {
      actorData.items.forEach((item) => {
        if (item.type === 'equipment') {
          acBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.ac);
          mdBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.md);
          pdBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.pd);
        }
      });
    }

    // Use array.sort()[1] to grab the middle of the three ability mods.
    data.attributes.ac.value = data.attributes.ac.base + [data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod].sort()[1] + data.attributes.level.value + acBonus;
    data.attributes.pd.value = data.attributes.pd.base + [data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod].sort()[1] + data.attributes.level.value + pdBonus;
    data.attributes.md.value = data.attributes.md.base + [data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod].sort()[1] + data.attributes.level.value + mdBonus;
  }

  static _getBonusOr0(type) {
    if (type && type.bonus) {
      return type.bonus;
    }
    return 0;
  }

  static _activatePortraitArtContextMenu(app, element) {
    ContextMenu.create(app, element, '.profile-img', [
      {
        name: 'Show Portrait',
        icon: '',
        callback: console.log
      },
      {
        name: 'Show Token',
        icon: '',
        callback: console.log
      }
    ])
  }
}
