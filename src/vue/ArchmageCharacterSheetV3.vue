<template>
  <div class="archmage-v3-vue character flexcol" :class="context.cssClass">
    <!-- Header -->
    <CharHeaderV3 :actor="context.actor" :editable="context.editable" />

    <!-- Body placeholder -->
    <section class="sheet-body flexcol">
      <p class="placeholder-title">(WIP)</p>
      <p class="placeholder-hint">{{ context.actor?.name }} &mdash; {{ context.actor?.type }}</p>
    </section>
  </div>
</template>

<script>
  import { localize } from '@/methods/Helpers';
  import CharHeaderV3 from '@/components/actor/character/v3/CharHeaderV3.vue';

  export default {
    name: 'ArchmageCharacterSheetV3',
    props: ['context'],
    inject: ['actorDocument'],
    components: { CharHeaderV3 },
    methods: {
      localize
    }
  }
</script>

<style scoped lang="scss">
  .sheet-body {
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    color: var(--color-text-dark-secondary, #7a7971);

    .placeholder-title {
      margin: 0;
      font-size: var(--font-size-18, 1.125rem);
      font-weight: bold;
    }

    .placeholder-hint {
      margin: 0;
      font-style: italic;
    }
  }
</style>
