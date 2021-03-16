<template>
  <section class="section section--tabs flexshrink">
    <nav :class="concat('sheet-tabs tabs tabs--', group)" :data-group="group">
      <a v-for="(item, index) in tabs" :key="concat('tab-', group, '-', index)" :class="getTabClass(item, index)" :data-tab="index" v-on:click="changeTab"><i v-if="item.icon" :class="concat('fas ', item.icon)"></i><span v-if="!item.hideLabel">{{localize(concat('ARCHMAGE.', index))}}</span></a>
    </nav>
  </section>
</template>

<script>
export default {
  props: ['actor', 'group', 'tabs'],
  data: function () {
    return {
      group: 'primary',
      tabs: []
    }
  },
  computed: {},
  methods: {
    changeTab(event) {
      let $target = $(event.currentTarget);
      let tab = $target.data('tab');
      for (let [k,v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }
      this.tabs[tab].active = true;
    },
    getTabClass(tab, index) {
      return `tab-link tab-link--${index}${tab.active ? ' active' : ''}`;
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>