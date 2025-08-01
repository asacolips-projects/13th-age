<template>
  <div :class="`archmage-appv2-vue flexcol`">
    <!-- Header -->
    <header class="sheet-header">
      <img class="profile-img" :src="effect.img" data-edit="img" data-action="onEditImage" :title="effect.name"
        height="100" width="100" />
      <div class="header-fields flexrow">
        <input type="text" name="name" v-model="effect.name" />
      </div>
    </header>

    <fieldset class="section--preview" :class="$style.preview">
      <legend>{{ localize('Preview') }}</legend>
      <div class="archmage-v2 sheet">
        <section class="section--effects">
          <ul class="effects-group-content flexcol">
            <li
              :class="concat('item effect effects-item ', concat('effect-', context.document._id), (context.document.disabled ? ' effects-disabled' : ''))"
              :data-effect-id="effect._id" data-document-class="ActiveEffect" data-drag="true" data-draggable="true"
              draggable="true">
              <div class="effects-summary grid effects-grid effects">
                <div class="effects-icon">
                  <img :src="effect.img ?? 'icons/svg/cowled.svg'" class="effects-image" />
                </div>
                <a class="effects-name" v-on:click="toggleEffect" :data-effects-id="effect._id">
                  <h3 class="effects-title unit-subtitle">{{ effect?.name ?? effect?.label }}</h3>
                </a>
                <div class="effects-bonus flexrow">
                  <div class="bonus" v-for="(bonus, bonusKey) in getChanges(context.document)" :key="bonusKey">
                    <span class="bonus-label"><i :class="bonus.icon"></i> {{ bonus.name }} </span>
                    <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
                    <span class="bonus-value">{{ numberFormat(bonus.value, 0, false) }}</span>
                  </div>
                  <div class="bonus" v-if="effect.flags.archmage?.ongoingDamage">
                    <span class="bonus-label"><i class="fas fa-flask-round-poison"></i>
                      {{ getOngoingDamage(context.document) }}</span>
                  </div>
                  <div class="bonus" v-if="effect.flags.archmage?.duration">
                    <span class="bonus-label"><i class="fas fa-timer"></i> {{ getDuration(context.document) }}</span>
                  </div>
                </div>
                <div class="item-controls effect-controls">
                  <a class="effect-control" :title="localize('ARCHMAGE.context.document.AE.toggle')"><i
                      :class="concat('fas fa-', context.document.disabled ? 'check' : 'times')"></i></a>
                  <a class="effect-control" :title="localize('ARCHMAGE.context.document.AE.edit')"><i
                      class="fas fa-edit"></i></a>
                  <a class="effect-control" :title="localize('ARCHMAGE.context.document.AE.delete')"><i
                      class="fas fa-trash"></i></a>
                </div>
              </div>
              <div v-if="effect.description" class="effect-detail effect-detail--description">
                <Transition name="slide-fade">
                  <div v-if="activeEffects[context.document._id]" class="effect-detail-value"
                    v-html="effect.description"></div>
                </Transition>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </fieldset>

    <div class="section--main">
      <section class="section--fields">
        <!-- Tab links -->
        <Tabs :tabs="tabs.primary" no-span="true" />

        <!-- Details fields -->
        <Tab group="primary" :tab="tabs.primary.details">
          <EffectDetails :effect="effect" :context="context" />
        </Tab>

        <Tab group="primary" :tab="tabs.primary.effects">
          TODO
        </Tab>
      </section>
    </div>

  </div>
</template>

<script setup>
import {
  Tabs,
  Tab,
  EffectDetails,
} from '@/components';
import { inject, reactive, toRaw } from 'vue';
import { concat, localize, localizeEquipmentBonus, numberFormat } from '@/methods/Helpers';

const props = defineProps(['context']);
// Convert the tabs into a new reactive variable so that they
// don't change every time the item is updated.
const rawTabs = toRaw(props.context.tabs);
const tabs = reactive({ ...rawTabs });
// Retrieve a copy of the full item document instance provided by
// the VueApplicationMixin.

const effect = props.context.document;

function getChanges(effect) {
  let changes = [];
  let modes = [
    'question',
    'times',
    'plus',
    "minus",
    'angle-double-down',
    'angle-double-up',
    'undo'
  ]
  effect.changes.forEach(c => {
    if (c.key && c.value) {
      const label = game.archmage.ArchmageUtility.cleanActiveEffectLabel(c.key);
      let change = {
        name: label,
        img: game.archmage.ArchmageUtility.getActiveEffectLabelIcon(label),
        mode: modes[c.mode],
        value: c.value
      };
      if (change.mode === "plus" && change.value < 0) {
        change.mode = "minus";
        change.value = Math.abs(change.value);
      }
      changes.push(change);
    }
  })
  return changes;
}

function getDuration(effect) {
  return game.i18n.localize(CONFIG.ARCHMAGE.effectDurationTypes[effect.flags.archmage.duration]);
}

function getOngoingDamage(effect) {
  return `${effect.flags.archmage.ongoingDamage} ongoing ${effect.flags.archmage.ongoingDamageType} damage`;
}

</script>

<style module>
.preview {
  margin-bottom: 1rem;
}
</style>
