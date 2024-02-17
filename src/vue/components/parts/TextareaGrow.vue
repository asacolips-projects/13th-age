<template>
  <div :class="`${classes} grow-wrap`" :data-replicated-value="value">
    <textarea :name="name" v-model="value" rows="1"></textarea>
  </div>
</template>

<script>
export default {
  name: 'TextareaGrow',
  props: ['classes', 'value', 'name'],
  computed: {}
}
</script>