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

  asDamage(roll, modifier = 1, targetType = 'selected') {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    const targets = this.getTargets(targetType);
    // Apply damage if user is a GM.
    if (game.user.isGM || targetType === 'selected') {
      targets.forEach(token => {
        let actorData = foundry.utils.duplicate(token.actor);
        token.actor.update({
          "system.attributes.hp.value": actorData.system.attributes.hp.value - toApply,
        });
      });
    }
    // Otherwise, emit a socket so that a GM user can apply it.
    else {
      game.socket.emit('system.archmage', {
        type: 'applyDamageHealing',
        uuids: targets.map(t => t.document.uuid),
        attr: 'system.attributes.hp.value',
        operation: 'damage',
        value: toApply,
      });
    }
  }

  asHealing(roll, modifier = 1, targetType = 'selected') {
    let toApply = this.getRollValue(roll);

    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }

    const targets = this.getTargets(targetType);
    // Apply damage if user is a GM.
    if (game.user.isGM || targetType === 'selected') {
      targets.forEach(token => {
        let actorData = foundry.utils.duplicate(token.actor);
        token.actor.update({
          "system.attributes.hp.value": Math.max(0, actorData.system.attributes.hp.value) + toApply,
        });
      });
    }
    // Otherwise, emit a socket so that a GM user can apply it.
    else {
      game.socket.emit('system.archmage', {
        type: 'applyDamageHealing',
        uuids: targets.map(t => t.document.uuid),
        attr: 'system.attributes.hp.value',
        operation: 'healing',
        value: toApply,
      });
    }
  }

  asTempHealth(roll, modifier = 1, targetType = 'selected') {
    let toApply = this.getRollValue(roll);
    if (game.settings.get('archmage', 'roundUpDamageApplication')) {
      toApply = Math.ceil(toApply * modifier);
    }
    else {
      toApply = Math.floor(toApply * modifier);
    }
    const targets = this.getTargets(targetType);
    // Apply damage if user is a GM.
    if (game.user.isGM || targetType === 'selected') {
      targets.forEach(token => {
        const hp = {...token.actor.system.attributes.hp};
        if (isNaN(hp.temp) || hp.temp === undefined) hp.temp = 0;
        hp.temp = Math.max(hp.temp, toApply);
        token.actor.update({
          "system.attributes.hp.temp": hp.temp,
        });
      });
    }
    // Otherwise, emit a socket so that a GM user can apply it.
    else {
      game.socket.emit('system.archmage', {
        type: 'applyDamageHealing',
        uuids: targets.map(t => t.document.uuid),
        attr: 'system.attributes.hp.temp',
        operation: 'tempHealing',
        value: toApply,
      });
    }
  }
}
