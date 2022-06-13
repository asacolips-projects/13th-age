<template>
  <nav :class="'sheet-tabs tabs tabs--' + group" :data-group="group">
    <a v-for="(tab, tabKey) in tabs" :key="'tab-' + group + '-' + tabKey" @click="changeTab" :class="getTabClass(tab, tabKey)" :data-tab="tabKey">{{tab.label}}</a>
  </nav>
</template>

<script>
export default {
  name: 'Tabs',
  props: ['context', 'actor', 'group', 'tabs'],
  data() {
    return {
      currentTab: 'features'
    }
  },
  methods: {
    changeTab(event) {
      // If this was a click, update the default tab.
      if (event && event.currentTarget) {
        let $target = $(event.currentTarget);
        this.currentTab = $target.data('tab');
      }

      // Update the tab displays.
      for (let [k,v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }

      // Update the active tab display.
      this.tabs[this.currentTab].active = true;
    },
    getTabClass(tab, index) {
      return `item ${tab.active ? ' active': ''}`;
    }
  }
}
</script>

<style scoped>

</style>