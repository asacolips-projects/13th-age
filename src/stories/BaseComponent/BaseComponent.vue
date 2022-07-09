<template>
  <section class="base-component">
    <h1 class="title">{{header}}</h1>
    <div class="content" v-html="content"></div>
  </section>
</template>

<script>
import './base-component.scss';
import { reactive, computed } from 'vue';
export default {
  name: 'base-component',
  props: {
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