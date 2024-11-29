<template>
  <div :class="concat('archmage-v2-vue character flexcol ', nightmode)">

    <!-- Top group -->
    <section class="container container--top flexcol">
      <!-- Header -->
      <CharHeader :actor="actor"/>
      <Tabs :actor="actor" group="mobile" :tabs="tabs.mobile" :flags="flags" hamburger="true" />
      <Tab group="mobile" :tab="tabs.mobile.attributes">
        <!-- Attributes section -->
        <CharAttributes :actor="actor"/>
      </Tab>
    </section>
    <!-- /Top group -->

    <!-- Bottom group -->
    <section class="container container--bottom flexrow">

      <!-- Left sidebar -->
      <Tab group="mobile" :tab="tabs.mobile.abilities">
        <section class="section section--sidebar flexcol">
          <CharInitiative :actor="actor"/>
          <CharAbilities :actor="actor"/>
          <CharBackgrounds :actor="actor"/>
          <CharIconRelationships :actor="actor"/>
          <CharOut :actor="actor" :owner="context.owner"/>
          <CharIncrementals :actor="actor"/>
        </section>
      </Tab>
      <!-- /Left sidebar -->

      <!-- Main content -->
      <Tab group="mobile" :tab="tabs.mobile.combat">
        <section class="section section--main flexcol">

          <!-- Class resources -->
          <CharResources :actor="actor"/>
          <!-- Tabs -->
          <Tabs :actor="actor" group="primary" :tabs="tabs.primary" :flags="flags"/>

          <!-- Tabs content -->
          <section class="section section--tabs-content flexcol">
            <!-- Details tab -->
            <Tab group="primary" :tab="tabs.primary.details">
              <CharDetails :actor="actor" :owner="context.owner" :tab="tabs.primary.details" :flags="flags"/>
            </Tab>
            <!-- Powers tab -->
            <Tab group="primary" :tab="tabs.primary.powers">
              <CharPowers :actor="actor" :context="context" :tab="tabs.primary.powers" :flags="flags"/>
            </Tab>
            <!-- Inventory tab -->
            <Tab group="primary" :tab="tabs.primary.inventory">
              <CharInventory :actor="actor" :tab="tabs.primary.inventory" :flags="flags"/>
            </Tab>
            <!-- Effects tab -->
            <Tab group="primary" :tab="tabs.primary.effects">
              <CharEffects :actor="actor" :tab="tabs.primary.effects" :flags="flags" :key="context._renderKey"/>
            </Tab>
            <!-- Settings tab -->
            <Tab group="primary" :tab="tabs.primary.settings" v-if="shouldDisplaySettingsTab(actor)">
              <CharSettings :actor="actor" :tab="tabs.primary.settings"/>
            </Tab>
          </section>
          <!-- /Tabs content -->

        </section>
      </Tab>
      <!-- /Main content -->

    </section>
    <!-- /Bottom group -->

  </div>
</template>


<script>

import { concat, localize } from '@/methods/Helpers';
import CharDetails from '@/components/actor/character/main/CharDetails.vue';
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
  // CharDetails,
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
    CharSettings,
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
            active: false,
            componentClass: CharDetails
          },
          powers: {
            key: 'powers',
            label: localize('ARCHMAGE.powers'),
            active: true,
            componentClass: CharPowers
          },
          inventory: {
            key: 'inventory',
            label: localize('ARCHMAGE.inventory'),
            active: false,
            componentClass: CharInventory
          },
          effects: {
            key: 'effects',
            label: localize('ARCHMAGE.effects'),
            active: false,
            componentClass: CharEffects
          },
          settings: {
            key: 'settings',
            label: localize('ARCHMAGE.settings'),
            active: false,
            icon: 'fa-cogs',
            hideLabel: true,
            hidden: (this.actor.flags?.archmage?.hideSettingsTab === true && !game.user.isGM)
          }
        },
        mobile: {
          attributes: {
            key: 'attributes',
            label: localize('ARCHMAGE.attributes'),
            active: false,
          },
          abilities: {
            key: 'abilities',
            label: localize('ARCHMAGE.abilities'),
            active: false,
          },
          combat: {
            key: 'combat',
            label: localize('ARCHMAGE.combat'),
            active: false,
          }
        }
      }
    }
  },
  methods: {
    shouldDisplaySettingsTab(actor) {
      if (actor?.flags?.archmage?.hideSettingsTab === true && !game.user.isGM) {
        return false;
      }
      return true;
    },
  },
  computed: {
    nightmode() {
      return game.settings.get("archmage", "nightmode") ? 'nightmode' : '';
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
            'primary': {'value': 'powers'},
            'mobile': {'value': 'attributes'},
          },
        }
      }
      return foundry.utils.mergeObject(baseFlags, flags);
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
