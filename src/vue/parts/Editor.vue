<template>
  <div class="editor-wrapper">
    <div class="editor">
      <div class="editor-content" :data-edit="target" v-html="enrichHTML()"></div>
      <a class="editor-edit" v-if="canEdit"><i class="fas fa-edit"></i></a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Edtior',
  props: ['owner', 'target', 'content', 'button', 'editable', 'documents', 'links', 'rolls', 'rollData'],
  data() {
    return {
      canEdit: false
    }
  },
  computed: {},
  methods: {
    enrichHTML() {
      const button = Boolean(this.button);
      const editable = Boolean(this.editable);
      this.canEdit = (button && editable);
      const editor = TextEditor.enrichHTML(this.content || '', {
        secrets: this.owner,
        documents: this.documents ?? true,
        links: this.links ?? true,
        rolls: this.rolls ?? true,
        rollData: this.rollData ?? {}
      });
      return editor;
    }
  }
}
</script>

<style lang="scss" scoped>
  .sheet {
    .editor-wrapper,
    .editor,
    .editor-content {
      height: 100%;
    }
  }
</style>