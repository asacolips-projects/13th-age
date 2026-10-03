<template>
  <section class="unit unit--initiative">
    <RollableV3 name="init" @click="rollInitiative">
      {{ localize('ARCHMAGE.initiative') }}
      {{ numberFormat(actor?.system?.attributes?.init?.mod, 0, true) }}
    </RollableV3>
  </section>
</template>

<script setup>
import { inject } from 'vue';
import { localize, numberFormat } from '@/methods/Helpers';
import RollableV3 from '../RollableV3.vue';

defineProps(['actor']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Initiative rolling (combatant check, bonus prompt, roll) lives on the actor
// document, shared with the V2 sheet's _onInitRoll.
function rollInitiative() {
  actorDocument?.rollInitiativeDialog();
}
</script>

<style scoped lang="scss">
.unit--initiative {
  font-size: var(--font-size-14);
  font-family: var(--v3-font-display);
  text-align: center;
  padding: 0 !important;
}
</style>
