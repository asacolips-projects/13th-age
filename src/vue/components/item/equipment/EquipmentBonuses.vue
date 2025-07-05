<template>
  <fieldset class="fieldset-attack">
    <legend>{{ game.i18n.localize('ARCHMAGE.ITEM.attackBonuses') }}</legend>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.meleeBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.attack.melee.bonus" v-model="item.system.attributes.attack.melee.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.rangedBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.attack.ranged.bonus" v-model="item.system.attributes.attack.ranged.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.divineBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.attack.divine.bonus" v-model="item.system.attributes.attack.divine.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.arcaneBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.attack.arcane.bonus" v-model="item.system.attributes.attack.arcane.bonus" />
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset-defense">
    <legend>{{ game.i18n.localize('ARCHMAGE.ITEM.defenseBonuses') }}</legend>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.acBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.ac.bonus" v-model="item.system.attributes.ac.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.pdBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.pd.bonus" v-model="item.system.attributes.pd.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.mdBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.md.bonus" v-model="item.system.attributes.md.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.hpBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.hp.bonus" v-model="item.system.attributes.hp.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.recoveriesBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.recoveries.bonus" v-model="item.system.attributes.recoveries.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.saveBonus') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.save.bonus" v-model="item.system.attributes.save.bonus" />
      </div>
    </div>

    <div class="form-group">
      <label>
        {{ game.i18n.localize('ARCHMAGE.ITEM.saveBonusHPTreshold') }}
      </label>
      <div class="field">
        <input type="number" name="system.attributes.save.threshold" v-model="item.system.attributes.save.threshold" />
      </div>
    </div>

  </fieldset>

</template>

<script setup>
import {
  InfoBubble,
} from '@/components';
const props = defineProps(['item', 'context']);
</script>
