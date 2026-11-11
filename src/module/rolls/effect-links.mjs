/**
 * Semantic HTML transformations for chat-card effect references.
 *
 * Each helper takes HTML in and returns HTML out: no jQuery, no Foundry globals beyond the
 * localization and UUID lookups passed in (or the globals they fall back to). Tests parse
 * the results with querySelector and inspect attributes, never serialized markup.
 */

/**
 * Natural-language duration -> CONFIG.ARCHMAGE.effectDurationTypes key.
 * @param {string|undefined} val The captured duration text, if any.
 * @param {object} localization `localize(key)` callable, backed by game.i18n in production.
 * @returns {string} One of the DURATION keys, or "Unknown".
 */
export function durationKeyOf(val, localization = (key) => game.i18n.localize(key)) {
	if (!val) return "Unknown";
	// Lowercased on both sides: some of these are title cased UI labels.
	const localize = (key) => localization(key).toLowerCase();
	switch (val.toLowerCase()) {
		case localize("ARCHMAGE.DURATION.SaveEnds"):
		case localize("ARCHMAGE.DURATION.NormalSaveEnds"):
			return "NormalSaveEnds";
		case localize("ARCHMAGE.DURATION.HardSaveEnds"):
			return "HardSaveEnds";
		case localize("ARCHMAGE.DURATION.EasySaveEnds"):
			return "EasySaveEnds";
		case localize("ARCHMAGE.DURATION.StartOfNextTurnFull"):
		case localize("ARCHMAGE.DURATION.StartOfNextTurnFull2"):
			return "StartOfNextTurn";
		case localize("ARCHMAGE.DURATION.EndOfNextTurnFull"):
		case localize("ARCHMAGE.DURATION.EndOfNextTurnFull2"):
			return "EndOfNextTurn";
		case localize("ARCHMAGE.DURATION.StartOfNextSourceTurnFull"):
			return "StartOfNextSourceTurn";
		case localize("ARCHMAGE.DURATION.EndOfNextSourceTurnFull"):
			return "EndOfNextSourceTurn";
		default:
			return "Unknown";
	}
}

/**
 * Normalize an item name for effect links: strip a leading "R: " (repeat-power marker).
 * @param {string} name
 * @returns {string}
 */
export function normalizeItemName(name) {
	return name.replace(/^R: /, "");
}

/**
 * Build the anchor for one condition occurrence.
 * @param {object} condition CONFIG.ARCHMAGE.statusEffects entry (id, img).
 * @param {string} matched The matched text from the card, verbatim.
 * @param {string} uuid Source document UUID.
 * @param {string} duration Resolved duration key (durationKeyOf).
 * @returns {string}
 */
export function conditionLinkHtml(condition, matched, uuid, duration) {
	return `<a class="effect-link" draggable="true" data-type="condition" data-id="${condition.id}" title=""
                                         data-source="${uuid}" data-ends="${duration}">
                                         <img class="effects-icon" src="${condition.img}" />
                                         ${matched.replace(/\*/g, "")}</a>`;
}

/**
 * Build the anchor for one ongoing-damage occurrence.
 * @param {object} args
 * @param {number} args.damageValue Signed damage per turn.
 * @param {string|undefined} args.damageType Damage type, trailing space included, or undefined.
 * @param {string} args.saveEndsConfigValue Resolved duration key for the save-ends clause.
 * @param {string} args.uuid Source document UUID.
 * @param {string} args.name Item name (already normalized).
 * @param {string} [args.saveEndsLabel] Localized "(save ends)" text for the tooltip message.
 * @returns {string}
 */
export function ongoingEffectLinkHtml({ damageValue, damageType, saveEndsConfigValue, uuid, name, saveEndsLabel }) {
	let message = `${damageValue} ongoing ${damageType}damage`;
	if (saveEndsLabel !== undefined) {
		message += ` (${saveEndsLabel})`;
	}
	const img = damageValue >= 0 ? "icons/svg/degen.svg" : "icons/svg/regen.svg";
	return `<a class="effect-link" draggable="true" data-type="ongoing-damage" data-id="ongoing" title=""
                        data-value="${damageValue}" data-damage-type="${damageType}" data-ends="${saveEndsConfigValue}"
                        data-tooltip="${message}" data-source="${uuid}" data-name="${name}"><img class="effects-icon" src="${img}"/> ${message}</a>`;
}

