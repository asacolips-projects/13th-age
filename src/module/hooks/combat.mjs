import { prepareOngoingDamage } from "../active-effects/ongoing-damage.mjs";

/**
 * Run the start-of-turn lifecycle macro for the first combatant when combat starts.
 * @param {Combat} combat The combat being started.
 */
export async function combatStart(combat) {
	// Ensure the start-of-turn hook fires for the first combatant, combatTurn doesn't fire here
	const firstCombatant = combat.turns[0];
	if (firstCombatant) {
		await executeLifecycleMacro(firstCombatant, "startOfTurn");
	}
}

/**
 * Handle a combat turn change: lifecycle macros, momentum, and turn/round effect expiry.
 * @param {Combat} combat The combat being updated.
 * @param {object} context The combat update data (round and turn).
 * @param {object} options The update options (e.g. direction).
 */
export async function combatTurn(combat, context, options) {
	const endCombatant = combat.combatant;
	const startCombatant = combat.nextCombatant;

	// Execute start/end of turn macros
	await executeLifecycleMacro(endCombatant, "endOfTurn");
	await _add2eFighterMomentum(endCombatant);
	await executeLifecycleMacro(startCombatant, "startOfTurn");

	// Exit early if the feature is disabled.
	if (!game.settings.get("archmage", "enableOngoingEffectsMessages")) return;

	// If the direction is negative, ignore the turn
	if (options.direction < 0) return;

	await handleTurnEffects("End", combat, endCombatant, context, options);
	await handleTurnEffects("Start", combat, startCombatant, context, options);
	if (CONFIG.ARCHMAGE.is2e) {
		await handleStoke(combat, context, options);
	}
	await handleRoundEffects(combat, context, options);
}

/**
 * Expire and report a combatant's start/end of turn effects, including effects it is the source of.
 * @param {string} prefix Either "Start" or "End".
 * @param {Combat} combat The combat being updated.
 * @param {Combatant} combatant The combatant whose turn is starting or ending.
 * @param {object} context The combat update data (round and turn).
 * @param {object} options The update options (e.g. direction).
 */
export async function handleTurnEffects(prefix, combat, combatant, context, options) {
	// Pseudo combatants may not have an actor.
	if (!combatant?.actor) return;

	const saveEndsEffects = ["EasySaveEnds", "NormalSaveEnds", "HardSaveEnds"];
	const hasImplacable = combatant?.actor?.flags.archmage?.implacable ?? false;
	const currentCombatantEffectData = {
		selfEnded: [],
		savesEnds: [],
		selfTriggered: [],
		otherEnded: [],
		unknown: []
	};
	let effectsToDelete = [];
	let isDead = false;

	for (const effect of combatant.actor.effects) {
		if (!effect.active) continue;
		// Handle ongoing.
		prepareOngoingDamage(effect);
		// Handle durations.
		if (effect.name === game.i18n.localize("ARCHMAGE.EFFECT.StatusDead")) isDead = true;
		const duration = effect.flags.archmage?.duration || "Unknown";
		if (duration === `${prefix}OfNextTurn`) {
			// Ensure it's the *next* turn
			if (startedBefore(effect, combat)) {
				currentCombatantEffectData.selfEnded.push(effect);
				effectsToDelete.push(effect.id);
			}
		}
		else if (saveEndsEffects.includes(duration) && (prefix == "End" || (prefix == "Start" && hasImplacable))) {
			currentCombatantEffectData.savesEnds.push(effect);
		}
		else if (duration === `${prefix}OfEachTurn`) {
			currentCombatantEffectData.selfTriggered.push(effect);
		}
		else if (duration === "Unknown") {
			currentCombatantEffectData.unknown.push(effect);
		}
	}
	// Auto-delete AEs
	await combatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);

	// For each other combatant, check if their EndOfNextSourceTurn effects reference this combatant's actor as the source
	for (const otherCombatant of combat.combatants) {
		effectsToDelete = [];
		if (otherCombatant?.actor?.effects) {
			for (const effect of otherCombatant.actor.effects) {
				prepareOngoingDamage(effect);
				const duration = effect.flags.archmage?.duration || "Unknown";
				if (duration === `${prefix}OfNextSourceTurn` && effect.origin === combatant.actor.uuid) {
					// Ensure it's the *next* turn
					if (startedBefore(effect, combat)) {
						effect.otherName = otherCombatant.actor.name;
						currentCombatantEffectData.otherEnded.push(effect);
						effectsToDelete.push(effect.id);
					}
				}
			}
			// Auto-delete AEs
			await otherCombatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
		}
	}

	if (!isDead) {
		await renderOngoingEffectsCard(`${prefix} of Turn Effects`, combatant, currentCombatantEffectData);
	}
}

/**
 * Expire and report EndOfRound effects when a new round starts.
 * @param {Combat} combat The combat being updated.
 * @param {object} context The combat update data (round and turn).
 * @param {object} options The update options (e.g. direction).
 */
