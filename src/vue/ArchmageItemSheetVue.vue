<template>
  <div :class="`archmage-appv2-vue flexcol`">
    <section>
      <h1>Hello, {{context.item.name ?? 'nobody'}}!</h1>
      <em>[{{ context.item.uuid }}]</em>
      <input type="text" name="name" v-model="context.item.name"/>
      <Editor :editable="context.editable" :field="context.editors['system.description.value']"/>
    </section>
  </div>
</template>

<script setup>
import Editor from '@/components/parts/Prosemirror.vue';
const props = defineProps(['context']);
</script>