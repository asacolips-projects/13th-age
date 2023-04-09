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

  asDamage(roll, modifier) {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    let selected = canvas.tokens.controlled;
    if (selected.length === 0) {
      ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.noToken"));
      return;
    }
    selected.forEach(token => {
      let actorData = duplicate(token.actor);
      actorData.system.attributes.hp.value -= toApply;
      token.actor.update(actorData);
    });

  }

  asHealing(roll, modifier) {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    let selected = canvas.tokens.controlled;
    selected.forEach(token => {
      let actorData = duplicate(token.actor);
      actorData.system.attributes.hp.value = Math.max(0, actorData.system.attributes.hp.value) + toApply;
      token.actor.update(actorData);
    });
  }

  asTempHealth(roll) {
    let toApply = this.getRollValue(roll);
    let selected = canvas.tokens.controlled;
    selected.forEach(token => {
      let actorData = duplicate(token.actor);
      let hp = actorData.system.attributes["hp"];
      if (isNaN(hp.temp) || hp.temp === undefined) hp.temp = 0;
      hp.temp = Math.max(hp.temp, toApply);
      token.actor.update(actorData);
    });
  }
}
