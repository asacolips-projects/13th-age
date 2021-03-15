<template>
  <a :class="cssClass" :data-roll-type="type" :data-roll-opt="opt"><slot></slot></a>
</template>

<script>
export default {
  props: ['name', 'hide-icon', 'type', 'opt'],
  data: () => ({}),
  computed: {
    cssClass() {
      return `rollable${this.hideIcon ? ' hide-icon' : ''}${this.name ? ' rollable--' + this.name : ''}`;
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