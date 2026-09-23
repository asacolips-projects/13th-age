<template>
  <section class="unit unit--saves">
    <h2 class="unit-title">{{ localize('ARCHMAGE.saves') }}</h2>
    <!-- Disengage lives with the death/last-gasp tracks in the top bar. -->
    <p class="saves-list">
      <RollableV3 name="save" @click="rollSave('easy')">{{ localize('ARCHMAGE.SAVE.easyShort') }} (6+)</RollableV3>
      <RollableV3 name="save" @click="rollSave('normal')">{{ localize('ARCHMAGE.SAVE.normalShort') }} (11+)</RollableV3>
      <RollableV3 name="save" @click="rollSave('hard')">{{ localize('ARCHMAGE.SAVE.hardShort') }} (16+)</RollableV3>
    </p>
  </section>
</template>

<script setup>
import { inject } from 'vue';
import { localize } from '@/methods/Helpers';
import RollableV3 from '../RollableV3.vue';

defineProps(['actor']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

function rollSave(difficulty) {
  actorDocument?.rollSave(difficulty);
}
</script>

<style scoped lang="scss">
.saves-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: var(--font-size-14, 0.875rem);
}
</style>
