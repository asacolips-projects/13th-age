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
        <strong class="power-detail-label">{{localize(concat('ARCHMAGE.CHAT.', field))}}:</strong> <span class="power-detail-value" v-html="enrichedPowers[field]"></span>
      </div>
    </section>
    <!-- Feats. -->
    <section class="power-feats flexcol">
      <div v-for="(feat, index) in filterFeats(power.system.feats)" :key="index" :class="concat('power-feat ', (feat.isActive.value ? 'active' : ''))">
        <strong class="feat-detail-label">{{localize(concat('ARCHMAGE.CHAT.', feat.tier?.value))}}:</strong>
        <div class="flexrow">
          <div class="power-detail-content" v-html="wrapRolls(feat.description.value, [], diceFormulaMode, context.rollData)"></div>
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
import { concat, localize, wrapRolls } from '@/methods/Helpers';
export default {
  name: 'Power',
  props: ['power', 'actor', 'context'],
  setup() {
    return {
      concat,
      localize,
      wrapRolls
    }
  },
  data() {
    return {
      powerFields: [
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
        'spellLevel3',
        'spellLevel5',
        'spellLevel7',
        'spellLevel9',
        'spellChain',
        'breathWeapon',
        'recharge',
      ],
      enrichedPowers: {},
      enrichedFeats: {},
    }
  },
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
    diceFormulaMode() {
      return this.actor?.flags?.archmage?.diceFormulaMode ?? 'short';
    },
    powerDetailFields() {
      return this.powerFields.filter(p => this.power.system[p].value);
    },
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
  async mounted() {
    for (let field of this.powerFields) {
      wrapRolls(this.power.system[field].value, [], this.diceFormulaMode, this.context.rollData, field).then(enrichedPower => {
        this.enrichedPowers[field] = enrichedPower;
      });
    }

    // @todo enrich feats.
    for (let [featKey, featValue] of Object.entries(this.power.system.feats)) {
      console.log(featKey, featValue);
    }
  }
}
</script>
