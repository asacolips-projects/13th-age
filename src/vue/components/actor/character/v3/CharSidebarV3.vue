<template>
  <aside class="sheet-sidebar">
    <CharAbilitiesV3 :actor="actor" />
    <CharBackgroundsV3 :actor="actor" />
    <CharIconsV3 :actor="actor" />
    <CharResourcesV3 :actor="actor" />
  </aside>
</template>

<script setup>
import CharAbilitiesV3 from './sidebar/CharAbilitiesV3.vue';
import CharBackgroundsV3 from './sidebar/CharBackgroundsV3.vue';
import CharIconsV3 from './sidebar/CharIconsV3.vue';
import CharResourcesV3 from './sidebar/CharResourcesV3.vue';

defineProps(['actor']);
</script>

<!-- Unscoped: the shared unit scaffolding must reach into the child
     components, which scoped selectors on this component cannot. Each child
     owns its own internal styles. -->
<style lang="scss">
.sheet-sidebar {
  flex: 0 0 250px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border-dark, #0003);

  .unit {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border-dark, #0003);

    &:last-child {
      border-bottom: none;
    }
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-family: $font-stack-secondary;
    font-size: var(--font-size-12, 0.75rem);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--color-text-dark-secondary, #7a7971);
  }

  .rollable {
    cursor: pointer;

    &:hover {
      text-shadow: 0 0 5px var(--color-shadow-primary, #0003);
    }
  }

  .filler {
    margin: 0;
    color: var(--color-text-dark-secondary, #7a7971);
  }
}
</style>
