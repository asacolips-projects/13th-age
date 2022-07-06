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
  name: 'Editor',
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
        rollData: this.rollData ?? {},
        async: false
      });
      return editor;
    }
  }
}
</script>

<style lang="scss">
.archmage-v2.npc-sheet {
  .sheet {
    .editor-wrapper,
    .editor,
    .editor-content {
      height: 100%;

      &:hover {
        .editor-edit {
          opacity: 1;
        }
      }
    }

    .editor-edit {
      background: transparent;
      border: none;
      box-shadow: none;
      opacity: 0;
      z-index: $z-overlay;
      margin-top: -8px;

      &:hover,
      &:focus {
        opacity: 1;
      }
    }
  }
}
</style>
