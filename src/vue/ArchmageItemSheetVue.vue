<template>
  <div :class="`archmage-appv2-vue flexcol`">
    <!-- Header -->
    <header class="sheet-header">
      <img
        class="profile-img"
        :src="context.item.img"
        data-edit="img"
        data-action="onEditImage"
        :title="context.item.name"
        height="100"
        width="100"
      />
      <div class="header-fields">
        <input type="text" name="name" v-model="context.item.name"/>
      </div>
    </header>

    <div class="section--main">
      <section class="section--fields">
        <!-- Tab links -->
        <Tabs :tabs="tabs.primary" no-span="true"/>
    
        <!-- Description tab -->
        <Tab group="primary" :tab="tabs.primary.description">
          <Prosemirror :editable="context.editable" :field="context.editors['system.description.value']"/>
        </Tab>
    
        <!-- Details fields -->
        <Tab group="primary" :tab="tabs.primary.details">
          <PowerDetails :item="context.item" :context="context" />
        </Tab>
    
        <!-- Details fields -->
        <Tab group="primary" :tab="tabs.primary.attack">
          <PowerAttack :item="context.item" :context="context"/>
        </Tab>

        <!-- Spell Fields -->
        <Tab group="primary" :tab="tabs.primary.spells">
          <PowerSpells :item="context.item" :context="context"/>
        </Tab>

        <!-- Active Effect Fields -->
        <Tab group="primary" :tab="tabs.primary.effects">
          <fieldset class="section--effects">
            <legend>Active Effects</legend>
            <div class="archmage-v2 sheet">
              <section class="section--powers">
                <CharEffects :actor="context.item" :key="context._renderKey"/>
              </section>
            </div>
          </fieldset>
        </Tab>
      </section>
  
      <fieldset class="section--preview">
        <legend>Preview</legend>
        <div class="archmage-v2 sheet">
          <section class="section--powers">
            <Power :power="context.item" :context="context" include-title="true" :enriched="context.editors"/>
          </section>
        </div>
      </fieldset>
    </div>

  </div>
</template>

<script setup>
import {
  Tabs,
  Tab,
  Prosemirror,
  Power,
  PowerDetails,
  PowerAttack,
  PowerSpells,
  CharEffects,
} from '@/components';
import { reactive } from 'vue';

const props = defineProps(['context']);
const tabs = reactive({
  primary: {
    description: {
      key: 'description',
      label: game.i18n.localize('ARCHMAGE.description'),
      active: false,
    },
    details: {
      key: 'details',
      label: game.i18n.localize('ARCHMAGE.details'),
      active: true,
    },
    attack: {
      key: 'attack',
      label: 'Attack',
      active: false,
    },
    spells: {
      key: 'spells',
      label: 'Spells',
      active: false,
    },
    effects: {
      key: 'effects',
      label: 'Effects',
      active: false,
    }
  },
});

</script>