<template>
  <fieldset class="fieldset-description">
    <legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>
    <Prosemirror :editable="context.editable" :field="context.editors['system.description.value']" />
  </fieldset>

  <fieldset class="fieldset-usage">
    <legend>{{ game.i18n.localize('ARCHMAGE.GROUPS.powerUsage') }}</legend>

    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.CHAT.powerUsage') }}</label>
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
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.rechargeHint')" />
      </label>
      <div class="field">
        <input type="number" name="system.recharge.value" v-model="item.system.recharge.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesRemaining') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.usesRemainingHint')" />
      </label>
      <div class="field">
        <input type="number" name="system.quantity.value" v-model="item.system.quantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.usesMax') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.usesMaxHint')" />
      </label>
      <div class="field">
        <input type="number" name="system.maxQuantity.value" v-model="item.system.maxQuantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')" />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.details') }}</legend>

    <!-- active -->
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.active') }}
      </label>
      <div class="field">
        <input type="checkbox" name="system.isActive" v-model="item.system.isActive" />
      </div>
    </div>

    <!-- tier -->
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHAT.tier') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.rechargeHint')" />
      </label>
      <div class="field">
        <select name="system.tier" v-model="item.system.tier">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.featTiers" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
    </div>

    <!-- icons -->
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.icons') }}
      </label>
      <div class="field">
        <input type="text" name="system.icons" v-model="item.system.icons"
          :placeholder="game.i18n.localize('ARCHMAGE.ITEM.iconPlaceholder')" />
      </div>
    </div>

    <!-- publication source -->
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHARACTERSETTINGS.publicationSource') }}
      </label>
      <div class="field">
        <input type="text" name="system.publicationSource" v-model="item.system.publicationSource" placeholder="13tw" />
      </div>
    </div>

    <!-- price -->
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.price') }}
      </label>
      <div class="field">
        <input type="text" name="system.price.value" v-model="item.system.price.value"
          :placeholder="game.i18n.localize('ARCHMAGE.ITEM.pricePlaceholder')" />
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
