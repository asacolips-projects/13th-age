<template>
  <fieldset class="fieldset-special">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.effect') }}</legend>
    <InlineRollsReferenceHint/>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.special')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.specialTitle')"/>
      </label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['special']"/>
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.effect')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.effectTitle')"/>
      </label>
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['effect']"/>
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-attack">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.attacks') }}</legend>
    <InlineRollsReferenceHint compact="true"/>

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
        {{game.i18n.localize('ARCHMAGE.CHAT.range')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.rangeTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.range.value"
          :value="item.system.range.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.rangePlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.target')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.targetTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.target.value"
          :value="item.system.target.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.targetPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.trigger')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.triggerTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.trigger.value"
          :value="item.system.trigger.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.triggerPlaceholder')"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-hit">
    <legend>{{ game.i18n.localize('ARCHMAGE.CHAT.hitSlashMiss') }}</legend>
    <InlineRollsReferenceHint compact="true"/>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.always')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.alwaysTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.always.value"
          :value="item.system.always.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.alwaysPlaceholder')"
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
        {{game.i18n.localize('ARCHMAGE.CHAT.hitEven')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitEvenTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.hitEven.value"
          :value="item.system.hitEven.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.hitOdd')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitOddTitle')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.hitOdd.value"
          :value="item.system.hitOdd.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.crit')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.critPlaceholder')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.crit.value"
          :value="item.system.crit.value"
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

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.missEven')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.missEvenPlaceholder')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.missEven.value"
          :value="item.system.missEven.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
        />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{game.i18n.localize('ARCHMAGE.CHAT.missOdd')}}
        <InfoBubble :tooltip="game.i18n.localize('ARCHMAGE.CHAT.missOddPlaceholder')"/>
      </label>
      <div class="field">
        <TextareaGrow name="system.missOdd.value"
          :value="item.system.missOdd.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
        />
      </div>
    </div>

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