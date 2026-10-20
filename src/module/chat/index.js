import FlexibleAttacks from "../rolls/FlexibleAttacks.mjs";
import { activateRollListeners } from "./listeners/inlineRolls.js";
import { activateEffectButtons } from "./listeners/effectButtons.js";

/**
 * Register the chat message rendering hook.
 *
 * The hook wires up everything a rendered chat card can do: flexible attack
 * rows, inline roll behavior and their damage application context menu, and
 * the effect buttons.
 *
 * Formerly a ~300 line hook body in archmage.js, split into one listener
 * module per concern.
 */
export function registerChatMessageHooks() {
	Hooks.on("renderChatMessageHTML", (chatMessage, rawhtml, options) => {
		// Cheap pre-check: most messages have nothing this hook interacts
		// with. False positives (content that merely mentions one of the
		// markers) are harmless and fall through to the listeners.
		if (!(rawhtml.includes("inline-roll") || rawhtml.includes("dice-roll")
			|| rawhtml.includes("effect-control") || rawhtml.includes("flexible-attack"))) return;

		const html = $(rawhtml);

		// Flexible attack rows on an attack's card.
		FlexibleAttacks.activateListeners(chatMessage, html);

		// Inline roll re-classing, context menus and click behavior.
		activateRollListeners(chatMessage, html, options);

		// Effect buttons (apply / save / d20 / remove).
		activateEffectButtons(chatMessage, html);
	});
}
