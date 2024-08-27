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
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.actionType')}}</label>
      <div class="field">
        <select name="system.actionType.value" v-model="item.system.actionType.value">
          <option value="">{{ game.i18n.localize('ARCHMAGE.noneOption') }}</option>
          <option v-for="(label, value) in CONFIG.ARCHMAGE.actionTypes" :key="value" :value="value">{{ label }}</option>
        </select>
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
  </fieldset>

  <fieldset class="fieldset-usage">
    <legend>Usage</legend>

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
      <label>{{ game.i18n.localize('ARCHMAGE.CHAT.recharge') }}</label>
      <div class="field">
        <input type="number" name="system.recharge.value" 
          v-model="item.system.recharge.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.rechargeHint')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.ITEM.usesRemaining') }}</label>
      <div class="field">
        <input type="number" name="system.quantity.value" 
          v-model="item.system.quantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesRemainingHint')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.ITEM.usesMax') }}</label>
      <div class="field">
        <input type="number" name="system.maxQuantity.value" 
          v-model="item.system.maxQuantity.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.ITEM.usesMaxHint')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.resources')}}</label>
      <div class="field">
        <input type="text" name="system.resources.value"
          v-model="item.system.resources.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.resourcesPlaceholder')"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-special">
    <legend>Automation</legend>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.rollTable')}}</label>
      <div class="field">
        <input type="text" name="system.rollTable.value"
          v-model="item.system.rollTable.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.rollTablePlaceholder')"
        />
      </div>
      <p class="hint">{{ game.i18n.localize('ARCHMAGE.CHAT.rollTableTitle') }}</p>
    </div>

    <div class="form-group stacked power-macro-editor">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.embeddedMacro')}}</label>
      <p class="hint">Use the field below to write a macro that executes when the power is used. Available variables are:
       <ul>
        <li><strong>speaker</strong>: User activing the item.</li>
        <li><strong>actor</strong>: Actor that owns the item.</li>
        <li><strong>token</strong>: Active token for the actor that owns the item.</li>
        <li><strong>archmage</strong>: Wrapper for the global game.archmage object</li>
       </ul>
      </p>
      <div class="field">
        <!-- <textarea class="attribute-value"
          name="system.embeddedMacro.value"
          rows="20"
          v-html="item.system.embeddedMacro.value"
          spellcheck="false"></textarea> -->
        <CodemirrorWrapper class="attribute-value"
          name="system.embeddedMacro.value"
          :value="item.system.embeddedMacro.value"
        />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
  import {
    TextareaGrow,
    CodemirrorWrapper,
    Prosemirror,
    InlineRollsReferenceHint,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>