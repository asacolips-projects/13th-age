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
      <span v-if="power.system.embeddedMacro.value" class="meta-item meta-macro"><em>{{ localize('ARCHMAGE.CHAT.embeddedMacro') }}</em></span>
    </header>

    <!-- Description, then the primary properties (attack, hit, effect, ...),
         then feats: sectioned like the item sheet's fieldsets for readability. -->
    <fieldset v-if="power.system.description.value" class="fieldset-description">
      <Enriched tag="div" class="detail-value" :text="power.system.description.value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" field="description"
        :enrichment-options="enrichmentOptions"/>
    </fieldset>
    <fieldset v-if="detailFields.length" class="fieldset-details">
      <div v-for="field in detailFields" :key="field" class="power-detail" :data-field="field">
        <h4 class="detail-label">{{ localize(`ARCHMAGE.CHAT.${field}`) }}</h4>
        <Enriched tag="div" class="detail-value" :text="power.system[field].value" :replacements="[]"
          :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" :field="field"
          :enrichment-options="enrichmentOptions"/>
      </div>
    </fieldset>

    <!-- Feats: the shared read-view rows. Listings that show them as rows
         of their own outside the details hide the section. -->
    <fieldset v-if="showFeats && feats.length" class="fieldset-feats">
      <PowerFeatsV3 :power="power" :actor="actor" :context="context"/>
    </fieldset>
  </article>
</template>

<script setup>
/**
 * The read view of a power's full details for V3 listings: quick facts,
 * description, primary properties and feats, all enriched like the item
 * sheet enriches them. Listings that show a power's feats as rows of their
 * own outside the details (the loadout tab) hide the section with
 * `showFeats`.
 */
import { computed } from 'vue';
import { filterFeats, localize } from '@/methods/Helpers';
import { useItemEnrichment } from '@/composables/useItemEnrichment';
import { isPowerFieldVisible, powerFieldKeys } from '@src/module/item/power-fields.mjs';
import { powerUsageColor } from '@src/module/item/power-usage.mjs';
import Enriched from '@/components/parts/Enriched.vue';
import PowerFeatsV3 from './PowerFeatsV3.vue';

const props = defineProps({
  power: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
  // The feats section at the bottom; the loadout tab renders the feats as
  // rows of their own beneath the power's row instead.
  showFeats: { type: Boolean, default: true },
});

const { diceFormulaMode, enrichmentOptions } = useItemEnrichment(
  () => props.power,
  () => props.actor,
  () => props.context
);

const detailFields = computed(() => powerFieldKeys()
  .filter(key => props.power.system[key]?.value)
  .filter(key => isPowerFieldVisible(props.power, key, props.actor)));

const feats = computed(() => Object.entries(filterFeats(props.power.system.feats))
  .map(([key, feat]) => ({key, feat})));

const usageLabel = computed(() => {
  const usage = props.power.system.powerUsage?.value;
  if (!usage) return '';
  const label = CONFIG.ARCHMAGE.powerUsages[usage];
  const secondary = props.power.system.powerUsageSecondary?.value;
  return secondary ? `${label} / ${CONFIG.ARCHMAGE.powerUsages[secondary]}` : label;
});

// The colour the usage chip wears, by the same module the V2 sheets use.
const usageColorClass = computed(() => powerUsageColor(props.power, props.actor));
</script>

<style scoped lang="scss">
  .power-details {
    padding: 0.375rem 0.375rem 0.25rem;
    font-size: var(--font-size-15);
  }

  .details-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.125rem 0.75rem;
    margin-bottom: 0.375rem;
    font-family: var(--v3-font-label);
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
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

  // Readability sectioning in the mould of the item sheet's fieldsets
  fieldset {
    margin: 0.375rem 0 0;
    padding: 0.25rem 0 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  .power-detail {
    margin: 0.25rem 0;
  }

  .detail-label {
    margin: 0;
    font-size: var(--font-size-16);
    font-family: var(--v3-font-base);
  }

  .detail-value {
    padding: 0 0.5rem;
    min-width: 0;
  }
</style>
