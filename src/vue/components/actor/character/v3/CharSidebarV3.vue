<template>
  <aside class="sheet-sidebar">
    <section class="unit unit--abilities">
      <h2 class="unit-title">{{ localize('ARCHMAGE.abilities') }}</h2>
      <p class="placeholder">(WIP)</p>
      <p v-for="n in 12" :key="`ability-${n}`" class="filler">...</p>
    </section>

    <section class="unit unit--backgrounds">
      <h2 class="unit-title">{{ localize('ARCHMAGE.backgrounds') }}</h2>
      <p class="placeholder">(WIP)</p>
      <p v-for="n in 12" :key="`background-${n}`" class="filler">...</p>
    </section>

    <section class="unit unit--icons">
      <h2 class="unit-title">{{ localize('ARCHMAGE.iconRelationships') }}</h2>
      <p class="placeholder">(WIP)</p>
      <p v-for="n in 12" :key="`icon-${n}`" class="filler">...</p>
    </section>
  </aside>
</template>

<script>
import { localize } from '@/methods/Helpers';

export default {
  name: 'CharSidebarV3',
  props: ['actor', 'editable'],
  methods: {
    localize
  }
}
</script>

<style scoped lang="scss">
  .sheet-sidebar {
    flex: 0 0 300px;
    overflow-y: auto;
    border-right: 1px solid var(--color-border-dark, #0003);
  }

  .unit {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border-dark, #0003);

    &:last-child {
      border-bottom: none;
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

  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--color-text-dark-secondary, #7a7971);
  }

  .filler {
    margin: 0;
    color: var(--color-text-dark-secondary, #7a7971);
  }
</style>
