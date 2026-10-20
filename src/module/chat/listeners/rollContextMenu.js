import { DamageApplicator } from "../../setup/damageApplicator.js";

/**
 * Build the context menu items for one inline roll or dice total on a chat
 * card: the target buttons, the damage modifiers, the damage / healing /
 * temp HP application actions, and the reroll action.
 *
 * The menu's transient state (which target type and damage modifier are
 * selected) lives in a closure object instead of the dataset of the shared
 * #context-menu2 element, so each menu starts fresh and no state leaks
 * between menus.
 *
 * @param {object} args
 * @param {boolean} args.isAttack       Whether the roll sits on an attack
 *   row: attacks get no damage application, only the reroll action.
 * @param {Function} args.getRollFromElement  Resolves the roll element the
 *   damage actions apply to.
 * @param {object} args.options         The renderChatMessageHTML options.
 * @returns {object[]} The menu items for ContextMenu2.
 */
export function buildRollMenuItems({ isAttack, getRollFromElement, options }) {
	// Determine if applying damage to targets is allowed.
	const allowTargeting = game.settings.get("archmage", "allowTargetDamageApplication");
	let targetType = game.settings.get("archmage", "userTargetDamageApplicationType");
	if (!allowTargeting && targetType !== "selected") {
		game.settings.set("archmage", "userTargetDamageApplicationType", "selected");
		targetType = "selected";
	}

	// This menu's transient state. The target type defaults to the user's
	// setting; the modifier resets to 1x for every menu.
	const menuState = { targetType, mod: 1 };

	// Build the list of menu items, starting with the target buttons
	// if allowed.
	let menuItems = [];
	if (allowTargeting && !isAttack) {
		menuItems.push({
			name: `
          <div class="damage-target flex flexrow">
            <button type="button" data-target="targeted"><i class="fa-solid fa-bullseye"></i> ${game.i18n.localize("ARCHMAGE.UI.targeted")}</button>
            <button type="button" data-target="selected"><i class="fa-solid fa-expand"></i> ${game.i18n.localize("ARCHMAGE.UI.selected")}</button>
          </div>`,
			id: "targets",
			icon: "",
			preventClose: true,
			callback: (inlineRoll, event) => {
				const button = event?.target ?? event?.currentTarget;
				if (button?.dataset?.target) {
					// Deactivate the other target type.
					const activeButtons = $("#context-menu2").find("button[data-target].active");
					activeButtons.removeClass("active");
					// Toggle the active button, remember the choice, and
					// update the user setting.
					button.classList.add("active");
					menuState.targetType = button.dataset.target;
					game.settings.set("archmage", "userTargetDamageApplicationType", button.dataset.target);
				}
			}
		});
	}

	// Add all of the damage/healing options.
	if (!isAttack) {
		// Add damage multipliers.
		menuItems.push({
			name: `
          <div class="damage-modifiers flex flexrow">
            <button class="damage-modifier" type="button" data-mod="0.25">&frac14;x</button>
            <button class="damage-modifier" type="button" data-mod="0.5">&frac12;x</button>
            <button class="damage-modifier active" type="button" data-mod="1" class="active">1x</button>
            <button class="damage-modifier" type="button" data-mod="1.5">1.5x</button>
            <button class="damage-modifier" type="button" data-mod="2">2x</button>
            <button class="damage-modifier" type="button" data-mod="3">3x</button>
            <button class="damage-modifier" type="button" data-mod="4">4x</button>
          </div>`,
			id: "modifiers",
			icon: "",
			preventClose: true,
			callback: (inlineRoll, event) => {
				const button = event?.target ?? event?.currentTarget;
				if (button?.dataset?.mod) {
					// Deactivate the other modifiers.
					const activeButtons = $("#context-menu2").find("button[data-mod].active");
					activeButtons.removeClass("active");
					// Toggle the active button and remember the choice.
					button.classList.add("active");
					menuState.mod = Number(button.dataset.mod);
				}
			}
		});

		// Add damage application links.
		menuItems.push(
			{
				name: game.i18n.localize("ARCHMAGE.contextApplyDamage"),
				id: "damage",
				icon: '<i class="fas fa-tint"></i>',
				callback: (inlineRoll, event) => {
					const roll = getRollFromElement(inlineRoll);
					new DamageApplicator().asDamage(roll, menuState.mod, menuState.targetType);
				}
			},
			{
				name: game.i18n.localize("ARCHMAGE.contextApplyHealing"),
				id: "healing",
				icon: '<i class="fas fa-medkit"></i>',
				callback: (inlineRoll, event) => {
					const roll = getRollFromElement(inlineRoll);
					new DamageApplicator().asHealing(roll, menuState.mod, menuState.targetType);
				}
			},
			{
				name: game.i18n.localize("ARCHMAGE.contextApplyTempHealth"),
				id: "temp-healing",
				icon: '<i class="fas fa-heart"></i>',
				callback: (inlineRoll, event) => {
					const roll = getRollFromElement(inlineRoll);
					new DamageApplicator().asTempHealth(roll, menuState.mod, menuState.targetType);
				}
			}
		);
	}

	// Add the reroll action regardless of whether or not this is an attack.
	const allowRerolls = game.settings.get("archmage", "allowRerolls") ?? false;
	const messageAuthor = options.message?.author ?? options.message?.user;
	if (game.user.isGM || (allowRerolls && messageAuthor === game.user.id)) {
		menuItems.push({
			name: game.i18n.localize("ARCHMAGE.contextReroll"),
			id: "reroll",
			icon: '<i class="fas fa-rotate-left"></i>',
			callback: (html, event) => {
				DamageApplicator.rerollDice(html);
			}
		});
	}

	return menuItems;
}
