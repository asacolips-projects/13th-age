<template>
  <aside class="sheet-sidebar">
    <CharHeaderV3 :actor="actor" />
    <CharAbilitiesV3 :actor="actor" />
    <CharDefensesV3 :actor="actor" />
    <CharSavesV3 :actor="actor" />
    <CharBackgroundsV3 :actor="actor" />
    <CharIconsV3 :actor="actor" />
  </aside>
</template>

<script setup>
import CharHeaderV3 from './CharHeaderV3.vue';
import CharDefensesV3 from './sidebar/CharDefensesV3.vue';
import CharAbilitiesV3 from './sidebar/CharAbilitiesV3.vue';
import CharBackgroundsV3 from './sidebar/CharBackgroundsV3.vue';
import CharIconsV3 from './sidebar/CharIconsV3.vue';
import CharSavesV3 from './sidebar/CharSavesV3.vue';

defineProps(['actor']);
</script>

<!-- Unscoped: the shared unit scaffolding must reach into the child
     components, which scoped selectors on this component cannot. Each child
     owns its own internal styles. -->
<style lang="scss">
.sheet-sidebar {
  flex: 0 0 250px;

  /* Explicit height: the parent root's flexed height is treated as indefinite
     for flex-line sizing, so align-items: stretch alone lets this column ride
     at its content height and overflow-y never engages. */
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid $ct-border;

  .unit {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid $ct-border;

    &:last-child {
      border-bottom: none;
    }
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-family: $font-stack-secondary;
    font-size: $font-tiny;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .placeholder {
    margin: 0;
    font-style: italic;
    color: $c-gray;
  }

  .rollable {
    cursor: pointer;

    &:hover {
      text-shadow: 0 0 5px $c-black--25;
    }
  }

  .filler {
    margin: 0;
    color: $c-gray;
  }
}
</style>
