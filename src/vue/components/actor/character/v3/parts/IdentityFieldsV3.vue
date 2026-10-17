<template>
	<!-- The identity entry fields the hero banner and the narrow command bar
      share: name, kin and class (autocomplete), and level. Each branch
      renders this in its own geometry. -->
	<input v-model="actor.name" type="text" name="name" :placeholder="localize('ARCHMAGE.name')">
	<AutocompleteInput
		v-model="actor.system.details.race.value"
		name="system.details.race.value"
		:placeholder="kinLabel"
		:suggestions="kinSuggestions"
		:input-class="{ 'field-empty': isBlank(actor.system.details.race.value) }"
		:separator="kinSeparators"
	/>
	<AutocompleteInput
		v-model="actor.system.details.class.value"
		name="system.details.class.value"
		:placeholder="localize('ARCHMAGE.class')"
		:suggestions="classSuggestions"
		:input-class="{ 'field-empty': isBlank(actor.system.details.class.value) }"
		:separator="classSeparators"
	/>
	<input
		v-model="actor.system.attributes.level.value"
		type="number"
		name="system.attributes.level.value"
		:class="{ 'field-empty': isZeroish(actor.system.attributes.level.value) }"
		min="0"
		max="10"
	>
</template>

<script setup>
/**
 * The identity editing fields (name, kin, class, level) the wide hero
 * banner and the narrow command bar both drop in when the sheet enters
 * edit mode. Pure bindings on the actor clone the sheet passes down; the
 * kin/class completion lists and separators are the parent's, shared with
 * its display-side labels.
 */
import { isBlank, isZeroish, localize } from "@/methods/Helpers";
import AutocompleteInput from "@/components/parts/AutocompleteInput.vue";

defineProps({
	// The actor data clone the fields bind to; writes persist via the
	// sheet's submitOnChange.
	actor: { type: Object, required: true },
	// The kin field's label (edition-dependent) as the empty placeholder.
	kinLabel: { type: String, default: "" },
	kinSuggestions: { type: Array, default: () => [] },
	kinSeparators: { type: Array, default: () => [] },
	classSuggestions: { type: Array, default: () => [] },
	classSeparators: { type: Array, default: () => [] }
});
</script>
