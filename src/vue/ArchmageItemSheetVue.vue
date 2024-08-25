<template>
  <div :class="`archmage-appv2-vue flexcol`">
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

    <Tabs :tabs="tabs.primary" no-span="true"/>

    <Tab group="primary" :tab="tabs.primary.details">
      <fieldset class="fieldset-details">
        <legend>Details</legend>
        <div class="form-group">
          <label>Level</label>
          <input type="number" name="system.powerLevel.value" 
            v-model="context.item.system.powerLevel.value"
          />
        </div>
  
        <div class="form-group">
          <label>Group</label>
          <input type="text" name="system.group.value" 
            v-model="context.item.system.group.value"
            :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.groupTitle')"
          />
        </div>
  
        <div class="form-group">
          <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerSourceName')}}</label>
          <input type="text" name="system.powerSourceName.value" 
            v-model="context.item.system.powerSourceName.value"
            :placeholder="game.i18n.localize('ARCHMAGE.CHAT.powerSourcePlaceholder')"
            :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTitle')"
          />
        </div>
  
        <div class="form-group">
          <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerSource')}}</label>
          <select name="system.powerSource.value" v-model="context.item.system.powerSource.value" :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTypeTitle')">
            <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
            <option v-for="(label, value) in CONFIG.ARCHMAGE.powerSources" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
  
        <div class="form-group">
          <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerType')}}</label>
          <select name="system.powerType.value" v-model="context.item.system.powerType.value">
            <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
            <option v-for="(label, value) in CONFIG.ARCHMAGE.powerTypes" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
  
        <div class="form-group">
          <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerUsage')}}</label>
          <select name="system.powerUsage.value" v-model="context.item.system.powerUsage.value">
            <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
            <option v-for="(label, value) in CONFIG.ARCHMAGE.powerUsages" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
  
        <div class="form-group">
          <label>{{game.i18n.localize('ARCHMAGE.CHAT.actionType')}}</label>
          <select name="system.actionType.value" v-model="context.item.system.actionType.value">
            <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
            <option v-for="(label, value) in CONFIG.ARCHMAGE.actionTypes" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </fieldset>
    </Tab>


    <Tab group="primary" :tab="tabs.primary.description">
      <Editor :editable="context.editable" :field="context.editors['system.description.value']"/>
    </Tab>
  </div>
</template>

<script setup>
import { Tabs, Tab } from '@/components';
import { reactive, computed } from 'vue';
import Editor from '@/components/parts/Prosemirror.vue';

const props = defineProps(['context']);
const tabs = reactive({
  primary: {
    description: {
      key: 'description',
      label: game.i18n.localize('ARCHMAGE.description'),
      active: true,
    },
    details: {
      key: 'details',
      label: game.i18n.localize('ARCHMAGE.details'),
      active: true,
    },
  },
});

</script>