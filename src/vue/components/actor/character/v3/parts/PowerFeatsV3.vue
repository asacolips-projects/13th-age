<template>
  <div v-for="{key, feat} in feats" :key="key" class="power-feat" :class="{active: feat.isActive.value}">
    <RollableV3 class="feat-tier" :disabled="!feat.isActive.value" @click="rollFeat(key)">
      <span class="feat-tier-letter">{{ tierLetter(feat) }}</span>
    </RollableV3>
    <span v-if="feat.isActive.value && feat.quantity?.value != null" class="feat-uses-count"
      @click="changeFeatUses(key, true)" @contextmenu.prevent="changeFeatUses(key, false)">{{ feat.quantity?.value }}</span>
    <Enriched tag="div" class="detail-value" :text="feat.description.value" :replacements="[]"
      :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData"
      :enrichment-options="enrichmentOptions"/>
    <span class="feat-active-pip" :class="{active: feat.isActive.value}" :data-tooltip="localize('ARCHMAGE.feats')"
      @click="toggleFeat(key)"></span>
  </div>
</template>

<script setup>
/**
 * A power's feats as the read view's rows: the tier letter with the die
 * icon that rolls it (and spends a use), the uses left beside it — click
 * to give one back, contextmenu to take one away — the description filling
 * the remainder, and the pip toggling the feat's taken state at the row's
 * right edge. PowerDetailsV3 lists them in its feats fieldset; the loadout
 * tab lists them beneath the power's row.
 */
import { computed, inject } from 'vue';
import { filterFeats, localize, TIERS } from '@/methods/Helpers';
import { useItemEnrichment } from '@/composables/useItemEnrichment';
import Enriched from '@/components/parts/Enriched.vue';
import RollableV3 from '../RollableV3.vue';

const props = defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const { diceFormulaMode, enrichmentOptions } = useItemEnrichment(
  () => props.power,
  () => props.actor,
  () => props.context
);

const feats = computed(() => Object.entries(filterFeats(props.power.system.feats))
  .map(([key, feat]) => ({key, feat})));

/**
 * Single-letter tier label: A for adventurer, C for champion, E for epic,
 * Z for zenith (the data's 'iconic' tier).
 */
function tierLetter(feat) {
  return TIERS.find(tier => tier.key === feat.tier?.value)?.letter ?? '';
}

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument', null);

/**
 * Roll a feat: rolls and spends one of its uses, per the item's rollFeat().
 */
function rollFeat(featKey) {
  actorDocument?.items?.get(props.power._id)?.rollFeat(featKey);
}

/**
 * Toggle a feat's taken state: the same flip the power rows' feat pips and
 * the item sheet's checkbox make.
 */
async function toggleFeat(featKey) {
  const item = actorDocument?.items?.get(props.power._id);
  const feat = item?.system?.feats?.[featKey];
  if (!feat) return;

  await item.update({[`system.feats.${featKey}.isActive.value`]: !feat.isActive?.value});
}

/**
 * Give a feat's remaining uses one back (click) or take one away
 * (contextmenu), within its max, the same way the V2 sheet's
 * .feat-uses-rollable behaves.
 */
async function changeFeatUses(featKey, increase = true) {
  const item = actorDocument?.items?.get(props.power._id);
  const feat = item?.system?.feats?.[featKey];
  if (!feat) return;

  const current = Number(feat.quantity?.value) || 0;
  const max = feat.maxQuantity?.value ?? 99;
  const next = increase ? Math.min(max, current + 1) : Math.max(0, current - 1);
  await item.update({[`system.feats.${featKey}.quantity.value`]: next});
}
</script>

<style scoped lang="scss">
  .power-feat {
    display: grid;
    // Fixed widths for the tier and uses cells so the description column
    // starts at the same offset on every row; the last column holds the
    // feat's toggle pip at the row's right edge.
    grid-template-columns: 2.25rem 1.5rem 1fr 1rem;
    gap: 0.375rem;
    align-items: baseline;
    margin: 0.25rem 0;

    // The V2 feat treatment: untaken feats dim to a quarter strength. The
    // dim sits on the content cells rather than the row, so the pip that
    // takes the feat stays clickable at full strength.
    &:not(.active) .feat-tier,
    &:not(.active) .feat-uses-count,
    &:not(.active) .detail-value {
      opacity: 0.5;
    }

    // The description always occupies the third column — rows without a use
    // count would otherwise shift it into the count's column — and it alone
    // carries the V2 feat gradient.
    .detail-value {
      grid-column: 3;
      min-width: 0;
      background: var(--v3-feat);
      padding: 0.375rem 0.75rem;

      :deep(p) {
        margin: 0;
      }
    }

    // The die icon rolls the feat and spends a use; the letter is the tier.
    .feat-tier-letter {
      text-transform: uppercase;
    }

    // The uses left: click to give one back, contextmenu to take one away.
    .feat-uses-count {
      cursor: pointer;
    }

    // The taken-state toggle, mirrored from PowerFeatPips.vue so a feat's pip
    // reads the same here as it does on the power rows. Hollow until taken,
    // filled once it is.
    .feat-active-pip {
      align-self: center;
      justify-self: end;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border: 1px solid var(--color-text-primary);
      border-radius: 50%;
      cursor: pointer;

      &.active {
        background: var(--color-text-primary);
      }
    }
  }
</style>
