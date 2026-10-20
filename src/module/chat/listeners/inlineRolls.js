import { ContextMenu2 } from "../../setup/contextMenu2.js";
import { buildRollMenuItems } from "./rollContextMenu.js";

/**
 * Inline roll behavior for rendered chat cards: re-class the Foundry default
 * roll markup, give each roll a stable identity, bind the damage application
 * context menu to it, and handle clicks to expand, collapse or execute the
 * rolls.
 *
 * Moved verbatim from the renderChatMessageHTML hook in archmage.js.
 *
 * @param {ChatMessage} chatMessage  The message being rendered.
 * @param {jQuery} html              The rendered message content.
 * @param {object} options           The renderChatMessageHTML options.
 */
export function activateRollListeners(chatMessage, html, options) {
	// Override the inline roll click behavior.
	html.find("a.inline-roll").addClass("inline-roll--archmage")
		.removeClass("inline-roll");
	html.find(".dice-roll").addClass("dice-roll--archmage");
	html.find(".inline-roll--archmage, .dice-roll--archmage").each(function () {
		var uuid = crypto.randomUUID();
		// Add a way to uniquely identify this roll
		$(this)[0].dataset.uuid = uuid;
		$(this).off("contextmenu");

		const triggerTarget = `${game.i18n.localize("ARCHMAGE.CHAT.target")}:`;
		const triggerCastPower = `${game.i18n.localize("ARCHMAGE.CHAT.castPower")}:`;
		if ($(this).parent()[0].innerText.includes(triggerTarget)
			&& !$(this).parent()[0].innerText.includes(triggerCastPower)) {
			// Ignore if this is a "Target:" line (but not if its "Cast for Power:",
			// which in some localizations contains "Target:").
			return;
		}

		const triggerAttack = `${game.i18n.localize("ARCHMAGE.attack")}:`;
		let isAttack = false;
		if ($(this).parent()[0].innerText.includes(triggerAttack)) {
			// Ignore if this is a "Attack:" line.
			// return;
			isAttack = true;
		}

		/**
		 * Get the roll element: the element itself if it is an inline roll, otherwise its dice total.
		 * @param {jQuery} element  The element the context menu was opened on.
		 * @returns {jQuery} The roll element.
		 */
		function getRollFromElement(element) {
			return element.hasClass("inline-roll--archmage")
				? element
				: element.find(".dice-total");
		}

		// Build the list of menu items, with the target buttons, damage
		// modifiers and application actions for non-attack rows.
		const menuItems = buildRollMenuItems({ isAttack, getRollFromElement, options });

		// Bind the context menu to the event.
		new ContextMenu2($(this).parent(), `[data-uuid=${uuid}]`, menuItems);
	});

	html.find("a.inline-roll--archmage").on("click", async (event) => {
		event.preventDefault();
		const a = event.currentTarget;

		// For inline results expand or collapse the roll details
		if (a.classList.contains("inline-result")) {
			const roll = Roll.fromJSON(unescape(a.dataset.roll));
			// Build a die string of the die parts, including whether they're discarded.
			const dieTotal = roll.terms.reduce((string, r) => {
				if (typeof string == "object") {
					string = "";
				}

				if (r.results) {
					string = `${string}${r.results.map((d) => `<span class="${d.discarded || d.rerolled ? "die die--discarded" : "die"}">${d.result}</span>`).join("+")}`;
				}
				else {
					string = `${string}<span class="mod">${r.number ?? r.operator}</span>`;
				}

				return string;
			}, {});

			// Replace the html.
			const tooltip = a.classList.contains("expanded") ? roll.total : `${dieTotal} = ${roll._total}`;
			a.innerHTML = `<i class="fas fa-dice-d20"></i> ${tooltip}`;
			a.classList.toggle("expanded");
		}

		// Otherwise execute the deferred roll
		else {
			const cls = CONFIG.ChatMessage.documentClass;

			// Get the "speaker" for the inline roll
			const actor = cls.getSpeakerActor(cls.getSpeaker());
			const rollData = actor ? actor.getRollData() : {};

			// Execute the roll
			const roll = await new Roll(a.dataset.formula, rollData).roll();
			var message = roll.toMessage({ flavor: a.dataset.flavor }, { messageMode: a.dataset.mode });
			$(".message").off("contextmenu");
			return message;
		}

	});
}
