<template>
	<section ref="host" class="tab-notes" :class="{ 'narrow-notes': narrow }" />
</template>

<script setup>
import { ref, inject, watch, onMounted } from "vue";
import { useProseMirrorEditor } from "@/composables/useProseMirrorEditor";

const props = defineProps(["actor", "editable"]);

// The real document provides a UUID for ProseMirror's relative links.
const actorDocument = inject("actorDocument");

// The narrow layout, injected from the sheet root like the row components
// read it: the tab there sizes to its content (the sheet scrolls as one
// page), which the fill-the-container editor below depends on.
const narrow = inject("narrowLayout", ref(false));

const host = ref(null);
const editorField = "system.details.biography.value";

const { editorEl, mountEditor } = useProseMirrorEditor({
	host,
	field: editorField,
	getValue: () => props.actor?.system?.details?.biography?.value ?? "",
	owner: () => props.actor?.owner,
	documentUUID: actorDocument?.uuid,
	toggled: true,
	disabled: () => props.editable === false
});

// Rebuild the (inactive) editor when the stored value changes elsewhere, e.g.
// after a save round-trips back through _prepareContext. Never touch it while
// the ProseMirror instance is open, so in-progress edits survive.
watch(() => props.actor?.system?.details?.biography?.value, () => {
	if (editorEl.value && !editorEl.value.hasAttribute("open")) mountEditor();
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

  // Narrow: the tab body rides at its content height (the whole sheet
  // scrolls as one page), so the fill-the-container arrangement has no
  // height to fill and collapses to nothing. Let the biography flow with
  // the page scroll instead: the host drops its flex fill and the content
  // layer drops the absolute inset that pins it to the editor's box.
  .tab-notes.narrow-notes {
    flex: 0 0 auto;
    display: block;

    :deep(prose-mirror.editor) {
      display: block;
      height: auto;

      .editor-content {
        position: static;
      }
    }
  }
</style>
