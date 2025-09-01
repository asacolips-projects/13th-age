<template>
  <div class="archmage-appv2-vue flexcol effects">
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
                  <div class="bonus" v-for="(bonus, bonusKey) in changes" :key="bonusKey">
                    <span class="bonus-label"><i :class="bonus.icon"></i> {{ bonus.name }} </span>
                    <span class="bonus-mode"><i :class="concat('fas fa-', bonus.mode)"></i> </span>
                    <span class="bonus-value">{{ numberFormat(bonus.value, 0, false) }}</span>
                  </div>
                  <div class="bonus" v-if="effect.flags.archmage?.ongoingDamage">
                    <span class="bonus-label"><i class="fas fa-flask-round-poison"></i>
                      {{ ongoingDamage }}</span>
                  </div>
                  <div class="bonus" v-if="effect.flags.archmage?.duration">
                    <span class="bonus-label"><i class="fas fa-timer"></i> {{ duration }}</span>
                  </div>
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
        <Tabs :tabs="tabs.primary" no-span="true" style="margin-bottom: 0.5rem;" />

        <Tab group="primary" :tab="tabs.primary.general">
          <EffectDetails :effect="effect" :context="context" />
        </Tab>

        <Tab group="primary" :tab="tabs.primary.attack">
          <EffectAttack :effect="effect" :context="context" />
        </Tab>

        <Tab group="primary" :tab="tabs.primary.defense">
          <EffectDefense :effect="effect" :context="context" />
        </Tab>

        <Tab group="primary" :tab="tabs.primary.ongoing">
          <EffectOngoing :effect="effect" :context="context" />
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
  EffectAttack,
  EffectDefense,
  EffectOngoing,
} from '@/components';
import { computed, inject, reactive, toRaw, watch } from 'vue';
import { concat, localize, numberFormat } from '@/methods/Helpers';

const props = defineProps(['context']);
const foundryEffect = inject('itemDocument')
// Convert the tabs into a new reactive variable so that they
// don't change every time the item is updated.
const rawTabs = toRaw(props.context.tabs);
const tabs = reactive({ ...rawTabs });
// Retrieve a copy of the full item document instance provided by
// the VueApplicationMixin.

const effect = computed(() => props.context.document);

const modes = [
  'question',
  'times',
  'plus',
  "minus",
  'angle-double-down',
  'angle-double-up',
  'undo'
]

const changes = computed(() => {
  const changesArray = [];
  effect.value.changes.forEach(c => {
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
      changesArray.push(change);
    }
  });
  return changesArray;
});

const duration = computed(() => {
  const rawDuration = effect.value.flags.archmage.duration
  return game.i18n.localize(CONFIG.ARCHMAGE.effectDurationTypes[rawDuration])
});

const ongoingDamage = computed(() => {
  const dmg = effect.value.flags.archmage.ongoingDamage || 0
  const type = effect.value.flags.archmage.ongoingDamageType || ''
  return `${dmg} ongoing ${type} damage`;
});
</script>

<style module>
.preview {
  margin-bottom: 1rem;
}
</style>
