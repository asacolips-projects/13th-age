<template>

  <!-- Spells -->
  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.higherLevels') }}</legend>
    <InlineRollsReferenceHint />
    <p class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.hideSpellLevelsHint')"></p>
    <div v-for="level in 11" :key="level" class="form-group">
      <!-- Loop through spell levels 2-11. -->
      <template v-if="level > 1">
        <label>{{game.i18n.localize(`ARCHMAGE.CHAT.spellLevel${level}`)}}</label>
        <div class="field flexrow">
          <span class="flexshrink" :data-tooltip="game.i18n.format('ARCHMAGE.CHAT.hideSpellFromChat', {level: level})" data-tooltip-direction="LEFT">
            <label><span class="visually-hidden" v-html="game.i18n.format('ARCHMAGE.CHAT.hideSpellFromChat', {level: level})"></span>
              <input type="checkbox" :name="`system.spellLevel${level}.hide`"
                v-model="item.system[`spellLevel${level}`].hide"
                class="checkbox-disable"
              />
            </label>
          </span>
          <TextareaGrow :name="`system.spellLevel${level}.value`"
            :value="item.system[`spellLevel${level}`].value"
            :placeholder="game.i18n.localize(`ARCHMAGE.CHAT.spellLevel${level}Placeholder`)"
          />
        </div>
      </template>
      <!-- Show a hint for spell level 1. -->
      <template v-else>
        <label>{{ game.i18n.localize('ARCHMAGE.CHAT.spellLevel1') }}</label>
        <div class="field"><p class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.firstLevelHint')"></p></div>
      </template>
    </div>
  </fieldset>

  <!-- Bard -->
  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.CLASSES.bard') }}</legend>
    <InlineRollsReferenceHint compact="true"/>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.CHAT.sustainOn') }}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.sustainOnTitle')"/>
      </label>
      <div class="field">
        <input type="number" name="system.sustainOn.value" 
          v-model="item.system.sustainOn.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.sustainedEffect')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['sustainedEffect']"/>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.finalVerse')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['finalVerse']"/>
      </div>
    </div>
  </fieldset>

  <!-- Cleric -->
  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.CLASSES.cleric') }}</legend>
    <InlineRollsReferenceHint compact="true"/>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.castPower')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['castPower']"/>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.castBroadEffect')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['castBroadEffect']"/>
      </div>
    </div>
  </fieldset>

  <!-- Sorcerer -->
  <fieldset class="fieldset-details">
    <legend>{{ game.i18n.localize('ARCHMAGE.CLASSES.sorcerer') }}</legend>
    <InlineRollsReferenceHint compact="true"/>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.spellChain')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['spellChain']"/>
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.breathWeapon')}}</label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['breathWeapon']"/>
      </div>
    </div>
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