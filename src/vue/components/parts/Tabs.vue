<template>
  <section class="section section--tabs flexshrink">
    <!-- <input type="hidden" :name="concat('flags.archmage.sheetDisplay.tabs.', group, '.value')" v-model="currentTab"/> -->
    <nav :class="'sheet-tabs tabs tabs--' + group" :data-group="group">
      <a v-for="(tab, tabKey) in tabs" :key="'tab-' + group + '-' + tabKey" @click="changeTab" :class="getTabClass(tab, tabKey)" :data-tab="tabKey"><i v-if="tab.icon" :class="concat('fas ', tab.icon)"></i><span v-if="!tab.hideLabel">{{tab.label}}</span></a>
    </nav>
  </section>
</template>

<script>
import { concat } from '@/methods/Helpers';
export default {
  name: 'Tabs',
  props: ['context', 'actor', 'group', 'tabs', 'flags'],
  setup() {
    return { concat }
  },
  data() {
    return {
      currentTab: 'powers'
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

      // Update the flag.
      const actor = game.actors.get(this.actor._id) ?? false;
      if (actor) actor.setFlag('archmage', `sheetDisplay.tabs.${this.group}.value`, this.currentTab);
    },
    getTabClass(tab, index) {
      return `tab-link tab-link--${index}${tab.active ? ' active': ''}`;
    }
  },
  async mounted() {
    this.currentTab = this.flags.sheetDisplay.tabs[this.group].value ? this.flags.sheetDisplay.tabs[this.group].value : 'details';
    this.changeTab(false);
  }
}
</script>

<style scoped>

</style>