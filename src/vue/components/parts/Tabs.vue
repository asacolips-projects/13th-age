<template>
  <section class="section section--tabs flexshrink">
    <!-- <input type="hidden" :name="concat('flags.archmage.sheetDisplay.tabs.', group, '.value')" v-model="currentTab"/> -->
    <nav :class="'sheet-tabs tabs tabs--' + group" :data-group="group">
      <a v-for="(tab, tabKey) in tabs" :key="'tab-' + group + '-' + tabKey" @click="changeTab" :class="getTabClass(tab, tabKey)" :data-tab="tabKey"><i v-if="tab.icon" :class="concat('fas ', tab.icon)"></i><span v-if="!tab.hideLabel">{{tab.label}}</span></a>
    </nav>
  </section>
</template>

<script>
import { concat, getActor } from '@/methods/Helpers';
export default {
  name: 'Tabs',
  props: ['context', 'actor', 'group', 'tabs', 'flags'],
  setup() {
    return { concat }
  },
  data() {
    return {
      currentTab: 'details'
    }
  },
  methods: {
    changeTab(event) {
      // If this was a click, update the default tab.
      if (event && event.currentTarget) {
        this.currentTab = event.currentTarget.dataset.tab;
      }

      // Update the tab displays.
      for (let [k,v] of Object.entries(this.tabs)) {
        this.tabs[k].active = false;
      }

      // Update the active tab display.
      if (this.tabs[this.currentTab]) {
        this.tabs[this.currentTab].active = true;
      }

      // Update the flag.
      const actor = !this.actor.pack ? getActor(this.actor) : false;
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

<style lang="scss">

</style>