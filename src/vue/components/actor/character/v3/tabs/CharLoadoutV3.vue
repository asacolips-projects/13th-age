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

        <!-- Feats, grouped into tiers, each group under its own separator.
             The row is the feat, but the item is the power it belongs to, so
             data-item-id stays truthful for drag and the sheet's delegated
             listeners; the entry's key drives the pip toggle. -->
        <template v-else>
          <template v-for="group in section.tierGroups" :key="group.tier.key">
            <li class="feat-tier-separator">
              <span class="tier-letter" :data-tier="group.tier.key">{{ group.tier.letter }}</span>
              <span class="separator-line" aria-hidden="true"></span>
            </li>
            <ExpandableItem v-for="feat in group.members" :key="feat.id" :item="feat.power" base-class="feat">
              <template #summary="{toggle}">
                <a class="feat-summary" @click="toggle">
                  <img :src="feat.power.img" class="feat-power-image"/>
                  <h3 class="feat-power-name">{{ feat.power.name }}</h3>
                  <span class="tier-letter feat-tier" :data-tier="feat.tier.key">{{ feat.tier.letter }}</span>
                  <span class="feat-active" :class="{taken: feat.feat.isActive.value}"
                    :title="localize('ARCHMAGE.ITEM.active')"
                    @click.stop="togglePip(actor, feat.power._id, feat.key)"></span>
                </a>
              </template>
              <template #content="{active}">
                <div v-if="active" class="feat-description" v-html="feat.feat.description.value"></div>
              </template>
            </ExpandableItem>
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
 * higher tier's slot. Rows own their expand state via the shared expandable
 * components; feats toggle through the same pips the powers tab uses.
 */
import { computed } from 'vue';
import { attunementCost, characterTierIndex, filterFeats, localize, TIERS as TIER_SLOTS, togglePip, TIER_ORDER } from '@/methods/Helpers';
import ExpandableEquipment from '@/components/actor/character/v3/parts/expandable/ExpandableEquipment.vue';
import ExpandableItem from '@/components/actor/character/v3/parts/expandable/ExpandableItem.vue';

const props = defineProps(['actor', 'editable', 'context']);

const byName = (a, b) => a.name.localeCompare(b.name);
const byTier = (a, b) => (TIER_ORDER[a.system?.tier] ?? 0) - (TIER_ORDER[b.system?.tier] ?? 0);

/**
 * Slot bookkeeping for one track: filled pips up to the allowance, squared
 * alert pips past it, hollow pips for what's left. The alert pips carry the
 * tier letter that overran, or none for the tierless magic item track.
 */
const slotTrack = (key, consumed, slots) => ({
  key,
  filled: Math.min(consumed, slots),
  overflow: Array(Math.max(consumed - slots, 0)).fill(null),
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
  const charTier = characterTierIndex(level);

  // Tier first, then name; the stable sort needs the minor key applied first.
  const magicItems = items
    .filter(i => i.type === 'equipment' && TIER_ORDER[i.system?.tier] !== undefined)
    .sort(byName).sort(byTier);
  const powers = items.filter(i => i.type === 'power').sort(byName);

  // Magic item slots: the level total, no tier split. Only attuned items —
  // the ones with their active pip filled — consume slots, and each
  // higher-tier attunement burns two.
  const itemsConsumed = magicItems.reduce((sum, item) => sum + (item.system.isActive ? attunementCost(item, charTier) : 0), 0);

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
  // tier up, and the borrowed pips wear the down-arrow. Whatever the cascade
  // can't place alerts on its own tier's track, each square wearing that
  // tier's letter — which is why a track also shows when it has overflow.
  const takenByTier = new Map(TIER_SLOTS.map(tier =>
    [tier.key, featsForTier(tier).filter(({feat}) => feat.isActive.value).length]));

  // Feats still unplaced, by origin tier letter.
  let spill = [];
  const featTracks = TIER_SLOTS.map(tier => {
    const allowance = Math.min(Math.max(level - tier.firstSlot + 1, 0), tier.cap);
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
      shown: allowance > 0 || filled > 0,
    };
  });
  for (const letter of spill) {
    const track = featTracks.find(track => track.letter === letter);
    if (track) {
      track.overflow.push(letter);
      track.shown = true;
    }
  }

  // Feats grouped by their tier for the separator rows; tiers with no
  // feats under them get no separator.
  const tierGroups = TIER_SLOTS
    .map(tier => ({ tier, members: featsForTier(tier) }))
    .filter(group => group.members.length);

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
      members: tierGroups.flatMap(group => group.members),
      tierGroups,
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

    // The label takes the rest of the row, pushing the pip tracks to the end.
    .section-label {
      flex: 1;
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

    // The feat's tier, same chip as the separator and the header tracks.
    .feat-tier {
      flex: 0 0 auto;
    }

    // Whether the feat is taken: the same open/filled pip the attunement
    // pip is, click to toggle.
    .feat-active {
      flex: 0 0 auto;
      display: block;
      width: 8px;
      height: 8px;
      background: transparent;
      border-radius: 50%;
      border: 1px solid $c-white;
      padding: 0;
      cursor: pointer;

      &.taken {
        background: $c-white;
      }
    }
  }

  // Between tier groups of feats: the tier's letter chip on a hairline that
  // runs to the end of the row.
  .feat-tier-separator {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0.375rem 0 0.125rem;

    &:first-child {
      margin-top: 0;
    }

    .separator-line {
      flex: 1;
      height: 1px;
      background: var(--v3-border);
    }
  }

  .feat-description {
    background: var(--v3-feat);
    padding: 0.375rem 0.75rem 0.375rem 2rem;
    font-size: var(--v3-font-size-label);

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
