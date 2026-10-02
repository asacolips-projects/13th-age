<template>
  <section class="tab-loadout">
    <!-- Two inventories: magic items and feats. The header tracks the slots —
         filled pips consumed, hollow pips free, squared pips past the
         allowance. Tracks with no allowance and nothing consumed don't show. -->
    <section v-for="section in sections" :key="section.key" class="loadout-section">
      <h4 class="loadout-section-title unit-title">
        <span class="section-label">{{ localize(section.labelKey) }}</span>
        <!-- Edit mode only: per-section tracker config, persisted to the
             sheetDisplay.loadout flags, tucked behind a cog. The popover's
             checkbox hides the section's tracks; the number grants slots
             beyond the level's allowance -->
        <template v-if="editing">
          <span class="track-config-menu">
            <button type="button" class="track-config-toggle"
              :class="{ open: openConfig === section.key }"
              :title="localize('ARCHMAGE.trackerSettings')"
              @click="toggleConfig(section.key)">
              <i class="fas fa-gear"></i>
            </button>
            <div v-if="openConfig === section.key" class="track-config-popover">
              <label class="track-config-option">
                <span class="option-label">{{ localize('ARCHMAGE.enableTracker') }}</span>
                <input type="checkbox" :checked="section.config.enabled"
                  @change="saveSectionFlag(section.key, 'enabled', $event.target.checked)">
              </label>
              <label class="track-config-option">
                <span class="option-label">{{ localize('ARCHMAGE.extraSlots') }}</span>
                <input type="number" min="0" :value="section.config.extraSlots"
                  @change="saveExtraSlots(section.key, $event)">
              </label>
            </div>
          </span>
        </template>
        <span class="slot-tracks">
          <template v-for="track in section.tracks" :key="track.key">
            <span v-if="track.shown" class="tier-track" :data-tier="track.key">
              <span v-if="track.letter" class="tier-letter">{{ track.letter }}</span>
              <ul class="slot-pips">
                <li v-for="n in track.filled" :key="`filled-${n}`" class="slot-pip filled"></li>
                <li v-for="n in track.borrowed" :key="`borrowed-${n}`" class="slot-pip filled borrowed">
                  <i class="fas fa-arrow-down"></i>
                </li>
                <li v-for="(letter, n) in track.overflow" :key="`overflow-${n}`" class="slot-pip overflow">
                  <span v-if="letter" class="overflow-letter">{{ letter }}</span>
                </li>
                <li v-for="n in track.free" :key="`free-${n}`" class="slot-pip"></li>
              </ul>
            </span>
          </template>
        </span>
      </h4>

      <ul class="loadout-list flexcol">
        <!-- Magic items, with the full equipment row treatment. -->
        <template v-if="section.kind === 'equipment'">
          <ExpandableEquipment v-for="item in section.members" :key="item._id" :equipment="item" :actor="actor"
            :class="rowClasses(item._id)"
            @dragstart="onRowDragStart($event, section.key, item._id)"
            @dragover="onRowDragOver($event, section.key, item._id)"
            @dragleave="onRowDragLeave($event, item._id)"
            @drop="onRowDrop($event, section, item._id)"
            @dragend="onRowDragEnd"/>
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
            <ExpandablePowerRow :power="power" :actor="actor" :context="context"
              columns="32px auto 36px 44px 60px 44px 64px"
              :class="rowClasses(power._id)"
              @dragstart="onRowDragStart($event, section.key, power._id)"
              @dragover="onRowDragOver($event, section.key, power._id)"
              @dragleave="onRowDragLeave($event, power._id)"
              @drop="onRowDrop($event, section, power._id)"
              @dragend="onRowDragEnd">
              <template #details="{active}">
                <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context" :show-feats="false"/>
              </template>
            </ExpandablePowerRow>
            <li class="item feat-item" :class="{'loadout-row--dragging': draggedRow === power._id}"
              :data-item-id="power._id"
              data-document-class="Item" data-draggable="true" draggable="true"
              @dragstart="onRowDragStart($event, section.key, power._id)"
              @dragover="onFeatBlockDragOver($event, section.key, power._id)"
              @dragleave="onRowDragLeave($event, power._id)"
              @drop="onFeatBlockDrop($event, section, power._id)"
              @dragend="onRowDragEnd">
              <PowerFeatsV3 :power="power" :actor="actor" :context="context"/>
            </li>
          </template>
        </template>

        <li v-if="!section.members.length" class="loadout-empty">&mdash;</li>
      </ul>
    </section>
  </section>
