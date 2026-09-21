<template>
  <section class="sheet-stats flexrow">
    <div class="stats-unit stats-unit--hp">
      <h2 class="unit-title">{{ localize('ARCHMAGE.hitPoints') }}</h2>
      <p class="unit-value">{{ actor?.system?.attributes?.hp?.value }} / {{ actor?.system?.attributes?.hp?.max }}</p>
    </div>

    <div class="stats-unit stats-unit--defenses">
      <h2 class="unit-title">{{ localize('ARCHMAGE.defenses') }}</h2>
      <p class="unit-value">
        <span class="defense"><span class="defense-label">AC</span> {{ actor?.system?.attributes?.ac?.value }}</span>
        <span class="defense"><span class="defense-label">PD</span> {{ actor?.system?.attributes?.pd?.value }}</span>
        <span class="defense"><span class="defense-label">MD</span> {{ actor?.system?.attributes?.md?.value }}</span>
      </p>
    </div>

    <div class="stats-unit stats-unit--recoveries">
      <h2 class="unit-title">{{ localize('ARCHMAGE.recoveries') }}</h2>
      <p class="unit-value">{{ actor?.system?.attributes?.recoveries?.value }} / {{ actor?.system?.attributes?.recoveries?.max }}</p>
    </div>

    <div class="stats-unit stats-unit--saves">
      <h2 class="unit-title">{{ localize('ARCHMAGE.saves') }}</h2>
      <p class="unit-value">6+ / 11+ / 16+</p>
    </div>
  </section>
</template>

<script setup>
import { localize } from '@/methods/Helpers';

defineProps(['actor', 'editable']);
</script>

<style scoped lang="scss">
  .sheet-stats {
    flex: 0 0 auto;
    height: 4.5rem; // placeholder until the real widgets land
    border-bottom: 1px solid var(--color-border-dark, #0003);
  }

  .stats-unit {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    border-right: 1px solid var(--color-border-dark, #0003);

    &:last-child {
      border-right: none;
    }
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-size: var(--font-size-12, 0.75rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-dark-secondary, #7a7971);
  }

  .unit-value {
    margin: 0;
    font-size: var(--font-size-16, 1rem);
  }

  .defense {
    display: inline-block;
    margin-right: 0.75rem;

    &:last-child {
      margin-right: 0;
    }
  }

  .defense-label {
    font-weight: 600;
    color: var(--color-text-dark-secondary, #7a7971);
  }
</style>
