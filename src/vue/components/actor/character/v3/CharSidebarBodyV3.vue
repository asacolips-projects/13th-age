<template>
  <CharAbilitiesV3 :actor="actor" />
  <CharDefensesV3 :actor="actor" />
  <CharInitiativeV3 :actor="actor" />
  <CharSavesV3 :actor="actor" />
  <CharBackgroundsV3 :actor="actor" />
  <CharIconsV3 :actor="actor" />
</template>

<script setup>
  import CharAbilitiesV3 from './sidebar/CharAbilitiesV3.vue';
  import CharDefensesV3 from './sidebar/CharDefensesV3.vue';
  import CharInitiativeV3 from './sidebar/CharInitiativeV3.vue';
  import CharSavesV3 from './sidebar/CharSavesV3.vue';
  import CharBackgroundsV3 from './sidebar/CharBackgroundsV3.vue';
  import CharIconsV3 from './sidebar/CharIconsV3.vue';

  defineProps(['actor']);
</script>
