<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <!-- One tab per class, kin or feat collection, then everything else. -->
    <section class="container container--top">
      <Tabs group="primary" :tabs="tabKeys" :flags="flags"/>
    </section>

    <section class="container container--bottom power-importer-content">
      <Tab v-for="tab in tabs.primary" :key="tab.key" group="primary" :tab="tab" classes="container container--bottom flexcol">
        <PowerImporterClass v-if="tab.active || tab.opened"
          :tab="tab" :context="context" :selection="selection"
          @toggle-selection="toggleSelection">
          <!-- The "other" tab is where further compendiums are picked, above
               what they add. -->
          <template v-if="tab.key === 'other'" #header>
            <PowerImporterSettings :packs="packs" :busy="busy" @toggle-pack="togglePack"/>
          </template>
        </PowerImporterClass>
      </Tab>
    </section>

    <footer class="power-importer-footer flexrow">
      <span class="power-importer-count">{{selection.length}} {{localize('ARCHMAGE.PREPOPULATE.selected')}}</span>
      <button type="button" @click="context.onCancel()">
        <i class="fas fa-times"></i> {{localize('ARCHMAGE.CHAT.Cancel')}}
      </button>
      <button type="button" :disabled="busy || !selection.length" @click="context.onImport(selection)">
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
import PowerImporterSettings from '@/components/dialogs/power-importer/PowerImporterSettings.vue';

/**
 * A row followed by all the rows below it.
 */
function withDescendants(row) {
  return [row, ...row.children.flatMap(withDescendants)];
}

/**
 * A child row and the rows below it that its tick carries to, or nothing if
 * it's above the actor's level.
 */
function withinLevel(row) {
  return row.withinLevel ? [row, ...row.children.flatMap(withinLevel)] : [];
}

/**
 * Every row across the tabs, top-level or not.
 */
function allRows(tabs) {
  return tabs
    .flatMap(tab => tab.sections)
    .flatMap(section => section.powerGroups)
    .flatMap(group => group.levels)
    .flatMap(level => level.groups)
    .flatMap(group => group.powers)
    .flatMap(row => withDescendants(row));
}

export default {
  name: 'ArchmagePowerImporter',
  props: ['context'],
  components: {
    Tabs,
    Tab,
    PowerImporterClass,
    PowerImporterSettings
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
      packs: this.context.packs,
      // Whether a compendium is being added or removed.
      busy: false,
      // Keys of the rows to import. Class features, and what they grant,
      // start out ticked.
      selection: [...new Set(allRows(this.context.tabs).filter(row => row.selected).map(row => row.key))]
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
     * changed on its own. Ticking only reaches children within the actor's
     * level, and not past them; unticking reaches everything below.
     */
    toggleSelection(row) {
      const select = !this.selection.includes(row.key);
      const rows = select ? [row, ...row.children.flatMap(withinLevel)] : withDescendants(row);
      for (const {key} of rows) {
        const index = this.selection.indexOf(key);
        if (select && index < 0) this.selection.push(key);
        else if (!select && index >= 0) this.selection.splice(index, 1);
      }
    },
    /**
     * Add or remove a compendium's powers. Tabs that are still there keep
     * their state, rows that are still there keep their tick, and rows that
     * are new start out as they would have if the importer had opened with
     * them.
     */
    async togglePack(pack, enabled) {
      this.busy = true;
      try {
        const before = new Set(allRows(this.tabs.primary).map(row => row.key));
        const tabs = await this.context.onTogglePack(pack.id, enabled);
        pack.enabled = enabled;

        const existing = new Map(this.tabs.primary.map(tab => [tab.key, tab]));
        this.tabs.primary = tabs.map(tab => {
          const old = existing.get(tab.key);
          if (!old) return tab;
          Object.assign(old, {label: tab.label, classContent: tab.classContent, sections: tab.sections});
          return old;
        });

        const selected = new Set(this.selection);
        this.selection = [...new Set(allRows(this.tabs.primary)
          .filter(row => before.has(row.key) ? selected.has(row.key) : row.selected)
          .map(row => row.key))];
      }
      finally {
        this.busy = false;
      }
    }
  },
  async mounted() {
    console.log("Power importer mounted.");
  }
}
</script>