</template>

<script setup>
/**
 * Loadout tab: the character's magic items and feats as two inventories,
 * with slot tracks in the section headers: filled pips for consumed, hollow
 * for free, squares in the alert colour for slots used beyond the
 * allowance, and filled pips wearing a down-arrow where a feat spent a
 * higher tier's slot. Feats group under their power: the power is a
 * collapsible catalog-style row whose expanded view is the read view minus
 * the feats, with the read view's feat rows — always expanded — indented
 * beneath it; the pips and rolls are the same flips the powers tab makes.
 *
 * In edit mode each header grows a cog button whose popover holds the
 * tracker config pair — an enable checkbox and an extra-slots number,
 * labeled now that they have room — persisted to the sheetDisplay.loadout
 * flags.
 * Extras join the level's magic item slots; for feats they are slots of the
 * highest tier the character's level has reached, since a bonus feat slot
 * has to belong to some tier. The feat and magic item incremental advances
 * (progression tab) each add a slot too — the feat one in the tier of the
 * PC's next level, the magic item one on the tierless track.
 *
 * Rows reorder by drag, persisting to the sheetDisplay.loadout.rowOrder flag;
 * a power's feat block drags with it, while the feats' own order stays the
 * author's.
 */
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { attunementCost, characterTierIndex, filterFeats, getActor, localize, TIERS as TIER_SLOTS, TIER_ORDER } from '@/methods/Helpers';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';
import ExpandablePowerRow from '@/components/actor/character/v3/parts/expandable/ExpandablePowerRow.vue';
import PowerDetailsV3 from '@/components/actor/character/v3/parts/PowerDetailsV3.vue';
import PowerFeatsV3 from '@/components/actor/character/v3/parts/PowerFeatsV3.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

// Tracker config popovers: one open at a time, keyed by section key. The
// toggle flips it; a document click outside the open menu or Escape closes
// it, and leaving edit mode takes the cogs (and any open popover) with it.
const openConfig = ref(null);

const toggleConfig = (key) => {
  openConfig.value = openConfig.value === key ? null : key;
};

const onDocClick = (event) => {
  if (openConfig.value && !event.target.closest?.('.track-config-menu')) openConfig.value = null;
};

const onDocKeydown = (event) => {
  if (event.key === 'Escape') openConfig.value = null;
};

onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onDocKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onDocKeydown);
});

watch(editing, () => { openConfig.value = null; });

const byName = (a, b) => a.name.localeCompare(b.name);
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

// Row reordering, shared by both sections: magic items and the powers in the
// feats section (each dragging its feat block with it — the feats themselves
// keep the order their author wrote). The order persists to this tab's own
// flag: the catalog's custom order lives in the items' sort values, shared
// with the v2 sheet, and must not move because the loadout was tidied.
const savedRowOrder = computed(() => {
  const stored = props.actor?.flags?.archmage?.sheetDisplay?.loadout?.rowOrder;
  return Array.isArray(stored) ? stored : [];
});

/**
 * Apply the saved row order to a section's rows; rows the saved order
 * doesn't know about (new items) keep their natural sort.
 */
