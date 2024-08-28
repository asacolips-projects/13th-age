<template>
  <fieldset class="fieldset-feats">
    <legend>{{ game.i18n.localize('ARCHMAGE.feats') }}</legend>
    <div class="form-group stacked feat-actions feat-header">
      <div class="operations">
        <a class="feat-action feat-create" data-action="createFeat"><i class="fas fa-plus"></i> {{ game.i18n.format('ARCHMAGE.newItem', {item: game.i18n.localize('ARCHMAGE.feat')}) }}</a>
      </div>
    </div>

    <fieldset v-for="(feat, featKey) in item.system.feats" :key="featKey">
      <div class="form-group stacked feat-actions">
        <div class="operations">
          <a class="feat-action feat-move-up" data-action="moveFeatUp" :data-feat-key="featKey"><i class="fas fa-angle-up"></i></a>
          <a class="feat-action feat-move-down" data-action="moveFeatDown" :data-feat-key="featKey"><i class="fas fa-angle-down"></i></a>
          <a class="feat-action feat-delete" data-action="deleteFeat" :data-feat-key="featKey"><i class="fas fa-trash"></i></a>
        </div>
      </div>


      <!-- Active -->
      <div class="form-group">
        <label>{{ game.i18n.localize('ARCHMAGE.ITEM.active') }}</label>
        <div class="field">
          <input type="checkbox" :name="`system.feats.${featKey}.isActive.value`" v-model="item.system.feats[featKey].isActive.value"/>
        </div>
      </div>

      <!-- Tier -->
      <div class="form-group">
        <label>{{ game.i18n.localize('ARCHMAGE.CHAT.tier') }}</label>
        <div class="field">
          <select :name="`system.feats.${featKey}.tier.value`" v-model="item.system.feats[featKey].tier.value">
            <option v-for="(name, tier) in CONFIG.ARCHMAGE.featTiers" :key="tier" :value="tier">{{ name }}</option>
          </select>
        </div>
      </div>

      <!-- Usage type -->
      <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.powerUsage')}}</label>
        <div class="field">
          <select :name="`system.feats.${featKey}.powerUsage.value`" v-model="item.system.feats[featKey].powerUsage.value">
            <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
            <option v-for="(label, value) in CONFIG.ARCHMAGE.powerUsages" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <!-- Uses remaining -->
      <div class="form-group">
        <label>
          {{ game.i18n.localize('ARCHMAGE.ITEM.usesRemaining') }}
          <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesRemainingHint')"/>
        </label>
        <div class="field">
          <input type="number" :name="`system.feats.${featKey}.quantity.value`"
            v-model="item.system.feats[featKey].quantity.value"
            :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          />
        </div>
      </div>

      <!-- Max uses -->
      <div class="form-group">
        <label>
          {{ game.i18n.localize('ARCHMAGE.ITEM.usesMax') }}
          <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesMaxHint')"/>
        </label>
        <div class="field">
          <input type="number" :name="`system.feats.${featKey}.maxQuantity.value`"
            v-model="item.system.feats[featKey].maxQuantity.value"
            :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          />
        </div>
      </div>

      <!-- Description -->
      <div class="form-group stacked">
        <label>{{game.i18n.localize('ARCHMAGE.description')}}</label>
        <div class="field">
          <Prosemirror :editable="context.editable" :field="context.editors[`feat.${featKey}`]"/>
        </div>
      </div>

    </fieldset>
  </fieldset>
</template>

<script setup>
  import {
    TextareaGrow,
    Prosemirror,
    InfoBubble,
    InlineRollsReferenceHint,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>