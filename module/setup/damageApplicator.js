export class DamageApplicator {

  getRollValue(inlineRoll) {
    return Number.parseInt(inlineRoll[0].innerText.trim());
  }

  getTokenAttribute(token, attribute) {
    if (token.data?.actorData?.data?.attributes != undefined) {
      // Return token overridden value
      if (token.data.actorData.data.attributes[attribute]) {
        return token.data.actorData.data.attributes[attribute];
      }
    }
    return token.actor.data.data.attributes[attribute];
  }

  asDamage(inlineRoll, modifier) {
    let toApply = this.getRollValue(inlineRoll);

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
      let actorData = duplicate(token.actor.data);
      actorData.data.attributes.hp.value -= toApply;
      token.actor.update(actorData);
    });

  }

  asHealing(inlineRoll) {
    let toApply = this.getRollValue(inlineRoll);
    let selected = canvas.tokens.controlled;
    selected.forEach(token => {
      let actorData = duplicate(token.actor.data);
      actorData.data.attributes.hp.value += toApply;
      token.actor.update(actorData);
    });
  }

  asTempHealth(inlineRoll) {
    let toApply = this.getRollValue(inlineRoll);
    let selected = canvas.tokens.controlled;
    selected.forEach(token => {
      let actorData = duplicate(token.actor.data);
      let hp = actorData.data.attributes["hp"];
      if (isNaN(hp.temp) || hp.temp === undefined) hp.temp = 0;
      hp.temp = Math.max(hp.temp, toApply);
      token.actor.update(actorData);
    });
  }
}
