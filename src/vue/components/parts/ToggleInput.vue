<template>
  <!-- Usage: -->
  <!--
    <ToggleInput>
      <template v-slot:edit><input type="text" name="foobar" v-model="foobar"></template>
      <template v-slot:display>{{foobar}}</template>
    </ToggleInput>
   -->
  <div class="edit-wrapper">
    <div v-if="active" class="input-edit">
      <slot name="edit"></slot>
    </div>
    <div class="input-display">
      <slot name="display"></slot>
    </div>
    <span :class="'icon-edit-toggle fas ' + (active ? 'fa-check' : 'fa-edit')" v-on:click="toggleEdit"></span>
  </div>
</template>

<script>
import Input from '@/components/parts/Input.vue';
export default {
    name: 'ToggleInput',
    props: [],
    components: { Input },
    data() {
      return {
        active: false
      }
    },
    methods: {
      // @todo also add a tab/enter event to toggle this.
      toggleEdit(event) {
        this.active = !this.active;
      }
    }
}
</script>

<style lang="scss" scoped>
.edit-wrapper {
  position: relative;
}

.input-edit {
  position: absolute;
  width: auto;
  min-width: 100%;
  background: $c-white;
  box-shadow: 0 0 15px 5px $c-gray--50;
  padding: 13px;
  height: 50px;
  border-radius: 8px;
  top: 0;
  left: 0;
  z-index: $z-higher;
}

.icon-edit-toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: $z-overlay;
  display: none;
  padding: 6px;

  &:hover,
  &:focus {
    color: $c-blue;
    display: block;
  }

  .edit-wrapper:hover & {
    display: block;
  }
}
</style>