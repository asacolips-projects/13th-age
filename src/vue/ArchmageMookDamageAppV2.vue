<template>
  <!-- <div class="form-header">How do you want to apply the damage?</div> -->
  <div class="dialog-content standard-form" :key="context._renderKey">
    <fieldset>
      <legend>Targets</legend>
      <div class="flexrow mook-row mook-header">
        <span class="mook-img"></span>
        <span class="mook-name">Name</span>
        <span class="mook-hp">Current HP</span>
        <span class="mook-damage">Damage</span>
        <span class="mook-spill">Spillover</span>
      </div>
      <ul class="mooks-list mooks-targets">
        <li v-for="(token, index) in context.mooks.targets" :key="token._id">
          <MookDamageRow :token="token" :editable="false" :damage="damage"/>
        </li>
      </ul>
      <div class="flexrow mook-row mook-footer">
        <span class="mook-name"></span>
        <strong class="mook-spill">{{ context.damage.spillover }}</strong>
      </div>
    </fieldset>

    <fieldset>
      <legend>Other Mooks</legend>
      <div class="flexrow mook-row mook-header">
        <span class="mook-img"></span>
        <span class="mook-name">Name</span>
        <span class="mook-hp">Current HP</span>
        <span class="mook-damage">Damage</span>
        <span class="mook-spill">Spillover</span>
      </div>
      <ul class="mooks-list mooks-other">
        <li v-for="(token, index) in context.mooks.other" :key="token._id">
          <MookDamageRow :token="token" :editable="true" :damage="damage"/>
        </li>
      </ul>
    </fieldset>

    <div class="flexrow mooks-total">
      <span class="total-label">Total Damage</span>
      <strong class="total-damage">{{ context.damage.total }}</strong>
    </div>
  </div>
  <div class="form-footer">
    <button type="submit" data-action="ok"><i class="fas fa-check"></i> Apply Damage</button>
  </div>
</template>

<!-- <script setup>
import MookDamageRow from '@/components/dialogs/mook-damage/MookDamageRow.vue';
import { inject, nextTick } from 'vue';
import { reactive } from '../scripts/lib/vue.esm-browser';

const props = defineProps(['context']);
const damageBaseObject = {};

for (let [groupName, group] of Object.entries(props.context.mooks)) {
  for (let token of group) {
    damageBaseObject[token._id] = {
      damage: groupName === 'targets' ? props.context.damage.single : 0,
      spillover: 0,
    };
  }
}

const damage = reactive(damageBaseObject);
nextTick(() => console.log('main'));
</script> -->
<script>
import MookDamageRow from '@/components/dialogs/mook-damage/MookDamageRow.vue';
export default {
  name: 'ArchmageMookDamageAppV2',
  props: ['context'],
  components: {
    MookDamageRow,
  },
  setup() {
    return {
      CONFIG,
      game,
      foundry,
    }
  },
  data() {
    return {
      damage: {},
      tabs: {
        primary: {},
      },
    }
  },
  methods: {},
  computed: {},
  watch: {},
  async created() {
    for (let [groupName, group] of Object.entries(this.context.mooks)) {
      for (let token of group) {
        this.damage[token._id] = {
          damage: groupName === 'targets' ? this.context.damage.single : 0,
          spillover: 0,
        };
      }
    }
  },
  async mounted() {},
}
</script>