import Triggers from "../Triggers/Triggers.mjs";

/**
 * Flexible attacks: an attack power whose embedded macro calls the listFlexibles system macro lists, on its
 * chat card, the flexible attack powers (`powerType: flexible`) of the same actor that its roll can trigger.
 *
 * Each maneuver is added as a card row labelled with its trigger ("Natural even hit: Me Smash!") and marked
 * active, unknown or inactive with the same trigger evaluation as the rest of the card (Triggers, which
 * DamageApplicator.rerollDice also runs again on these rows). Inactive rows are hidden by CSS unless
 * "show all" is clicked. A maneuver with no uses left is always inactive. Clicking a row rolls that
 * power from the actor.
 */
export default class FlexibleAttacks {

	/**
	 * Can a flexible power be used with this kind of attack? Its range reads "Flexible melee attack",
	 * "Flexible ranged attack" or "Flexible melee or ranged attack"; one that names no known kind
	 * is allowed with any.
	 * @param {string} rangeText The flexible power's `system.range.value`.
	 * @param {string} kind "melee" or "ranged".
	 * @returns {boolean}
	 */
	static allowsKind(rangeText, kind) {
		const text = String(rangeText ?? "");
		const named = Object.entries(CONFIG.ARCHMAGE.REGEXP.FLEXIBLE_KINDS)
			.filter(([, word]) => word.test(text))
			.map(([namedKind]) => namedKind);
		return named.length === 0 || named.includes(kind);
	}

	/**
	 * The actor's flexible powers that can go with this attack.
	 * @param {Actor} actor
	 * @param {string} kind "melee" or "ranged".
	 * @returns {Item[]}
	 */
	static flexiblesFor(actor, kind) {
		return actor.items
			.filter((item) => item.system?.powerType?.value === "flexible"
				&& FlexibleAttacks.allowsKind(item.system?.range?.value, kind))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Add the maneuver rows to a chat card that has already been evaluated, and evaluate them against the
	 * attack's result. Meant for the listFlexibles system macro, which runs after preCreateChatMessageHandler.handle.
	 * The rows are appended to the card row that holds the attack row, after it.
	 * @param {string} content The rendered and evaluated card.
	 * @param {Actor} actor The actor whose flexible powers are listed.
	 * @param {string} kind The kind of the attack, "melee" or "ranged".
	 * @param {object[]} [rollOutcomes] HitEvaluation's per-roll outcomes for the attack.
	 * @returns {string} The card, with the rows when there are any to show.
	 */
	static addRows(content, actor, kind, rollOutcomes) {
		if (!actor) return content;
		const maneuvers = FlexibleAttacks.flexiblesFor(actor, kind);
		if (!maneuvers.length) return content;

		// The rows go inside the attack's own card row: DamageApplicator.rerollDice re-evaluates the trigger
		// rows of that row only, so rows placed anywhere else would keep the first roll's result.
		const attackLabel = `${game.i18n.localize("ARCHMAGE.CHAT.attack")}:`;
		const $content = $(`<div class="wrapper">${content}</div>`);
		const $attackRow = $content.find(".card-prop").filter((i, row) => $(row).text()
			.trim()
			.startsWith(attackLabel))
			.first();
		const $target = $attackRow.closest(".card-row");
		if (!$target.length) return content;

		const esc = foundry.utils.escapeHTML;
		const rows = maneuvers.map((item) => {
			const trigger = String(item.system.trigger?.value ?? "").replace(/<[^>]*>/g, "")
				.replace(/[.:\s]+$/, "")
				.trim();
			const label = trigger ? `<strong>${esc(trigger)}:</strong> ` : "";
			const pools = item.usagePools();
			const spent = pools.length > 0 && pools.every((pool) => pool.usage !== "at-will" && pool.uses <= 0);
			const note = spent ? ` <em>(${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackNoUses"))})</em>` : "";
			// A maneuver with no uses left does not apply, whatever the roll: trigger-fixed keeps
			// DamageApplicator.rerollDice from evaluating it again.
			const classes = spent ? "flexible-attack-row trigger-inactive trigger-fixed" : "flexible-attack-row";
			return `<div class="card-prop ${classes}">${label}`
				+ `<a class="flexible-attack-use" data-item-id="${esc(item.id)}"><img src="${esc(item.img)}" width="18" height="18"/> ${esc(item.name)}</a>${note}</div>`;
		});
		const heading = `<strong>${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackHeading"))}</strong> `
			+ `(<a class="flexible-attack-toggle">${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackShowAll"))}</a>)`;
		const $group = $(`<div class="flexible-attacks">${heading}${rows.join("")}</div>`);

		// The card was evaluated before these rows existed: mark them as preCreateChatMessageHandler.handle would.
		const triggers = new Triggers();
		$group.find(".flexible-attack-row:not(.trigger-fixed)").each((i, row) => {
			const $row = $(row);
			const rowLabel = Triggers.labelOf($row);
			if (!triggers.isTriggerRow(rowLabel)) return;
			const active = triggers.evaluateRow(rowLabel, rollOutcomes);
			if (active == undefined) $row.addClass("trigger-unknown");
			else if (active) {
				$row.addClass("trigger-active");
				if (rowLabel.includes(game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase())) $row.addClass("trigger-miss");
			}
			else $row.addClass("trigger-inactive");
		});

		$target.append($group);
		return $content.html();
	}

	/**
	 * Click handling for the rows of one rendered chat card.
	 * @param {ChatMessage} message
	 * @param {jQuery} $html The rendered message.
	 */
	static activateListeners(message, $html) {
		// "show all" lists the maneuvers the roll did not trigger as well, in the inactive style; they stay
		// clickable (a GM ruling, or a class feature that lets a roll trigger more than its text says).
		$html.find(".flexible-attack-toggle").on("click", (event) => {
			event.preventDefault();
			const toggle = event.currentTarget;
			const showAll = toggle.closest(".flexible-attacks").classList.toggle("flexible-attacks--all");
			toggle.textContent = game.i18n.localize(showAll ? "ARCHMAGE.CHAT.flexibleAttackShowApplicable" : "ARCHMAGE.CHAT.flexibleAttackShowAll");
		});

		$html.find(".flexible-attack-use").on("click", async (event) => {
			event.preventDefault();
			const link = event.currentTarget;
			const card = link.closest("[data-actor-uuid]");
			const group = link.closest(".flexible-attacks");
			if (!card || !group || group.classList.contains("flexible-attacks--used")) return;
			const actor = await fromUuid(card.dataset.actorUuid);
			const item = actor?.items.get(link.dataset.itemId);
			if (!item) return;
			if (!actor.isOwner) {
				ui.notifications.warn(game.i18n.format("ARCHMAGE.CHAT.flexibleAttackNotOwner", { actor: actor.name }));
				return;
			}
			// One maneuver per attack.
			const row = link.closest(".flexible-attack-row");
			group.classList.add("flexible-attacks--used");
			row.classList.add("flexible-attack-row--used");
			try {
				await item.roll();
			}
			catch(err) {
				console.error(`Archmage | Flexible attack '${item.name}' failed`, err);
				group.classList.remove("flexible-attacks--used");
				row.classList.remove("flexible-attack-row--used");
				return;
			}
			// Remember the choice. Only the message's author or a GM may update it.
			if (message.canUserModify(game.user, "update")) {
				await message.update({ content: card.outerHTML });
			}
		});
	}
}
