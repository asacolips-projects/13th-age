<template>
  <div :class="`archmage-appv2-vue flexcol`">
    <!-- Header -->
    <header class="sheet-header">
      <img class="profile-img" :src="equipment.img" data-edit="img" data-action="onEditImage" :title="equipment.name"
        height="100" width="100" />
      <div class="header-fields flexrow">
        <button class="item-roll flexshrink" @click="itemDocument.roll()"><i class="fas fa-dice-d20"></i><span
            class="visually-hidden"> Send to Chat</span></button>
        <input type="text" name="name" v-model="equipment.name" />
      </div>
    </header>

    <div class="section--main">
      <section class="section--fields has-preview">
        <!-- Tab links -->
        <Tabs :tabs="tabs.primary" no-span="true" />

        <!-- Details fields -->
        <Tab group="primary" :tab="tabs.primary.details">
          <!--EquipmentPower :item="equipment" :context="context" /-->
        </Tab>

        <!-- Details fields -->
        <Tab group="primary" :tab="tabs.primary.bonuses">
        </Tab>

        <!-- Active Effect Fields -->
        <Tab group="primary" :tab="tabs.primary.effects">
          <fieldset class="section--effects">
            <legend>{{ localize('ARCHMAGE.activeEffects') }}</legend>
            <p class="hint" v-html="localize('ARCHMAGE.TOOLTIP.activeEffectsItemHint')"></p>
            <div class="archmage-v2 sheet">
              <section class="section--powers">
                <CharEffects :actor="equipment" :key="context._renderKey" />
              </section>
            </div>
          </fieldset>
        </Tab>
      </section>

      <fieldset class="section--preview">
        <legend>{{ localize('Preview') }}</legend>
        <div class="archmage-v2 sheet">
          <section class="section--inventory">
            <div class="equipment-summary grid equipment-grid equipment">
              <div class="equipment-feat-pips" v-if="groupKey === 'equipment'">
                <ul class="feat-pips">
                  <li :class="concat('feat-pip', (equipment.system.isActive ? ' active' : ''))"
                    :data-item-id="equipment._id">
                    <div class="hide">{{ equipment.system.isActive }}</div>
                  </li>
                </ul>
              </div>
              <div class="equipment-bonus flexrow" v-if="equipment.system.attributes">
                <span class="bonus" v-for="(bonus, bonusProp) in getBonuses(equipment)" :key="bonusProp">
                  <span class="bonus-label">{{ localizeEquipmentBonus(bonusProp) }} </span>
                  <span class="bonus-value">{{ numberFormat(bonus, 0, true) }}</span>
                </span>
              </div>
              <div class="equipment-chakra" v-if="equipment.system.chackra">{{ localize(concat('ARCHMAGE.CHAKRA.',
                equipment.system.chackra, "Label")) }}</div>
              <div class="equipment-recharge"
                v-if="equipment.system.recharge && equipment.system.recharge.value && equipment.system.powerUsage.value == 'recharge'">
                <Rollable name="recharge" type="recharge" :opt="equipment._id">{{
                  Number(equipment.system.recharge.value)
                  || 16}}+</Rollable>
              </div>
              <div class="equipment-quantity" :data-item-id="equipment._id"
                :data-quantity="equipment.system.quantity.value"><span>{{ equipment.system.quantity.value }}</span>
              </div>
            </div>
            <Equipment :equipment="equipment" :bonuses="getBonuses(equipment)" />
          </section>
        </div>
      </fieldset>
    </div>

  </div>
</template>

<script setup>
import {
  Tabs,
  Tab,
  Equipment,
  EquipmentPower,
  CharEffects,
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
const itemDocument = inject('itemDocument');

const equipment = props.context.item;

function getBonuses(equipment) {
  let bonuses = {};
  for (let [prop, value] of Object.entries(equipment.system.attributes)) {
    if (value.bonus) {
      if (prop == 'disengage' && game.settings.get("archmage", "secondEdition")) prop = 'disengage&initiative';
      bonuses[prop] = value.bonus;
    }
    else if (prop == 'attack') {
      for (let [atkProp, atkValue] of Object.entries(value)) {
        if (atkValue.bonus) {
          bonuses[atkProp] = atkValue.bonus;
        }
      }
    }
  }
  return bonuses;
}
</script>
