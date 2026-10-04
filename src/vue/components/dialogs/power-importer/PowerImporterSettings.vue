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
            <label>
              <input type="checkbox" :checked="pack.enabled" :disabled="busy"
                @change="$emit('toggle-pack', pack, $event.target.checked)"/>
              {{pack.label}}
              <!-- Only the part the character's tabs leave out. -->
              <span v-if="pack.isDefault" class="power-import-pack-rest">{{localize('ARCHMAGE.PREPOPULATE.compendiumRest')}}</span>
            </label>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script>
/**
 * The compendiums that can be listed on the "other" tab, at the top of it.
 * The ones the character's own tabs list in full are left out; for the ones
 * they only list part of, such as kin powers, this lists the rest. Which of
 * them the character's own tabs draw on is filtered on those tabs.
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
      for (const pack of this.packs.filter(pack => pack.hasRest)) {
        if (!groups.has(pack.packageLabel)) groups.set(pack.packageLabel, {label: pack.packageLabel, packs: []});
        groups.get(pack.packageLabel).packs.push(pack);
      }
      for (const group of groups.values()) group.packs.sort((a, b) => a.label.localeCompare(b.label));
      return [...groups.values()];
    }
  }
}
</script>
