<template>
  <section class="tab-loadout">
    <!-- Two inventories: magic items and feats. The header tracks the slots —
         filled pips consumed, hollow pips free, squared pips past the
         allowance. Tracks with no allowance and nothing consumed don't show. -->
    <section v-for="section in sections" :key="section.key" class="loadout-section">
      <h4 class="loadout-section-title unit-title">
        <span class="section-label">{{ localize(section.labelKey) }}</span>
        <span class="slot-tracks">
          <template v-for="track in section.tracks" :key="track.key">
            <span v-if="track.shown" class="tier-track" :data-tier="track.key">
              <span v-if="track.letter" class="tier-letter">{{ track.letter }}</span>
              <ul class="slot-pips">
                <li v-for="n in track.filled" :key="`filled-${n}`" class="slot-pip filled"></li>
                <li v-for="n in track.borrowed" :key="`borrowed-${n}`" class="slot-pip filled borrowed">
                  <i class="fas fa-arrow-down"></i>
                </li>
                <li v-for="n in track.overflow" :key="`overflow-${n}`" class="slot-pip overflow"></li>
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

        <!-- Feats. The row is the feat, but the item is the power it belongs
             to, so data-item-id stays truthful for drag and the sheet's
             delegated listeners; the entry's key drives the pip toggle. -->
        <template v-else>
          <ExpandableItem v-for="feat in section.members" :key="feat.id" :item="feat.power" base-class="feat">
            <template #summary="{toggle}">
              <a class="feat-summary" @click="toggle">
                <img :src="feat.power.img" class="feat-power-image"/>
                <h3 class="feat-power-name">{{ feat.power.name }}</h3>
                <span class="tier-letter feat-tier" :data-tier="feat.tier.key">{{ feat.tier.letter }}</span>
                <i class="fas fa-check feat-active" :class="{taken: feat.feat.isActive.value}"
                  :title="localize('ARCHMAGE.ITEM.active')"
                  @click.stop="togglePip(actor, feat.power._id, feat.key)"></i>
              </a>
            </template>
            <template #content="{active}">
              <div v-if="active" class="feat-description" v-html="feat.feat.description.value"></div>
            </template>
          </ExpandableItem>
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
 * higher tier's slot. Rows own their expand state via the shared expandable
 * components; feats toggle through the same pips the powers tab uses.
 */
import { computed } from 'vue';
import { filterFeats, localize, togglePip } from '@/methods/Helpers';
import ExpandableEquipment from '@/components/parts/expandable/ExpandableEquipment.vue';
import ExpandableItem from '@/components/parts/expandable/ExpandableItem.vue';

const props = defineProps(['actor', 'editable', 'context']);

// The tiers, keyed by the values featTiers and system.tier use. 'Z' is the
// data's 'iconic' tier, localized as Zenith. firstSlot is the level the
// tier's slots begin at; cap is how many the tier grants across its levels.
const TIER_SLOTS = [
  { key: 'adventurer', letter: 'A', firstSlot: 1, cap: 4 },
  { key: 'champion', letter: 'C', firstSlot: 5, cap: 3 },
  { key: 'epic', letter: 'E', firstSlot: 8, cap: 3 },
  { key: 'iconic', letter: 'Z', firstSlot: 10, cap: 1 },
];
const TIER_ORDER = Object.fromEntries(TIER_SLOTS.map((tier, i) => [tier.key, i]));

const byName = (a, b) => a.name.localeCompare(b.name);
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

// The character's tier index, from the same tier starts the feats use.
const tierIndexFor = (level) =>
  TIER_SLOTS.reduce((index, tier, i) => level >= tier.firstSlot ? i : index, 0);

// Attunement cost against the level limit: an item at or below your tier
// counts as one; the rules let you attune one tier above and price that at
// two. (Anything higher can't be attuned at all; it still counts as two.)
const itemCost = (item, charTier) => (TIER_ORDER[item.system?.tier] ?? 0) > charTier ? 2 : 1;

/**
 * Slot bookkeeping for one track: filled pips up to the allowance, squared
 * alert pips past it, hollow pips for what's left.
 */
const slotTrack = (key, consumed, slots) => ({
  key,
  filled: Math.min(consumed, slots),
  overflow: Math.max(consumed - slots, 0),
  free: Math.max(slots - consumed, 0),
  shown: slots > 0 || consumed > 0,
});

/**
 * The two inventories with their slot tracks. Equipment whose tier is unset
 * (the item sheet's none option) isn't a magic item and lives on the catalog
 * tab. Feats with no text are skipped, matching the power sheet's read view.
 */
