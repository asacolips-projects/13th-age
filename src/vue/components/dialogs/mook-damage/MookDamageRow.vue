<template>
  <div class="flexrow mook-row" :key="damage[token._id].damage">
    <img class="mook-img" :src="token.actor.img" alt="Mook Avatar" width="50" height="50"/>
    <span class="mook-name">{{ token.name }}</span>
    <span class="mook-hp">{{ token.actor.system.attributes.hp.value }}</span>
    <div class="form-group mook-damage">
      <input v-if="editable" type="number"
        :name="token._id"
        :data-uuid="token.actor.uuid"
        v-model="damageValue"
      />
      <span v-else>{{ damageValue }}</span>
    </div>
    <span class="mook-spill">{{ spillover }}</span>
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch, nextTick } from 'vue';
const props = defineProps(['token', 'editable', 'damage']);
// console.log('damage', props.damage);

const damageValue = ref(props.damage[props.token._id].damage ?? 0);

const spillover = computed(() => {
  console.log('damage', damageValue);
  const spill = damageValue.value - Number(props.token.actor.system.attributes.hp.value);
  return spill > 0 ? spill : 0;
});

// const damageValue = ref(0);
// const spillover = computed(() => {
//   console.log('foo', props.damage);
//   const dmg = Number(props.damage);
//   const hp = Number(props.token.actor.system.attributes.hp.value);
//   return dmg > 0 ? dmg - hp : 0;
// });
</script>