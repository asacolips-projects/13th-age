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

    <!-- Tab links -->
    <Tabs :tabs="tabs.primary" no-span="true"/>

    <!-- Simulate the rendered power per the character sheet -->
    <Tab group="primary" :tab="tabs.primary.preview">
      <div class="archmage-v2 sheet">
        <section class="section--powers">
          <Power :power="context.item" :context="context" include-title="true" :enriched="context.editors"/>
        </section>
      </div>
    </Tab>

    <!-- Description tab -->
    <Tab group="primary" :tab="tabs.primary.description">
      <Prosemirror :editable="context.editable" :field="context.editors['system.description.value']"/>
    </Tab>

    <!-- Details fields -->
    <Tab group="primary" :tab="tabs.primary.details">
      <PowerDetails :item="context.item" />
    </Tab>

    <!-- Details fields -->
    <Tab group="primary" :tab="tabs.primary.attack">
      <PowerAttack :item="context.item" />
    </Tab>

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
} from '@/components';
import { reactive } from 'vue';

const props = defineProps(['context']);
const tabs = reactive({
  primary: {
    preview: {
      key: 'preview',
      label: game.i18n.localize('ARCHMAGE.preview'),
      active: false,
    },
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
  },
});

</script>