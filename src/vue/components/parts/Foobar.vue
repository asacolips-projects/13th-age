<template>
  <div>{{foobar}}</div>
</template>

<script>
export default {
  name: 'Foobar',
  props: ['foobar','type', 'name', 'actor', 'classes', 'readonly', 'reactive'],
  computed: {}
}
</script>