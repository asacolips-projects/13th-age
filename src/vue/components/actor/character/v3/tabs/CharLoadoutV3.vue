<template>
  <section class="tab-loadout">
    <!-- Two inventories: magic items and feats. The header tracks the slots —
         filled pips consumed, hollow pips free, squared pips past the
         allowance. Tracks with no allowance and nothing consumed don't show. -->
    <section v-for="section in sections" :key="section.key" class="loadout-section">
      <h4 class="loadout-section-title unit-title">
        <span class="section-label">{{ localize(section.labelKey) }}</span>
        <!-- Edit mode only: per-section tracker config, persisted to the
             sheetDisplay.loadout flags. The checkbox hides the section's
             tracks; the number grants slots beyond the level's allowance -->
        <template v-if="editing">
          <label class="track-config" :title="localize('ARCHMAGE.enableTracker')">
            <input type="checkbox" :checked="section.config.enabled"
              @change="saveSectionFlag(section.key, 'enabled', $event.target.checked)">
          </label>
          <label class="track-config" :title="localize('ARCHMAGE.extraSlots')">
            <input type="number" min="0" :value="section.config.extraSlots"
              @change="saveExtraSlots(section.key, $event)">
          </label>
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
          <ExpandableEquipment v-for="item in section.members" :key="item._id" :equipment="item" :actor="actor"/>
        </template>

        <!-- Feats grouped under their power. The power gets the catalog's
             collapsible row, expanding to its read view minus the feats;
             beneath it, indented, the read view's feat rows: rollable tier
             and uses at left, description in the middle, taken pip at
             right. The wrapper's item is the power the feats belong to, so
             data-item-id stays truthful for drag and the sheet's delegated
             listeners. -->
        <template v-else>
          <template v-for="power in section.members" :key="power._id">
            <ExpandablePowerRow :power="power" :actor="actor" :context="context"
              columns="32px auto 36px 44px 60px 44px 64px">
              <template #details="{active}">
                <PowerDetailsV3 v-if="active" :power="power" :actor="actor" :context="context" :show-feats="false"/>
              </template>
            </ExpandablePowerRow>
            <li class="item feat-item" :data-item-id="power._id"
              data-document-class="Item" data-draggable="true" draggable="true">
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
 * In edit mode each header grows a tracker config pair — an enable checkbox
 * and an extra-slots number — persisted to the sheetDisplay.loadout flags.
 * Extras join the level's magic item slots; for feats they are slots of the
 * highest tier the character's level has reached, since a bonus feat slot
 * has to belong to some tier. The feat and magic item incremental advances
 * (progression tab) each add a slot too — the feat one in the tier of the
 * PC's next level, the magic item one on the tierless track.
 */
import { computed, inject, ref } from 'vue';
import { attunementCost, characterTierIndex, filterFeats, getActor, localize, TIERS as TIER_SLOTS, TIER_ORDER } from '@/methods/Helpers';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';
import ExpandablePowerRow from '@/components/actor/character/v3/parts/expandable/ExpandablePowerRow.vue';
import PowerDetailsV3 from '@/components/actor/character/v3/parts/PowerDetailsV3.vue';
import PowerFeatsV3 from '@/components/actor/character/v3/parts/PowerFeatsV3.vue';

const props = defineProps(['actor', 'editable', 'context']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

const byName = (a, b) => a.name.localeCompare(b.name);
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

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

  // The section's rows: every power with feats, in name order, its feats
  // rendered beneath it by the read view's feat rows.
  const featPowers = powers
    .filter(power => Object.keys(filterFeats(power.system?.feats)).length);

  return [
    {
      key: 'equipment',
      kind: 'equipment',
      labelKey: 'ARCHMAGE.INVENTORY.equipment',
      members: magicItems,
      config: itemsConfig,
      tracks: [slotTrack('items', itemsConsumed, itemAllowance, itemsConfig)],
    },
    {
      key: 'feats',
      kind: 'feats',
      labelKey: 'ARCHMAGE.feats',
      members: featPowers,
      config: featsConfig,
      tracks: featTracks,
    },
  ];
});
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

  // The edit-mode tracker config pair in the header: the enable checkbox and
  // the extra-slots entry, compact to sit beside the pip tracks without
  // widening the sticky header.
  .track-config {
    display: flex;
    align-items: center;
    flex: 0 0 auto;

    input[type='checkbox'] {
      margin: 0;
    }

    input[type='number'] {
      min-width: 0;
      width: calc(3ch + 0.5rem);
      height: 1.25rem;
      padding: 0 0.25rem;
      line-height: 1.25rem;
      font-size: var(--v3-font-size-label);
      font-variant-numeric: tabular-nums;
      text-align: center;
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
    border: 1px solid var(--v3-border);
    border-radius: 0.25rem;
    background: var(--v3-chip-bg);
    font-family: var(--v3-font-display);
    font-size: var(--v3-font-size-label);
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
      font-size: 10px;
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
    font-size: 10px;
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
</style>
