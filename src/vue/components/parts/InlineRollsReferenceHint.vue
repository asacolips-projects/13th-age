<template>
  <!-- @todo figure out why link tabbing is greedy. Use -1 tabindex for now to turn it off. -->
  <p v-if="compact" v-html="game.i18n.localize('ARCHMAGE.helpCompact')"></p>
  <p v-else v-html="game.i18n.localize('ARCHMAGE.helpDetailed')"></p>
</template>

<script setup>
  const props = defineProps(['compact']);
</script>