<template>
  <textarea class="attribute-value"
    :name="name"
    ref="textareaRef"
    rows="20"
    v-html="rawValue"
    spellcheck="false"></textarea>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  const props = defineProps(['name', 'value']);
  // Store a ref so we can attach CodeMirror.
  const textareaRef = ref(null);
  // Move the value into a ref so that CodeMirror can update it.
  const rawValue = ref(props.value);

  onMounted(() => {
    if (game.modules.get('_CodeMirror')?.active && typeof CodeMirror !== undefined) {
      // @todo make this more reactive.
      let nightmode = game.settings.get('archmage', 'nightmode');
      if (!nightmode) {
        nightmode = document.body.classList.contains('theme-dark');
      }
      // Using a timeout for this is super hacky, but it's what we got.
      const element = textareaRef.value;
      if (element) {
        const editor = CodeMirror.fromTextArea(element, {
          ...CodeMirror.userSettings,
          mode: "javascript",
          lineNumbers: true,
          inputStyle: "contenteditable",
          autofocus: false,
          theme: nightmode ? 'monokai' : 'default',
          readOnly: element.hasAttribute('readonly')
        });
        // Update the textarea value so Foundry can see it.
        editor.on('change', (instance) => {
          rawValue.value = instance.getValue();
        });
  
        // Hacky, but refresh the editor content to fix quirks with CodeMirror + Vue.
        setTimeout(() => {
          editor.refresh();
        }, 250);
      }
    }
  });
</script>