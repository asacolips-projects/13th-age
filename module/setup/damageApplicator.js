export class DamageApplicator {

  getRollValue(inlineRoll) {
    return Number.parseInt(inlineRoll[0].innerText.trim());
  }

  getTokenAttribute(token, attribute) {
    //console.log(target);
    if (token.data?.actorData?.data?.attributes != undefined) {
      // Return token overridden value
      if (token.data.actorData.data.attributes[attribute]) {
        return token.data.actorData.data.attributes[attribute];
      }
    }
    return token.actor.data.data.attributes[attribute];
  }

  asDamage(inlineRoll, modifier) {
    var toApply = this.getRollValue(inlineRoll);

    if (inlineRoll[0].classList.contains('dc-crit')) {

      // Crits are pre-doubled, so we gotta math it up a bit
      if (modifier == 2) {
        modifier = 1.5;
      }
      else if (modifier == 3) {
        modifier = 2;
      }
    }

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.round(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    var selected = canvas.tokens.controlled;
    if (selected.length === 0) {
      ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.noToken"));
      return;
    }
    selected.forEach(token => {

      if (token.data?.actorData?.data?.attributes != undefined) {
        var tokenData = duplicate(token.data);
        var hp = tokenData.actorData.data.attributes["hp"];
        var temp = hp.temp ?? 0;
        if (isNaN(temp)) remp = 0;

        if (toApply > temp) {
          var overflow = toApply - temp;
          hp.temp = 0;
          hp.value -= overflow;
        }
        else {
          hp.temp -= toApply;
        }

        token.update(tokenData);
      }
      else {
        var actorData = duplicate(token.actor.data);
        var hp = actorData.data.attributes["hp"];
        var temp = hp.temp;

        if (toApply > temp) {
          var overflow = toApply - temp;
          hp.temp = 0;
          hp.value -= overflow;
        }
        else {
          hp.temp -= toApply;
        }

        token.actor.update(actorData);
      }
    });

  }

  asHealing(inlineRoll) {
    var toApply = this.getRollValue(inlineRoll);

    var selected = canvas.tokens.controlled;
    selected.forEach(token => {
      // console.log(token);

      if (token.data?.actorData?.data?.attributes != undefined) {
        var tokenData = duplicate(token.data);
        var hp = tokenData.actorData.data.attributes["hp"];
        hp.value += toApply;
        if (hp.value > hp.max) {
          hp.value = hp.max;
        }
        token.update(tokenData);
      }
      else {
        var actorData = duplicate(token.actor.data);
        var hp = actorData.data.attributes["hp"];
        hp.value += toApply;
        if (hp.value > hp.max) {
          hp.value = hp.max;
        }
        token.actor.update(actorData);
      }
    });
  }

  asTempHealth(inlineRoll) {
    var toApply = this.getRollValue(inlineRoll);

    var selected = canvas.tokens.controlled;
    selected.forEach(token => {
      // console.log(token);

      if (token.data?.actorData?.data?.attributes != undefined) {
        var tokenData = duplicate(token.data);
        var hp = tokenData.actorData.data.attributes["hp"];
        hp.temp += toApply;
        token.update(tokenData);
      }
      else {
        var actorData = duplicate(token.actor.data);
        var hp = actorData.data.attributes["hp"];
        hp.temp += toApply;
        token.actor.update(actorData);
      }
    });
  }
}
