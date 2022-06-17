<template>
  <div :class="concat('archmage-v2-vue flexcol ', nightmode)">

    <!-- Top group -->
    <section class="container container--top flexcol">
      <!-- Header -->
      <CharHeader :actor="actor"/>
      <!-- Attributes section -->
      <CharAttributes :actor="actor"/>
    </section>
    <!-- /Top group -->

    <!-- Bottom group -->
    <section class="container container--bottom flexrow">

      <!-- Left sidebar -->
      <section class="section section--sidebar flexcol">
        <CharInitiative :actor="actor"/>
        <CharAbilities :actor="actor"/>
        <CharBackgrounds :actor="actor"/>
        <CharIconRelationships :actor="actor"/>
        <CharOut :actor="actor" :owner="owner"/>
        <CharIncrementals :actor="actor"/>
      </section>
      <!-- /Left sidebar -->

      <!-- Main content -->
      <section class="section section--main flexcol">

        <!-- Class resources -->
        <CharResources :actor="actor"/>
        <!-- Tabs -->
        <Tabs :actor="actor" group="primary" :tabs="tabs.primary" :flags="flags"/>

        <!-- Tabs content -->
        <section class="section section--tabs-content flexcol">
          <!-- Details tab -->
          <Tab group="primary" :tab="tabs.primary.details">
            <CharDetails :actor="actor" :owner="owner" :tab="tabs.primary.details" :flags="flags"/>
          </Tab>
          <!-- Powers tab -->
          <Tab group="primary" :tab="tabs.primary.powers">
            <CharPowers :actor="actor" :tab="tabs.primary.powers" :flags="flags"/>
          </Tab>
          <!-- Inventory tab -->
          <Tab group="primary" :tab="tabs.primary.inventory">
            <CharInventory :actor="actor" :tab="tabs.primary.inventory" :flags="flags"/>
          </Tab>
          <!-- Effects tab -->
          <Tab group="primary" :tab="tabs.primary.effects">
            <CharEffects :actor="actor" :tab="tabs.primary.effects" :flags="flags"/>
          </Tab>
          <!-- Settings tab -->
          <Tab group="primary" :tab="tabs.primary.settings">
            <CharSettings :actor="actor" :tab="tabs.primary.settings"/>
          </Tab>
        </section>
        <!-- /Tabs content -->

      </section>
      <!-- /Main content -->

    </section>
    <!-- /Bottom group -->

  </div>
</template>


<script>

import { concat, localize } from '@/methods/Helpers';
import {
  Tabs,
  Tab,
  CharHeader,
  CharAttributes,
  CharInitiative,
  CharAbilities,
  CharBackgrounds,
  CharIconRelationships,
  CharOut,
  CharIncrementals,
  CharResources,
  CharDetails,
  CharPowers,
  CharInventory,
  CharEffects,
  CharSettings
} from '@/components';

export default {
  name: 'ArchmageCharacterSheet',
  props: ['context', 'actor', 'owner'],
  components: {
    Tabs,
    Tab,
    CharHeader,
    CharAttributes,
    CharInitiative,
    CharAbilities,
    CharBackgrounds,
    CharIconRelationships,
    CharOut,
    CharIncrementals,
    CharResources,
    CharDetails,
    CharPowers,
    CharInventory,
    CharEffects,
    CharSettings
  },
  setup() {
    return {
      concat
    }
  },
  data() {
    return {
      actorData: {},
      tabs: {
        primary: {
          details: {
            key: 'details',
            label: localize('ARCHMAGE.details'),
            active: false
          },
          powers: {
            key: 'powers',
            label: localize('ARCHMAGE.powers'),
            active: true
          },
          inventory: {
            key: 'inventory',
            label: localize('ARCHMAGE.inventory'),
            active: false
          },
          effects: {
            key: 'effects',
            label: localize('ARCHMAGE.effects'),
            active: false
          },
          settings: {
            key: 'settings',
            label: localize('ARCHMAGE.settings'),
            active: false,
            icon: 'fa-cogs',
            hideLabel: true
          }
        }
      }
    }
  },
  methods: {},
  computed: {
    nightmode() {
      let flags = this.actor.flags ? this.actor.flags.archmage : null;
      return flags && flags.nightmode ? 'nightmode' : '';
    },
    flags() {
      let flags = this.actor.flags ? this.actor.flags.archmage : {};
      let baseFlags = {
        'sheetDisplay': {
          'powers': {
            'groupBy': {'value': 'powerType'},
            'sortBy': {'value': 'custom'}
          },
          'inventory': {
            'sortBy': {'value': 'custom'}
          },
          'tabs': {
            'primary': {'value': 'powers'}
          },
        }
      }
      return mergeObject(baseFlags, flags);
    }
  },
  watch: {},
  async created() {
    console.log("Creating Sheet");
  },
  async mounted() {
    console.log("Sheet Mounted");
  },
};
</script>
