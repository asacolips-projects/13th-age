<template>
  <article class="equipment-details">
    <!-- Quick facts: the usage chip, colour-coded like the powers' usage tags. -->
    <header v-if="usageLabel" class="details-meta">
      <span class="meta-item meta-usage" :class="usageColorClass">{{ usageLabel }}</span>
    </header>

    <!-- Bonuses, then the chakra slot, then the description: sectioned like
         the item sheet's fieldsets for readability. -->
    <fieldset v-if="bonusEntries.length" class="fieldset-bonuses">
      <div v-for="[key, value] in bonusEntries" :key="key" class="equipment-detail">
        <strong class="detail-label">{{ localizeEquipmentBonus(key) }}:</strong>
        <span class="detail-value">{{ numberFormat(value, 0, true) }}</span>
      </div>
    </fieldset>

    <fieldset v-if="chakraLabel" class="fieldset-details">
      <div class="equipment-detail">
        <strong class="detail-label">{{ localize('ARCHMAGE.ITEM.chakraSlot') }}:</strong>
        <span class="detail-value">{{ chakraLabel }}</span>
      </div>
    </fieldset>

    <fieldset v-if="equipment.system.description.value" class="fieldset-description">
      <Enriched tag="div" class="detail-value" :text="equipment.system.description.value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" field="description"
        :enrichment-options="enrichmentOptions"/>
    </fieldset>
  </article>
</template>

<script setup>
/**
 * The read view of an equipment item's full details for V3 listings: the
 * usage chip, its bonuses, chakra slot and description, all enriched like
 * the item sheet enriches them.
 */
import { computed } from 'vue';
import { concat, equipmentBonuses, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers';
import { powerUsageColor } from '@src/module/item/power-usage.mjs';
import Enriched from '@/components/parts/Enriched.vue';

const props = defineProps({
  equipment: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const diceFormulaMode = computed(() => props.actor?.flags?.archmage?.diceFormulaMode ?? 'short');

const bonusEntries = computed(() => Object.entries(equipmentBonuses(props.equipment)));

const chakraLabel = computed(() => {
  const chakra = props.equipment.system.chackra;
  return chakra ? localize(concat('ARCHMAGE.CHAKRA.', chakra, 'Label')) : '';
});

const usageLabel = computed(() => {
  const usage = props.equipment.system.powerUsage?.value;
  return usage ? CONFIG.ARCHMAGE.powerUsages[usage] : '';
});

// The colour the usage chip wears, by the same module the V2 sheets use.
const usageColorClass = computed(() => powerUsageColor(props.equipment, props.actor));

/**
 * The item's document, when it can be resolved. Enrichment needs it to
 * resolve relative UUID links, such as @UUID[.someId].
 */
const itemDocument = computed(() => {
  const uuid = props.actor?.dragData?.uuid;
  if (!uuid || !props.equipment?._id) return null;
  try {
    return fromUuidSync(uuid)?.items?.get(props.equipment._id) ?? null;
  }
  catch (error) {
    return null;
  }
});

/**
 * Enrichment options matching the ones the item sheet enriches with, so the
 * same item reads the same way on both.
 */
const enrichmentOptions = computed(() => ({
  secrets: props.actor?.owner ?? false,
  rollData: props.context?.rollData ?? {},
  relativeTo: itemDocument.value,
}));
</script>

<style scoped lang="scss">
  .equipment-details {
    padding: 0.375rem 0.375rem 0.25rem;
    font-size: var(--v3-font-size-xxs);
  }

  .details-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.125rem 0.75rem;
    margin-bottom: 0.375rem;
    font-family: var(--v3-font-label);
    font-size: var(--v3-font-size-tiny);
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

  // Readability sectioning in the mould of the item sheet's fieldsets
  fieldset {
    margin: 0.375rem 0 0;
    padding: 0.25rem 0 0;
    border: none;
    border-top: 1px solid var(--v3-border);
  }

  .equipment-detail {
    display: flex;
    gap: 0.375rem;
    margin: 0.25rem 0;
  }

  .detail-label {
    flex: 0 0 auto;
  }

  .detail-value {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
