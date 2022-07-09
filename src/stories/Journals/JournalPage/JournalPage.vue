<template>
  <section class="journal-page">
    <h1 class="title">{{header}}</h1>
    <div v-if="content" class="content" v-html="content"></div>
    <div v-else class="content">
      <template v-if="sections">
        <template v-for="section in sections" :key="section">
          <component :is="section.heading ?? 'h2'" v-if="section.header">{{section.header}}</component>
          <div v-if="section.content" v-html="section.content"></div>
        </template>
      </template>
    </div>
    <h2>Components</h2>
    <p>A list of components are displayed below.</p>

    <h3>Quote</h3>
    <h4>NPC</h4>
    <quote content="Lorem ipsum dolor sit amet" type="npc" author="Some Dude"/>
    <h4>Icon</h4>
    <quote content="Lorem ipsum dolor sit amet" type="icon"/>

    <h3>Author Callout</h3>
    <h4>Rob's Callout</h4>
    <author-callout content="Lorem ipsum dolor sit amet" author="Rob Heinsoo"/>
    <h4>Jonathan's Callout</h4>
    <author-callout content="Lorem ipsum dolor sit amet" author="Jonathan Tweet"/>

    <h3>Callout</h3>
    <h4>Player</h4>
    <callout header="Player" type="player" content="Lorem ipsum dolor sit amet."/>
    <h4>GM</h4>
    <callout header="Game Master" type="gm" content="Lorem ipsum dolor sit amet."/>
    <h4>Aside</h4>
    <callout header="Aside" type="aside" content="Lorem ipsum dolor sit amet."/>

    <h3>Icon Background</h3>
    <h4>Great Gold Wyrm</h4>
    <icon-background header="The Great Gold Wyrm's Mirror"
      type="great-gold-wyrm"
      content="<p>Risus arcu tellus dictum congue potenti elementum blandit vehicula porttitor suspendisse. Laoreet feugiat consectetuer ornare primis justo pellentesque letius. Maximus aliquam sociosqu curae justo ante tristique. Arcu fusce integer montes at facilisi proin neque sollicitudin faucibus. Dui quam convallis vulputate est donec natoque hac tristique sodales.</p>
        <p>Pede nunc libero vulputate elementum tempor tellus. Luctus sed faucibus est sollicitudin velit dictum congue. Habitant turpis conubia quis himenaeos egestas arcu. Dapibus maecenas blandit nascetur mollis scelerisque. Consequat euismod tempor iaculis suscipit dui odio tortor curae convallis libero nisl. Sagittis mattis sit quam cubilia montes. Pulvinar dignissim cubilia porta lectus proin aenean ultrices bibendum letius class.</p>"/>
  </section>
</template>

<script>
import './journal-page.scss';
import Quote from '../Quote/Quote.vue';
import AuthorCallout from '../AuthorCallout/AuthorCallout.vue';
import Callout from '../Callout/Callout.vue';
import IconBackground from '../IconBackground/IconBackground.vue';
import { reactive, computed } from 'vue';
export default {
  name: 'journal-page',
  props: {
    header: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: false
    },
    sections: {
      type: Array,
      required: false
    }
  },
  components: {
    Quote,
    AuthorCallout,
    Callout,
    IconBackground
  },

  setup(props, { emit }) {
    props = reactive(props);
  }
}
</script>