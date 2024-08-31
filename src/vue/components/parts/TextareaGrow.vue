<template>
  <div :class="`field-textarea grow-wrap ${classes ?? ''}`" :data-replicated-value="replicatedValue" :data-tooltip="dataTooltip" :data-tooltip-direction="dataTooltipDirection">
    <textarea :name="name"
      :value="valueAttr"
      @input="updateValue"
      rows="1"
      :placeholder="placeholder"
      spellcheck="false"
      @paste="parsePastedContent"
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
  computed: {
    // This is hacky, but it helps with cases where you have a single word wrap to a new line.
    replicatedValue() {
      return `${this.valueAttr} &nbsp; &nbsp;`;
    }
  },
  methods: {
    updateValue(event) {
      this.valueAttr = event.target.value;
      this.$emit('update:value', event.target.value);
    },
    parsePastedContent(event) {
      event.preventDefault();
      const options = {
        field: event.target.name,
      };
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      const result = game.archmage.ArchmageUtility.parseClipboardText(paste, options);
      event.target.value = result;
      this.valueAttr = result;
      this.$emit('update:value', result);
      const changeEvent = new Event('change', {bubbles: true});
      event.target.dispatchEvent(changeEvent);
      return result;
    }
  },
  // Add a watch process to catch upstream updates from the actor/item document.
  watch: {
    'value': {
      handler() {
        this.valueAttr = this.value;
      }
    }
  },
  async created() {
    this.valueAttr = this.value ?? '';
  }
}
</script>