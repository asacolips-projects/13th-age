<template>
  <div class="archmage-v3-vue character flexcol" :class="context.cssClass">
    <!-- Header -->
    <header class="sheet-header">
      <img class="profile-img" :src="context.actor?.img" :title="context.actor?.name" height="60" width="60" />
      <h1 class="sheet-name">{{ context.actor?.name }}</h1>
    </header>

    <!-- Body placeholder -->
    <section class="sheet-body flexcol">
      <p class="placeholder-title">{{ localize('ARCHMAGE.underConstruction') }}</p>
      <p class="placeholder-hint">{{ context.actor?.name }} &mdash; {{ context.actor?.type }}</p>
    </section>
  </div>
</template>

<script>
  import { localize } from '@/methods/Helpers';

  export default {
    name: 'ArchmageCharacterSheetV3',
    props: ['context'],
    inject: ['actorDocument'],
    methods: {
      localize
    }
  }
</script>

<style scoped lang="scss">
  .sheet-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border-dark, #0003);

    .profile-img {
      border-radius: 4px;
      object-fit: cover;
    }

    .sheet-name {
      margin: 0;
      font-size: var(--font-size-24, 1.5rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

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
