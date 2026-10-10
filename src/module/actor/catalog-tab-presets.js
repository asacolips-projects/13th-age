/**
 * Class-flavored catalog tab presets for the V3 sheet.
 *
 * When a character's class changes, `_preUpdate` regenerates the sheet's
 * catalog tab set (sheetDisplay.catalog.tabs) from these recipes — the same
 * update that recalculates base stats from the class. Import-free on purpose:
 * both bundles load this file (the module scripts copy it raw, the Vue bundle
 * inlines it), so it may only touch runtime globals like CONFIG and game.
 *
 * Presets are only written over a tab set this feature manages: the
 * `sheetDisplay.catalog.presetClasses` marker (a comma-joined list of the
 * detected class keys the current tabs were generated for, "" = none yet).
 * Any customization through the tab settings popover clears the marker to
 * null, and a missing or null marker means the user owns the tabs — the
 * settings popover's reset button re-applies the preset on demand.
 */

/**
 * The per-class tab recipes. `class` renders one tab filtered to the class's
 * own powers, grouped by the mode that class plays best with; casters
 * additionally split spells from features/talents. The shared byAction and
 * bySource tabs are appended for every class.
 */
const CLASS_RECIPES = {
	barbarian: [{ id: "class", label: "classPowers", groupBy: "actionType", filter: { powerSource: ["class"] } }],
	bard: [{ id: "class", label: "classPowers", groupBy: "powerUsage", filter: { powerSource: ["class"] } }],
	chaosmage: [
		{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } },
		{ id: "classFeats", label: "classFeats", groupBy: "powerType", filter: { powerSource: ["class"], powerType: ["feature", "talent", "flexible"] } }
	],
	cleric: [
		{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } },
		{ id: "classFeats", label: "classFeats", groupBy: "powerType", filter: { powerSource: ["class"], powerType: ["feature", "talent", "flexible"] } }
	],
	commander: [{ id: "class", label: "classPowers", groupBy: "powerUsage", filter: { powerSource: ["class"] } }],
	druid: [
		{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } },
		{ id: "classFeats", label: "classFeats", groupBy: "powerType", filter: { powerSource: ["class"], powerType: ["feature", "talent", "flexible"] } }
	],
	fighter: [{ id: "class", label: "classPowers", groupBy: "actionType", filter: { powerSource: ["class"] } }],
	monk: [{ id: "class", label: "maneuvers", groupBy: "actionType", filter: { powerSource: ["class"] } }],
	necromancer: [
		{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } },
		{ id: "classFeats", label: "classFeats", groupBy: "powerType", filter: { powerSource: ["class"], powerType: ["feature", "talent", "flexible"] } }
	],
	occultist: [{ id: "class", label: "classPowers", groupBy: "powerUsage", filter: { powerSource: ["class"] } }],
	paladin: [{ id: "class", label: "classPowers", groupBy: "actionType", filter: { powerSource: ["class"] } }],
	ranger: [{ id: "class", label: "classPowers", groupBy: "actionType", filter: { powerSource: ["class"] } }],
	rogue: [
		{ id: "class", label: "classPowers", groupBy: "actionType", filter: { powerSource: ["class"] } },
		{ id: "classFeats", label: "classFeats", groupBy: "powerType", filter: { powerSource: ["class"], powerType: ["feature", "talent", "flexible"] } }
	],
	sorcerer: [{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } }],
	wizard: [{ id: "spells", label: "spells", groupBy: "powerUsage", filter: { powerSource: ["class"], powerType: ["spell"] } }]
};

// The shared tail every preset ends with: powers by their action, then the
// full catalog by power source (race/item/other powers among them). Empty
// labels fall back to the derived "By {group}" names.
const SHARED_TABS = [
	{ id: "byAction", label: "", groupBy: "actionType" },
	{ id: "bySource", label: "", groupBy: "powerSource" }
];

/**
 * Display name for a detected class key.
 *
 * @param {string} classKey Class key, e.g. `fighter`.
 * @returns {string} Localized class name.
 */
function localizeClass(classKey) {
	return game.i18n.localize(CONFIG.ARCHMAGE.classList?.[classKey] ?? classKey);
}

/**
 * The label builders for the recipe label keys.
 */
const LABELS = {
	classPowers: localizeClass,
	classFeats: () => game.i18n.localize("ARCHMAGE.classFeatsTab"),
	maneuvers: () => game.i18n.localize("ARCHMAGE.maneuvers"),
	spells: () => game.i18n.localize("ARCHMAGE.spells")
};

/**
 * The catalog tab set for a character's detected classes: each class's
 * recipe tabs, then the shared action/source tabs. Multiclass characters
 * get one class tab per class — colliding ids are suffixed with the class
 * key (their saved group/row orders are lost, which is fine — so are the
 * tabs), and the generic labels are prefixed with the class name.
 *
 * @param {string[]|null} matchedClasses Detected class keys, e.g.
 *   `["fighter", "wizard"]`.
 * @returns {object[]} Tab definitions in the sheetDisplay.catalog.tabs shape.
 */
export function classCatalogTabPreset(matchedClasses) {
	const classes = (matchedClasses ?? []).filter((classKey) => CLASS_RECIPES[classKey]);
	if (!classes.length) return [];
	const multi = classes.length > 1;
	const tabs = [];
	const usedIds = new Set();
	for (const classKey of classes) {
		for (const recipe of CLASS_RECIPES[classKey]) {
			const id = usedIds.has(recipe.id) ? `${recipe.id}-${classKey}` : recipe.id;
			usedIds.add(id);
			const base = LABELS[recipe.label](classKey);
			const label = multi && recipe.label !== "classPowers" ? `${localizeClass(classKey)} ${base}` : base;
			tabs.push({ id, label, groupBy: recipe.groupBy, sortBy: "custom", filter: foundry.utils.duplicate(recipe.filter) });
		}
	}
	for (const { id, label, groupBy } of SHARED_TABS) {
		if (!usedIds.has(id)) tabs.push({ id, label, groupBy, sortBy: "custom" });
	}
	return tabs;
}

/**
 * Ride a class-change update (the `_preUpdate` branch that also recalculates
 * base stats) with a regenerated tab preset. Only manages the tab set while
 * it is still preset-generated: the stored marker must be a string, and it
 * must name a different class list than the new one.
 *
 * The whole sheetDisplay flag is rewritten (copied from the actor's current
 * flags with only the catalog's tabs and marker swapped) so the update
 * carries complete data no matter how Foundry expands it.
 *
 * @param {object} data The pending update data, mutated in place.
 * @param {object} actor The actor document being updated.
 * @param {string[]} matchedClasses The newly detected class keys.
 * @returns {undefined}
 */
export function applyClassCatalogTabs(data, actor, matchedClasses) {
	const catalog = actor?.flags?.archmage?.sheetDisplay?.catalog;
	if (typeof catalog?.presetClasses !== "string") return;
	const key = matchedClasses.join(",");
	if (catalog.presetClasses === key) return;
	const sheetDisplay = foundry.utils.duplicate(actor.flags.archmage.sheetDisplay ?? {});
	sheetDisplay.catalog = {
		...sheetDisplay.catalog,
		tabs: classCatalogTabPreset(matchedClasses),
		presetClasses: key
	};
	data.flags ??= {};
	data.flags.archmage ??= {};
	data.flags.archmage.sheetDisplay = sheetDisplay;
}
