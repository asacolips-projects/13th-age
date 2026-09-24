<template>
  <header class="sheet-header">
    <!-- Portrait. The profile-img class goes on the wrapper div, matching the
         V2 sheets: ContextMenu injects the menu into the matched element, and
         an img can't render children. -->
    <div class="header-portrait profile-img">
      <img :src="actor?.img" :alt="localize('ARCHMAGE.avatarAlt')" :title="actor?.name"
        data-edit="img" data-action="onEditImage" :data-tooltip="tooltip('portrait')" />
    </div>

    <!-- Name + subtitle, or their edit fields -->
    <div class="header-id flexcol">
      <template v-if="!editing">
        <h1 class="char-name">{{ actor?.name }}</h1>
        <p class="char-subtitle" v-if="subtitle">{{ subtitle }}</p>
      </template>
      <template v-else>
        <input type="text" name="name" v-model="actor.name" :placeholder="localize('ARCHMAGE.name')">
        <div class="edit-row">
          <input type="text" name="system.details.race.value" v-model="actor.system.details.race.value" :placeholder="kinLabel">
          <input type="text" name="system.details.class.value" v-model="actor.system.details.class.value" :placeholder="localize('ARCHMAGE.class')">
          <input type="number" name="system.attributes.level.value" v-model="actor.system.attributes.level.value" min="0" max="10">
        </div>
      </template>
    </div>

    <!-- One Unique Thing -->
    <div class="header-out">
      <h2 class="out-label">{{ localize('ARCHMAGE.oneUniqueThing') }}</h2>
      <p class="out-text" v-if="!editing">{{ outPlainText }}</p>
      <textarea v-else name="system.details.out.value" v-model="actor.system.details.out.value" :placeholder="localize('ARCHMAGE.oneUniqueThing')"></textarea>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize, tooltip, stripHtml } from '@/methods/Helpers';

const props = defineProps(['actor']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

const secondEdition = computed(() => game.settings.get('archmage', 'secondEdition') === true);
const kinLabel = computed(() => secondEdition.value ? localize('ARCHMAGE.kin') : localize('ARCHMAGE.race'));
const subtitle = computed(() => {
  const parts = [
    props.actor?.system?.details?.race?.value,
    props.actor?.system?.details?.class?.value,
    props.actor?.system?.attributes?.level?.value
  ].filter(part => part !== undefined && part !== null && part !== '');
  return parts.join(' · ');
});
const outPlainText = computed(() => stripHtml(props.actor?.system?.details?.out?.value));
</script>

<!-- Laid out vertically: it lives at the top of the narrow sidebar column
     rather than spanning the sheet width. -->
<style scoped lang="scss">
  .sheet-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--v3-border);
  }

  .header-portrait {
    align-self: center;

    img {
      height: 100px;
      width: auto;
      max-width: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  .header-id {
    min-width: 0;
    text-align: center;

    .char-name {
      margin: 0;
      font-family: var(--v3-font-display);
      font-weight: normal;
      font-size: var(--v3-font-size-name);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .char-subtitle {
      margin: 0;
      color: var(--v3-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    input {
      display: block;
      width: 100%;
      margin-bottom: 0.25rem;
      font-family: var(--v3-font-display);
      font-weight: normal;
    }

    .edit-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      input {
        min-width: 0;
        margin-bottom: 0;
      }
    }
  }

  .header-out {
    border-top: 1px solid var(--v3-border);
    padding-top: 0.5rem;
    max-height: 100px;
    overflow-y: auto;

    .out-label {
      margin: 0 0 0.25rem;
      font-family: var(--v3-font-display);
      font-size: var(--v3-font-size-title);
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--v3-text-muted);
    }

    .out-text {
      margin: 0;
      white-space: normal;
      font-style: italic;
    }

    textarea {
      width: 100%;
      min-height: 3rem;
      resize: none;
    }
  }
</style>
