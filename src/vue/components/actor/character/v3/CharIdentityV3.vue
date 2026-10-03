<template>
  <header class="sheet-header">
    <!-- Hero banner: the portrait bleeds across a fixed-height area with the
         name docked to its bottom edge. The profile-img class goes on the
         hero itself: ContextMenu injects the menu into the matched element
         and forces an inline `position: relative` on it that it never
         removes, so the hook must live on an element that is already
         relative — putting it on the absolutely-positioned portrait layer
         would knock the image out of the banner for good. -->
    <div class="header-hero profile-img">
      <div class="header-portrait" :class="{ 'portrait--round': portraitRound, 'portrait--frame': portraitFrame }">
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
            <input type="text" name="system.details.race.value" v-model="actor.system.details.race.value" :class="{ 'field-empty': isBlank(actor.system.details.race.value) }" :placeholder="kinLabel">
            <input type="text" name="system.details.class.value" v-model="actor.system.details.class.value" :class="{ 'field-empty': isBlank(actor.system.details.class.value) }" :placeholder="localize('ARCHMAGE.class')">
            <input type="number" name="system.attributes.level.value" v-model="actor.system.attributes.level.value" :class="{ 'field-empty': isZeroish(actor.system.attributes.level.value) }" min="0" max="10">
          </div>
        </template>
      </div>
    </div>

    <!-- One Unique Thing -->
    <div class="header-out" :class="{ 'header-out--editing': editing }">
      <h2 class="out-label">{{ localize('ARCHMAGE.oneUniqueThing') }}</h2>
      <!-- Display shows the enriched HTML; edit mode swaps in a full
           ProseMirror editor (same mechanism as the notes tab). -->
      <div class="out-text" v-if="!editing" v-html="outEnriched"></div>
      <div class="out-editor" v-else ref="outEditorHost"></div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, inject, watch, nextTick } from 'vue';
import { isBlank, isZeroish, localize, tooltip } from '@/methods/Helpers';

const props = defineProps(['actor']);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

// The real document provides a UUID for ProseMirror's relative links.
const actorDocument = inject('actorDocument');

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
const outRaw = computed(() => props.actor?.system?.details?.out?.value ?? '');
const outEnriched = ref('');

// One Unique Thing: display shows enriched HTML; edit mode swaps the field for
// a full ProseMirror editor bound to the document field (created on demand via
// the edit-mode watch). Its change event on blur flows through the enclosing
// form's submitOnChange, so no explicit save wiring is needed. Enrichment is
// async-only, so the rendered HTML lives in a ref fed by a watcher.
const outEditorHost = ref(null);
const outField = 'system.details.out.value';

async function enrichOut(raw) {
  return foundry.applications.ux.TextEditor.implementation.enrichHTML(raw, {
    secrets: props.actor?.owner,
    documents: true,
    links: true,
    rolls: true,
    rollData: {},
    async: false
  });
}

watch(outRaw, async raw => {
  const enriched = await enrichOut(raw);
  // Skip stale resolutions if the value changed while enriching.
  if (outRaw.value === raw) outEnriched.value = enriched;
}, { immediate: true });

async function mountOutEditor() {
  const raw = outRaw.value;
  const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
    name: outField,
    value: raw,
    enriched: await enrichOut(raw),
    toggled: false,
    documentUUID: actorDocument?.uuid
  });
  outEditorHost.value.replaceChildren(editor);
}

watch(editing, value => {
  if (value) nextTick(mountOutEditor);
});

// Portrait treatment flags (same ones the V2 sheets honor).
const archmageFlags = computed(() => props.actor?.flags?.archmage ?? {});
const portraitRound = computed(() => archmageFlags.value.portraitRound === true);
const portraitFrame = computed(() => archmageFlags.value.portraitFrame === true);
</script>

<!-- Laid out vertically: it lives at the top of the narrow sidebar column
     rather than spanning the sheet width. -->
<style scoped lang="scss">
  .sheet-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Hero banner: fixed height, portrait bleeding across it, identity text
     docked to the bottom edge. isolation contains the negative-z portrait
     layer; the layer still receives clicks, so the image stays editable in
     the gaps around the text. */
  .header-hero {
    position: relative;
    isolation: isolate;
    flex: 0 0 auto;
    height: 225px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .header-portrait {
    position: absolute;
    inset: 5px;
    z-index: -1;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      /* Faces sit near the top of most portraits. */
      object-position: center top;
    }

    /* A circle crop can't fill the banner, so "round" softens the corners
       instead; "frame" becomes an inset ring around the bleed. */
    &.portrait--round img {
      border-radius: 20px;
    }

    &.portrait--frame::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid var(--c-white--75);
      pointer-events: none;
    }
  }

  .header-id {
    position: relative;
    min-width: 0;
    padding: 0.75rem;
    text-align: center;

    /* 25% black scrim behind the text. A two-axis mask intersection feathers
       all four edges, and the fade stays inside the block (matching the
       padding) so nothing spills past the banner onto the sheet below. */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: $c-black--75;
      mask-image:
        linear-gradient(to bottom, transparent, black 1.5em, black);
      mask-composite: intersect;
    }

    .char-name {
      margin: 0;
      font-family: var(--v3-font-display);
      font-weight: normal;
      font-size: var(--font-size-24);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px $c-black, 0 0 10px $c-black--50;
    }

    .char-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px $c-black, 0 0 10px $c-black--50;
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
    /* The hero bleeds edge to edge, so the OUT block carries the gutter the
       header's old padding used to provide. */
    margin: 0 0.75rem 0.75rem;
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    padding: 0.75rem;
    overflow-y: auto;

    /* Editing needs room for the editor's menu bar plus a usable writing
       area, which the display mode's compact cap can't provide. */
    &.header-out--editing {
      max-height: 240px;
    }

    .out-label {
      margin: 0 0 0.25rem;
      font-family: var(--v3-font-display);
      font-size: var(--font-size-12);
      font-weight: normal;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
    }

    .out-text {
      margin: 0;
      white-space: normal;

      /* Enriched HTML arrives wrapped in <p>; the browser's default margins
         would pad the tight header block. */
      :deep(p) {
        margin: 0;
      }
    }

    /* Activating a ProseMirror editor restructures .editor into a menu bar
       plus an .editor-container (whose flex basis collapses without help).
       Same narrow-column treatment as the V2 sheet's rules in
       _sheet.scss: keep the menu in the flow, wrap it, and give the writing
       area its own floor. */
    :deep(prose-mirror.editor) {
      display: flex;
      flex-direction: column;
      min-height: 7rem;

      > menu,
      .editor-menu {
        position: relative;
        inset: auto;
        flex: 0 0 auto;
        flex-wrap: wrap;
        height: auto;
        max-height: none;
        overflow: visible;
      }

      .editor-container {
        margin-top: 0;
        padding-top: 0;
        flex: 1 1 auto;
        min-height: 3rem;
        overflow-y: auto;
      }

      .editor-content {
        min-height: 100%;
      }
    }
  }
</style>
