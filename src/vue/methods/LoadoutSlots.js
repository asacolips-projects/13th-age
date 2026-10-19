import { attunementCost, characterTierIndex, filterFeats, isSecondEdition, orderedRows, TIERS as TIER_SLOTS, TIER_ORDER, byName, byTier } from "@/methods/Helpers";

/**
 * The loadout tab's slot bookkeeping: the pure rules that turn a character's
 * items and tracker config into the two inventories' slot tracks. Kept out
 * of the tab component so the feat-slot cascade can be reasoned about (and
 * unit-tested) on its own.
 */

/**
 * One section's tracker config from its display flag: the enable checkbox
 * (default on) and the extra-slot grants. The feats section's bonuses are
 * keyed per tier letter; the magic item track stays a single number.
 *
 * @param {string} key The section key, 'equipment' or 'feats'.
 * @param {object} raw The section's stored flag value, if any.
 *
 * @returns {object} The parsed config.
 */
export function loadoutConfig(key, raw = {}) {
	if (key === "feats") {
		return {
			enabled: raw.enabled !== false,
			resourceful: raw.resourceful === true,
			prodigiousLearner: raw.prodigiousLearner === true,
			extraSlots: {
				A: Math.max(Math.trunc(Number(raw.extraSlots?.A)) || 0, 0),
				C: Math.max(Math.trunc(Number(raw.extraSlots?.C)) || 0, 0),
				E: Math.max(Math.trunc(Number(raw.extraSlots?.E)) || 0, 0),
				Z: Math.max(Math.trunc(Number(raw.extraSlots?.Z)) || 0, 0)
			}
		};
	}
	return {
		enabled: raw.enabled !== false,
		extraSlots: Math.max(Number(raw.extraSlots) || 0, 0)
	};
}

/**
 * Slot bookkeeping for one track: filled pips up to the allowance, alert
 * triangles past it, hollow pips for what's left. A disabled config hides
 * the track; edit mode reveals it so the config pair always has its target
 * on screen.
 *
 * @param {string} key The track's key.
 * @param {number} consumed Slots the section's items consume.
 * @param {number} slots The track's allowance.
 * @param {object} config The section's parsed config.
 * @param {boolean} editing Whether the sheet is in edit mode.
 *
 * @returns {object} The track, for the header's pip strip.
 */
const slotTrack = (key, consumed, slots, config, editing) => ({
	key,
	filled: Math.min(consumed, slots),
	overflow: Array(Math.max(consumed - slots, 0)).fill(null),
	free: Math.max(slots - consumed, 0),
	shown: config.enabled !== false && (slots > 0 || consumed > 0 || editing)
});

/**
 * The loadout's two inventories with their slot tracks: magic items and
 * feats. Equipment whose tier is unset (the item sheet's none option) isn't
 * a magic item and lives on the catalog tab. Feats with no text are
 * skipped, matching the power sheet's read view.
 *
 * The feat cascade: each level grants a slot in its tier's track — one per
 * level 1-4 for A, 5-7 for C, 8-10 for E — plus the single Z slot at 10th
 * in second edition. A tier's own feats fill its slots first; past that,
 * feats spend the next
 * tier up, and the borrowed pips wear the down-arrow. Whatever the cascade
 * can't place alerts on its own tier's track — which is why a track also
 * shows when it has overflow.
 *
 * @param {object} parts
 * @param {object} parts.actor The sheet's actor data.
 * @param {boolean} parts.editing Whether the sheet is in edit mode.
 * @param {object} parts.configs The parsed tracker configs, keyed by
 *   section key (see loadoutConfig).
 * @param {Array} parts.rowOrder The tab's saved row order.
 *
 * @returns {Array} The two sections, members and tracks included.
 */
