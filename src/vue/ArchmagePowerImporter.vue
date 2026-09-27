<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <!-- One tab per class, kin or feat collection. -->
    <section class="container container--top" v-if="tabs.primary.length > 1">
      <Tabs group="primary" :tabs="tabKeys" :flags="flags"/>
    </section>

    <section class="container container--bottom power-importer-content">
      <Tab v-for="tab in tabs.primary" :key="tab.key" group="primary" :tab="tab" classes="container container--bottom flexcol">
        <PowerImporterClass v-if="tab.active || tab.opened"
          :tab="tab" :context="context" :selection="selection"
          @toggle-selection="toggleSelection"/>
      </Tab>
    </section>

    <footer class="power-importer-footer flexrow">
      <span class="power-importer-count">{{selection.length}} {{localize('ARCHMAGE.PREPOPULATE.selected')}}</span>
      <button type="button" @click="context.onCancel()">
        <i class="fas fa-times"></i> {{localize('ARCHMAGE.CHAT.Cancel')}}
      </button>
      <button type="button" :disabled="!selection.length" @click="context.onImport(selection)">
        <i class="fas fa-check"></i> {{localize('ARCHMAGE.importSubmit')}}
      </button>
    </footer>
  </div>
</template>

<script>
import { localize } from '@/methods/Helpers';
import Tabs from '@/components/parts/Tabs.vue';
import Tab from '@/components/parts/Tab.vue';
import PowerImporterClass from '@/components/dialogs/power-importer/PowerImporterClass.vue';

/**
 * A row followed by all the rows below it.
 */
function withDescendants(row) {
  return [row, ...row.children.flatMap(withDescendants)];
}

export default {
  name: 'ArchmagePowerImporter',
  props: ['context'],
  components: {
    Tabs,
    Tab,
    PowerImporterClass
  },
  setup() {
    return {
      localize,
      CONFIG,
      game
    }
  },
  data() {
    return {
      tabs: {
        primary: this.context.tabs
      },
      // Keys of the rows to import. Class features, and what they grant,
      // start out ticked.
      selection: this.context.tabs
        .flatMap(tab => tab.powerGroups)
        .flatMap(group => group.levels)
        .flatMap(level => level.groups)
        .flatMap(group => group.powers)
        .flatMap(row => withDescendants(row))
        .filter(row => row.selected)
        .map(row => row.key)
    }
  },
  computed: {
    nightmode() {
      return game.settings.get("archmage", "nightmode") ? 'nightmode' : '';
    },
    /**
     * The Tabs component takes its tabs keyed by name.
     */
    tabKeys() {
      return Object.fromEntries(this.tabs.primary.map(tab => [tab.key, tab]));
    },
    flags() {
      return {
        'sheetDisplay': {
          'tabs': {
            'primary': {'value': this.context?.defaultTab ?? this.tabs.primary[0]?.key}
          },
        }
      };
    }
  },
  methods: {
    /**
     * Tick or untick a row. What a power grants follows it, and can then be
     * unticked on its own.
     */
    toggleSelection(row) {
      const select = !this.selection.includes(row.key);
      for (const {key} of withDescendants(row)) {
        const index = this.selection.indexOf(key);
        if (select && index < 0) this.selection.push(key);
        else if (!select && index >= 0) this.selection.splice(index, 1);
      }
    }
  },
  async mounted() {
    console.log("Power importer mounted.");
  }
}
</script>
