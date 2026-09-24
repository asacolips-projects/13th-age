<template>
  <div class="archmage-v3-vue character flexrow" :class="context.cssClass">
    <!-- Edit toggle: owned at the sheet level, broadcast to children via provide/inject -->
    <button v-if="context.editable" type="button" class="sheet-edit-toggle" :title="localize('ARCHMAGE.edit')" @click="toggleEdit">
      <i :class="editing ? 'fas fa-check' : 'fas fa-pen-to-square'"></i>
    </button>

    <!-- Full-height sidebar: identity, defenses, abilities -->
    <CharSidebarV3 :actor="context.actor" />

    <!-- Right column: fixed-height stats header over the tabbed main zone -->
    <section class="sheet-right flexcol">
      <CharStatsHeaderV3 :actor="context.actor" :editable="context.editable" />
      <CharMainV3 :context="context" />
    </section>
  </div>
</template>

<script setup>
  import { ref, provide } from 'vue';
  import { localize } from '@/methods/Helpers';
  import CharSidebarV3 from '@/components/actor/character/v3/CharSidebarV3.vue';
  import CharStatsHeaderV3 from '@/components/actor/character/v3/CharStatsHeaderV3.vue';
  import CharMainV3 from '@/components/actor/character/v3/CharMainV3.vue';

  defineProps(['context']);

  const editing = ref(false);
  provide('editMode', editing);

  function toggleEdit() {
    editing.value = !editing.value;
  }
</script>

<style scoped lang="scss">
  .archmage-v3-vue {
    /* Theme tokens: every color and font the V3 sheet uses resolves through
       one of these custom properties, so a theme only has to override this
       block (e.g. by scoping new values to a theme class on this root).
       Defaults alias the global palette/typography variables so color modes
       and night mode keep flowing through unchanged. */
    --v3-border: var(--c-black--25);
    --v3-border-header: var(--c-white--25);
    --v3-text-muted: var(--c-gray);
    --v3-rollable: var(--c-blue);
    --v3-rollable-glow: var(--c-blue--50);
    --v3-hover-glow: var(--c-black--25);
    --v3-positive: var(--c-hit);
    --v3-negative: var(--c-red);
    --v3-conflicted: var(--c-yellow);

    --v3-font-display: #{$font-stack-secondary};
    --v3-font-size-title: #{$font-tiny};
    --v3-font-size-label: #{$font-xxs};
    --v3-font-size-value: #{$font-xs};
    --v3-font-size-name: #{$font-lg};

    height: 100%;
    position: relative;
    flex: 1;

    /* Required so the height stays pinned to the window: without it the
       min-content floor lets tall children (the sidebar) inflate this root
       past the form, and their overflow-y scrollbars never engage. */
    min-height: 0;

    /* Own the layout explicitly rather than relying on Foundry's .flexrow
       utility: the sidebar and right column must start at the top edge and
       stretch to the full height of the window. */
    display: flex;
    flex-direction: row;
    align-items: stretch;

    .sheet-edit-toggle {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 5;
      padding: 0.25rem 0.5rem;
    }
  }

  .sheet-right {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;

    /* Same height pin as .sheet-sidebar: without it this column rides at its
       content height instead of the window height and its internal scroll
       regions never engage. */
    height: 100%;

    /* The stats header pins to the top (flex: 0 0 auto on the header) and
       CharMainV3 grows to fill everything beneath it. */
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
</style>

<!-- Window-level rules: the window frame and form sit above the component
     root, so scoped selectors can't reach them. -->
<style lang="scss">
  .archmage-v3.character-sheet {
    .window-content {
      padding: 0;
    }

    .window-content > form {
      height: 100%;
      overflow: hidden;
    }

    /* Keep the stats header's content clear of the floating edit toggle. */
    .sheet-stats-header {
      padding-right: 2.75rem;
    }
  }
</style>