export function loadoutSections({ actor, editing, configs, rowOrder }) {
	const items = actor?.items ?? [];
	const level = Number(actor?.system?.attributes?.level?.value) || 0;
	const charTier = characterTierIndex(level);

	// First edition has no iconic/zenith tier — the config doesn't offer Z
	// feats, so the track would be a permanently hollow pip at 10th level.
	// Second edition's cap notes ride on the tier entries themselves.
	const tiers = isSecondEdition() ? TIER_SLOTS : TIER_SLOTS.filter((tier) => tier.key !== "iconic");

	// The feat and magic item incremental advances each add a bonus slot: one
	// more magic item, and one feat slot in the tier of the PC's next level.
	const incrementals = actor?.system?.incrementals ?? {};

	// Tier first, then name; the stable sort needs the minor key applied first.
	const magicItems = items
		.filter((i) => i.type === "equipment" && TIER_ORDER[i.system?.tier] !== undefined)
		.sort(byName)
		.sort(byTier);
	const powers = items.filter((i) => i.type === "power").sort(byName);

	// Magic item slots: the level total plus the section's extra slots, no
	// tier split. Only attuned items — the ones with their active pip filled —
	// consume slots, and each higher-tier attunement burns two.
	const itemsConfig = configs.equipment;
	const itemsConsumed = magicItems.reduce(
		(sum, item) => sum + (item.system.isActive ? attunementCost(item, charTier) : 0), 0);
	const itemAllowance = level + itemsConfig.extraSlots + (incrementals.extraMagicItem === true ? 1 : 0);

	// The feats a tier's track counts: the tier's taken feats with text.
	const takenFeatsForTier = (tier) => powers.flatMap((power) =>
		Object.values(filterFeats(power.system?.feats))
			.filter((feat) => feat.tier?.value === tier.key && feat.isActive.value));

	const takenByTier = new Map(tiers.map((tier) =>
		[tier.key, takenFeatsForTier(tier).length]));

	// Feats still unplaced, by origin tier letter.
	let spill = [];
	const featsConfig = configs.feats;
	// The feat incremental's bonus slot belongs to the tier of the PC's next
	// level — a 4th-level PC's lands on C — clamped at 10th since the tiers
	// run out there. It's a bonus, so it rides past the tier cap.
	const featIncrementalTier = tiers[characterTierIndex(Math.min(level + 1, 10))].key;
	const featIncrementalSlot = incrementals.feat === true ? 1 : 0;

	// Prodigious Learner's bonus feats: three adventurer-tier at 1st; from
	// 5th level one of them is replaced by a champion-tier feat, and from 8th
	// another by an epic-tier one.
	const prodigiousGrants = !featsConfig.prodigiousLearner ? {} : level >= 8
		? { A: 1, C: 1, E: 1 }
		: level >= 5 ? { A: 2, C: 1 } : { A: 3 };

	const featTracks = tiers.map((tier) => {
		// The level's grant, capped, then the bonuses, all of which ride past
		// the cap: the tier's configured extras, the Resourceful kin power's
		// slot in the highest tier the character has reached, the Prodigious
		// Learner feats in their tiers, and the feat incremental's slot in the
		// next level's tier.
		const bonus = (featsConfig.extraSlots[tier.letter] ?? 0)
			+ (tier.key === TIER_SLOTS[charTier].key && featsConfig.resourceful ? 1 : 0)
			+ (prodigiousGrants[tier.letter] ?? 0)
			+ (tier.key === featIncrementalTier ? featIncrementalSlot : 0);
		const allowance = Math.min(Math.max(level - tier.firstSlot + 1, 0), tier.cap) + bonus;
		const own = takenByTier.get(tier.key);
		const demand = own + spill.length;
		const filled = Math.min(demand, allowance);
		const ownFilled = Math.min(own, filled);
		// Own feats place first; what they leave, the carried feats and the
		// tier's own unplaced ones spill upward, keeping their letters.
		spill = spill.slice(filled - ownFilled).concat(Array(own - ownFilled).fill(tier.letter));
		return {
			key: tier.key,
			letter: tier.letter,
			filled: ownFilled,
			borrowed: filled - ownFilled,
			overflow: [],
			free: allowance - filled,
			shown: featsConfig.enabled !== false && (allowance > 0 || filled > 0 || editing)
		};
	});
	for (const letter of spill) {
		const track = featTracks.find((track) => track.letter === letter);
		if (track) {
			track.overflow.push(letter);
			// Overflow only forces an otherwise-hidden track out when the section
			// is enabled; a disabled tracker stays dark.
			if (featsConfig.enabled !== false) track.shown = true;
		}
	}

	// The section's rows: every power with feats, in the saved row order
	// falling back to name order, its feats rendered beneath it by the read
	// view's feat rows.
	const featPowers = powers
		.filter((power) => Object.keys(filterFeats(power.system?.feats)).length);

	return [
		{
			key: "equipment",
			kind: "equipment",
			labelKey: "ARCHMAGE.INVENTORY.equipment",
			members: orderedRows(magicItems, rowOrder),
			config: itemsConfig,
			tracks: [slotTrack("items", itemsConsumed, itemAllowance, itemsConfig, editing)]
		},
		{
			key: "feats",
			kind: "feats",
			labelKey: "ARCHMAGE.feats",
			members: orderedRows(featPowers, rowOrder),
			config: featsConfig,
			tracks: featTracks
		}
	];
}
