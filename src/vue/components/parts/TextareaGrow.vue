<template>
  <div :class="`field-textarea grow-wrap ${classes ?? ''}`" :data-replicated-value="valueAttr" :data-tooltip="dataTooltip" :data-tooltip-direction="dataTooltipDirection">
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
  methods: {
    updateValue(event) {
      this.valueAttr = event.target.value;
      this.$emit('update:value', event.target.value);
    },
    parsePastedContent(event) {
      event.preventDefault();
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      const result = game.archmage.ArchmageUtility.parseClipboardText(paste);
      event.target.value = result;
      this.valueAttr = result;
      this.$emit('update:value', result);
      // const selection = window.getSelection();
      // if (!selection.rangeCount) return;
      // selection.deleteFromDocument();
      // selection.getRangeAt(0).insertNode(document.createTextNode(paste));
      // selection.collapseToEnd();
      console.log('result', result);
      return result;
    }
  },
  async created() {
    this.valueAttr = this.value ?? '';
  }
}
</script>