const orderedRows = (rows) => {
  const positions = new Map(savedRowOrder.value.map((id, index) => [id, index]));
  if (!positions.size) return rows;
  return [...rows].sort((a, b) => {
    const ai = positions.get(a._id);
    const bi = positions.get(b._id);
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
};

/**
 * One section's tracker config from its display flag: the enable checkbox
 * (default on) and the extra-slot grant (default none, floored at zero).
 */
const sectionConfig = (key) => {
  const raw = props.actor?.flags?.archmage?.sheetDisplay?.loadout?.[key] ?? {};
  return {
    enabled: raw.enabled !== false,
    extraSlots: Math.max(Number(raw.extraSlots) || 0, 0),
  };
};

/**
 * Persist one config value through the live actor document; props.actor is a
 * data clone whose flag updates wouldn't round-trip. Writing only when the
 * stored value differs avoids a re-render loop from the update. Pack actors
 * have no setFlag; getActor resolves the live document from the context
 * actor's drag data.
 */
const saveSectionFlag = async (key, path, value) => {
  if (props.actor?.pack) return;
  const actor = await getActor(props.actor);
  const current = foundry.utils.getProperty(
    props.actor?.flags?.archmage?.sheetDisplay?.loadout?.[key] ?? {}, path);
  if (actor && current !== value) {
    await actor.setFlag('archmage', `sheetDisplay.loadout.${key}.${path}`, value);
  }
};

/** Clamp the extra-slots entry to a non-negative integer, then persist it. */
const saveExtraSlots = (key, event) => {
  const value = Math.max(Math.trunc(Number(event.target.value)) || 0, 0);
  if (String(event.target.value) !== String(value)) event.target.value = value;
  saveSectionFlag(key, 'extraSlots', value);
};

/**
 * Slot bookkeeping for one track: filled pips up to the allowance, squared
 * alert pips past it, hollow pips for what's left. The alert pips carry the
 * tier letter that overran, or none for the tierless magic item track. A
 * disabled config hides the track; edit mode reveals it so the config pair
 * always has its target on screen.
 */
const slotTrack = (key, consumed, slots, config = {}) => ({
  key,
  filled: Math.min(consumed, slots),
  overflow: Array(Math.max(consumed - slots, 0)).fill(null),
  free: Math.max(slots - consumed, 0),
  shown: config.enabled !== false && (slots > 0 || consumed > 0 || editing.value),
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
    .filter(i => i.type === 'equipment' && TIER_ORDER[i.system?.tier] !== undefined)
    .sort(byName).sort(byTier);
  const powers = items.filter(i => i.type === 'power').sort(byName);

  // Magic item slots: the level total plus the section's extra slots, no
  // tier split. Only attuned items — the ones with their active pip filled —
  // consume slots, and each higher-tier attunement burns two.
  const itemsConfig = sectionConfig('equipment');
  const itemsConsumed = magicItems.reduce((sum, item) => sum + (item.system.isActive ? attunementCost(item, charTier) : 0), 0);
  const itemAllowance = level + itemsConfig.extraSlots + (incrementals.extraMagicItem === true ? 1 : 0);

  // The feats a tier's track counts: the tier's taken feats with text.
  const takenFeatsForTier = (tier) => powers.flatMap(power =>
    Object.values(filterFeats(power.system?.feats))
      .filter(feat => feat.tier?.value === tier.key && feat.isActive.value));

  // Feat slots: each level grants a slot in its tier's track — one per level
  // 1-4 for A, 5-7 for C, 8-10 for E — plus the single Z slot at 10th. A
  // tier's own feats fill its slots first; past that, feats spend the next
  // tier up, and the borrowed pips wear the down-arrow. Whatever the cascade
  // can't place alerts on its own tier's track, each square wearing that
  // tier's letter — which is why a track also shows when it has overflow.
  const takenByTier = new Map(TIER_SLOTS.map(tier =>
    [tier.key, takenFeatsForTier(tier).length]));

  // Feats still unplaced, by origin tier letter.
  let spill = [];
  const featsConfig = sectionConfig('feats');
  // The feat incremental's bonus slot belongs to the tier of the PC's next
  // level — a 4th-level PC's lands on C — clamped at 10th since the tiers
  // run out there. It's a bonus, so it rides past the tier cap.
  const featIncrementalTier = TIER_SLOTS[characterTierIndex(Math.min(level + 1, 10))].key;
  const featIncrementalSlot = incrementals.feat === true ? 1 : 0;
  const featTracks = TIER_SLOTS.map(tier => {
    // The level's grant, capped, with the section's extra slots joining the
    // highest tier the level has reached and the feat incremental's slot the
    // next level's tier — both past the cap, since they're bonuses.
    const extraSlots = tier.key === TIER_SLOTS[charTier].key ? featsConfig.extraSlots : 0;
    const allowance = Math.min(Math.max(level - tier.firstSlot + 1, 0), tier.cap)
      + extraSlots + (tier.key === featIncrementalTier ? featIncrementalSlot : 0);
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
      shown: featsConfig.enabled !== false && (allowance > 0 || filled > 0 || editing.value),
    };
  });
  for (const letter of spill) {
    const track = featTracks.find(track => track.letter === letter);
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
    .filter(power => Object.keys(filterFeats(power.system?.feats)).length);

  return [
    {
      key: 'equipment',
      kind: 'equipment',
      labelKey: 'ARCHMAGE.INVENTORY.equipment',
      members: orderedRows(magicItems),
      config: itemsConfig,
      tracks: [slotTrack('items', itemsConsumed, itemAllowance, itemsConfig)],
    },
    {
      key: 'feats',
      kind: 'feats',
      labelKey: 'ARCHMAGE.feats',
      members: orderedRows(featPowers),
      config: featsConfig,
      tracks: featTracks,
    },
  ];
});

// Reordering is only offered when the sheet is editable and the actor isn't
// a compendium entry (where flags can't be written).
const canReorder = computed(() => props.editable === true && !props.actor?.pack);

const draggedRow = ref(null);
const draggedRowSection = ref(null);
const dragOverRow = ref(null);
const dropAfter = ref(false);

/**
 * Classes for a row, including drag feedback.
 */
const rowClasses = (rowId) => ({
  'loadout-row--dragging': draggedRow.value === rowId,
  'loadout-row--drop-above': dragOverRow.value === rowId && !dropAfter.value,
  'loadout-row--drop-below': dragOverRow.value === rowId && dropAfter.value,
});

const onRowDragStart = (event, sectionKey, rowId) => {
  if (!canReorder.value) return;
  draggedRow.value = rowId;
  draggedRowSection.value = sectionKey;
  // Deliberately no stopPropagation: the sheet's dragstart still arms the
  // item payload, so dropping the row outside this tab sorts or drags as
  // usual. Only the drops below keep the two apart.
};

const onRowDragOver = (event, sectionKey, rowId) => {
  if (!draggedRow.value) return;
  // A row drag stays ours end to end: keep it away from the sheet's item
  // sorting even over the other section's rows, where the drop is a no-op.
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  if (draggedRowSection.value !== sectionKey || rowId === draggedRow.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  dropAfter.value = (event.clientY - rect.top) >= (rect.height / 2);
  dragOverRow.value = rowId;
};

const onRowDragLeave = (event, rowId) => {
  if (dragOverRow.value !== rowId) return;
  // dragleave also fires when moving between the row's children, so only
  // clear the indicator once the cursor has actually left the row.
  if (event.currentTarget.contains(event.relatedTarget)) return;
  dragOverRow.value = null;
};

const onRowDrop = async (event, section, targetId) => {
  if (!draggedRow.value) return;
  // A row is being reordered, so keep this away from item sorting.
  event.preventDefault();
  event.stopPropagation();

  const sourceId = draggedRow.value;
  const sourceSection = draggedRowSection.value;
  const after = dropAfter.value;
  clearRowDrag();
  // Cross-section drops do nothing: the two inventories hold different items.
  if (sourceSection !== section.key || sourceId === targetId) return;
  await insertRow(section, sourceId, targetId, after);
};

const onRowDragEnd = () => clearRowDrag();

const clearRowDrag = () => {
  draggedRow.value = null;
  draggedRowSection.value = null;
  dragOverRow.value = null;
  dropAfter.value = false;
};

/**
 * The feat block beneath a power row drags with its power: hovering it
 * targets the power row itself, and since the block sits below that row, a
 * drop there always means after that power.
 */
const onFeatBlockDragOver = (event, sectionKey, powerId) => {
  if (!draggedRow.value) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  if (draggedRowSection.value !== sectionKey || draggedRow.value === powerId) return;
  dropAfter.value = true;
  dragOverRow.value = powerId;
};

const onFeatBlockDrop = async (event, section, powerId) => {
  if (!draggedRow.value) return;
  event.preventDefault();
  event.stopPropagation();

  const sourceId = draggedRow.value;
  const sourceSection = draggedRowSection.value;
  clearRowDrag();
  if (sourceSection !== section.key || sourceId === powerId) return;
  await insertRow(section, sourceId, powerId, true);
};

/**
 * Rebuild a section's order from what's currently displayed, inserting above
 * or below the target based on where the cursor was released.
 */
const insertRow = async (section, sourceId, targetId, after) => {
  const ids = section.members.map(row => row._id).filter(id => id !== sourceId);
  const index = ids.indexOf(targetId);
  if (index < 0) return;
  ids.splice(after ? index + 1 : index, 0, sourceId);

  // Keep the other section's entries (pruning deleted items) and append this
  // section's slice: position within the flat array only matters relative to
  // an item's own section, since the order is applied per section.
  const memberIds = new Set(section.members.map(row => row._id));
  const itemIds = new Set((props.actor?.items ?? []).map(item => item._id));
  const rest = savedRowOrder.value.filter(id => !memberIds.has(id) && itemIds.has(id));
  await saveRowOrder([...rest, ...ids]);
};

const saveRowOrder = async (order) => {
  if (!canReorder.value) return;
  // Pack actors have no setFlag; getActor resolves the live document from
  // the context actor's drag data.
  const actor = await getActor(props.actor);
  await actor?.setFlag('archmage', 'sheetDisplay.loadout.rowOrder', order);
};
</script>

<style scoped lang="scss">
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
    // beneath it, and matches the window so it reads as part of the frame.
    position: sticky;
    top: -12px;
    z-index: 10;
    margin: 0 0 0.25rem;
    padding: 0.25rem 0;
    background: var(--c-black--75);
    display: flex;
    align-items: center;
    gap: 0.75rem;

    // The label takes the rest of the row, pushing the pip tracks to the end.
    .section-label {
      flex: 1;
    }
  }

  // The edit-mode tracker config in the header: a cog button opening a small
  // popover holding the labeled enable checkbox and the extra-slots entry.
  // The popover hangs from the cog, absolute so it doesn't widen the sticky
  // header, and reads as a little panel over the rows beneath.
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
    background: var(--c-black--75);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    box-shadow: 0 2px 8px var(--c-black--50);

    .track-config-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .option-label {
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
  // the slot is consumed. Squared pips in the alert colour mark slots used
  // beyond the allowance.
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
    width: 12px;
    height: 12px;
    background: transparent;
    border-radius: 50%;
    border: 1px solid $c-white;
    margin: 0 1px;
    padding: 0;

    &.filled {
      background: $c-white;
    }

    // A slot a lower-tier feat spent: the arrow marks the down-spend.
    &.borrowed i {
      font-size: var(--font-size-10);
      line-height: 0;
      color: var(--c-black);
    }

    &.overflow {
      border-radius: 1px;
      background: var(--v3-negative);
      border-color: var(--v3-negative);
    }
  }

  // The tier letter an unplaceable feat wears on its alert square.
  .overflow-letter {
    font-family: var(--v3-font-label);
    font-size: var(--font-size-10);
    line-height: 0;
    color: var(--c-white);
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

  .loadout-empty {
    margin: 0;
    padding: 0 0.25rem;
    color: var(--v3-text-muted);
  }

  // Row reordering feedback, matching the other v3 tabs: the dragged row
  // dims (a power's feat block dims with it), the hovered row shows an
  // insertion edge on the side the drop would land.
  .loadout-row--dragging {
    opacity: 0.5;
  }

  .loadout-row--drop-above {
    box-shadow: inset 0 2px 0 var(--color-border);
  }

  .loadout-row--drop-below {
    box-shadow: inset 0 -2px 0 var(--color-border);
  }
</style>
