<template>
  <section :class="`callout ${type}`">
    <h1 class="title">{{header}}</h1>
    <div class="content" v-html="content"></div>
  </section>
</template>

<script>
import './callout.scss';
import { reactive, computed } from 'vue';
export default {
  name: 'callout',
  props: {
    type: {
      type: String,
      required: true
    },
    header: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },

  setup(props, { emit }) {
    props = reactive(props);
  }
}
</script>