<template>
	<!-- The identity entry fields the hero banner and the narrow command bar
      share: name, kin and class (autocomplete), and level. Each branch
      renders this in its own geometry. Each field edits through the
      document via useDocumentField — unnamed, so the form's
      submitOnChange doesn't also carry it — and rolls back if the write
      is rejected. -->
	<input v-model="name.value" type="text" :placeholder="localize('ARCHMAGE.name')" @change="name.write">
	<AutocompleteInput
		v-model="kin.value"
		:placeholder="kinLabel"
		:suggestions="kinSuggestions"
		:input-class="{ 'field-empty': isBlank(kin.value) }"
		:separator="kinSeparators"
		@commit="kin.write"
	/>
	<AutocompleteInput
		v-model="class_.value"
		:placeholder="localize('ARCHMAGE.class')"
		:suggestions="classSuggestions"
		:input-class="{ 'field-empty': isBlank(class_.value) }"
		:separator="classSeparators"
		@commit="class_.write"
	/>
	<input
		v-model="level.value"
		type="number"
		:class="{ 'field-empty': isZeroish(level.value) }"
		min="0"
		max="10"
		@change="level.write"
	>
</template>

<script setup>
/**
 * The identity editing fields (name, kin, class, level) the wide hero
 * banner and the narrow command bar both drop in when the sheet enters
 * edit mode. Each field edits through the document via useDocumentField —
 * local values that roll back when a write is rejected — so the actor
 * clone itself is never bound to an input; the kin/class completion lists
 * and separators are the parent's, shared with its display-side labels.
 */
import { isBlank, isZeroish, localize } from "@/methods/Helpers";
import { useDocumentField } from "@/composables/useDocumentField";
import AutocompleteInput from "@/components/parts/AutocompleteInput.vue";

const props = defineProps({
	// The actor data clone the display bindings read; field edits go through
	// useDocumentField's document writes, with rollback on rejection.
	actor: { type: Object, required: true },
	// The kin field's label (edition-dependent) as the empty placeholder.
	kinLabel: { type: String, default: "" },
	kinSuggestions: { type: Array, default: () => [] },
	kinSeparators: { type: Array, default: () => [] },
	classSuggestions: { type: Array, default: () => [] },
	classSeparators: { type: Array, default: () => [] }
});

// The fields edit through the document via useDocumentField: local values
// that roll back when a write is rejected.
const name = useDocumentField(() => props.actor, () => "name");
const kin = useDocumentField(() => props.actor, () => "system.details.race.value");
const class_ = useDocumentField(() => props.actor, () => "system.details.class.value");
const level = useDocumentField(() => props.actor, () => "system.attributes.level.value");
</script>
