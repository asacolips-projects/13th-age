<template>
  <!-- Usage: -->
  <!--
    <ToggleInput>
      <template v-slot:edit><input type="text" name="foobar" v-model="foobar"></template>
      <template v-slot:display>{{foobar}}</template>
    </ToggleInput>
   -->
  <div class="edit-wrapper">
    <div :class="'input-edit' + (active ? ' active' : '')" @click="toggleEdit" :ref="'toggle-input'">
      <slot name="edit"></slot>
    </div>
    <div class="input-display" @click="toggleEdit">
      <slot name="display"></slot>
    </div>
    <a :class="'input-edit-toggle fas ' + (active ? 'fa-check' : 'fa-edit')" @click="toggleExternal" @focus="toggleEdit" tabindex="0"></a>
  </div>
</template>

<script>
import Input from '@/components/parts/Input.vue';
export default {
  name: 'ToggleInput',
  props: ['closeInputs'],
  components: { Input },
  data() {
    return {
      active: false
    }
  },
  computed: {},
  methods: {
    toggleEdit(event) {
      // Determine if this is an input or not.
      const isInput = ['INPUT','SELECT'].includes(event.target.tagName);

      // Toggle the state if this isn't an input, otherwise persist it.
      this.active = !isInput ? !this.active : this.active;

      // If we're active, select the first input.
      if (this.active && !isInput) {
        const $parent = $(event.target).parents('.edit-wrapper');
        const $el = $parent.find('input,select').first()
        if ($el.length > 0) {
          setTimeout(() => {
            $el.focus().trigger('select');
          }, 100);
        }
      }
    },
    // Method used to toggle the state when triggered by an external update.
    watchForToggle() {
      if (this.active && this.closeInputs) {
        this.active = false;
      }
    }
  },
  watch: {
    'closeInputs': {
      handler() {
        this.watchForToggle();
      }
    },
  },
}
</script>

<style lang="scss">
.archmage-vue {
  .input-edit-toggle {
    position: absolute;
    top: 0;
    right: auto;
    left: -9999px;
    z-index: $z-overlay;
    display: block;
    padding: 6px;
  }

  .edit-wrapper {
    position: relative;

    &:hover,
    &:focus {
      .input-edit-toggle {
        color: $c-blue;
        left: auto;
        right: 0;
      }
    }

    .input-edit-toggle {
      &:hover,
      &:focus {
        color: $c-blue;
        left: auto;
        right: 0;
      }
    }
  }

  .input-edit {
    position: absolute;
    width: auto;
    min-width: 100%;
    background: $c-white;
    box-shadow: 0 0 15px 5px $c-gray--50;
    padding: 13px;
    // height: 50px;
    border-radius: 8px;
    top: 0;
    left: 0;
    z-index: $z-higher;
    display: none;

    &.active {
      display: block;
    }

    input,
    select {
      margin: 0 $padding-sm $padding-sm 0;
    }
  }
}
</style>