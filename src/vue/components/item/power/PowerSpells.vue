<template>

  <!-- Spells -->
  <fieldset class="fieldset-details">
    <legend>Spells</legend>
    <InlineRollsReferenceHint />
    <p class="hint">Use the checkboxes next to each spell level to hide that level from chat if it's made redundant by a higher level version of the spell.</p>

    <div v-for="level in 11" :key="level" class="form-group">
      <!-- Loop through spell levels 2-11. -->
      <template v-if="level > 1">
        <label>{{game.i18n.localize(`ARCHMAGE.CHAT.spellLevel${level}`)}}</label>
        <div class="field flexrow">
          <span class="flexshrink" data-tooltip="Hide from chat" data-tooltip-direction="LEFT">
            <label><span class="visually-hidden">Hide spell level {{ level }} from chat.</span>
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
        <label>1st Level</label>
        <div class="field"><p class="hint">See the <strong>Hit</strong> and <strong>Effect</strong> fields in the <strong>Attack</strong> tab.</p></div>
      </template>
    </div>
  </fieldset>

  <!-- Bard -->
  <fieldset class="fieldset-details">
    <legend>Bard</legend>
    <InlineRollsReferenceHint compact="true"/>

    <div class="form-group">
      <label>{{ game.i18n.localize('ARCHMAGE.CHAT.sustainOn') }}</label>
      <div class="field">
        <input type="number" name="system.sustainOn.value" 
          v-model="item.system.sustainOn.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.numbersOnly')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.sustainOnTitle')"
          data-tooltip-direction="RIGHT"
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
    <legend>Cleric</legend>
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
    <legend>Sorcerer</legend>
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
    InlineRollsReferenceHint,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>