<template>
  <section :class="classes" data-tab="powers">
    <section v-for="groupKey in groups" :key="groupKey" class="power-group">
      <div class="power-group-header flexrow">
        <h2 class="power-group-title unit-title">{{localize(groupKey)}}</h2>
        <div class="item-controls">
          <a class="item-control item-create" data-item-type="power" :data-power-type="groupKey"><i class="fas fa-plus"></i> Add</a>
        </div>
      </div>
      <ul class="power-group-content flexcol">
        <li v-for="(power, powerKey) in powerGroups[groupKey]" :key="powerKey" class="power flexrow">
          <h3 class="power-title unit-subtitle">{{power.name}}</h3>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
export default {
  props: ['actor', 'tab'],
  data: function() {
    return {
      groups: [
        'feature',
        'talent',
        'power',
        'spell',
        'other'
      ]
    }
  },
  computed: {
    classes() {
      return `section section--powers flexcol${this.tab.active ? ' active' : ''}`;
    },
    powerGroups() {
      let powers = this.actor.items.filter(i => i.type == 'power');
      let powersByGroup = duplicate(powers).reduce((powerGroup, power) => {
        if (power.data.powerType.value) {
          let group = power.data.powerType.value ? power.data.powerType.value : 'other';
          if (!powerGroup[group]) {
            powerGroup[group] = [];
          }
          powerGroup[group].push(power);
        }
        return powerGroup;
      }, {});

      return powersByGroup;
    }
  },
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>