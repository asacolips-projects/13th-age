<template>
  <component :is="tag" v-html="wrappedRolls" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { wrapRolls } from '@/methods/Helpers';

const props = defineProps(['tag', 'text', 'replacements', 'diceFormulaMode', 'rollData', 'field']);

const wrappedRolls = ref(props.text);

watch(() => props.text, async (newText) => {
  wrappedRolls.value = await wrapRolls(newText, props.replacements, props.diceFormulaMode, props.rollData, props.field);
}, { immediate: true });

</script>