/**
 * Replace every condition mention in the HTML with an effect-link anchor.
 * @param {string} html
 * @param {string} uuid Source document UUID.
 * @param {object} args
 * @param {Map} args.conditions CONFIG.ARCHMAGE.REGEXP.CONDITIONS: name -> [effect, regexp].
 * @param {object} [args.localization] `localize(key)` callable for duration resolution.
 * @returns {string} The transformed HTML.
 */
export function replaceConditionReferencesInHtml(html, uuid, { conditions, localization } = {}) {
	if (!conditions) conditions = globalThis.CONFIG?.ARCHMAGE?.REGEXP?.CONDITIONS;
	let result = html;
	// Each entry: localized condition word -> [status effect, matcher].
	for (const [, [condition, regexp]] of conditions) {
		const conditionInstances = Array.from(result.matchAll(regexp));
		// Order by largest index first, to avoid stepping over our own toes during replacements
		for (const match of conditionInstances.sort((a, b) => b.index - a.index)) {
			const duration = durationKeyOf(match[2], localization);
			const conditionLink = conditionLinkHtml(condition, match[0], uuid, duration);
			result = result.substring(0, match.index)
				+ conditionLink
				+ result.substring(match.index + match[0].length);
		}
	}
	return result;
}

/**
 * Replace every ongoing-damage mention in the HTML with an effect-link anchor.
 * @param {string} html
 * @param {string} uuid Source document UUID.
 * @param {object} args
 * @param {RegExp} args.ongoingRegexp CONFIG.ARCHMAGE.REGEXP.ONGOING_DAMAGE.
 * @param {string} args.itemName Item name; a leading "R: " is stripped.
 * @param {object} [args.localization] `localize(key)` callable for the save-ends label,
 *   backed by game.i18n by default.
 * @returns {string} The transformed HTML.
 */
export function replaceOngoingEffectReferencesInHtml(html, uuid, { ongoingRegexp, itemName, localization = (key) => game.i18n.localize(key) } = {}) {
	if (!ongoingRegexp) ongoingRegexp = globalThis.CONFIG?.ARCHMAGE?.REGEXP?.ONGOING_DAMAGE;
	const name = normalizeItemName(itemName);
	let result = html;
	const ongoingEffects = Array.from(result.matchAll(ongoingRegexp));
	ongoingEffects.forEach((ongoingEffect) => {
		const damageValue = Number(ongoingEffect[2]);
		// Type follows "ongoing" in group 4, or precedes it in group 5.
		let damageType = ongoingEffect[4] ?? ongoingEffect[5];
		if (damageType) damageType += " ";
		// Undefined without a save ends clause, empty for a plain "(save ends)".
		const saveEndsValue = ongoingEffect[6]?.toLowerCase();
		let saveEndsConfigValue = "NormalSaveEnds";
		if (saveEndsValue === "easy") saveEndsConfigValue = "EasySaveEnds";
		else if (saveEndsValue === "hard") saveEndsConfigValue = "HardSaveEnds";
		const saveEndsLabel = saveEndsValue !== undefined
			? localization(globalThis.CONFIG.ARCHMAGE.effectDurationTypes[saveEndsConfigValue])
			: undefined;
		const link = ongoingEffectLinkHtml({ damageValue, damageType, saveEndsConfigValue, uuid, name, saveEndsLabel });
		result = result.replace(ongoingEffect[0], link);
	});
	return result;
}

/**
 * Upgrade Foundry content-link elements for ActiveEffects into effect-link anchors. The
 * resolver turns each element's data-uuid into an effect document (fromUuidSync in
 * production); effects that do not resolve are left untouched.
 * @param {string} html
 * @param {function(string): {parent: {uuid: string}, img: string}|null} uuidResolver
 * @returns {string} The transformed HTML.
 */
export function replaceActiveEffectReferencesInHtml(html, uuidResolver) {
	// Parse in a detached document so the DOM work stays local to this function.
	const container = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstChild;
	const elements = container.querySelectorAll('.content-link[data-type="ActiveEffect"]');
	elements.forEach((element) => {
		const effect = uuidResolver(element.dataset.uuid);
		if (!effect) return;
		element.classList.add("effect-link");
		element.dataset.source = effect.parent.uuid;
		const hasImg = element.querySelector("img");
		if (!hasImg) {
			// innerText in production; textContent is equivalent for these text-only anchors
			// and works in jsdom, which does not implement layout-based innerText.
			element.innerHTML = `<img class="effects-icon" src="${effect.img}"/>${element.innerText ?? element.textContent}`;
		}
	});
	return container.innerHTML;
}