export async function handleRoundEffects(combat, context, options) {
	// If we have not just started a new round, skip
	if (context.turn != 0) return;
	// For each other combatant, check if any of their effects has an EndOfRound lower than the current round
	const currentCombatantEffectData = {
		selfEnded: [],
		savesEnds: [],
		selfTriggered: [],
		otherEnded: [],
		unknown: []
	};
	let effectsToDelete = [];
	for (const combatant of combat.combatants) {
		if (!combatant?.actor?.effects) continue;
		effectsToDelete = [];
		for (const effect of combatant.actor.effects) {
			const duration = effect.flags.archmage?.duration || "Unknown";
			if (duration === "EndOfRound" && effect.flags.archmage?.endRound < context.round) {
				effect.otherName = combatant.actor.name;
				currentCombatantEffectData.otherEnded.push(effect);
				effectsToDelete.push(effect.id);
			}
		}
		// Auto-delete AEs
		await combatant.actor.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
	}
	await renderOngoingEffectsCard(`End of Round ${context.round - 1} Effects`, null, currentCombatantEffectData);
}

/**
 * Handle a combat round change: expire pseudo-combatants, then process the turn change.
 * @param {Combat} combat The combat being updated.
 * @param {object} context The combat update data (round and turn).
 * @param {object} options The update options (e.g. direction).
 */
export async function combatRound(combat, context, options) {
	await expirePseudoCombatants(combat, context);
	await combatTurn(combat, context, options);
}

/**
 * Remove pseudo-combatants whose round has elapsed.
 * Only the active GM performs the deletion, both for permissions and to avoid duplicate updates.
 * @param {Combat} combat The combat being updated.
 * @param {object} context The combat update data (round and turn).
 */
export async function expirePseudoCombatants(combat, context) {
	if (game.users.activeGM?.id !== game.user.id) return;
	const expired = combat.combatants
		.filter((c) => typeof c.flags.archmage?.expireAfterRound === "number"
			&& c.flags.archmage.expireAfterRound < context.round)
		.map((c) => c.id);
	if (expired.length) await combat.deleteEmbeddedDocuments("Combatant", expired);
}

/**
 * Clean up when a combat is deleted: reset stoke, hide the escalation die and end battle effects.
 * @param {Combat} combat The combat being deleted.
 * @param {object} options The deletion options.
 * @param {string} userId The ID of the user deleting the combat.
 */
