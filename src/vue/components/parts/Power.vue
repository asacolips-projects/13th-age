<template>
  <section class="power">
    <!-- Group, range, and quick info. -->
    <header class="power-header flexcol">
      <strong v-if="power.system.group.value">{{power.system.group.value}}</strong>
      <em v-if="power.system.range.value">{{power.system.range.value}}</em>
      <div class="power-subheader flexrow">
        <strong v-if="power.system.actionType.value">{{localize(concat('ARCHMAGE.',power.system.actionType.value))}}</strong>
        <strong v-if="power.system.powerUsage.value">{{constants.powerUsages[power.system.powerUsage.value]}}</strong>
        <strong v-if="power.system.powerType.value">{{constants.powerTypes[power.system.powerType.value]}}</strong>
        <strong v-if="power.system.embeddedMacro.value"><em>{{localize('ARCHMAGE.CHAT.embeddedMacro')}}</em></strong>
      </div>
    </header>
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="power-details flexcol">
      <div v-if="power.system.description.value" class="power-detail power-detail--description">
        <span class="power-detail-value" v-html="power.system.description.value"></span>
      </div>
      <div class="power-detail" :data-field="field" v-for="field in powerDetailFields" :key="field">
        <strong class="power-detail-label">{{localize(concat('ARCHMAGE.CHAT.', field))}}:</strong>
        <Suspense>
          <Enriched tag="span" class="power-detail-value" :text="power.system[field].value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData" :field="field"/>
        </Suspense>
      </div>
    </section>
    <!-- Feats. -->
    <section class="power-feats flexcol">
      <div v-for="(feat, index) in filterFeats(power.system.feats)" :key="index" :class="concat('power-feat ', (feat.isActive.value ? 'active' : ''))">
        <strong class="feat-detail-label">{{localize(concat('ARCHMAGE.CHAT.', feat.tier?.value))}}:</strong>
        <div class="flexrow">
          <Suspense>
            <Enriched tag="div" class="power-detail-content" :text="feat.description.value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData"/>
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
import { concat, localize } from '@/methods/Helpers';
import Enriched from '@/components/parts/Enriched.vue';
export default {
  name: 'Power',
  props: ['power', 'actor', 'context'],
  components: {
    Enriched
  },
  setup() {
    return {
      concat,
      localize,
    }
  },
  data() {
    return {}
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
    diceFormulaMode() {
      return this.actor?.flags?.archmage?.diceFormulaMode ?? 'short';
    },
    powerDetailFields() {
      const spellFields = game.settings.get("archmage", "secondEdition")
        ? [
          'spellLevel2',
          'spellLevel3',
          'spellLevel4',
          'spellLevel5',
          'spellLevel6',
          'spellLevel7',
          'spellLevel8',
          'spellLevel9',
          'spellLevel10',
          'spellLevel11',
        ]
        : [
          'spellLevel3',
          'spellLevel5',
          'spellLevel7',
          'spellLevel9',
        ]
      let powerFields = [
        'trigger',
        'sustainOn',
        'target',
        'always',
        'attack',
        'hit',
        'hitEven',
        'hitOdd',
        'crit',
        'miss',
        'missEven',
        'missOdd',
        'resources',
        'castBroadEffect',
        'castPower',
        'sustainedEffect',
        'finalVerse',
        'special',
        'effect',
        ...spellFields,
        'spellChain',
        'breathWeapon',
        'recharge',
      ];

      powerFields = powerFields.filter(p => this.power.system[p].value);
      return powerFields;
    }
  },
  methods: {
    /**
     * Filter empty feats
     */
    filterFeats(featObj) {
      if (!featObj) return {};
      let res = {};
      for (let [tier, feat] of Object.entries(featObj)) {
        if (feat.description.value) res[tier] = feat;
      }
      return res;
    }
  },
  async mounted() {}
}
</script>
