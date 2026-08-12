<template>
  <section class="section section--powers flexcol power-importer-class">
    <!-- The class' journal page, when there is one. -->
    <div v-if="tab.classContent" class="class-content" v-html="tab.classContent"></div>

    <p class="prepopulate-help">{{localize('ARCHMAGE.PREPOPULATE.help')}}</p>

    <!-- Powers, by type and then by level. -->
    <section v-for="group in tab.powerGroups" :key="group.type" class="power-group">
      <div class="power-group-header">
        <h2 class="power-list-title">{{localize(`ARCHMAGE.${group.type}s`)}}</h2>
      </div>
      <template v-for="entry in group.levels" :key="entry.level">
        <h3 class="power-list-subtitle">{{localize('ARCHMAGE.level')}} {{entry.level}} {{localize(`ARCHMAGE.${group.type}s`)}}</h3>
        <ul class="power-group-content flexcol">
          <li v-for="row in entry.powers" :key="row.id" class="item power-item">
            <!-- Clickable power header, matching the character sheet's rows. -->
            <PowerSummaryRow :power="row.power" :active="!!expanded[row.id]" @toggle="toggle(row.id)">
              <template #image>
                <img :src="row.power.img" class="power-image" :alt="row.power.name"/>
              </template>
              <PowerFeatPips v-if="hasFeats(row.power)" :feats="row.power.system.feats" :all-active="true"/>
              <div class="power-action" v-if="row.power.system.actionType.value">{{getActionShort(row.power.system.actionType.value)}}</div>
              <div class="power-recharge" v-if="row.power.system.recharge.value && ['recharge', 'recharge-desperate'].includes(row.power.system.powerUsage.value)">{{Number(row.power.system.recharge.value) || 16}}+</div>
              <div class="item-controls power-import-select">
                <label :data-tooltip="localize('ARCHMAGE.importSubmit')" @click.stop>
                  <input type="checkbox" :checked="selection.includes(row.id)" @change="$emit('toggle-selection', row.id)"/>
                </label>
              </div>
            </PowerSummaryRow>
            <!-- Expanded power content. -->
            <div class="power-content" :class="expanded[row.id] ? 'active' : ''">
              <Transition name="slide-fade">
                <Power v-if="expanded[row.id]" :power="row.power" :actor="false" :context="context" :all-levels="true"/>
              </Transition>
            </div>
          </li>
        </ul>
      </template>
    </section>
  </section>
</template>

<script>
/**
 * One class' worth of importable powers.
 *
 * Powers are drawn with the same components the character sheet uses, so what
 * you pick here looks like what you end up with.
 */
import { getActionShort, hasFeats, localize } from '@/methods/Helpers';
import Power from '@/components/parts/Power.vue';
import PowerFeatPips from '@/components/parts/PowerFeatPips.vue';
import PowerSummaryRow from '@/components/parts/PowerSummaryRow.vue';

export default {
  name: 'PowerImporterClass',
  props: ['tab', 'context', 'selection'],
  emits: ['toggle-selection'],
  components: {
    Power,
    PowerFeatPips,
    PowerSummaryRow
  },
  setup() {
    return {
      getActionShort,
      hasFeats,
      localize,
    }
  },
  data() {
    return {
      // Which powers have been expanded to show their text, keyed by id.
      expanded: {}
    }
  },
  methods: {
    toggle(id) {
      this.expanded[id] = !this.expanded[id];
    }
  },
  async mounted() {
    this.tab.opened = true;
  }
}
</script>
