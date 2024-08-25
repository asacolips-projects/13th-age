<template>
  <div :class="`field-textarea grow-wrap ${classes ?? ''}`" :data-replicated-value="valueAttr" :data-tooltip="dataTooltip" :data-tooltip-direction="dataTooltipDirection">
    <textarea :name="name"
      :value="valueAttr"
      @input="updateValue"
      rows="1"
      :placeholder="placeholder"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script>
export default {
  name: 'TextareaGrow',
  props: ['classes', 'value', 'name', 'placeholder', 'data-tooltip', 'data-tooltip-direction'],
  data() {
    return {
      valueAttr: ''
    }
  },
  methods: {
    updateValue(event) {
      this.valueAttr = event.target.value;
      this.$emit('update:value', event.target.value);
    }
  },
  async created() {
    this.valueAttr = this.value ?? '';
  }
}
</script>