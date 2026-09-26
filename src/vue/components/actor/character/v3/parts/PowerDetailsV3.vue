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
      <div v-for="(feat, index) in feats" :key="index" class="power-feat" :class="{active: feat.isActive.value}">
        <strong class="detail-label">{{ localize(`ARCHMAGE.CHAT.${feat.tier?.value}`) }}:</strong>
        <Enriched tag="div" class="detail-value" :text="feat.description.value" :replacements="[]"
          :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData"
          :enrichment-options="enrichmentOptions"/>
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
import { computed } from 'vue';
import { filterFeats, localize } from '@/methods/Helpers';
import { isPowerFieldVisible, powerFieldKeys } from '@src/module/item/power-fields.mjs';
import { powerUsageColor } from '@src/module/item/power-usage.mjs';
import Enriched from '@/components/parts/Enriched.vue';

const props = defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const diceFormulaMode = computed(() => props.actor?.flags?.archmage?.diceFormulaMode ?? 'short');

const detailFields = computed(() => powerFieldKeys()
  .filter(key => props.power.system[key]?.value)
  .filter(key => isPowerFieldVisible(props.power, key, props.actor)));

const feats = computed(() => Object.values(filterFeats(props.power.system.feats)));

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
  }
</style>
