<template>
  <section :class="classes">
    <Editor :owner="actor.owner" target='data.details.biography.value' button="true" editable="true" :content="actor.data.details.biography.value"/>
  </section>
</template>

<script>
import Editor from '@/components/parts/Editor.vue';
export default {
  name: 'CharDetails',
  props: ['actor', 'owner', 'tab', 'flags'],
  setup(props) {
    const classes = `section section--details flexcol`;
    return {
      classes
    }
  },
  components: {
    Editor
  }
}
</script>