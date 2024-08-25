<template>
  <fieldset class="fieldset-attack">
    <legend>Attacks</legend>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.attack')}}</label>
      <div class="field">
        <TextareaGrow name="system.attack.value"
          :value="item.system.attack.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.attackPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.attackTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.range')}}</label>
      <div class="field">
        <TextareaGrow name="system.range.value"
          :value="item.system.range.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.rangePlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.rangeTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.target')}}</label>
      <div class="field">
        <TextareaGrow name="system.target.value"
          :value="item.system.target.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.targetPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.targetTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.trigger')}}</label>
      <div class="field">
        <TextareaGrow name="system.trigger.value"
          :value="item.system.trigger.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.triggerPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.triggerTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-hit">
    <legend>Hit / Miss</legend>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.always')}}</label>
      <div class="field">
        <TextareaGrow name="system.always.value"
          :value="item.system.always.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.alwaysPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.alwaysTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.hit')}}</label>
      <div class="field">
        <TextareaGrow name="system.hit.value"
          :value="item.system.hit.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.hitEven')}}</label>
      <div class="field">
        <TextareaGrow name="system.hitEven.value"
          :value="item.system.hitEven.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitEvenTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.hitOdd')}}</label>
      <div class="field">
        <TextareaGrow name="system.hitOdd.value"
          :value="item.system.hitOdd.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.hitOddTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.crit')}}</label>
      <div class="field">
        <TextareaGrow name="system.crit.value"
          :value="item.system.crit.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.critPlaceholder')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.miss')}}</label>
      <div class="field">
        <TextareaGrow name="system.miss.value"
          :value="item.system.miss.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.missPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.missTitle')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.missEven')}}</label>
      <div class="field">
        <TextareaGrow name="system.missEven.value"
          :value="item.system.missEven.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.missEvenPlaceholder')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{game.i18n.localize('ARCHMAGE.CHAT.missOdd')}}</label>
      <div class="field">
        <TextareaGrow name="system.missOdd.value"
          :value="item.system.missOdd.value"
          :placeholder="game.i18n.localize('ARCHMAGE.CHAT.hitPlaceholder')"
          :data-tooltip="game.i18n.localize('ARCHMAGE.CHAT.missOddPlaceholder')"
          data-tooltip-direction="RIGHT"
        />
      </div>
    </div>

  </fieldset>
</template>

<script setup>
  import {
    TextareaGrow,
    Prosemirror,
  } from '@/components';
  const props = defineProps(['item']);
</script>