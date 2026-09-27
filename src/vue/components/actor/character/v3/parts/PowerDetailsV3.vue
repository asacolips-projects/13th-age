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

    <!-- Description, then the primary properties (attack, hit, effect, ...),
         then feats: sectioned like the item sheet's fieldsets for readability. -->
    <fieldset v-if="power.system.description.value" class="fieldset-description">
      <legend>{{ localize('ARCHMAGE.description') }}</legend>
      <Enriched tag="div" class="detail-value" :text="power.system.description.value" :replacements="[]"
        :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" field="description"
        :enrichment-options="enrichmentOptions"/>
    </fieldset>
    <fieldset v-if="detailFields.length" class="fieldset-details">
      <legend>{{ localize('ARCHMAGE.details') }}</legend>
      <div v-for="field in detailFields" :key="field" class="power-detail" :data-field="field">
        <strong class="detail-label">{{ localize(`ARCHMAGE.CHAT.${field}`) }}:</strong>
        <Enriched tag="div" class="detail-value" :text="power.system[field].value" :replacements="[]"
          :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData" :field="field"
          :enrichment-options="enrichmentOptions"/>
      </div>
    </fieldset>

    <!-- Feats. Feats not yet taken read muted. Each row is a grid: the tier
         letter with the die icon that rolls it (and spends a use), the uses
         left beside it — click/contextmenu to give one back or take one away
         — and the description filling the remainder. -->
    <fieldset v-if="feats.length" class="fieldset-feats">
      <legend>{{ localize('ARCHMAGE.feats') }}</legend>
      <div v-for="{key, feat} in feats" :key="key" class="power-feat" :class="{active: feat.isActive.value}">
        <RollableV3 class="feat-tier" :disabled="!feat.isActive.value" @click="rollFeat(key)">
          <span class="feat-tier-letter">{{ tierLetter(feat) }}</span>
        </RollableV3>
        <span v-if="feat.isActive.value && feat.quantity?.value != null" class="feat-uses-count"
          @click="changeFeatUses(key, true)" @contextmenu.prevent="changeFeatUses(key, false)">{{ feat.quantity?.value }}</span>
        <Enriched tag="div" class="detail-value" :text="feat.description.value" :replacements="[]"
          :dice-formula-mode="diceFormulaMode" :roll-data="context?.rollData"
          :enrichment-options="enrichmentOptions"/>
      </div>
    </fieldset>
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

/**
 * Single-letter prefix of a feat's tier: A for adventurer, C for champion,
 * E for epic.
 */
function tierLetter(feat) {
  return feat.tier?.value?.charAt(0).toUpperCase() ?? '';
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

  // Readability sectioning in the mould of the item sheet's fieldsets: a
  // hairline across each section and a small-caps legend naming it.
  fieldset {
    margin: 0.375rem 0 0;
    padding: 0.25rem 0 0;
    border: none;
    border-top: 1px solid var(--v3-border);
  }

  legend {
    padding: 0;
    font-family: var(--v3-font-label);
    font-size: var(--v3-font-size-title);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--v3-text-muted);
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

  .power-feat {
    display: grid;
    // Fixed widths for the tier and uses cells so the description column
    // starts at the same offset on every row.
    grid-template-columns: 2.25rem 1.5rem 1fr;
    gap: 0.375rem;
    align-items: baseline;
    margin: 0.25rem 0;
    // The V2 feat treatment: untaken feats dim to a quarter strength.
    opacity: 0.25;

    &.active {
      opacity: 1;
    }

    // The description always occupies the third column — rows without a use
    // count would otherwise shift it into the count's column — and it alone
    // carries the V2 feat gradient.
    .detail-value {
      grid-column: 3;
      background: var(--v3-feat);
      padding: 0.375rem 0.75rem;
    }

    // The die icon rolls the feat and spends a use; the letter is the tier.
    .feat-tier {
      font-family: var(--v3-font-label);
    }

    .feat-tier-letter {
      text-transform: uppercase;
    }

    // The uses left: click to give one back, contextmenu to take one away.
    .feat-uses-count {
      cursor: pointer;
      font-family: var(--v3-font-label);
    }
  }
</style>
