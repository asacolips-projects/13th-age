<template>
  <!-- @todo figure out why link tabbing is greedy. Use -1 tabindex for now to turn it off. -->
  <!-- @todo localize this, but ideally with some sort of an enricher. -->
  <p v-if="compact"><a href="javascript:void(0)" click="preventDefault" role="button" tabindex="-1" class="archmage-rolls-reference">Inline rolls</a> allowed here.</p>
  <p v-else class="hint">Use <a href="javascript:void(0)" click="preventDefault" role="button" tabindex="-1" class="archmage-rolls-reference">inline rolls</a> such as <strong>[[d20+@str.mod+@std+@atk.a.bonus]] vs AC</strong> to insert dice rolls wherever you need them. Any roll formula will work!</p>
</template>
<template>
  <!-- @todo figure out why link tabbing is greedy. Use -1 tabindex for now to turn it off. -->
  <template v-if="compact" v-html="game.i18n.localize('ARCHMAGE.helpCompact')"></template>
  <template v-else v-html="game.i18n.localize('ARCHMAGE.helpDetailed')"></template>
</template>

<script setup>
  const props = defineProps(['compact']);
</script>