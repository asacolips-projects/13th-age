<template>
  <section class="power-importer-settings" :class="open ? 'open' : ''">
    <!-- Collapses the list, to leave room for what it adds. -->
    <header class="power-import-packs-header flexrow" @click="open = !open">
      <h2 class="power-list-title">{{localize('ARCHMAGE.PREPOPULATE.compendiums')}}</h2>
      <a class="power-import-packs-toggle" :aria-expanded="open ? 'true' : 'false'">
        <i :class="open ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </a>
    </header>

    <div v-if="open" class="power-import-packs-body">
      <p class="prepopulate-help">{{localize('ARCHMAGE.PREPOPULATE.compendiumsHelp')}}</p>

      <!-- Compendiums, by the system, module or world they come from. -->
      <section v-for="group in groups" :key="group.label" class="power-import-packs">
        <h3 class="power-list-subtitle">{{group.label}}</h3>
        <ul class="power-import-pack-list">
          <li v-for="pack in group.packs" :key="pack.id" class="power-import-pack">
            <!-- A compendium for the character's own tabs, which can be
                 unlisted unless it's all those tabs have... -->
            <label v-if="pack.ownTabs.length">
              <input type="checkbox" :checked="pack.locked || pack.listed" :disabled="busy || pack.locked"
                @change="$emit('toggle-pack', pack, 'listed', $event.target.checked)"/>
              {{pack.label}}
              <i v-if="pack.locked" class="fas fa-lock" :data-tooltip="localize('ARCHMAGE.PREPOPULATE.compendiumLocked')"></i>
            </label>
            <!-- ...and whose remaining powers, if any, can go on the "other"
                 tab, like the whole of any other compendium. -->
            <label v-if="pack.hasRest" :class="pack.ownTabs.length ? 'power-import-pack-rest' : ''">
              <input type="checkbox" :checked="pack.enabled" :disabled="busy"
                @change="$emit('toggle-pack', pack, 'enabled', $event.target.checked)"/>
              {{pack.ownTabs.length ? localize('ARCHMAGE.PREPOPULATE.compendiumRest') : pack.label}}
            </label>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script>
/**
 * The compendiums the importer lists powers from, at the top of the "other"
 * tab. The ones the character's own tabs are made from can be unlisted, unless
 * one is all a tab has. Whatever those tabs leave out of them can be listed on
 * the "other" tab, like any other compendium.
 *
 * It starts open, since nothing on the "other" tab is ticked to begin with.
 */
import { localize } from '@/methods/Helpers';

export default {
  name: 'PowerImporterSettings',
  props: ['packs', 'busy'],
  emits: ['toggle-pack'],
  setup() {
    return {
      localize,
    }
  },
  data() {
    return {
      open: true
    }
  },
  computed: {
    groups() {
      const groups = new Map();
      for (const pack of this.packs) {
        if (!groups.has(pack.packageLabel)) groups.set(pack.packageLabel, {label: pack.packageLabel, packs: []});
        groups.get(pack.packageLabel).packs.push(pack);
      }
      for (const group of groups.values()) group.packs.sort((a, b) => a.label.localeCompare(b.label));
      return [...groups.values()];
    }
  }
}
</script>
