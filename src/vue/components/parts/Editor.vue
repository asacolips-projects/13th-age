<template>
  <div class="editor-wrapper">
    <div class="editor">
      <a class="editor-edit" v-if="canEdit"><i class="fas fa-edit"></i></a>
      <div class="editor-content" :data-edit="target" v-html="editor"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Editor',
  props: ['owner', 'target', 'content', 'button', 'editable', 'documents', 'links', 'rolls', 'rollData'],
  async setup(props) {
    const button = Boolean(props.button);
    const editable = Boolean(props.editable);
    const canEdit = (button && editable);
    const editor = await TextEditor.enrichHTML(props.content || '', {
      secrets: props.owner,
      documents: props.documents ?? true,
      links: props.links ?? true,
      rolls: props.rolls ?? true,
      rollData: props.rollData ?? {},
      async: false
    });
    return {
      canEdit,
      editor
    };
  },
  computed: {},
  methods: {},
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
