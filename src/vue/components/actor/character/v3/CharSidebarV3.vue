<template>
  <aside class="sheet-sidebar">
    <CharIdentityV3 :actor="actor" />
    <CharSidebarBodyV3 :actor="actor" />
  </aside>
</template>

<script setup>
import CharIdentityV3 from './CharIdentityV3.vue';
import CharSidebarBodyV3 from './CharSidebarBodyV3.vue';

defineProps(['actor']);
</script>

<!-- Unscoped: the shared unit scaffolding must reach into the child
     components, which scoped selectors on this component cannot. Each child
     owns its own internal styles. The scaffolding selectors also cover
     .sidebar-units, the wrapper the narrow layout's character tab uses when
     it re-homes the same body units. -->
<style lang="scss">
.sheet-sidebar {
  flex: 0 0 250px;

  /* Explicit height: the parent root's flexed height is treated as indefinite
     for flex-line sizing, so align-items: stretch alone lets this column ride
     at its content height and overflow-y never engages. */
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid var(--v3-border);
}

.sheet-sidebar, .sidebar-units {
  .unit {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--v3-border);
    &:last-child {
      border-bottom: none;
    }
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-family: var(--v3-font-display);
    font-size: var(--v3-font-size-tiny);
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .placeholder {
    margin: 0;
    font-style: italic;
    color: var(--v3-text-muted);
  }

  .rollable {
    cursor: pointer;

    &:hover {
      text-shadow: 0 0 5px var(--v3-hover-glow);
    }
  }

  .filler {
    margin: 0;
    color: var(--v3-text-muted);
  }
}
</style>
