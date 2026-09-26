<template>
  <section class="unit unit--defenses">
    <p class="unit-value flexrow">
      <span class="defense"><span class="defense-label">AC</span> {{ actor?.system?.attributes?.ac?.value }}</span>
      <span class="defense"><span class="defense-label">PD</span> {{ actor?.system?.attributes?.pd?.value }}</span>
      <span class="defense"><span class="defense-label">MD</span> {{ actor?.system?.attributes?.md?.value }}</span>
    </p>
  </section>
</template>

<script setup>
import { localize } from '@/methods/Helpers';

defineProps(['actor']);
</script>

<style scoped lang="scss">
.unit-value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--v3-font-size-label);

  span {
    text-align: center;
  }
}

.defense-label {
  margin-right: 0.25rem;
  font-weight: 600;
  color: var(--v3-text-muted);
}
</style>
