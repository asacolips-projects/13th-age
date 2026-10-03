<template>
  <section class="section section--powers section--main flexcol power-importer-class">
    <!-- Anything the tab adds above its listing, such as the "other" tab's
         compendium list. -->
    <slot name="header"></slot>

    <!-- The class' journal page, when there is one. -->
    <div v-if="tab.classContent" class="class-content" v-html="tab.classContent"></div>

    <p class="prepopulate-help">{{localize('ARCHMAGE.PREPOPULATE.help')}}</p>

    <p v-if="!tab.sections.length" class="power-import-empty">{{localize('ARCHMAGE.PREPOPULATE.otherEmpty')}}</p>

    <!-- Powers, by compendium on the "other" tab, then by type, then by
         level, then by custom group. -->
    <section v-for="source in tab.sections" :key="source.key" class="power-import-source">
      <h2 v-if="source.label" class="power-import-source-title">{{source.label}}</h2>
      <section v-for="group in source.powerGroups" :key="group.type" class="power-group">
        <div class="power-group-header">
          <h2 class="power-list-title">{{localize(`ARCHMAGE.${group.type}s`)}}</h2>
        </div>
        <template v-for="entry in group.levels" :key="entry.level">
          <h3 class="power-list-subtitle">{{localize('ARCHMAGE.level')}} {{entry.level}} {{localize(`ARCHMAGE.${group.type}s`)}}</h3>
          <!-- Then by custom group, for the powers that have one. -->
          <template v-for="customGroup in entry.groups" :key="customGroup.name">
            <h4 v-if="customGroup.name" class="power-list-group">{{customGroup.name}}</h4>
            <ul class="power-group-content power-import-list">
              <PowerImporterRow v-for="row in customGroup.powers" :key="row.key"
                :row="row" :context="context" :selection="selection" :expanded="expanded"
                @toggle-selection="$emit('toggle-selection', $event)"
                @toggle-expanded="toggle"/>
            </ul>
          </template>
        </template>
      </section>
    </section>
  </section>
</template>

<script>
/**
 * One class' worth of importable powers, or one per compendium on the
 * "other" tab.
 *
 * Powers are drawn with the same components the character sheet uses, so what
 * you pick here looks like what you end up with.
 */
import { localize } from '@/methods/Helpers';
import PowerImporterRow from '@/components/dialogs/power-importer/PowerImporterRow.vue';

export default {
  name: 'PowerImporterClass',
  props: ['tab', 'context', 'selection'],
  emits: ['toggle-selection'],
  components: {
    PowerImporterRow
  },
  setup() {
    return {
      localize,
    }
  },
  data() {
    return {
      // Which rows have been expanded to show their text, keyed by row key.
      expanded: {}
    }
  },
  methods: {
    toggle(key) {
      this.expanded[key] = !this.expanded[key];
    }
  },
  async mounted() {
    this.tab.opened = true;
  }
}
</script>
