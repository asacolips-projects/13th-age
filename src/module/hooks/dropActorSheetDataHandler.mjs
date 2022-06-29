export default class dropActorSheetDataHandler {
  static handle(actor, sheet, data) {
    const actorId = data.actorId;
    const sourceActor = game.actors.get(actorId);

    function _enhanceData(effect) {
      if ( !game.combat ) return;

      effect.duration = {
        combat: game.combat.id,
        startRound: game.combat.round,
        startTurn: game.combat.turns.indexOf(c => c.actorId === actorId)
      }

      effect.flags = {
        archmage: {
          lastsUntil: data.lastsUntil ?? CONFIG.ARCHMAGE.effectDurationChoices.unset,
          save: data.save ?? 11
        }
      }

      effect.origin = actorId;

      if ( effect.duration.startTurn === -1 ) effect.duration.startTurn = game.combat.turn;
    }

    if ( data.type === "condition" ) {
      let statusEffect = foundry.utils.duplicate(CONFIG.statusEffects.find(x => x.id === data.id));
      _enhanceData(statusEffect);

      // If we have a Token, just toggle the effect
      const token = canvas.scene.tokens.find(t => t.data.actorId === actor.id);
      if ( token ) return token._object.toggleEffect(statusEffect);

      // Otherwise, create the AE
      statusEffect.label = game.i18n.localize(statusEffect.label);
      return actor.createEmbeddedDocuments("ActiveEffect", [statusEffect]);
    }
    else if ( data.type === "effect" ) {
      const effect = sourceActor.effects.get(data.id);
      let effectData = foundry.utils.duplicate(effect);
      _enhanceData(effectData);
      return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
  }
}
