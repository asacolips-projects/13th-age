<template>
  <section :class="classes">
    <Suspense>
      <Editor :key="context?.updateKey ?? 0" :owner="actor.owner" target='system.details.biography.value' button="true" editable="true" :content="actor.system.details.biography.value"/>
    </Suspense>
  </section>
</template>

<script>
import Editor from '@/components/parts/Editor.vue';
export default {
  name: 'CharDetails',
  props: ['context', 'actor', 'owner', 'tab', 'flags'],
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