export async function preDeleteCombat(combat, options, userId) {
	await cleanupStoke(combat, options, userId);
	$(".archmage-escalation-display").addClass("hide");

	// Exit early if the feature is disabled.
	if (!game.settings.get("archmage", "enableOngoingEffectsMessages")) return;

	const saveEndsEffects = ["EasySaveEnds", "NormalSaveEnds", "HardSaveEnds"];

	// Remove all battle effects
	for (const combatant of combat.combatants) {
		// Pseudo combatants may not have an actor or a token.
		if (!combatant.actor || !combatant.token) continue;

		let effectsToDelete = [];

		if (combatant.token.isLinked) {
			// Probably player-facing, create end-of-combat chat card
			const currentCombatantEffectData = {
				selfEnded: [],
				savesEnds: [],
				selfTriggered: [],
				otherEnded: [],
				unknown: []
			};

			for (const effect of combatant.actor.effects) {
				if (!effect.active) continue;
				prepareOngoingDamage(effect);
				const duration = effect.flags.archmage?.duration || "Unknown";
				// If duration is longer than battle skip
				if (["Infinite", "EndOfArc"].includes(duration)) continue;
				// If it's a save-ends effect store it as such
				else if (saveEndsEffects.includes(duration)) {
					currentCombatantEffectData.savesEnds.push(effect);
				}
				// If it's unknown also store it as such
				else if (duration === "Unknown") {
					currentCombatantEffectData.unknown.push(effect);
				}
				// Everything else should end with the battle
				else {
					currentCombatantEffectData.selfEnded.push(effect);
					effectsToDelete.push(effect.id);
				}
			}

			// Render card
			await renderOngoingEffectsCard("End of Battle Effects", combatant, currentCombatantEffectData);

		}
		else {
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

/**
 * Raise (or lower, if its breath was used) the stoke of the NPC whose turn just ended (2e).
 * @param {Combat} combat The combat being updated.
 * @param {object} context The combat update data (round and turn).
 * @param {object} options The update options (e.g. direction).
 */
async function handleStoke(combat, context, options) {
	const endCombatant = combat.combatant;
	const { enabled, current, breathUsed } = endCombatant?.actor?.system?.resources?.spendable?.stoke ?? {};
	if (endCombatant?.actor?.type === "npc" && enabled) {
		const stokeDelta = breathUsed ? -1 : 1;
		const newCurrent = Math.max(0, (current ?? 0) + stokeDelta);
		await endCombatant.actor.update({
			"system.resources.spendable.stoke.current": newCurrent,
			"system.resources.spendable.stoke.breathUsed": false
		});
		// Show scrolling text for the update.
		endCombatant.actor._showScrollingText(stokeDelta, game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.stoke"), {}, "#1776D5");
	}
}

/**
 * Reset the stoke resource of every combatant that has it enabled.
 * @param {Combat} combat The combat being deleted.
 * @param {object} options The deletion options.
 * @param {string} userId The ID of the user deleting the combat.
 */
async function cleanupStoke(combat, options, userId) {
	for (const c of combat.combatants) {
		// If the combatant has a stoke resource, reset it
		if (c?.actor?.system?.resources?.spendable?.stoke?.enabled) {
			await c.actor.update({
				"system.resources.spendable.stoke.current": 0,
				"system.resources.spendable.stoke.breathUsed": false
			});
		}
	}
}

/* -------------------------------------------- */

/**
 * Whether an effect started before the combat's current turn, and so is due to
 * expire on it. Effects applied outside of combat record no start, and count as
 * having started before it so that they expire during the first round.
 * @param {ActiveEffect} effect  The effect to check.
 * @param {Combat} combat  The combat to check it against.
 * @returns {boolean}
 */
function startedBefore(effect, combat) {
	const round = effect.start?.round ?? -1;
	const turn = effect.start?.turn ?? -1;
	return combat.round > round || (combat.round === round && combat.turn > turn);
}

/* -------------------------------------------- */

/**
 * Render a chat card listing ended, save-ends, triggered and unknown-duration effects.
 * @param {string} title The card title.
 * @param {Combatant|null} combatant The combatant used as the chat speaker, if any.
 * @param {object} effectData Effects grouped by selfEnded, savesEnds, selfTriggered, otherEnded and unknown.
 */
async function renderOngoingEffectsCard(title, combatant, effectData) {
	// If no effects, return
	if (effectData.selfEnded.length === 0
		&& effectData.savesEnds.length === 0
		&& effectData.selfTriggered.length === 0
		&& effectData.otherEnded.length === 0
		&& effectData.unknown.length === 0) return;

	const template = "systems/archmage/templates/chat/ongoing-effects-card.html";
	const renderData = {
		title: title,
		combatant: combatant,  // Not used?
		selfEnded: effectData.selfEnded,
		hasSelfEnded: effectData.selfEnded.length > 0,
		saveEnds: effectData.savesEnds,
		hasSaveEnds: effectData.savesEnds.length > 0,
		selfTriggered: effectData.selfTriggered,
		hasSelfTriggered: effectData.selfTriggered.length > 0,
		otherEnded: effectData.otherEnded,
		hasOtherEnded: effectData.otherEnded.length > 0,
		unknown: effectData.unknown,
		hasUnknown: effectData.unknown.length > 0
	};
	const html = await foundry.applications.handlebars.renderTemplate(template, renderData);

	// Create a chat card
	const chatData = {
		user: game.user.id,
		speaker: ChatMessage.getSpeaker({ actor: combatant?.actor }),
		content: html,
		flags: { core: { canPopout: true } }
	};
	ChatMessage.create(chatData, {});
}

/**
 * Run an actor's lifecycle hook macro, or ask the owning player to run it via socket.
 * @param {Combatant} combatant The combatant whose actor owns the hook.
 * @param {string} hookName The lifecycle hook to run (e.g. "startOfTurn").
 * @returns {Promise<*>} Resolves once the hook has run or the socket request was sent.
 */
async function executeLifecycleMacro(combatant, hookName) {
	// Pseudo combatants may not have an actor.
	if (!combatant?.actor) return;

	// If this isn't the actor's player, emit a socket request for that player to execute the hook
	if (game.user?.character?.id !== combatant.actor?.id) {
		return game.socket.emit("system.archmage", {
			type: "actorLifecycleHook",
			actorId: combatant.actor.id,
			hookName
		});
	}

	const speaker = ChatMessage.implementation.getSpeaker();
	const actor = game.user.character;
	const macroData = {
		// TODO: ???
	};

	const hookBody = combatant?.actor?.system?.lifecycleHooks?.[hookName]?.trim();
	if (!hookBody) return;

	// Can't run if you can't run
	if (!game.user.hasPermission("MACRO_SCRIPT")) return;

	// Run our own function to bypass macro parameters limitations - based on Foundry's _executeScript
	const AsyncFunction = async function () {}.constructor;
	try {
		const fn = new AsyncFunction("speaker", "actor", "archmage", hookBody);
		await fn.call(this, speaker, actor, macroData);
	}
	catch(ex) {
		ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errMacroSyntax"));
		console.error(`Lifecycle hook '${combatant.actor.name}' / ${hookName} failed with: ${ex}`, ex);
	}
}

/**
 * Grant momentum to a 2e fighter at the end of their turn.
 * @param {Combatant} combatant The combatant whose turn just ended.
 */
async function _add2eFighterMomentum(combatant) {
	// Pseudo combatants may not have an actor.
	if (!combatant?.actor) return;

	// Only woks in 2e and for fighters
	if (!(game.settings.get("archmage", "secondEdition") && combatant.actor?.system?.details?.detectedClasses?.includes("fighter"))) return;

	// Update actor's resource
	if (combatant.actor?.system.resources?.perCombat?.momentum?.enabled) {
		await combatant.actor.update({ "system.resources.perCombat.momentum.current": true });
	}
}
