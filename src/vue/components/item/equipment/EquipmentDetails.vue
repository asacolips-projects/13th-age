<template>
  <fieldset class="fieldset-description">
    <legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>
    <Prosemirror :editable="context.editable" :field="context.editors['system.description.value']"/>
  </fieldset>

  <fieldset class="fieldset-usage">
    <legend>{{ game.i18n.localize('ARCHMAGE.GROUPS.powerUsage') }}</legend>

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
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHAT.recharge') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.rechargeHint')"/>
      </label>
      <div class="field">
        <input type="number" name="system.recharge.value"
          v-model="item.system.recharge.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesRemaining') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.usesRemainingHint')"/>
      </label>
      <div class="field">
        <input type="number" name="system.quantity.value"
          v-model="item.system.quantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesMax') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.usesMaxHint')"/>
      </label>
      <div class="field">
        <input type="number" name="system.maxQuantity.value"
          v-model="item.system.maxQuantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
  import {
    Prosemirror,
    InfoBubble,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>
