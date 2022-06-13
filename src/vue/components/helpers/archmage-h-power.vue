<template>
  <section class="power">
    <!-- Group, range, and quick info. -->
    <header class="power-header flexcol">
      <strong v-if="power.data.group.value">{{power.data.group.value}}</strong>
      <em v-if="power.data.range.value">{{power.data.range.value}}</em>
      <div class="power-subheader flexrow">
        <strong v-if="power.data.actionType.value">{{localize(concat('ARCHMAGE.',power.data.actionType.value))}}</strong>
        <strong v-if="power.data.powerUsage.value">{{constants.powerUsages[power.data.powerUsage.value]}}</strong>
        <strong v-if="power.data.powerType.value">{{constants.powerTypes[power.data.powerType.value]}}</strong>
      </div>
    </header>
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="power-details flexcol">
      <div v-if="power.data.description.value" class="power-detail power-detail--description">
        <span class="power-detail-value" v-html="power.data.description.value"></span>
      </div>
      <div class="power-detail" v-for="field in powerDetailFields" :key="field">
        <strong class="power-detail-label">{{power.data[field].label}}:</strong> <span class="power-detail-value" v-html="power.data[field].value"></span>
      </div>
    </section>
    <!-- Feats. -->
    <section class="power-feats flexcol">
      <div v-for="(feat, tier) in filterFeats(power.data.feats)" :key="tier" :class="concat('power-feat ', (feat.isActive.value ? 'active' : ''))">
        <strong class="power-detail-label">{{localize(concat('ARCHMAGE.CHAT.', tier))}}:</strong>
        <div class="power-detail-content" v-html="feat.description.value"></div>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: ['power'],
  data: () => ({}),
  computed: {
    constants() {
      return CONFIG.ARCHMAGE;
    },
    powerDetailFields() {
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
        'cost',
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
      ];

      powerFields = powerFields.filter(p => this.power.data[p].value);

      return powerFields;
    }
  },
  methods: {
    /**
     * Filter empty feats
     */
    filterFeats(featObj) {
      let res = {}
      for (let [tier, feat] of Object.entries(featObj)) {
        if (feat.description.value) res[tier] = feat;
      }
      return res;
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>