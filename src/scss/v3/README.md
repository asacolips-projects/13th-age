The styles in this directory are not part of the main SCSS bundle
(`archmage.scss` never imports them). They are the V3 sheet's shared
partials, imported by the Vue components' `<style>` blocks (`@import
'v3/...'`, resolved against `src/scss`) and compiled into the Vue bundle's
stylesheet (`dist/vue/styles.vue.css`, loaded via `system.yaml`).

Partials:

- `_details-meta.scss`: the read views' quick-facts header, usage chip
  colours and fieldset sectioning.
- `_drag-reorder.scss`: the row/group drag-reorder feedback classes the
  reorder composables emit.
- `_empty.scss`: the listings' empty-state dash (`.v3-empty`).
- `_pips.scss`: the circle state-pip mixin (feat pips, loadout slot pips).
- `_popover.scss`: the view popover shell and control-column mixins.
- `_pulse.scss`: the single global `v3-empty-pulse` keyframes definition
  (imported by CharSidebarV3's unscoped style block) and the `.v3-pulse`
  helper class — the class binds the animation to whole elements the
  per-field `.field-empty` bindings don't cover, e.g. the catalog's import
  button while the character is empty.
- `_transitions.scss`: the expandable rows' slide-fade rules.
- `_unit-title.scss`: the sidebar/unit heading mixin.
