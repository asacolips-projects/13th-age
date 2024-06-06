<template>
  <component :is="tag" v-html="wrappedRolls"/>
</template>

<script>
import { wrapRolls } from '@/methods/Helpers';
export default {
  name: 'Enriched',
  props: ['tag', 'text', 'replacements', 'diceFormulaMode', 'rollData', 'field'],
  async setup(props) {
    const wrappedRolls = await wrapRolls(props.text, props.replacements, props.diceFormulaMode, props.rollData, props.field);
    return {
      wrappedRolls
    };
  },
  computed: {},
  methods: {},
}
</script>