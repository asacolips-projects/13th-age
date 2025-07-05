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

</template>

<script setup>
import {
  InfoBubble,
} from '@/components';
const props = defineProps(['item', 'context']);
</script>
