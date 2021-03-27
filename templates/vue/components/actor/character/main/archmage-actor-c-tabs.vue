<template>
  <section class="section section--tabs flexshrink">
    <input type="text" style="display:none;" :name="concat('flags.archmage.sheetDisplay.tabs.', group, '.value')" v-model="flags.sheetDisplay.tabs[group].value"/>
    <nav :class="concat('sheet-tabs tabs tabs--', group)" :data-group="group">
      <a v-for="(item, index) in tabs" :key="concat('tab-', group, '-', index)" :class="getTabClass(item, index)" :data-tab="index" v-on:click="changeTab"><i v-if="item.icon" :class="concat('fas ', item.icon)"></i><span v-if="!item.hideLabel">{{localize(concat('ARCHMAGE.', index))}}</span></a>
    </nav>
  </section>
</template>

<script>
export default {
  props: ['actor', 'group', 'tabs', 'flags'],
  data: function () {
    return {}
  },
  computed: {},
  methods: {
    changeTab(event) {
      // Get the default tab.
      let tab = this.flags.sheetDisplay.tabs[this.group].value;

      // If this was a click, update the default tab.
      if (event && event.currentTarget) {
        let $target = $(event.currentTarget);
        tab = $target.data('tab');
        this.flags.sheetDisplay.tabs[this.group].value = tab;
      }

      // Update the tab displays.
      for (let [k,v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }

      // Update the active tab display.
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
  async mounted() {
    this.changeTab(false);
  }
}
</script>