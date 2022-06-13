<template>
  <header class="sheet-header">
    <img :src="actor.img" :alt="actor.name" class="profile-img" height="100" width="100"/>
    <div class="header-fields">
      <a @click="launchDialog">Launch Dialog</a>
      <h1 class="charname flexcol">
        <input type="text" name="name" v-model="actor.name" placeholder="Name"/>
      </h1>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  props: ['actor'],
  computed: {
    data() {
      return this.actor.data;
    }
  },
  methods: {}
}
</script>

<style scoped>

</style>