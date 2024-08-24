<template>
  <section :class="classes">
    <h2 class="unit-title">{{localize('ARCHMAGE.CHARACTERSETTINGS.settings')}}</h2>
    <section class="sheet-settings grid grid-4col">
      <!-- Flag Settings -->
      <div class="unit unit--flags">
        <div v-for="(flag, f) in flags" :key="f" :data-key="f" class="settings-flags">
          <label :for="concat('flags.archmage.', f)" class="unit-subtitle flexrow"><input type="checkbox" :name="concat('flags.archmage.', f, )" v-model="flag.value"> {{flag.name}}</label>
          <p class="notes">{{flag.hint}}</p>
        </div>
      </div>
      <!-- Resource Settings -->
      <div class="unit unit--resources">
        <!-- Stoke -->
        <div v-if="CONFIG.ARCHMAGE.is2e && actor?.system?.resources?.spendable?.stoke" class="settings-resource">
          <input type="checkbox" name="system.resources.spendable.stoke.enabled" v-model="actor.system.resources.spendable.stoke.enabled">
          <strong class="unit-subtitle">{{localize('ARCHMAGE.CHARACTER.RESOURCES.stoke')}}</strong>
        </div>
        <!-- Custom -->
        <div v-for="(resource, r) in resourcesCustom" :key="r" class="settings-resource" :data-key="r">
          <input type="checkbox" :name="concat('system.resources.spendable.', r, '.enabled')" v-model="resource.enabled">
          <strong class="unit-subtitle">{{localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r))}}</strong>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
export default {
  name: 'NpcSettings',
  props: ['actor', 'owner', 'tab'],
  setup() {
    return {
      concat,
      localize,
      CONFIG,
    }
  },
  computed: {
    flags() {
      let flags = CONFIG.Actor.npcFlags;
      let charFlags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
      for (let [k, v] of Object.entries(flags)) {
        v.value = charFlags && charFlags[k] ? charFlags[k] : null;
        flags[k] = v;
      }
      return flags;
    },
    resourcesCustom() {
      let resources = {};
      if (this.actor.system?.resources?.spendable) {
        for (let [k,v] of Object.entries(this.actor.system.resources.spendable)) {
          if ( v.secondEdition && !game.settings.get('archmage', 'secondEdition') ) continue;
          if (k.includes('custom')) resources[k] = v;
        }
      }
      return resources;
    },
    classes() {
      return `section section--settings flexcol`;
    },
    overrides() {
      return Object.keys(this.actor.overrides);
    }
  },
  methods: { /* See created. */},
  async mounted() {}
}
</script>

<style lang="scss">
.archmage-v2.npc-sheet {
  .section--settings {
    .unit--flags {
      grid-column-end: span 2;
    }

    .unit--resources {
      grid-column-start: 3;
      grid-column-end: span 2;
    }
  }
}
</style>