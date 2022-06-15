<template>
  <section :class="classes">
    <Editor :owner="owner" target='data.details.biography.value' button="true" editable="true" :content="actor.data.details.biography.value"/>
  </section>
</template>

<script>
import { default as Editor } from '/src/vue/components/parts/Editor.vue';
export default {
  props: ['actor', 'owner', 'tab', 'flags'],
  data() {
    return {}
  },
  components: {
    Editor
  },
  computed: {
    classes() {
      return `section section--details flexcol`;
    }
  },
  methods: { /* See created. */},
  async mounted() {}
}
</script>