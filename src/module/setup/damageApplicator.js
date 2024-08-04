export class DamageApplicator {

  getRollValue(roll) {
    if (Number.isInteger(roll)) {
      return roll;
    }
    if (roll instanceof Roll) {
      return roll.total;
    }
    return Number.parseInt(roll[0].innerText.trim());
  }

  getTargets(targetType) {
    const targets = targetType === 'targeted'
      ? [...game.user.targets]
      : canvas.tokens.controlled;

    if (!targets || targets?.length < 1) {
      ui.notifications.warn(game.i18n.localize(`ARCHMAGE.UI.${targetType === 'targeted' ? 'noTarget' : 'noToken'}`));
      return [];
    }

    return targets;
  }

  asDamage(roll, modifier, targetType = 'selected') {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    const targets = this.getTargets(targetType);
    targets.forEach(token => {
      let actorData = foundry.utils.duplicate(token.actor);
      token.actor.update({
        "system.attributes.hp.value": actorData.system.attributes.hp.value - toApply,
      });
    });
  }

  asHealing(roll, modifier, targetType = 'selected') {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    const targets = this.getTargets(targetType);
    targets.forEach(token => {
      let actorData = foundry.utils.duplicate(token.actor);
      token.actor.update({
        "system.attributes.hp.value": Math.max(0, actorData.system.attributes.hp.value) + toApply,
      });
    });
  }

  asTempHealth(roll, targetType = 'selected') {
    let toApply = this.getRollValue(roll);
    const targets = this.getTargets(targetType);
    targets.forEach(token => {
      let actorData = foundry.utils.duplicate(token.actor);
      let hp = actorData.system.attributes["hp"];
      if (isNaN(hp.temp) || hp.temp === undefined) hp.temp = 0;
      hp.temp = Math.max(hp.temp, toApply);
      token.actor.update({
        "system.attributes.hp.temp": hp.temp,
      });
    });
  }
}
