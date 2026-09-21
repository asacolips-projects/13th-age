<template>
  <div class="archmage-v3-vue character flexcol" :class="context.cssClass">
    <!-- Header -->
    <CharHeaderV3 :actor="context.actor" :editable="context.editable" />

    <!-- Subheader stats bar -->
    <CharStatsV3 :actor="context.actor" :editable="context.editable" />

    <!-- Body: fixed-width sidebar + main zone -->
    <section class="sheet-body">
      <CharSidebarV3 :actor="context.actor" :editable="context.editable" />
      <CharMainV3 :context="context" />
    </section>
  </div>
</template>

<script setup>
  import CharHeaderV3 from '@/components/actor/character/v3/CharHeaderV3.vue';
  import CharStatsV3 from '@/components/actor/character/v3/CharStatsV3.vue';
  import CharSidebarV3 from '@/components/actor/character/v3/CharSidebarV3.vue';
  import CharMainV3 from '@/components/actor/character/v3/CharMainV3.vue';

  defineProps(['context']);
</script>

<style scoped lang="scss">
  .archmage-v3-vue {
    height: 100%;
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
  }
</style>
