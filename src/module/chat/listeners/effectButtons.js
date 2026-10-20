import { resetOngoingDamageMultiplier } from "../../active-effects/ongoing-damage.mjs";

/**
 * Effect buttons on chat cards: apply, save, d20 and remove, with the
 * applied state grayed out or disabled per message flags, falling back to a
 * socket message when the current user lacks permission to set the flags.
 *
 * Moved verbatim from the renderChatMessageHTML hook in archmage.js.
 *
 * @param {ChatMessage} chatMessage  The message being rendered.
 * @param {jQuery} html              The rendered message content.
 */
export function activateEffectButtons(chatMessage, html) {
	// Hook up Effect buttons
	html.find(".effect-control").on("click", async (event) => {
		const action = event.currentTarget.dataset.action;
		event.currentTarget.classList.add("grayed-out");
		// Get parent
		const parent = event.currentTarget.closest(".effect");
		const uuid = parent.dataset.uuid;
		const actor = await fromUuid(uuid);
		const effectId = parent.dataset.effectId;
		const effect = actor.effects.get(effectId);
		switch (action) {
			case "apply":
				const value = parent.dataset.value;
				// Healing always starts from 0 HP
				const base = value >= 0
					? actor.system.attributes.hp.value
					: Math.max(actor.system.attributes.hp.value, 0);
				await actor.update({ "system.attributes.hp.value": base - value });
				if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag("archmage", `effectApplied.${effectId}`, true);
				else game.socket.emit("system.archmage", { type: "condButton", msg: chatMessage.id, flg: `effectApplied.${effectId}` });
				// Ongoing damage is only multiplied on its first tick, revert to x1.
				await resetOngoingDamageMultiplier(effect);
				break;
			case "save":
				const duration = parent.dataset.save;
				const durationToDifficulty = {
					EasySaveEnds: "easy",
					NormalSaveEnds: "normal",
					HardSaveEnds: "hard"
				};
				await actor.rollSave(durationToDifficulty[duration] ?? "normal");
				if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag("archmage", `effectSaved.${effectId}`, true);
				else game.socket.emit("system.archmage", { type: "condButton", msg: chatMessage.id, flg: `effectSaved.${effectId}` });
				break;
			case "d20":
				new Roll("d20").toMessage();
				if (chatMessage.isAuthor || game.user.isGM) await chatMessage.setFlag("archmage", `effectRolled.${effectId}`, true);
				else game.socket.emit("system.archmage", { type: "condButton", msg: chatMessage.id, flg: `effectRolled.${effectId}` });
				break;
			case "remove":
				await actor.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
				if (chatMessage.isAuthor || game.user.isGM) {
					await chatMessage.setFlag("archmage", `effectRemoved.${effectId}`, true);
					// Replace grayed-out with disabled
					event.currentTarget.classList.remove("grayed-out");
					event.currentTarget.classList.add("disabled");
					event.currentTarget.setAttribute("disabled", true);
				}
				else {
					game.socket.emit("system.archmage", {
						type: "condButton",
						msg: chatMessage.id,
						flg: `effectRolled.${effectId}`,
						disable: event.currentTarget });
				}
				break;
		}
		chatMessage.render();
	});

	// Gray out and disable the effect buttons if the effect has already been applied, saved, or removed
	html.find(".effect-control").each((i, el) => {
		if (!chatMessage?.flags?.archmage) return;
		const flags = chatMessage.flags.archmage;
		const parent = el.closest(".effect");
		const effectId = parent.dataset.effectId;

		if (el.dataset.action === "apply" && flags?.effectApplied?.[effectId] == true) {
			el.classList.add("grayed-out");
		}
		else if (el.dataset.action === "save" && flags?.effectSaved?.[effectId] == true) {
			el.classList.add("grayed-out");
		}
		else if (el.dataset.action === "d20" && flags?.effectRolled?.[effectId] == true) {
			el.classList.add("grayed-out");
		}
		else if (el.dataset.action === "remove" && flags?.effectRemoved?.[effectId] == true) {
			el.classList.add("disabled");
			el.setAttribute("disabled", true);
		}
	});
}
