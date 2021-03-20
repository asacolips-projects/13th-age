<template>
  <section class="section section--incrementals flexcol">
    <h2 class="unit-title">{{localize('Incremental Advances')}}</h2>
    <ul class="list list--incrementals incrementals">
      <li v-for="(item, index) in actor.data.incrementals" :key="index" class="list-item list-item--incrementals incremental" :data-key="index">
        <label :for="concat('data.incrementals.', index)" :title="localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Hint'))">
          <input type="checkbox" :name="concat('data.incrementals.', index)" v-model="actor.data.incrementals[index]">
          {{localize(concat('ARCHMAGE.INCREMENTALS.', index, 'Name'))}}
        </label>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: ['actor'],
  data: function () {
    return {}
  },
  computed: {},
  methods: { /* See created. */},
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>