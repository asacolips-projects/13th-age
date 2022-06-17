<template>
  <section class="section section--out flexcol">
    <h2 class="unit-title">{{localize('ARCHMAGE.oneUniqueThing')}}</h2>
    <div class="out">
      <Editor :owner="owner" target='data.details.out.value' button="true" editable="true" :content="actor.data.details.out.value"/>
    </div>
  </section>
</template>

<script>
import { localize } from '@/methods/Helpers';
import Editor from '@/components/parts/Editor.vue';
export default {
  name: 'CharOut',
  props: ['actor', 'owner'],
  setup() {
    return { localize }
  },
  data() {
    return {}
  },
  components: {
    Editor
  },
  computed: {},
  methods: { /* See created. */},
  async mounted() {
  }
}
</script>