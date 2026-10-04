<template>
  <article class="loot-details">
    <!-- Description: sectioned like the item sheet's fieldsets for
         readability. -->
    <fieldset v-if="equipment.system.description.value" class="fieldset-description">
      <Enriched tag="div" class="detail-value" :text="equipment.system.description.value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" field="description"
        :enrichment-options="enrichmentOptions"/>
    </fieldset>
  </article>
</template>

<script setup>
/**
 * The read view of a loot item's full details for V3 listings: just the
 * description, enriched like the item sheet enriches it. Legacy 'tool' items
 * are rendered here too.
 */
import { useItemEnrichment } from '@/composables/useItemEnrichment';
import Enriched from '@/components/parts/Enriched.vue';

const props = defineProps({
  equipment: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const { diceFormulaMode, enrichmentOptions } = useItemEnrichment(
  () => props.equipment,
  () => props.actor,
  () => props.context
);
</script>

<style scoped lang="scss">
  .loot-details {
    padding: 0.375rem 0.375rem 0.25rem;
    font-size: var(--font-size-14);
  }

  // Readability sectioning in the mould of the item sheet's fieldsets
  fieldset {
    margin: 0.375rem 0 0;
    padding: 0.25rem 0 0;
    border: none;
    border-top: 1px solid var(--color-border);
  }

  .detail-value {
    flex: 1 1 auto;
    min-width: 0;

    :deep(p) {
      margin: 0;
    }
  }
</style>
