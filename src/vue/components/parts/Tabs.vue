<template>
  <section :class="`section section--tabs section--tabs-${group} flexshrink`">
    <!-- <input type="hidden" :name="concat('flags.archmage.sheetDisplay.tabs.', group, '.value')" v-model="currentTab"/> -->
    <button v-if="hamburger" :class="`sheet-tabs-toggle sheet-tabs-toggle--${group}`" @click="toggleMenu">
      <i class="fas fa-bars"></i><span class="visually-hidden"> Toggle Navigation</span>
    </button>
    <nav :class="`sheet-tabs tabs tabs--${group}`" :data-group="group">
      <template v-if="noSpan">
        <a v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`" @click="changeTab" :class="getTabClass(tab, tabKey)" :data-tab="tabKey">
          <i v-if="tab.icon" :class="concat('fas ', tab.icon)"></i>
          <span v-if="!tab.hideLabel">{{tab.label}}</span>
        </a>
      </template>
      <template v-else>
        <span v-for="(tab, tabKey) in tabs" :key="`tab-${group}-${tabKey}`">
          <a @click="changeTab" @click.right="popOut" :class="getTabClass(tab, tabKey)" :data-tab="tabKey" v-if="!tab.hidden">
            <i v-if="tab.icon" :class="concat('fas ', tab.icon)"></i>
            <span v-if="!tab.hideLabel">{{tab.label}}</span>
          </a>
        </span>
      </template>
    </nav>
  </section>
</template>

<script>
import { concat, getActor } from '@/methods/Helpers';
import { toRaw } from 'vue';
export default {
  name: 'Tabs',
  props: ['context', 'actor', 'group', 'tabs', 'flags', 'hamburger', 'no-span'],
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
      if (typeof this.actor !== 'undefined' && !this.actor.pack) {
        getActor(this.actor).then(actor => {
          actor.setFlag('archmage', `sheetDisplay.tabs.${this.group}.value`, this.currentTab);
        });
      }
      // Close the mobile menu if open. We also need a click listener in the actor sheet class
      // to close it as well, ideally.
      const menu = event?.target?.closest('.section--tabs')?.querySelector('.sheet-tabs');
      if (menu) {
        menu.classList.remove('active');
      }
    },
    async popOut(event) {
      const tab = this.tabs[event.currentTarget.dataset.tab];
      const actor = await getActor(this.actor);
      console.log(tab);
      new CONFIG.ARCHMAGE.ActorTabFocusSheet(tab.componentClass, actor).render(true);
    },
    toggleMenu(event) {
      const target = event.target;
      const menu = target?.closest('.section--tabs')?.querySelector('.sheet-tabs');
      if (menu) {
        menu.classList.toggle('active');
      }
    },
    getTabClass(tab, index) {
      return `tab-link tab-link--${index}${tab.active ? ' active': ''}`;
    }
  },
  async mounted() {
    // Attempt to get the current tab from sheet flags.
    const flagTab = this.flags?.sheetDisplay?.tabs[this.group]?.value;
    // Otherwise, attempt to get the current tab from the first active tab.
    const rawTabs = toRaw(this.tabs);
    this.currentTab = flagTab ?? (Object.values(rawTabs).find(t => t.active)?.key ?? 'details');
    // If the tab is hidden, default to details.
    if (this.tabs[this.currentTab].hidden) {
      this.currentTab = 'details';
    }
    this.changeTab(false);
  }
}
</script>

<style lang="scss">

</style>
