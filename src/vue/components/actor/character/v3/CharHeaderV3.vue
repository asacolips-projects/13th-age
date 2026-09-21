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
      <p class="out-text" v-if="!editing">{{ outPlainText }}</p>
      <textarea v-else name="system.details.out.value" v-model="actor.system.details.out.value" :placeholder="localize('ARCHMAGE.oneUniqueThing')"></textarea>
    </div>

    <!-- Edit toggle -->
    <button v-if="editable" type="button" class="header-edit-toggle" :title="localize('ARCHMAGE.edit')" @click="toggleEdit">
      <i :class="editing ? 'fas fa-check' : 'fas fa-pen-to-square'"></i>
    </button>
  </header>
</template>

<script>
import { localize, tooltip, stripHtml } from '@/methods/Helpers';

export default {
  name: 'CharHeaderV3',
  props: ['actor', 'editable'],
  data() {
    return {
      editing: false
    }
  },
  computed: {
    secondEdition() {
      return game.settings.get('archmage', 'secondEdition') === true;
    },
    kinLabel() {
      return this.secondEdition ? this.localize('ARCHMAGE.kin') : this.localize('ARCHMAGE.race');
    },
    subtitle() {
      const parts = [
        this.actor?.system?.details?.race?.value,
        this.actor?.system?.details?.class?.value,
        this.actor?.system?.attributes?.level?.value
      ].filter(part => part !== undefined && part !== null && part !== '');
      return parts.join(' · ');
    },
    outPlainText() {
      return stripHtml(this.actor?.system?.details?.out?.value);
    }
  },
  methods: {
    localize,
    tooltip,
    toggleEdit() {
      this.editing = !this.editing;
    }
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
  }

  .header-portrait {
    flex: 0 0 auto;

    img {
      height: 100px;
      width: auto;
      max-width: 150px;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  .header-id {
    flex: 1 1 auto;
    min-width: 0;

    .char-name {
      margin: 0;
      font-size: var(--font-size-24, 1.5rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .char-subtitle {
      margin: 0;
      color: var(--color-text-dark-secondary, #7a7971);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    input {
      display: block;
      width: 100%;
      margin-bottom: 0.25rem;
    }

    .edit-row {
      display: flex;
      gap: 0.5rem;

      input {
        flex: 1 1 auto;
        min-width: 0;
        margin-bottom: 0;
      }

      input[type='number'] {
        flex: 0 0 4rem;
      }
    }
  }

  .header-out {
    flex: 0 0 35%;
    border-left: 1px solid var(--color-border-dark, #0003);
    padding-left: 0.5rem;
    max-height: 100px;
    overflow-y: auto;

    .out-text {
      margin: 0;
      white-space: normal;
    }

    textarea {
      width: 100%;
      height: 100%;
      resize: none;
    }
  }

  .header-edit-toggle {
    flex: 0 0 auto;
    padding: 0.25rem 0.5rem;
  }
</style>
