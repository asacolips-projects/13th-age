<template>
  <section :class="`power ${includeTitle ? 'include-title': ''}`">
    <!-- Optionally show the title bar. -->
    <div v-if="includeTitle" :class="`power-summary grid power-grid ${powerUsageClass(power)} ${power.system.trigger.value ? 'power-summary--trigger' : ''} active`">
      <span class="power-name" :data-item-id="power._id">
        <h3 class="power-title unit-subtitle"><span v-if="power.system.powerLevel.value">[{{power.system.powerLevel.value}}] </span> {{power.name}}</h3>
      </span>
    </div>
    <!-- Group, range, and quick info. -->
    <header class="power-header flexcol">
      <strong v-if="power.system.group.value">{{power.system.group.value}}</strong>
      <em v-if="power.system.range.value">{{power.system.range.value}}</em>
      <div class="power-subheader flexrow">
        <strong v-if="power.system.actionType.value">{{localize(`ARCHMAGE.${power.system.actionType.value}`)}}</strong>
        <strong v-if="power.system.powerUsage.value">{{constants.powerUsages[power.system.powerUsage.value]}}</strong>
        <strong v-if="power.system.powerType.value">{{constants.powerTypes[power.system.powerType.value]}}</strong>
        <strong v-if="power.system.embeddedMacro.value"><em>{{localize('ARCHMAGE.CHAT.embeddedMacro')}}</em></strong>
      </div>
    </header>
    <!-- Primary properties (attack, hit, effect, etc.). -->
    <section class="power-details flexcol">
      <div v-if="power.system.description.value" class="power-detail power-detail--description">
        <span v-if="enriched" class="power-detail-value" v-html="enriched['system.description.value'].enriched"></span>
        <Suspense v-else>
          <Enriched tag="span" class="power-detail-value" :text="power.system.description.value" :diceFormulaMode="diceFormulaMode" />
        </Suspense>
      </div>
      <template v-for="field in powerDetailFields" :key="field">
        <div v-if="!power.system[field]?.hide && canCastSpell(field)" class="power-detail" :data-field="field">
          <strong class="power-detail-label">{{localize(`ARCHMAGE.CHAT.${field}`)}}:</strong>
          <span v-if="enriched" class="power-detail-value" v-html="enriched[field].enriched"></span>
          <Suspense v-else>
            <Enriched tag="span" class="power-detail-value" :text="power.system[field].value" :replacements="[]" :diceFormulaMode="diceFormulaMode" :rollData="context.rollData" :field="field"/>
          </Suspense>
        </div>
      </template>
    </section>
    <!-- Feats. -->
    <section class="power-feats flexcol">
      <div v-for="(feat, index) in filterFeats(power.system.feats)" :key="index" :class="`power-feat ${feat.isActive.value || includeTitle ? 'active' : ''}`">
        <strong class="feat-detail-label">{{localize(`ARCHMAGE.CHAT.${feat.tier?.value}`)}}:</strong>
        <div class="flexrow">
          <div v-if="enriched" class="power-detail-content" v-html="enriched[`feat.${index}`].enriched"></div>
          <Suspense v-else>
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
import { localize } from '@/methods/Helpers';
import Enriched from '@/components/parts/Enriched.vue';
export default {
  name: 'Power',
  props: ['power', 'actor', 'context', 'include-title', 'enriched'],
  components: {
    Enriched
  },
  setup() {
    return {
      localize,
      CONFIG,
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
     * Determine if this power has one or more feats.
     */
     hasFeats(power) {
      let hasFeats = false;
      if (power && power.system && power.system.feats) {
        for (let [id, feat] of Object.entries(power.system.feats)) {
          if (feat.description.value || feat.isActive.value) {
            hasFeats = true;
            break;
          }
        }
      }
      return hasFeats;
    },
    /**
     * Retrieve the abbreviated action type, such as 'STD' or 'QCK'.
     */
    getActionShort(actionType) {
      if (CONFIG.ARCHMAGE.actionTypesShort[actionType]) {
        return CONFIG.ARCHMAGE.actionTypesShort[actionType];
      }
      return CONFIG.ARCHMAGE.actionTypesShort['standard'];
    },
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
    },
    /**
     * Compute CSS class to assign based on special usage
     */
     powerUsageClass(power) {
      let use = power.system.powerUsage.value ? power.system.powerUsage.value : 'other';
      if (['daily', 'daily-desperate'].includes(use)) use = 'daily';
      else if (use == 'cyclic') {
        if (this.actor?.system.attributes.escalation.value > 0
          && this.actor?.system.attributes.escalation.value % 2 == 0) {
          use = 'at-will cyclic';
        } else use = 'once-per-battle cyclic';
      }
      return use;
    },
    /**
     * Determine if a character is high enough level to cast a spell.
     * 
     * @param {string} field Field name, such as "spellLevel1".
     * @returns {boolean} True if the power's current (or overridden) level
     *   is greater than or equal to this particular field's level.
     */
    canCastSpell(field) {
      if (!field.includes('spellLevel')) return true;

      const overridePowerLevel = this.actor?.flags?.archmage.overridePowerLevel ?? false;
      const actorLevel = Number(this.actor?.system?.attributes?.level?.value ?? 1);
      const powerLevel = Number(this.power.system.powerLevel.value ?? 1);
      return overridePowerLevel
        ? Math.max(actorLevel, powerLevel) >= Number(field.match(/\d+/g)?.[0] ?? 0)
        : powerLevel >= Number(field.match(/\d+/g)?.[0] ?? 0);
    }
  },
  async mounted() {}
}
</script>
