<template>
  <section :class="`icon-background${icon ? ' ' + icon : ''}`">
    <h1 class="title">{{header}}</h1>
    <div class="content" v-html="content"></div>
  </section>
</template>

<script>
import './icon-background.scss';
import { reactive, computed } from 'vue';
export default {
  name: 'icon-background',
  props: {
    header: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: false
    }
  },

  setup(props, { emit }) {
    props = reactive(props);
  }
}
</script>