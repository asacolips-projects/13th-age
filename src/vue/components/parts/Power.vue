<template>
  <section :class="`power ${includeTitle ? 'include-title': ''}`">
    <!-- Optionally show the title bar. -->
    <PowerSummaryRow v-if="includeTitle" :power="power" :actor="actor" :image="false" :active="true"/>
    <!-- Group, range, and quick info. -->
    <header class="power-header flexcol">
      <strong v-if="power.system.group.value">{{power.system.group.value}}</strong>
      <em v-if="power.system.range.value">{{power.system.range.value}}</em>
      <div class="power-subheader flexrow">
        <strong v-if="power.system.actionType.value">{{localize(`ARCHMAGE.${power.system.actionType.value}`)}}</strong>
        <!-- Read from the config rather than localized here, so that 2e's "arc" is used in place of "daily". -->
        <strong v-if="power.system.powerUsage.value">{{CONFIG.ARCHMAGE.powerUsages[power.system.powerUsage.value]}}<template v-if="power.system.powerUsageSecondary?.value"> / {{CONFIG.ARCHMAGE.powerUsages[power.system.powerUsageSecondary.value]}}</template></strong>
        <strong v-if="power.system.powerType.value">{{localize(`ARCHMAGE.${power.system.powerType.value}`)}}</strong>
        <strong v-if="power.system.embeddedMacro.value"><em>{{localize('ARCHMAGE.CHAT.embeddedMacro')}}</em></strong>
      </div>
    </header>
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="power-details flexcol">
      <div v-if="power.system.description.value" class="power-detail power-detail--description">
        <span v-if="enriched" class="power-detail-value" v-html="enriched['system.description.value'].enriched"></span>
        <Suspense v-else>
          <Enriched tag="span" class="power-detail-value" :text="power.system.description.value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData" field="description" :enrichmentOptions="enrichmentOptions" />
        </Suspense>
      </div>
      <template v-for="field in powerDetailFields" :key="field">
        <div v-if="allLevels || isPowerFieldVisible(power, field, actor)" class="power-detail" :data-field="field">
          <strong class="power-detail-label">{{localize(`ARCHMAGE.CHAT.${field}`)}}:</strong>
          <span v-if="enriched" class="power-detail-value" v-html="enriched[field].enriched"></span>
          <Suspense v-else>
            <Enriched tag="span" class="power-detail-value" :text="power.system[field].value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData" :field="field" :enrichmentOptions="enrichmentOptions"/>
          </Suspense>
        </div>
      </template>
    </section>
    <!-- Feats. -->
    <section class="power-feats flexcol">
      <div v-for="(feat, index) in filterFeats(power.system.feats)" :key="index" :class="`power-feat ${feat.isActive.value || featsActive ? 'active' : ''}`">
        <strong class="feat-detail-label">{{localize(`ARCHMAGE.CHAT.${feat.tier?.value}`)}}:</strong>
        <div class="flexrow">
          <div v-if="enriched" class="power-detail-content" v-html="enriched[`feat.${index}`].enriched"></div>
          <Suspense v-else>
            <Enriched tag="div" class="power-detail-content" :text="feat.description.value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData" :enrichmentOptions="enrichmentOptions"/>
          </Suspense>
          <div class="feat-uses" v-if="feat.isActive.value">
            <a class="rollable" data-roll-type="feat" :data-roll-opt="power._id" :data-roll-opt2="index"></a>
            <span v-if="feat.quantity?.value !== null" class="feat-uses-rollable" :data-item-id="power._id" :data-item-featKey="index" :data-quantity="feat.quantity?.value">{{feat.quantity?.value}}</span>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import { filterFeats, localize } from '@/methods/Helpers';
import { isPowerFieldVisible, powerFieldKeys } from '@src/module/item/power-fields.mjs';
import Enriched from '@/components/parts/Enriched.vue';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';
export default {
  name: 'Power',
  // Listings that preview what a power can do, rather than what it currently
  // does for its owner, have two things to say about that:
  //   all-levels   lists every per-level entry of a spell, whatever its level.
  //   feats-active renders every feat as though it had been taken, so that they
  //                read as legibly as the rest of the power.
  props: ['power', 'actor', 'context', 'include-title', 'enriched', 'all-levels', 'feats-active'],
  components: {
    Enriched,
    PowerSummaryRow
  },
  setup() {
    return {
      filterFeats,
      isPowerFieldVisible,
      localize,
      CONFIG,
    }
  },
  computed: {
    diceFormulaMode() {
      return this.actor?.flags?.archmage?.diceFormulaMode ?? 'short';
    },
    powerDetailFields() {
      return powerFieldKeys().filter(key => this.power.system[key]?.value);
    },
    /**
     * Enrichment options matching the ones the item sheet enriches with, so the
     * same power reads the same way on both.
     */
    enrichmentOptions() {
      return {
        secrets: this.actor?.owner ?? false,
        rollData: this.context?.rollData ?? {},
        relativeTo: this.itemDocument
      };
    },
    /**
     * The power's document, when it can be resolved. Enrichment needs it to
     * resolve relative UUID links, such as @UUID[.someId].
     */
    itemDocument() {
      const uuid = this.actor?.dragData?.uuid;
      if (!uuid || !this.power?._id) return null;
      try {
        return fromUuidSync(uuid)?.items?.get(this.power._id) ?? null;
      }
      catch (error) {
        return null;
      }
    }
  }
}
</script>
