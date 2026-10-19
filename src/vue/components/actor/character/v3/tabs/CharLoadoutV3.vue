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

				<!-- Feats grouped under their power. The power gets the item index's
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
 * collapsible item-index-style row whose expanded view is the read view minus
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
import { computed, inject, ref, watch } from "vue";
import { localize, saveSheetDisplayPref } from "@/methods/Helpers";
import { loadoutConfig, loadoutSections } from "@/methods/LoadoutSlots";
import { useDismissablePopover } from "@/composables/useDismissablePopover";
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
useDismissablePopover(openConfig, ".track-config-menu", null);

const toggleConfig = (key) => {
	openConfig.value = openConfig.value === key ? null : key;
};

watch(editing, () => {
	openConfig.value = null;
});

// Reordering is only offered when the sheet is editable and the actor isn't
// a compendium entry (where flags can't be written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

// Row reordering, shared by both sections: magic items and the powers in the
// feats section (each dragging its feat block with it — the feats themselves
// keep the order their author wrote). The order persists to this tab's own
// flag: the item index's custom order lives in the items' sort values, shared
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
 * One section's tracker config from its display flag; the parse itself is
 * loadoutConfig in methods/LoadoutSlots, so the sections computed and the
 * popover read the same shape.
 * @param key
 */
const sectionConfig = (key) => loadoutConfig(key,
	props.actor?.flags?.archmage?.sheetDisplay?.loadout?.[key] ?? {});

/**
 * Persist one config value through the live actor document; props.actor is a
 * data clone whose flag updates wouldn't round-trip. saveSheetDisplayPref
 * does the same job the loadout's flag writes need: the pack guard, resolving
 * the live document, and writing only when the stored value differs (which
 * avoids a re-render loop from the update).
 * @param key
 * @param path
 * @param value
 */
const saveSectionFlag = (key, path, value) =>
	saveSheetDisplayPref(props.actor, `sheetDisplay.loadout.${key}.${path}`, value);

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
 * The two inventories with their slot tracks. The rules — the magic-item
 * track, the feat-slot cascade with its borrowed and overflow pips, the
 * level grants and bonuses — live in methods/LoadoutSlots; this wiring
 * re-runs them as the actor clone, the saved row order or edit mode change.
 */
const sections = computed(() => loadoutSections({
	actor: props.actor,
	editing: editing.value,
	configs: {
		equipment: sectionConfig("equipment"),
		feats: sectionConfig("feats")
	},
	rowOrder: savedRowOrder.value
}));
</script>

<style scoped lang="scss">
  @import 'v3/drag-reorder';
  @import 'v3/pips';
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
  // the slot is consumed (the shared circle-pip mixin). Red triangles mark
  // slots used beyond the allowance.
  .slot-pips {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .slot-pip {
    @include v3-circle-pip(var(--font-size-12));
    display: flex;
    align-items: center;
    justify-content: center;

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
