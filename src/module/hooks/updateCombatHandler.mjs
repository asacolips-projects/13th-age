import {ArchmageUtility} from "../setup/utility-classes.js";

export default class updateCombatHandler {
  static async handle(combat, data) {
    // Handle non-gm users.
    if ( combat.current === undefined ) {
      combat = game.combat;
    }

    updateCombatHandler.updateEscalationDie(combat);
    await updateCombatHandler.handleStartOfTurn(combat, data);
  }

  static async handlePre(combat, data) {
    // Handle non-gm users.
    if ( combat.current === undefined ) {
      combat = game.combat;
    }

    await updateCombatHandler.handleEndOfTurn(combat, data);
  }

  // Update the escalation die tracker. Character values for the escalation die
  // are updated in their prepareData() and getRollData() functions.
  static updateEscalationDie(combat) {
    if (combat.current.round !== combat.previous.round) {
      let escalation = ArchmageUtility.getEscalation(combat);

      // Update the escalation die tracker.
      let $escalationDiv = $('.archmage-escalation');
      $escalationDiv.attr('data-value', escalation);
      $escalationDiv.removeClass('hide');
      $escalationDiv.find('.ed-number').text(escalation);
    }
  }

  static getExternalExpiredEffects(combat, currentCombatant, combatantEffects, lastsUntil) {
    // Grab all external active effects that expire at the start of the combatant's turn.
    let expiredEffects = combatantEffects.filter(e => e.data.flags.archmage?.lastsUntil === lastsUntil + "NextTurn");
    for ( const combatant of combat.combatants ) {
      if ( combatant.data.actorId == currentCombatant.data.actorId ) continue;
      const actor = game.actors.get(combatant.data.actorId);
      const originEffectsToExpire =
        actor.data.effects.filter(x => x.data.origin && x.data.origin == currentCombatant.data.actorId &&
          x.data.flags.archmage?.lastsUntil === lastsUntil + "NextSourceTurn");
      originEffectsToExpire.map(x => x.actorLink = `@Actor[${actor.id}]{${actor.data.name}}`);
      expiredEffects = expiredEffects.concat(originEffectsToExpire);
    }
    return expiredEffects;
  }

  /**
   * Grab the current combatant and process their current active effects.
   * 1) Show a list of current active effects impacting the combatant.
   * 2) Automatically end any effects on other Actors that expire at the start of the combatant's turn.
   * @param combat
   * @param data
   * @returns {Promise<void>}
   */
  static async handleStartOfTurn(combat, data) {

    // Grab the current combatant.
    const currentCombatant = canvas.scene.tokens.get(combat.current.tokenId);

    // Grab the current combatant's active effects.
    const combatantEffects = Array.from(currentCombatant._actor.data.effects)
      .filter(e => e.data.changes.find(c => c.key === "data.ongoingDamage")?.value == 0);

    // Grab all active effects that expire at the start of the combatant's turn.
    let expiredEffects = updateCombatHandler.getExternalExpiredEffects(combat, currentCombatant, combatantEffects, "startOf");

    // If we have no effects, return.
    if ( expiredEffects.length == 0 && combatantEffects.length == 0 ) return;

    // Assign reasons for each expired effect.
    expiredEffects.map(e => e.reason = "Reason: " +
      game.i18n.localize(CONFIG.ARCHMAGE.effectDurationChoices[e.data.flags.archmage.lastsUntil]));

    // Render handlebars template with effects.
    const templateData = {
      title: `@Actor[${currentCombatant.data.actorId}]{${currentCombatant.data.name}} - Start of Turn`,
      showActive: combatantEffects.length > 0,
      combatantEffects: combatantEffects,
      expiredEffects: expiredEffects,
      hasExpiredEffects: expiredEffects.length > 0,
      hasSaveEnds: false
    };
    const template = await renderTemplate('systems/archmage/templates/chat/combat-effects-card.html', templateData);
    ChatMessage.create({content: template}, {displaySheet: false});
  }

  /**
   * Grab the current combatant and process their current active effects.
   * 1) Show a list of current active effects impacting the combatant.
   * 2) Automatically end any effects on other Actors that expire at the start of the combatant's turn.
   * @param combat
   * @param data
   * @returns {Promise<void>}
   */
  static async handleEndOfTurn(combat, data) {

    // Grab the current combatant.
    const currentCombatant = canvas.scene.tokens.get(combat.current.tokenId);

    // Grab the current combatant's active effects.
    const combatantEffects = Array.from(currentCombatant._actor.data.effects);

    // Grab all external active effects that expire at the start of the combatant's turn.
    let expiredEffects = updateCombatHandler.getExternalExpiredEffects(combat, currentCombatant, combatantEffects, "endOf");

    let saveEndEffects = combatantEffects.filter(e => e.data.flags.archmage?.lastsUntil === "saveEnds");
    saveEndEffects.map(e => {
      e.reason = "Reason: " + game.i18n.localize(CONFIG.ARCHMAGE.effectDurationChoices[e.data.flags.archmage.lastsUntil]);
      e.save = e.data.flags.archmage?.save;
      const ongoing = e.data.changes.find(c => c.key === "data.ongoingDamage");
      const ongoingDamageType = e.data.flags.archmage?.ongoingDamageType;
      e.hasDamage = ongoing?.value > 0;
      e.damageString = `[[${ongoing?.value}]] ${ongoingDamageType ? ongoingDamageType + " " : ""}damage`;
    });

    // If we have no effects, return.
    if ( expiredEffects.length == 0 && saveEndEffects.length == 0 ) return;

    // Assign reasons for each expired effect.
    expiredEffects.map(e => e.reason = "Reason: " +
      game.i18n.localize(CONFIG.ARCHMAGE.effectDurationChoices[e.data.flags.archmage.lastsUntil]));

    // Render handlebars template with effects.
    const templateData = {
      title: `@Actor[${currentCombatant.data.actorId}]{${currentCombatant.data.name}} - End of Turn`,
      showActive: false,
      expiredEffects: expiredEffects,
      hasExpiredEffects: expiredEffects.length > 0,
      hasSaveEnds: saveEndEffects.length > 0,
      saveEndEffects: saveEndEffects
    };
    console.dir(templateData);
    const template = await renderTemplate('systems/archmage/templates/chat/combat-effects-card.html', templateData);
    ChatMessage.create({content: template}, {displaySheet: false});
  }
}
