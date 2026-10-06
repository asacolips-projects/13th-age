<template>
	<section ref="host" class="tab-notes" />
</template>

<script setup>
import { ref, inject, watch, onMounted } from "vue";
import { useProseMirrorEditor } from "@/composables/useProseMirrorEditor";

const props = defineProps(["actor", "editable"]);

// The real document provides a UUID for ProseMirror's relative links.
const actorDocument = inject("actorDocument");

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
</style>
