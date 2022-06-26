<template>
  <input :type="type" :name="name" v-model="value" :readonly="locked" :class="classes"/>
</template>

<script>
export default {
  name: 'Input',
  props: ['type', 'name', 'actor', 'classes', 'readonly', 'reactive'],
  computed: {
    value: {
      get() {
        return getProperty(this.actor, this.name);
      },
      set(value) {
        if (this.reactive) {
          console.log(value);
          setProperty(this.actor, this.name, value);
        }
        else {
          return false;
        }
      }
    },
    locked() {
      return this.readonly || this.actor.lockedFields.includes(this.name);
    }
  }
}
</script>