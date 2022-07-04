<template>
  <!-- <input :type="type" :name="name" v-model="value" :readonly="locked" :class="classes"/> -->
  <select :class="classes" :name="name" v-model="value" :readonly="locked">
    <option v-for="(label, value) in options" :key="value" :value="value">{{label}}</option>
  </select>
</template>

<script>
export default {
  name: 'Input',
  props: ['options', 'name', 'actor', 'classes', 'readonly', 'reactive'],
  computed: {
    value: {
      get() {
        return getProperty(this.actor, this.name);
      },
      set(value) {
        if (this.reactive) {
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