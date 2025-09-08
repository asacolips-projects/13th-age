<template>
  <fieldset class="fieldset-description">
    <legend>{{ game.i18n.localize('ARCHMAGE.description') }}</legend>
    <Prosemirror :editable="context.editable" :field="context.editors['system.description.value']"/>
  </fieldset>

  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.details') }}</legend>
    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHAT.powerLevel') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerLevelTitle')"/>
      </label>
      <div class="field">
        <input type="number" name="system.powerLevel.value" 
          v-model="item.system.powerLevel.value"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHAT.group') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.groupTitle')"/>
      </label>
      <div class="field">
        <input type="text" name="system.group.value" 
          v-model="item.system.group.value"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.powerOriginName')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerOriginTitle')"/>
      </label>
      <div class="field">
        <input type="text" name="system.powerOriginName.value" 
          v-model="item.system.powerOriginName.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.powerOriginNamePlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.powerSourceName')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTitle')"/>
      </label>
      <div class="field">
        <input type="text" name="system.powerSourceName.value"
          v-model="item.system.powerSourceName.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.powerSourcePlaceholder')"
        />
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
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.powerSource')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.powerSourceTypeTitle')"/>
      </label>
      <div class="field">
        <select name="system.powerSource.value" v-model="item.system.powerSource.value">
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

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.resources')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.resourcesTitle')"/>
      </label>
      <div class="field">
        <input type="text" name="system.resources.value"
          v-model="item.system.resources.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.resourcesPlaceholder')"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-special">
    <legend>{{ game.i18n.localize('ARCHMAGE.SETTINGS.groups.automation') }}</legend>

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
      <div class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.macroEditorHint')"></div>
        <CodemirrorWrapper class="attribute-value" name="system.embeddedMacro.value"
          :value="item.system.embeddedMacro.value" />
    </div>
  </fieldset>

  <fieldset class="fieldset-sequencer" v-if="context.sequencerEnabled">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.sequencer') }}</legend>
    <p class="hint">{{ game.i18n.localize('ARCHMAGE.CHAT.sequencerDesc') }}</p>

    <div class="form-group stacked">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.sequencerSelf')}}</label>
      <div class="field">
        <input type="text" name="system.sequencer.self"
          v-model="item.system.sequencer.self"
          placeholder="Ex: modules/JB2A_DnD5e/Library/Generic/UI/IconSnowflake_01_Regular_Blue_200x200.webm"
        />
      </div>
    </div>

    <div class="form-group stacked">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.sequencerRay')}}</label>
      <div class="field">
        <input type="text" name="system.sequencer.ray"
          v-model="item.system.sequencer.ray"
          placeholder="Ex: modules/JB2A_DnD5e/Library/Cantrip/Ray_Of_Frost/RayOfFrost_01_Regular_Blue_30ft_1600x400.webm"
        />
      </div>
    </div>

    <div class="form-group stacked">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.sequencerTarget')}}</label>
      <div class="field">
        <input type="text" name="system.sequencer.target"
          v-model="item.system.sequencer.target"
          placeholder="Ex: modules/JB2A_DnD5e/Library/Generic/Explosion/Explosion_04_Regular_Blue_400x400.webm"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.sequencerReverse')}}</label>
      <div class="field">
        <input type="checkbox" name="system.sequencer.reversed"
          v-model="item.system.sequencer.reversed"
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
    InfoBubble,
    InlineRollsReferenceHint,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>