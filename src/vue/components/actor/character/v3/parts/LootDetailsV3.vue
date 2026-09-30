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
import { computed } from 'vue';
import { localize } from '@/methods/Helpers';
import Enriched from '@/components/parts/Enriched.vue';

const props = defineProps({
  equipment: { type: Object, required: true },
  actor: { type: [Object, Boolean], default: null },
  context: { type: Object, default: null },
});

const diceFormulaMode = computed(() => props.actor?.flags?.archmage?.diceFormulaMode ?? 'short');

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
  .loot-details {
    padding: 0.375rem 0.375rem 0.25rem;
    font-size: var(--v3-font-size-label);
  }

  // Readability sectioning in the mould of the item sheet's fieldsets
  fieldset {
    margin: 0.375rem 0 0;
    padding: 0.25rem 0 0;
    border: none;
    border-top: 1px solid var(--v3-border);
  }

  .detail-value {
    flex: 1 1 auto;
    min-width: 0;

    :deep(p) {
      margin: 0;
    }
  }
</style>
