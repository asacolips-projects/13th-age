<template>

  <fieldset class="fieldset-attack">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.attacks') }}</legend>
    <InlineRollsReferenceHint/>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.attack')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.attackTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.attack.value"
          :value="item.system.attack.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.attackPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.hit')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.hit.value"
          :value="item.system.hit.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.miss')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.missTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.miss.value"
          :value="item.system.miss.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.missPlaceholder')"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-special">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.special') }}</legend>
    <InlineRollsReferenceHint compact="true"/>
    <p class="hint" v-html="game.i18n.localize('ARCHMAGE.TOOLTIP.actionSpecialHint')"></p>

    <fieldset v-for="index in 5" :key="index">
      <legend>{{game.i18n.localize(`ARCHMAGE.CHAT.hit${index}`)}}</legend>
      <div class="form-group">
        <label>
          {{game.i18n.localize(`ARCHMAGE.CHAT.trigger`)}}
          <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.triggerTitle')"/>
        </label>
        <div class="field">
          <TextareaGrow :name="`system.hit${index}.name`"
            :value="item.system[`hit${index}`].name"
            :placeholder="game.i18n.localize(`ARCHMAGE.CHAT.hit${index}NamePlaceholder`)"
          />
        </div>
      </div>

      <div class="form-group">
        <label>
          {{game.i18n.localize(`ARCHMAGE.CHAT.effect`)}}
          <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitTitle')"/>
        </label>
        <div class="field">
          <TextareaGrow :name="`system.hit${index}.value`"
            :value="item.system[`hit${index}`].value"
            :placeholder="game.i18n.localize(`ARCHMAGE.CHAT.hit${index}ValuePlaceholder`)"
          />
        </div>
      </div>
    </fieldset>

  </fieldset>
</template>

<script setup>
  import {
    TextareaGrow,
    Prosemirror,
    InlineRollsReferenceHint,
    InfoBubble,
  } from '@/components';
  const props = defineProps(['item', 'context']);
</script>