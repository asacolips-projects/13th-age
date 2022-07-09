<template>
  <figure :class="`quote${type ? ' ' + type : ''}`">
    <blockquote>
      <h1 v-if="header" class="title">{{header}}</h1>
      <div class="content" v-html="content"></div>
    </blockquote>
    <figcaption v-if="author">&mdash; {{author}}</figcaption>
  </figure>
</template>

<script>
import './quote.scss';
import { reactive, computed } from 'vue';
export default {
  name: 'quote',
  props: {
    type: {
      type: String,
      required: true
    },
    header: {
      type: String,
      required: false
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: false
    }
  },

  setup(props, { emit }) {
    props = reactive(props);
  }
}
</script>