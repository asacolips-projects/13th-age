<template>
  <fieldset class="fieldset-details">
    <legend>Details</legend>
    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.CHAT.powerLevel') }}</label>
      <div class="field">
        <input type="number" name="system.powerLevel.value" 
          v-model="item.system.powerLevel.value"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.CHAT.group') }}</label>
      <div class="field">
        <input type="text" name="system.group.value" 
          v-model="item.system.group.value"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.groupTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerOriginName')}}</label>
      <div class="field">
        <input type="text" name="system.powerOriginName.value" 
          v-model="item.system.powerOriginName.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.powerOriginNamePlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerOriginTitle')"
          data-tooltip-direction="RIGHT"/>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerSourceName')}}</label>
      <div class="field">
        <input type="text" name="system.powerSourceName.value"
          v-model="item.system.powerSourceName.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.powerSourcePlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTitle')"
          data-tooltip-direction="RIGHT"/>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerSource')}}</label>
      <div class="field">
        <select name="system.powerSource.value"
          v-model="item.system.powerSource.value"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTypeTitle')"
          data-tooltip-direction="RIGHT">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.powerSources" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerType')}}</label>
      <div class="field">
        <select name="system.powerType.value" v-model="item.system.powerType.value">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.powerTypes" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerUsage')}}</label>
      <div class="field">
        <select name="system.powerUsage.value" v-model="item.system.powerUsage.value">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.powerUsages" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.actionType')}}</label>
      <div class="field">
        <select name="system.actionType.value" v-model="item.system.actionType.value">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.actionTypes" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
  import {
    TextareaGrow,
  } from '@/components';
  const props = defineProps(['item']);
</script>