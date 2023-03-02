<template>
  <!-- HEADER -->
  <header class="header character-header grid grid-4col">
    <!-- Name -->
    <div class="unit unit--abs-label unit--name" :data-tooltip="tooltip('pcName')">
      <label for="name">{{localize("ARCHMAGE.name")}}</label>
      <input type="text" name="name" class="input-secondary" v-model="actor.name">
    </div>
    <!-- Race -->
    <div class="unit unit--abs-label unit--race" :data-tooltip="tooltip('pcRace', 'pcRaceDesc')">
      <label for="system.details.race.value">{{secondEdition ? localize("ARCHMAGE.kin") : localize("ARCHMAGE.race")}}</label>
      <input type="text" name="system.details.race.value" class="input-secondary" v-model="actor.system.details.race.value">
    </div>
    <!-- Class -->
    <div class="unit unit--abs-label unit--class" :data-tooltip="tooltip('pcClass')">
      <label for="system.details.class.value">{{localize("ARCHMAGE.class")}}</label>
      <input type="text" name="system.details.class.value" class="input-secondary" v-model="actor.system.details.class.value">
    </div>
    <!-- Level -->
    <div class="unit unit--abs-label unit--level" :data-tooltip="tooltip('pcLevel')">
      <label for="system.attributes.level.value">{{localize("ARCHMAGE.level")}}</label>
      <input type="number" name="system.attributes.level.value" class="input-secondary" v-model="actor.system.attributes.level.value" min="0">
    </div>
  </header>
</template>

<script>
import { localize, tooltip } from '@/methods/Helpers';
export default {
  name: 'CharacterHeader',
  props: ['actor'],
  setup() {
    return {
      localize,
      tooltip
    }
  },
  data() {
    return {
      level: {}
    }
  },
  computed: {
    secondEdition() {
      return game.settings.get('archmage', 'secondEdition') === true;
    }
  },
  methods: { /* See created. */},
  async mounted() {
    this.level = this.actor.system.attributes.level;
  }
}
</script>
