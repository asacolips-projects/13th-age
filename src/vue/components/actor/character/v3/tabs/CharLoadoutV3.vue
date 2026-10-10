<template>
	<section class="tab-loadout">
		<!-- Two inventories: magic items and feats. The header tracks the slots —
         filled pips consumed, hollow pips free, squared pips past the
         allowance. Tracks with no allowance and nothing consumed don't show. -->
		<section v-for="section in sections" :key="section.key" class="loadout-section">
			<h4 class="loadout-section-title unit-title" :class="{ 'config-open': openConfig === section.key }">
				<span class="section-label">{{ localize(section.labelKey) }}</span>
				<!-- Edit mode only: per-section tracker config, persisted to the
             sheetDisplay.loadout flags, tucked behind a cog. The popover's
             checkbox hides the section's tracks; the number(s) grant slots
             beyond the level's allowance -->
				<span class="track-config-menu">
					<button
						type="button"
						class="track-config-toggle"
						:class="{ open: openConfig === section.key }"
						:title="localize('ARCHMAGE.trackerSettings')"
						@click="toggleConfig(section.key)"
					>
						<i class="fas fa-gear" />
					</button>
					<div v-if="openConfig === section.key" class="track-config-popover">
						<label class="track-config-option">
							<span class="option-label">{{ localize('ARCHMAGE.enableTracker') }}</span>
							<input
								type="checkbox"
								:checked="section.config.enabled"
								@change="saveSectionFlag(section.key, 'enabled', $event.target.checked)"
							>
						</label>
						<!-- The feats tracker's bonuses: Resourceful's slot lands in the
                  character's highest tier; Prodigious Learner grants three
                  adventurer-tier feats that climb the tiers with level. Both
                  ride past the tier caps, as do the per-tier extras. -->
						<template v-if="section.kind === 'feats'">
							<label class="track-config-option" :data-tooltip="localize('ARCHMAGE.resourcefulHint')">
								<span class="option-label">{{ localize('ARCHMAGE.resourceful') }}</span>
								<input
									type="checkbox"
									:checked="section.config.resourceful"
									@change="saveSectionFlag(section.key, 'resourceful', $event.target.checked)"
								>
							</label>
							<label class="track-config-option" :data-tooltip="localize('ARCHMAGE.prodigiousLearnerHint')">
								<span class="option-label">{{ localize('ARCHMAGE.prodigiousLearner') }}</span>
								<input
									type="checkbox"
									:checked="section.config.prodigiousLearner"
									@change="saveSectionFlag(section.key, 'prodigiousLearner', $event.target.checked)"
								>
							</label>
							<label class="track-config-option">
								<span class="option-label">{{ localize('ARCHMAGE.extraASlots') }}</span>
								<input
									type="number"
									min="0"
									:value="section.config.extraSlots.A"
									@change="saveExtraSlots(section.key, 'extraSlots.A', $event)"
								>
							</label>
							<label class="track-config-option">
								<span class="option-label">{{ localize('ARCHMAGE.extraCSlots') }}</span>
								<input
									type="number"
									min="0"
									:value="section.config.extraSlots.C"
									@change="saveExtraSlots(section.key, 'extraSlots.C', $event)"
								>
							</label>
							<label class="track-config-option">
								<span class="option-label">{{ localize('ARCHMAGE.extraESlots') }}</span>
								<input
									type="number"
									min="0"
									:value="section.config.extraSlots.E"
									@change="saveExtraSlots(section.key, 'extraSlots.E', $event)"
								>
							</label>
							<label class="track-config-option">
								<span class="option-label">{{ localize('ARCHMAGE.extraZSlots') }}</span>
								<input
									type="number"
									min="0"
									:value="section.config.extraSlots.Z"
									@change="saveExtraSlots(section.key, 'extraSlots.Z', $event)"
								>
							</label>
						</template>
						<label v-else class="track-config-option">
							<span class="option-label">{{ localize('ARCHMAGE.extraSlots') }}</span>
							<input
								type="number"
								min="0"
								:value="section.config.extraSlots"
								@change="saveExtraSlots(section.key, 'extraSlots', $event)"
							>
						</label>
					</div>
				</span>
				<span class="slot-tracks">
					<template v-for="track in section.tracks" :key="track.key">
						<span v-if="track.shown" class="tier-track" :data-tier="track.key">
							<span v-if="track.letter" class="tier-letter">{{ track.letter }}</span>
							<ul class="slot-pips">
								<li v-for="n in track.filled" :key="`filled-${n}`" class="slot-pip filled" />
								<li v-for="n in track.borrowed" :key="`borrowed-${n}`" class="slot-pip filled borrowed">
									<i class="fas fa-arrow-down" />
								</li>
								<li v-for="n in track.overflow.length" :key="`overflow-${n}`" class="slot-pip overflow" />
								<li v-for="n in track.free" :key="`free-${n}`" class="slot-pip" />
							</ul>
						</span>
					</template>
				</span>
			</h4>

			<ul class="loadout-list flexcol">
				<!-- Magic items, with the full equipment row treatment. -->
				<template v-if="section.kind === 'equipment'">
					<ExpandableRowV3
						v-for="item in section.members"
						:key="item._id"
						:item="item"
						:actor="actor"
						:class="rowClasses(item._id)"
						@dragstart="onRowDragStart($event, section.key, item._id)"
						@dragover="onRowDragOver($event, section.key, item._id)"
						@dragleave="onRowDragLeave($event, item._id)"
						@drop="onRowDrop($event, section.key, item._id)"
						@dragend="onRowDragEnd"
					/>
				</template>

				<!-- Feats grouped under their power. The power gets the catalog's
             collapsible row, expanding to its read view minus the feats;
             beneath it, indented, the read view's feat rows: rollable tier
             and uses at left, description in the middle, taken pip at
             right. The wrapper's item is the power the feats belong to, so
             data-item-id stays truthful for drag and the sheet's delegated
             listeners. The block drags with its power — hovering it targets
             the power row, and the feats' own order is the author's, never
             reordered here. -->
				<template v-else>
					<template v-for="power in section.members" :key="power._id">
						<ExpandableRowV3
							:item="power"
							:actor="actor"
							:context="context"
							:show-feats="false"
							:class="rowClasses(power._id)"
							@dragstart="onRowDragStart($event, section.key, power._id)"
							@dragover="onRowDragOver($event, section.key, power._id)"
							@dragleave="onRowDragLeave($event, power._id)"
							@drop="onRowDrop($event, section.key, power._id)"
							@dragend="onRowDragEnd"
						/>
						<!-- The feat block beneath drags with its power: hovering it
                 targets the power row, and since the block sits below that
                 row, a drop there always means after that power. -->
						<li
							class="item feat-item"
							:class="{'v3-row--dragging': draggedRow === power._id}"
							:data-item-id="power._id"
							data-document-class="Item"
							data-draggable="true"
							draggable="true"
							@dragstart="onRowDragStart($event, section.key, power._id)"
							@dragover="onRowDragOver($event, section.key, power._id, true)"
							@dragleave="onRowDragLeave($event, power._id)"
							@drop="onRowDrop($event, section.key, power._id, true)"
							@dragend="onRowDragEnd"
						>
							<PowerFeatsV3 :power="power" :actor="actor" :context="context" />
						</li>
					</template>
				</template>

				<li v-if="!section.members.length" class="v3-empty">&mdash;</li>
			</ul>
		</section>
	</section>
