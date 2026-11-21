<template>
	<!-- `tag` is always a plain HTML element name, so v-html can't clobber a component's own content. -->
	<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
	<component :is="tag" v-html="wrappedRolls" />
</template>

<script setup>
import { ref, watch } from "vue";
import { wrapRolls } from "@/methods/Helpers";

const props = defineProps(["tag", "text", "replacements", "diceFormulaMode", "rollData", "field", "enrichmentOptions"]);

const wrappedRolls = ref(props.text);

// Re-enrich on either input changing: the text itself, or the roll data the
// text's inline rolls evaluate against (level ups, ability score changes).
// The rollData prop is rebuilt with every sheet context, so watching it
// catches roll-data changes that leave the text untouched.
watch([
	() => props.text,
	() => props.rollData
], async ([newText, newRollData]) => {
	wrappedRolls.value = await wrapRolls(
		newText,
		props.replacements,
		props.diceFormulaMode,
		newRollData,
		props.field,
		props.enrichmentOptions ?? {}
	);
}, { immediate: true });

</script>
