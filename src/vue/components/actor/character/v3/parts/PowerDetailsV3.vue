<template>
  <article class="power-details">
    <!-- Quick facts: group, range, and the action / usage / type tags. -->
    <header class="details-meta">
      <span v-if="power.system.group.value" class="meta-item">{{ power.system.group.value }}</span>
      <span v-if="power.system.range.value" class="meta-item">{{ power.system.range.value }}</span>
      <span v-if="power.system.actionType.value" class="meta-item">{{ localize(`ARCHMAGE.${power.system.actionType.value}`) }}</span>
      <!-- Read from the config rather than localized here, so that 2e's "arc" is used in place of "daily". -->
      <span v-if="usageLabel" class="meta-item meta-usage" :class="usageColorClass">{{ usageLabel }}</span>
      <span v-if="power.system.powerType.value" class="meta-item">{{ localize(`ARCHMAGE.${power.system.powerType.value}`) }}</span>
    </header>

    <!-- Description, then the primary properties (attack, hit, effect, ...). -->
    <div v-if="power.system.description.value" class="power-detail power-detail--description">
      <Enriched tag="div" class="detail-value" :text="power.system.description.value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" field="description"
        :enrichment-options="enrichmentOptions"/>
    </div>
    <div v-for="field in detailFields" :key="field" class="power-detail" :data-field="field">
      <strong class="detail-label">{{ localize(`ARCHMAGE.CHAT.${field}`) }}:</strong>
      <Enriched tag="div" class="detail-value" :text="power.system[field].value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" :field="field"
        :enrichment-options="enrichmentOptions"/>
    </div>

    <!-- Feats. Feats not yet taken read muted. -->
    <section v-if="feats.length" class="details-feats">
      <div v-for="{key, feat} in feats" :key="key" class="power-feat" :class="{active: feat.isActive.value}">
        <strong class="detail-label">{{ localize(`ARCHMAGE.CHAT.${feat.tier?.value}`) }}:</strong>
        <Enriched tag="div" class="detail-value" :text="feat.description.value" :replacements="[]"
          :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData"
          :enrichment-options="enrichmentOptions"/>
        <!-- The die rolls the feat and spends a use; the count is
             click/contextmenu to give one back or take one away. -->
        <div v-if="feat.isActive.value" class="feat-uses">
          <RollableV3 @click="rollFeat(key)"/>
          <span v-if="feat.quantity?.value != null" class="feat-uses-count"
            @click="changeFeatUses(key, true)" @contextmenu.prevent="changeFeatUses(key, false)">{{ feat.quantity?.value }}</span>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup>
/**
 * The read view of a power's full details for V3 listings: quick facts,
 * description, primary properties and feats, all enriched like the item
 * sheet enriches them.
 */
import { computed, inject } from 'vue';
import { filterFeats, localize } from '@/methods/Helpers';
import { isPowerFieldVisible, powerFieldKeys } from '@src/module/item/power-fields.mjs';
import { powerUsageColor } from '@src/module/item/power-usage.mjs';
import Enriched from '@/components/parts/Enriched.vue';
import RollableV3 from '../RollableV3.vue';

const props = defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const diceFormulaMode = computed(() => props.actor?.flags?.archmage?.diceFormulaMode ?? 'short');

const detailFields = computed(() => powerFieldKeys()
  .filter(key => props.power.system[key]?.value)
  .filter(key => isPowerFieldVisible(props.power, key, props.actor)));

const feats = computed(() => Object.entries(filterFeats(props.power.system.feats))
  .map(([key, feat]) => ({key, feat})));

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

const usageLabel = computed(() => {
  const usage = props.power.system.powerUsage?.value;
  if (!usage) return '';
  const label = CONFIG.ARCHMAGE.powerUsages[usage];
  const secondary = props.power.system.powerUsageSecondary?.value;
  return secondary ? `${label} / ${CONFIG.ARCHMAGE.powerUsages[secondary]}` : label;
});

// The colour the usage chip wears, by the same module the V2 sheets use.
const usageColorClass = computed(() => powerUsageColor(props.power, props.actor));

/**
 * The power's document, when it can be resolved. Enrichment needs it to
 * resolve relative UUID links, such as @UUID[.someId].
 */
const itemDocument = computed(() => {
  const uuid = props.actor?.dragData?.uuid;
  if (!uuid || !props.power?._id) return null;
  try {
    return fromUuidSync(uuid)?.items?.get(props.power._id) ?? null;
  }
  catch (error) {
    return null;
  }
});

/**
 * Enrichment options matching the ones the item sheet enriches with, so the
 * same power reads the same way on both.
 */
const enrichmentOptions = computed(() => ({
  secrets: props.actor?.owner ?? false,
  rollData: props.context?.rollData ?? {},
  relativeTo: itemDocument.value,
}));
</script>

<style scoped lang="scss">
  .power-details {
    padding: 0.375rem 0.375rem 0.25rem;
    font-size: var(--v3-font-size-label);
  }

  .details-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.125rem 0.75rem;
    margin-bottom: 0.375rem;
    font-family: var(--v3-font-label);
    color: var(--v3-text-muted);
  }

  .meta-item {
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // The usage tag wears its usage colour as a chip, by the system-wide
  // gradients the colour-blind modes override.
  .meta-usage {
    padding: 0 0.375rem;
    border-radius: 0.25rem;
    color: var(--c-white);
    text-shadow: 0 0 10px var(--c-black--50);

    &.at-will { background: var(--v3-power-will); }
    &.once-per-battle { background: var(--v3-power-battle); }
    &.daily { background: var(--v3-power-daily); }
    &.recharge { background: var(--v3-power-recharge); }
    &.other { background: var(--v3-power-other); }
  }

  .power-detail {
    display: flex;
    gap: 0.375rem;
    margin: 0.25rem 0;
  }

  .detail-label {
    flex: 0 0 auto;
    font-family: var(--v3-font-label);
  }

  .detail-value {
    flex: 1 1 auto;
    min-width: 0;

    :deep(p) {
      margin: 0;
    }
  }

  .details-feats {
    margin-top: 0.5rem;
    padding-top: 0.25rem;
    border-top: 1px solid var(--v3-border);
  }

  .power-feat {
    display: flex;
    gap: 0.375rem;
    margin: 0.25rem 0;

    &:not(.active) .detail-value {
      color: var(--v3-text-muted);
    }

    // The die icon rolls the feat; the count beside it is the uses left.
    .feat-uses {
      flex: 0 0 auto;
      display: flex;
      align-items: baseline;
      gap: 0.125rem;
    }

    .feat-uses-count {
      cursor: pointer;
      font-family: var(--v3-font-label);
    }
  }
</style>
