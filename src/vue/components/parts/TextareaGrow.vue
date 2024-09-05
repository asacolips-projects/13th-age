<template>
  <div :class="`field-textarea grow-wrap ${classes ?? ''}`" :data-replicated-value="replicatedValue" :data-tooltip="dataTooltip" :data-tooltip-direction="dataTooltipDirection">
    <textarea :name="name"
      :value="valueAttr"
      @input="updateValue"
      rows="1"
      :placeholder="placeholder"
      spellcheck="false"
      @paste="parsePastedContent"
      @keydown="(event) => handleShiftKey(event, 'keydown')"
      @keyup="(event) => handleShiftKey(event, 'keyup')"
    ></textarea>
  </div>
</template>

<script>
export default {
  name: 'TextareaGrow',
  props: ['classes', 'value', 'name', 'placeholder', 'data-tooltip', 'data-tooltip-direction', 'disable-paste-parsing'],
  data() {
    return {
      valueAttr: '',
      isShift: false,
    }
  },
  computed: {
    // Not currently used, but we can modify this if we need to add things
    // like &nbsp; to the replicated value.
    replicatedValue() {
      return this.valueAttr;
    }
  },
  methods: {
    updateValue(event) {
      this.valueAttr = event.target.value;
      this.$emit('update:value', event.target.value);
    },
    handleShiftKey(event, eventName) {
      if (eventName === 'keydown') {
        if (!this.isShift && event.shiftKey) {
          this.isShift = true;
        }
      }
      else if (eventName === 'keyup') {
        if (this.isShift && event.shiftKey) {
          this.isShift = false;
        }
      }
    },
    parsePastedContent(event) {
      if (!this.isShift && !this.disablePasteParsing && game.settings.get('archmage', 'allowPasteParsing')) {
        event.preventDefault();
        const options = {
          field: event.target.name,
        };
        // Retrieve the value from the field and the clipboard.
        const oldValue = event.target.value ?? '';
        const paste = (event.clipboardData || window.clipboardData).getData('text');
        const result = game.archmage.ArchmageUtility.parseClipboardText(paste, options);
        let newValue = result;
  
        // Handle selections.
        const selection = window.getSelection();
        let startRange = event.target.selectionStart ?? oldValue.length;
        let endRange = event.target.selectionEnd ?? startRange;
        // If there's a selection, replace it.
        if (selection.rangeCount) {
          newValue = `${oldValue.slice(0, startRange)}${result}${oldValue.slice(endRange)}`;
          startRange += result.length;
        }
        // Otherwise, append it.
        else {
          newValue = `${oldValue}${result}`;
        }
  
        // Update field contents.
        event.target.value = newValue;
        this.valueAttr = newValue;
        this.$emit('update:value', newValue);
  
        // Update cursor position.
        if (startRange) {
          event.target.focus();
          event.target.setSelectionRange(startRange, startRange);
        }
  
        // Trigger actor/item updates.
        const changeEvent = new Event('change', {bubbles: true});
        event.target.dispatchEvent(changeEvent);
      }
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