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
      <div class="header-fields flexrow">
        <button class="item-roll flexshrink" @click="itemDocument.roll()"><i class="fas fa-dice-d20"></i><span class="visually-hidden"> Send to Chat</span></button>
        <input type="text" name="name" v-model="context.item.name"/>
      </div>
    </header>

    <div class="section--main">
      <section class="section--fields">
        <!-- Tab links -->
        <Tabs :tabs="context.tabs.primary" no-span="true"/>
    
        <!-- Details fields -->
        <Tab group="primary" :tab="context.tabs.primary.details">
          <ActionDetails :item="context.item" :context="context"/>
        </Tab>
    
        <!-- Attack fields -->
        <Tab v-if="context.item.type === 'action'" group="primary" :tab="context.tabs.primary.attack">
          <ActionAttack :item="context.item" :context="context"/>
        </Tab>

        <!-- Active Effect Fields -->
        <Tab group="primary" :tab="context.tabs.primary.effects">
          <fieldset class="section--effects">
            <legend>{{ game.i18n.localize('ARCHMAGE.activeEffects') }}</legend>
            <p class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.activeEffectsItemHint')"></p>
            <div class="archmage-v2 sheet">
              <section class="section--effects">
                <CharEffects :actor="context.item" :key="context._renderKey"/>
              </section>
            </div>
          </fieldset>
        </Tab>
      </section>
    </div>

  </div>
</template>

<script setup>
import {
  Tabs,
  Tab,
  ActionDetails,
  ActionAttack,
  CharEffects,
} from '@/components';
import { inject } from 'vue';

const props = defineProps(['context']);
const itemDocument = inject('itemDocument');

</script>