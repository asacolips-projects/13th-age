<template>
  <section class="tab-notes" ref="host"></section>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue';

const props = defineProps(['actor', 'editable']);

// The real document provides a UUID for ProseMirror's relative links.
const actorDocument = inject('actorDocument');

const host = ref(null);
const editorField = 'system.details.biography.value';
const editorEl = ref(null);

async function mountEditor() {
  const raw = props.actor?.system?.details?.biography?.value ?? '';
  const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(raw, {
    secrets: props.actor?.owner,
    documents: true,
    links: true,
    rolls: true,
    rollData: {},
    async: false
  });
  const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
    name: editorField,
    value: raw,
    enriched,
    toggled: true,
    documentUUID: actorDocument?.uuid,
    disabled: props.editable === false
  });
  editorEl.value = editor;
  host.value.replaceChildren(editor);
}

// Rebuild the (inactive) editor when the stored value changes elsewhere, e.g.
// after a save round-trips back through _prepareContext. Never touch it while
// the ProseMirror instance is open, so in-progress edits survive.
watch(() => props.actor?.system?.details?.biography?.value, () => {
  if (editorEl.value && !editorEl.value.hasAttribute('open')) mountEditor();
});

onMounted(mountEditor);
</script>

<style scoped lang="scss">
  .tab-notes {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;

    // prose-mirror manages its own internal scrolling; the element itself
    // must fill the available height for .editor-content's inset: 0 to work.
    :deep(prose-mirror.editor) {
      flex: 1 1 0;
      min-height: 0;
    }
  }
</style>
