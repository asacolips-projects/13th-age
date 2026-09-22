<template>
  <div class="archmage-v3-vue character flexcol" :class="context.cssClass">
    <!-- Edit toggle: owned at the sheet level, broadcast to children via provide/inject -->
    <button v-if="context.editable" type="button" class="sheet-edit-toggle" :title="localize('ARCHMAGE.edit')" @click="toggleEdit">
      <i :class="editing ? 'fas fa-check' : 'fas fa-pen-to-square'"></i>
    </button>

    <!-- Header -->
    <CharHeaderV3 :actor="context.actor" />

    <!-- Subheader stats bar -->
    <CharStatsV3 :actor="context.actor" :editable="context.editable" />

    <!-- Body: fixed-width sidebar + main zone -->
    <section class="sheet-body">
      <CharSidebarV3 :actor="context.actor" />
      <CharMainV3 :context="context" />
    </section>
  </div>
</template>

<script setup>
  import { ref, provide } from 'vue';
  import { localize } from '@/methods/Helpers';
  import CharHeaderV3 from '@/components/actor/character/v3/CharHeaderV3.vue';
  import CharStatsV3 from '@/components/actor/character/v3/CharStatsV3.vue';
  import CharSidebarV3 from '@/components/actor/character/v3/CharSidebarV3.vue';
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
    height: 100%;
    position: relative;

    .sheet-edit-toggle {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 5;
      padding: 0.25rem 0.5rem;
    }
  }

  .sheet-body {
    flex: 1;
    min-height: 0;
    display: flex;
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

    /* Keep the header's content clear of the floating edit toggle. */
    .sheet-header {
      padding-right: 2.75rem;
    }
  }
</style>