const sections = computed(() => {
  const items = props.actor?.items ?? [];
  const level = Number(props.actor?.system?.attributes?.level?.value) || 0;
  const charTier = tierIndexFor(level);

  // Tier first, then name; the stable sort needs the minor key applied first.
  const magicItems = items
    .filter(i => i.type === 'equipment' && TIER_ORDER[i.system?.tier] !== undefined)
    .sort(byName).sort(byTier);
  const powers = items.filter(i => i.type === 'power').sort(byName);

  // Magic item slots: the level total, no tier split. Each higher-tier
  // attunement burns two.
  const itemsConsumed = magicItems.reduce((sum, item) => sum + itemCost(item, charTier), 0);

  const featsForTier = (tier) => powers.flatMap(power =>
    Object.entries(filterFeats(power.system?.feats))
      .filter(([, feat]) => feat.tier?.value === tier.key)
      .map(([key, feat]) => ({
        key,
        id: `${power._id}.${key}`,
        power,
        feat,
        tier,
      })));

  // Feat slots: each level grants a slot in its tier's track — one per level
  // 1-4 for A, 5-7 for C, 8-10 for E — plus the single Z slot at 10th. A
  // tier's own feats fill its slots first; past that, feats spend the next
  // tier up, and the borrowed pips wear the down-arrow. Whatever the
  // cascade can't place alerts on the last track that shows.
  const takenByTier = new Map(TIER_SLOTS.map(tier =>
    [tier.key, featsForTier(tier).filter(({feat}) => feat.isActive.value).length]));

  let spill = 0;
  const featTracks = TIER_SLOTS.map(tier => {
    const allowance = Math.min(Math.max(level - tier.firstSlot + 1, 0), tier.cap);
    const own = takenByTier.get(tier.key);
    const demand = own + spill;
    const filled = Math.min(demand, allowance);
    const ownFilled = Math.min(own, filled);
    spill = demand - filled;
    return {
      key: tier.key,
      letter: tier.letter,
      filled: ownFilled,
      borrowed: filled - ownFilled,
      overflow: 0,
      free: allowance - filled,
      shown: allowance > 0 || filled > 0,
    };
  });
  if (spill > 0) {
    const lastShown = featTracks.findLast(track => track.shown);
    if (lastShown) lastShown.overflow = spill;
  }

  return [
    {
      key: 'equipment',
      kind: 'equipment',
      labelKey: 'ARCHMAGE.INVENTORY.equipment',
      members: magicItems,
      tracks: [slotTrack('items', itemsConsumed, level)],
    },
    {
      key: 'feats',
      kind: 'feats',
      labelKey: 'ARCHMAGE.feats',
      members: TIER_SLOTS.flatMap(featsForTier),
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
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
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
    font-size: var(--v3-font-size-title);
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
    width: 8px;
    height: 8px;
    background: transparent;
    border-radius: 50%;
    border: 2px solid $c-white;
    margin: 0 1px;
    padding: 0;

    &.filled {
      background: $c-white;
    }

    // A slot a lower-tier feat spent: the arrow marks the down-spend.
    &.borrowed i {
      font-size: 6px;
      line-height: 0;
      color: var(--c-black);
    }

    &.overflow {
      border-radius: 1px;
      background: var(--v3-negative);
      border-color: var(--v3-negative);
    }
  }

  .loadout-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  // The feat row's summary: the parent power's portrait and name stand in for
  // the feat's, since the feat has no name of its own.
  .feat-item {
    position: relative;
  }

  .feat-summary {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.125rem 0.25rem;
    cursor: pointer;
    font-family: var(--v3-font-label);
    font-size: var(--v3-font-size-title);

    .feat-power-image {
      width: 25px;
      height: 25px;
      object-fit: cover;
      border-radius: 0.25rem;
    }

    .feat-power-name {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      font-family: var(--v3-font-display);
      font-size: var(--v3-font-size-value);
      font-weight: normal;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // The feat's tier, quieter than the header chips.
    .feat-tier {
      flex: 0 0 auto;
      opacity: 0.6;
    }

    // Whether the feat is taken; click to toggle, like the feat pips.
    .feat-active {
      flex: 0 0 auto;
      opacity: 0.25;
      cursor: pointer;

      &.taken {
        opacity: 1;
        color: var(--v3-positive);
      }
    }
  }

  .feat-content {
    overflow: hidden;
  }

  .feat-description {
    padding: 0.25rem 0.5rem 0.25rem 2rem;
    font-size: var(--v3-font-size-label);
    color: var(--v3-text-muted);

    :deep(p) {
      margin: 0;
    }
  }

  .loadout-empty {
    margin: 0;
    padding: 0 0.25rem;
    color: var(--v3-text-muted);
  }
</style>
