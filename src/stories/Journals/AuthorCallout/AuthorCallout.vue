<template>
  <section :class="`author-callout ${author.trim().toLowerCase().replace(' ', '-')}`">
    <img v-if="img" :src="img"/>
    <h1 v-if="header" class="title">{{header}}</h1>
    <div class="content" v-html="content"></div>
  </section>
</template>

<script>
import './author-callout.scss';
import { reactive, computed } from 'vue';
export default {
  name: 'author-callout',
  props: {
    author: {
      type: String,
      required: true
    },
    img: {
      type: String,
      required: false
    },
    header: {
      type: String,
      required: false
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