<template>
  <section class="section section--powers section--main flexcol power-importer-class">
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
        <ul class="power-group-content power-import-list">
          <li v-for="row in entry.powers" :key="row.id" class="item power-item">
            <!-- Clickable power header, matching the character sheet's rows. -->
            <!-- The trigger goes in a Foundry tooltip rather than the row's own
                 hover box: that box is absolutely positioned inside the row,
                 and so is fragmented by the multi-column list, which makes the
                 columns rebalance the moment it appears. -->
            <PowerSummaryRow :power="row.power" :active="!!expanded[row.id]" @toggle="toggle(row.id)"
              :trigger="false" :data-tooltip="triggerTooltip(row)" data-tooltip-direction="DOWN">
              <template #image>
                <img :src="row.power.img" class="power-image" :alt="row.power.name"/>
              </template>
              <PowerFeatPips v-if="hasFeats(row.power)" :feats="row.power.system.feats"/>
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
                <Power v-if="expanded[row.id]" :power="row.power" :actor="false" :context="context" :all-levels="true" :feats-active="true"/>
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
    },
    /**
     * A power's trigger text, as tooltip markup, or undefined for powers
     * without one, and for powers already expanded to show their full text.
     * Foundry renders tooltips in its own layer at the root of the document, so
     * this costs the list no layout.
     */
    triggerTooltip(row) {
      const trigger = row.power.system.trigger?.value;
      if (!trigger || this.expanded[row.id]) return undefined;
      const escaped = trigger.replace(/[&<>"]/g, char => `&#${char.charCodeAt(0)};`);
      return `<p style="text-align: left; margin: 0;"><strong>${localize('ARCHMAGE.CHAT.trigger')}:</strong> ${escaped}</p>`;
    }
  },
  async mounted() {
    this.tab.opened = true;
  }
}
</script>