</template>

<script setup>
/**
 * Loadout tab: the character's magic items and feats as two inventories,
 * with slot tracks in the section headers: filled pips for consumed, hollow
 * for free, red triangles for slots used beyond the allowance, and filled
 * pips wearing a down-arrow where a feat spent a
 * higher tier's slot. Feats group under their power: the power is a
 * collapsible catalog-style row whose expanded view is the read view minus
 * the feats, with the read view's feat rows — always expanded — indented
 * beneath it; the pips and rolls are the same flips the powers tab makes.
 *
 * In edit mode each header grows a cog button whose popover holds the
 * tracker config, labeled now that it has room, persisted to the
 * sheetDisplay.loadout flags: the enable checkbox for both sections; for
 * magic items a single extra-slots number; for feats, per-tier extra-slot
 * numbers plus the Resourceful and Prodigious Learner checkboxes. Extras
 * join the level's magic item slots; a bonus feat slot has to belong to
 * some tier, so the feats' extras are granted per tier (A/C/E/Z),
 * Resourceful lands one in the highest tier the character has reached, and
 * Prodigious Learner grants three adventurer-tier feats that climb the
 * tiers with level (one turns champion at 5th, another epic at 8th). All
 * ride past the tier caps, being bonuses. The feat and magic item
 * incremental advances (progression tab) each add a slot too — the feat one
 * in the tier of the PC's next level, the magic item one on the tierless
 * track.
 *
 * Rows reorder by drag, persisting to the sheetDisplay.loadout.rowOrder flag;
 * a power's feat block drags with it, while the feats' own order stays the
 * author's.
 */
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { attunementCost, byName, characterTierIndex, filterFeats, getActor, localize, orderedRows, TIERS as TIER_SLOTS, TIER_ORDER } from "@/methods/Helpers";
import { useRowReorder } from "@/composables/useRowReorder";
import ExpandableRowV3 from "@/components/actor/character/v3/parts/ExpandableRowV3.vue";
import PowerFeatsV3 from "@/components/actor/character/v3/parts/PowerFeatsV3.vue";

