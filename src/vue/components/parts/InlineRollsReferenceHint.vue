<template>
  <p v-if="compact"><a href="javascript:void(0)" click="preventDefault" role="button" tabindex="0" class="archmage-rolls-reference">Inline rolls</a> allowed here.</p>
  <p v-else class="hint">Use <a href="javascript:void(0)" click="preventDefault" role="button" tabindex="0" class="archmage-rolls-reference">inline rolls</a> such as <strong>[[d20+@str.mod+@std+@atk.a.bonus]] vs AC</strong> to insert dice rolls wherever you need them. Any roll formula will work!</p>
</template>

<script setup>
  const props = defineProps(['compact']);
</script>