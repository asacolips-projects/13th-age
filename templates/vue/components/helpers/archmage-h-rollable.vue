<template>
  <a :class="cssClass" :data-roll-type="type" :data-roll-opt="opt"><slot></slot></a>
</template>

<script>
export default {
  props: ['name', 'type', 'opt'],
  data: () => ({}),
  computed: {
    cssClass() {
      return this.name ? `rollable rollable--${this.name}` : `rollable`;
    }
  },
  methods: {},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>