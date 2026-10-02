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
  border-right: 1px solid var(--color-border);
}

.sheet-sidebar, .sidebar-units {
  .unit {
    padding: 0.5rem 0.75rem;
  }

  .unit-title {
    margin: 0 0 0.25rem;
    font-family: var(--v3-font-display);
    font-size: var(--font-size-12);
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

/* Attention pulse on empty entry fields: background and icon entries pulse
   while blank (or zero), and the identity's kin/class/level while blank (or
   level zero) — the same cue the sheet-wide placeholder styling gives those
   fields. Calms to a steady glow while focused so it doesn't fight typing.
   The class is bound per field in the child components (CSS can't see a
   number input's zero). The command bar is the narrow layout's re-home of
   the identity fields. */
.sheet-sidebar,
.sidebar-units,
.sheet-command-bar {
  .field-empty {
    animation: v3-empty-pulse 2s ease-in-out infinite;

    &:focus {
      animation: none;
      box-shadow: 0 0 0 1px var(--v3-hint);
    }
  }
}

@keyframes v3-empty-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 0 2px var(--v3-hint);
  }
}
</style>
