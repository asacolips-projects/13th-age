<template>
  <section class="section section--out flexcol" v-if="!actor.flags.archmage?.hideOneUniqueThing">
    <h2 class="unit-title">{{localize('ARCHMAGE.oneUniqueThing')}}</h2>
    <div class="out">
      <Suspense>
        <Editor :owner="actor.owner" target='system.details.out.value' button="true" editable="true" :content="actor.system.details.out.value"/>
      </Suspense>
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