const props = defineProps(["actor", "editable", "context"]);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject("editMode", ref(false));

// Tracker config popovers: one open at a time, keyed by section key. The
// toggle flips it; a document click outside the open menu or Escape closes
// it, and leaving edit mode takes the cogs (and any open popover) with it.
const openConfig = ref(null);

const toggleConfig = (key) => {
	openConfig.value = openConfig.value === key ? null : key;
};

const onDocClick = (event) => {
	if (openConfig.value && !event.target.closest?.(".track-config-menu")) openConfig.value = null;
};

const onDocKeydown = (event) => {
	if (event.key === "Escape") openConfig.value = null;
};

onMounted(() => {
	document.addEventListener("click", onDocClick);
	document.addEventListener("keydown", onDocKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", onDocClick);
	document.removeEventListener("keydown", onDocKeydown);
});

watch(editing, () => {
	openConfig.value = null;
});

const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

// Reordering is only offered when the sheet is editable and the actor isn't
// a compendium entry (where flags can't be written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

// Row reordering, shared by both sections: magic items and the powers in the
// feats section (each dragging its feat block with it — the feats themselves
// keep the order their author wrote). The order persists to this tab's own
// flag: the catalog's custom order lives in the items' sort values, shared
// with the v2 sheet, and must not move because the loadout was tidied.
const {
	draggedRow, savedRowOrder,
	rowClasses, onRowDragStart, onRowDragOver, onRowDragLeave, onRowDrop, onRowDragEnd
} = useRowReorder({
	actor: () => props.actor,
	canReorder,
	flagPath: "sheetDisplay.loadout.rowOrder",
	getRows: (sectionKey) => sections.value.find((section) => section.key === sectionKey)?.members ?? []
});

/**
 * One section's tracker config from its display flag: the enable checkbox
 * (default on) and the extra-slot grants. The feats section's bonuses are
 * keyed per tier letter; the magic item track stays a single number.
 * @param key
 */
const sectionConfig = (key) => {
	const raw = props.actor?.flags?.archmage?.sheetDisplay?.loadout?.[key] ?? {};
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
};

/**
 * Persist one config value through the live actor document; props.actor is a
 * data clone whose flag updates wouldn't round-trip. Writing only when the
 * stored value differs avoids a re-render loop from the update. Pack actors
 * have no setFlag; getActor resolves the live document from the context
 * actor's drag data.
 * @param key
 * @param path
 * @param value
 */
const saveSectionFlag = async (key, path, value) => {
	if (props.actor?.pack) return;
	const actor = await getActor(props.actor);
	const current = foundry.utils.getProperty(
		props.actor?.flags?.archmage?.sheetDisplay?.loadout?.[key] ?? {}, path);
	if (actor && current !== value) {
		await actor.setFlag("archmage", `sheetDisplay.loadout.${key}.${path}`, value);
	}
};

/**
 * Clamp an extra-slots entry to a non-negative integer, then persist it.
 * @param key
 * @param path
 * @param event
 */
const saveExtraSlots = (key, path, event) => {
	const value = Math.max(Math.trunc(Number(event.target.value)) || 0, 0);
	if (String(event.target.value) !== String(value)) event.target.value = value;
	saveSectionFlag(key, path, value);
};

/**
 * Slot bookkeeping for one track: filled pips up to the allowance, alert
 * triangles past it, hollow pips for what's left. A
 * disabled config hides the track; edit mode reveals it so the config pair
 * always has its target on screen.
 * @param key
 * @param consumed
 * @param slots
 * @param config
 */
const slotTrack = (key, consumed, slots, config = {}) => ({
	key,
	filled: Math.min(consumed, slots),
	overflow: Array(Math.max(consumed - slots, 0)).fill(null),
	free: Math.max(slots - consumed, 0),
	shown: config.enabled !== false && (slots > 0 || consumed > 0 || editing.value)
});

/**
 * The two inventories with their slot tracks. Equipment whose tier is unset
 * (the item sheet's none option) isn't a magic item and lives on the catalog
 * tab. Feats with no text are skipped, matching the power sheet's read view.
 */
const sections = computed(() => {
	const items = props.actor?.items ?? [];
	const level = Number(props.actor?.system?.attributes?.level?.value) || 0;
	const charTier = characterTierIndex(level);

	// The feat and magic item incremental advances each add a bonus slot: one
	// more magic item, and one feat slot in the tier of the PC's next level.
	const incrementals = props.actor?.system?.incrementals ?? {};

	// Tier first, then name; the stable sort needs the minor key applied first.
	const magicItems = items
		.filter((i) => i.type === "equipment" && TIER_ORDER[i.system?.tier] !== undefined)
		.sort(byName)
		.sort(byTier);
	const powers = items.filter((i) => i.type === "power").sort(byName);

	// Magic item slots: the level total plus the section's extra slots, no
	// tier split. Only attuned items — the ones with their active pip filled —
	// consume slots, and each higher-tier attunement burns two.
	const itemsConfig = sectionConfig("equipment");
	const itemsConsumed = magicItems.reduce((sum, item) => sum + (item.system.isActive ? attunementCost(item, charTier) : 0), 0);
	const itemAllowance = level + itemsConfig.extraSlots + (incrementals.extraMagicItem === true ? 1 : 0);

	// The feats a tier's track counts: the tier's taken feats with text.
	const takenFeatsForTier = (tier) => powers.flatMap((power) =>
		Object.values(filterFeats(power.system?.feats))
			.filter((feat) => feat.tier?.value === tier.key && feat.isActive.value));

	// Feat slots: each level grants a slot in its tier's track — one per level
	// 1-4 for A, 5-7 for C, 8-10 for E — plus the single Z slot at 10th. A
	// tier's own feats fill its slots first; past that, feats spend the next
	// tier up, and the borrowed pips wear the down-arrow. Whatever the cascade
	// can't place alerts on its own tier's track — which is why a track also
	// shows when it has overflow. Spill keeps its letters only to route each
	// overflow pip to the right tier's track.
	const takenByTier = new Map(TIER_SLOTS.map((tier) =>
		[tier.key, takenFeatsForTier(tier).length]));

	// Feats still unplaced, by origin tier letter.
	let spill = [];
	const featsConfig = sectionConfig("feats");
	// The feat incremental's bonus slot belongs to the tier of the PC's next
	// level — a 4th-level PC's lands on C — clamped at 10th since the tiers
	// run out there. It's a bonus, so it rides past the tier cap.
	const featIncrementalTier = TIER_SLOTS[characterTierIndex(Math.min(level + 1, 10))].key;
	const featIncrementalSlot = incrementals.feat === true ? 1 : 0;

	// Prodigious Learner's bonus feats: three adventurer-tier at 1st; from
	// 5th level one of them is replaced by a champion-tier feat, and from 8th
	// another by an epic-tier one.
	const prodigiousGrants = !featsConfig.prodigiousLearner ? {} : level >= 8
		? { A: 1, C: 1, E: 1 }
		: level >= 5 ? { A: 2, C: 1 } : { A: 3 };

	const featTracks = TIER_SLOTS.map((tier) => {
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
			shown: featsConfig.enabled !== false && (allowance > 0 || filled > 0 || editing.value)
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
			members: orderedRows(magicItems, savedRowOrder.value),
			config: itemsConfig,
			tracks: [slotTrack("items", itemsConsumed, itemAllowance, itemsConfig)]
		},
		{
			key: "feats",
			kind: "feats",
			labelKey: "ARCHMAGE.feats",
			members: orderedRows(featPowers, savedRowOrder.value),
			config: featsConfig,
			tracks: featTracks
		}
	];
});
</script>

<style scoped lang="scss">
  @import 'v3/drag-reorder';
  @import 'v3/empty';

  .loadout-section {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .loadout-section-title {
    // Sticky against the tab's scroll container: the header pins to the top
    // of the view while its section is in view, then gets pushed out by the
    // section's end. The opaque backdrop is what masks the rows scrolling
    // beneath it; --v3-surface matches the window frame in both themes.
    position: sticky;
    top: -12px;
    z-index: 10;
    margin: 0 0 0.25rem;
    padding: 0.25rem 0;
    background: var(--v3-surface);
    display: flex;
    align-items: center;
    gap: 0.75rem;

    // The label takes the rest of the row, pushing the pip tracks to the end.
    .section-label {
      flex: 1;
    }

    // While a section's config popover is open, lift this header above its
    // sibling headers: the sticky positioning makes each header its own
    // stacking context, so the popover's z-index can't reach past it, and
    // the next section's header would otherwise paint over the popover.
    &.config-open {
      z-index: 30;
    }
  }

  // The edit-mode tracker config in the header: a cog button opening a small
  // popover holding the labeled enable checkbox and the extra-slot entries
  // (the feats section adds its Resourceful and Prodigious Learner
  // checkboxes). The popover hangs from the cog, absolute so it doesn't
  // widen the sticky header, and reads as a little panel over the rows
  // beneath.
  .track-config-menu {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }

  .track-config-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    font-size: var(--font-size-10);
    line-height: 1;

    // Lit while its popover is open.
    &.open i {
      color: var(--v3-rollable);
    }
  }

  .track-config-popover {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    background: var(--v3-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    box-shadow: 0 2px 8px var(--c-black--50);

    .track-config-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      // The label takes the rest of the row, pushing the input to the
      // popover's right edge so the controls line up.
      .option-label {
        flex: 1;
        font-family: var(--v3-font-label);
        font-size: var(--font-size-12);
        white-space: nowrap;
      }

      input[type='checkbox'] {
        margin: 0;
      }

      input[type='number'] {
        min-width: 0;
        width: calc(3ch + 0.5rem);
        height: 1.25rem;
        padding: 0 0.25rem;
        line-height: 1.25rem;
        font-size: var(--font-size-14);
        font-variant-numeric: tabular-nums;
        text-align: center;
      }
    }
  }

  // The section's pip tracks: one for magic items, one per feat tier.
  .slot-tracks {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .tier-track {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  // The track's tier letter, as a small square chip. The magic item track
  // has no letter, being tierless.
  .tier-letter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4em;
    height: 1.4em;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--v3-chip-bg);
    font-family: var(--v3-font-display);
    font-size: var(--font-size-14);
  }

  // The slot pips, mirrored from PowerFeatPips: hollow circles, filled when
  // the slot is consumed. Red triangles mark slots used beyond the allowance.
  .slot-pips {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .slot-pip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--font-size-12);
    height: var(--font-size-12);
    background: transparent;
    border-radius: 50%;
    border: 1px solid var(--color-text-primary);
    margin: 0 1px;
    padding: 0;

    &.filled {
      background: var(--color-text-primary);
    }

    // A slot a lower-tier feat spent: the arrow marks the down-spend.
    &.borrowed i {
      font-size: var(--font-size-10);
      line-height: 0;
      color: var(--color-fieldset-border);
    }

    &.overflow {
      border: none;
      border-radius: 0;
      background: var(--v3-negative);
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
  }

  .loadout-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  // The power rows that group the feats: spaced apart as their own groups.
  .power-item {
    margin-top: 0.5rem;

    &:first-child {
      margin-top: 0;
    }
  }

  // The wrapper beneath each power row holding its feat rows, indented to
  // sit under the power's name.
  .feat-item {
    margin-left: 2rem;
  }
</style>
