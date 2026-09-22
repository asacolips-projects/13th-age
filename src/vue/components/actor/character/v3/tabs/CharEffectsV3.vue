<template>
  <section class="tab-effects">
    <p class="placeholder">(WIP) &mdash; {{ localize('ARCHMAGE.effects') }}</p>
  </section>
</template>

<script setup>
import { localize } from '@/methods/Helpers';

defineProps(['actor', 'editable']);
</script>

<style scoped lang="scss">
  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--color-text-dark-secondary, #7a7971);
  }
</style>
