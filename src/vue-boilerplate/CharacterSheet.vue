<template>
  <Header :actor="context.actor"/>
  <Tabs :actor="context.actor" group="primary" :tabs="tabs.primary"/>
  <section class="sheet-body">
    <!-- <Features :context="context" :actor="actor" :tab="tabs.primary.features"/>
    <Bio :context="context" :tab="tabs.primary.description"/>
    <Items :context="context" :tab="tabs.primary.items"/>
    <Spells :context="context" :tab="tabs.primary.spells"/>
    <ActiveEffects :context="context" :tab="tabs.primary.effects"/> -->
  </section>
</template>

<script>
import { default as Header } from './components/parts/Header.vue';
import { default as Tabs } from './components/parts/Tabs.vue';
// import { default as Features } from './tabs/Features.vue';
// import { default as Bio } from './tabs/Bio.vue';
// import { default as Items } from './tabs/Items.vue';
// import { default as Spells } from './tabs/Spells.vue';
// import { default as ActiveEffects } from './tabs/ActiveEffects.vue';
export default {
  name: 'CharacterSheet',
  props: ['msg', 'actor', 'context'],
  data() {
    return {
      tabs: {
        primary: {
          features: {
            key: 'features',
            active: true,
            label: 'Features',
          },
          description: {
            key: 'description',
            active: false,
            label: 'Description',
          },
          items: {
            key: 'items',
            active: false,
            label: 'Items',
          },
          spells: {
            key: 'spells',
            active: false,
            label: 'Spells',
          },
          effects: {
            key: 'effects',
            active: false,
            label: 'Effects',
          }
        }
      }
    }
  },
  components: {
    Header: Header,
    Tabs: Tabs,
    // Features: Features,
    // Bio: Bio,
    // Items: Items,
    // Spells: Spells,
    // ActiveEffects: ActiveEffects
  },
  methods: {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
