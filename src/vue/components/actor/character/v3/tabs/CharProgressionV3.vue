<template>
  <section class="tab-progression">
    <p class="placeholder">(WIP) &mdash; {{ localize('ARCHMAGE.progression') }}</p>
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
    color: var(--v3-text-muted);
  }
</style>
