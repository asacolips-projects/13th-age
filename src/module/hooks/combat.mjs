export async function combatTurn(combat, context, options) {
    console.log("Combat Turn", combat, context, options);

    // If the direction is negative, ignore the turn
    if (options.direction < 0) return;

    await handleTurnEffects("Start", combat, combat.nextCombatant, context, options);
    await handleTurnEffects("End", combat, combat.combatant, context, options);
}

export async function handleTurnEffects(prefix, combat, combatant, context, options) {
    const saveEndsEffects = ["EasySaveEnds", "NormalSaveEnds", "HardSaveEnds"];
    console.log(`Handling ${prefix} of Turn for combatant`, combatant.name, combatant);

    const hasImplacable = combatant.actor.flags.archmage?.implacable ?? false;
    const currentCombatantEffectData = {
        selfEnded: [],
        savesEnds: [],
        selfTriggered: [],
        otherEnded: []
    };
    let effectsToDelete = [];

    for (const effect of combatant.actor.effects) {
        const duration = effect.flags.archmage?.duration;
        if (duration === `${prefix}OfNextTurn`) {
            console.log(`${prefix}OfNextTurn effect found`, effect);
            currentCombatantEffectData.selfEnded.push(effect);
            effectsToDelete.push(effect.id);
        } else if (saveEndsEffects.includes(duration) &&
                (prefix == "End" || (prefix == "Start" && hasImplacable))) {
            console.log("SaveEnds effect found", effect);
            const isOngoing = effect.flags.archmage?.ongoingDamage != 0;
            effect.isOngoing = isOngoing;
            currentCombatantEffectData.savesEnds.push(effect);
        } else if (duration === `${prefix}OfEachTurn`) {
            currentCombatantEffectData.selfTriggered.push(effect);
        }
    }
    // Auto-delete AEs
    await combatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);

    // For each other combatant, check if their EndOfNextSourceTurn effects reference this combatant's actor as the source
    for (const otherCombatant of combat.combatants) {
        effectsToDelete = [];
        for (const effect of otherCombatant.actor.effects) {
            const duration = effect.flags.archmage?.duration;
            if (duration === `${prefix}OfNextSourceTurn` && effect.origin === combatant.actor.uuid) {
                console.log(`${prefix}OfNextSourceTurn effect found`, effect);
                effect.otherName = otherCombatant.actor.name;
                currentCombatantEffectData.otherEnded.push(effect);
                effectsToDelete.push(effect.id);
            }
        }
        // Auto-delete AEs
        await otherCombatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
    }

    console.log("Current Combatant Effect Data", currentCombatantEffectData);
    await renderOngoingEffectsCard(`${prefix} of Turn Effects`, combatant, currentCombatantEffectData);
}

export async function combatRound(combat, context, options) {
    await combatTurn(combat, context, options);
}

export async function preDeleteCombat(combat, context, options) {
    const saveEndsEffects = ["EasySaveEnds", "NormalSaveEnds", "HardSaveEnds"];

    // Remove all battle effects
    for (const combatant of combat.combatants) {
        let effectsToDelete = [];

        if (combatant.token.isLinked) {
            // Probably player-facing, create end-of-combat chat card
            const currentCombatantEffectData = {
                selfEnded: [],
                savesEnds: [],
                selfTriggered: [],
                otherEnded: []
            };

            for (const effect of combatant.actor.effects) {
                const duration = effect.flags.archmage?.duration;
                // If duration is "Infinite", skip
                if (duration === "Infinite") continue;
                // If it's a save-ends effect store it as such
                else if (saveEndsEffects.includes(duration)) {
                    const isOngoing = effect.flags.archmage?.ongoingDamage != 0;
                    effect.isOngoing = isOngoing;
                    currentCombatantEffectData.savesEnds.push(effect);
                }
                // Everything else should end with the battle
                else {
                    currentCombatantEffectData.selfEnded.push(effect);
                    effectsToDelete.push(effect.id);
                }
            }

            // Render card
            await renderOngoingEffectsCard("End of Battle Effects", combatant, currentCombatantEffectData);

        } else {
            // Probably random monster, just delete silently
            for (const effect of combatant.actor.effects) {
                // If duration is "Infinite", skip
                if (effect.flags.archmage?.duration === "Infinite") continue;
                // Everything else should end with the battle
                else effectsToDelete.push(effect.id);
            }
        }

        // Auto-delete AEs
        await combatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
    }
}

/* -------------------------------------------- */

function saveEndsNameToTarget(saveEnds) {
    let target = 11;
    if (saveEnds === "EasySaveEnds") {
        target = 6;
    } else if (saveEnds === "NormalSaveEnds") {
        target = 11;
    } else if (saveEnds === "HardSaveEnds") {
        target = 16;
    }
    return target;
}

/* -------------------------------------------- */

async function renderOngoingEffectsCard(title, combatant, effectData) {
    // If no effects, return
    if (effectData.selfEnded.length === 0
        && effectData.savesEnds.length === 0
        && effectData.selfTriggered.length === 0
        && effectData.otherEnded.length === 0) return;

    const template = "systems/archmage/templates/chat/ongoing-effects-card.html";
    const renderData = {
        title: title,
        combatant: combatant,
        selfEnded: effectData.selfEnded,
        hasSelfEnded: effectData.selfEnded.length > 0,
        saveEnds: effectData.savesEnds,
        hasSaveEnds: effectData.savesEnds.length > 0,
        selfTriggered: effectData.selfTriggered,
        hasSelfTriggered: effectData.selfTriggered.length > 0,
        otherEnded: effectData.otherEnded,
        hasOtherEnded: effectData.otherEnded.length > 0
    };
    console.log("Render Data", renderData);
    const html = await renderTemplate(template, renderData);

    // Create a chat card
    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({actor: combatant.actor}),
        content: html
    };
    ChatMessage.create(chatData, {});
}
