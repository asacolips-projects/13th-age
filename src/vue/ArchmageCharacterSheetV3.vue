<template>
  <div ref="rootEl" class="archmage-v3-vue character flexrow" :class="[context.cssClass, { 'is-narrow': narrow }]">
    <!-- Control cluster: the edit toggle (owned at the sheet level, broadcast
         to children via provide/inject) and the settings cog. Absolutely
         positioned in both layouts — over the sidebar's top-left corner in
         the wide layout, over the command bar's right edge in narrow. -->
    <div v-if="context.editable" class="sheet-controls">
      <button type="button" class="sheet-edit-toggle" :title="localize('ARCHMAGE.edit')" @click="toggleEdit">
        <i :class="editing ? 'fas fa-check' : 'fas fa-pen-to-square'"></i>
      </button>
      <button type="button" class="sheet-settings-toggle" :title="localize('ARCHMAGE.CHARACTERSETTINGS.settings')" @click="openSettings">
        <i class="fas fa-gear"></i>
      </button>
    </div>

    <!-- Wide layout: full-height sidebar (identity, defenses, abilities) over
         to a right column with a fixed stats header and the tabbed main. -->
    <template v-if="!narrow">
      <CharSidebarV3 :actor="context.actor" />

      <section class="sheet-right flexcol">
        <CharStatsHeaderV3 :actor="context.actor" />
        <CharMainV3 :context="context" />
      </section>
    </template>

    <!-- Narrow layout: single column. Identity condenses into a command bar,
         the vitals stay pinned beneath it, and the sidebar's units re-home
         into a character tab inside CharMainV3. -->
    <template v-else>
      <header class="sheet-command-bar">
        <CharIdentityV3 :actor="context.actor" />
      </header>

      <CharStatsHeaderV3 :actor="context.actor" />
      <!-- Bound explicitly: a bare `narrow` attribute would arrive as ""
           (falsy) because array-declared props get no boolean casting. -->
      <CharMainV3 :context="context" :narrow="narrow" />
    </template>
  </div>
</template>

<script setup>
  import { ref, computed, provide, onMounted, onBeforeUnmount } from 'vue';
  import { localize, getActor } from '@/methods/Helpers';
  import CharSidebarV3 from '@/components/actor/character/v3/CharSidebarV3.vue';
  import CharIdentityV3 from '@/components/actor/character/v3/CharIdentityV3.vue';
  import CharStatsHeaderV3 from '@/components/actor/character/v3/CharStatsHeaderV3.vue';
  import CharMainV3 from '@/components/actor/character/v3/CharMainV3.vue';

  const props = defineProps(['context']);

  const editing = ref(false);
  provide('editMode', editing);

  function toggleEdit() {
    editing.value = !editing.value;
  }

  // First-run experience. A character with neither kin nor class filled in is
  // presumed brand new, so the sheet opens straight into edit mode once; the
  // blank fields then pulse for attention (CharIdentityV3), since the power
  // importer depends on both.
  const missingKinClass = computed(() => {
    const details = props.context.actor?.system?.details ?? {};
    return !details.race?.value && !details.class?.value;
  });

  // Narrow layout switch: key off the sheet's own width rather than the
  // viewport, because a Foundry window resizes independently of the device.
  // Below the breakpoint the root renders the single-column arrangement.
  const NARROW_BREAKPOINT = 720;

  const rootEl = ref(null);
  const narrow = ref(false);
  let resizeObserver = null;

  onMounted(() => {
    resizeObserver = new ResizeObserver(entries => {
      narrow.value = entries[0].contentRect.width < NARROW_BREAKPOINT;
    });
    resizeObserver.observe(rootEl.value);

    // Open a character missing its kin and class straight into edit mode,
    // once per mount — filling them in later shouldn't hijack the user's
    // cursor.
    if (props.context.editable && !props.context.actor?.pack && missingKinClass.value) {
      editing.value = true;
    }
  });

  onBeforeUnmount(() => resizeObserver?.disconnect());

  // Opens the per-character settings window. The AppV2 class lives in the
  // module bundle (exposed on game.archmage) to keep the module -> vue bundle
  // dependency one-directional.
  async function openSettings() {
    const App = game.archmage?.ArchmageCharacterSettingsApp;
    if (!App || props.context.actor?.pack) return;
    const actor = await getActor(props.context.actor);
    if (!actor) return;
    App.show(actor);
  }
</script>

<style lang="scss">
  .archmage-v3-vue {
    /* Theme tokens: every color and font the V3 sheet uses resolves through
       one of these custom properties, so a theme only has to override this
       block (e.g. by scoping new values to a theme class on this root).
       Defaults alias the global palette/typography variables so color modes
       and night mode keep flowing through unchanged. */
    --v3-rollable: var(--c-blue);
    --v3-rollable-glow: var(--c-blue--50);
    --v3-hover-glow: var(--c-black--25);
    --v3-negative: var(--c-red);

    /* Inline-roll expressions ([[...]]), which the enrichment helpers behind
       Enriched wrap in .expression spans. Copied from the V2 sheet's rule in
       the SCSS bundle (v2/layout/_layout.scss), which is nested under
       .archmage-v2 and so never matches this root. */
    --v3-expression: var(--color-warm-2);

    /* Power usage colours: the system-wide gradients, which the colour-blind
       modes override through their body classes. Aliased so a theme only has
       to override this block to retint them. */
    --v3-power-will: var(--c-power-will);
    --v3-power-battle: var(--c-power-battle);
    --v3-power-daily: var(--c-power-daily);
    --v3-power-recharge: var(--c-power-recharge);
    --v3-power-other: var(--c-power-other);
    --v3-power-equipment: var(--c-power-equipment);

    /* Effect summaries use the system-wide power gradient so colorblind
       modes keep flowing through; themes can override this token. */
    --v3-effect-bg: var(--c-power-other);
    --v3-chip-bg: var(--c-black--25);

    /* Feat rows carry the system-wide feat gradient, same deal. */
    --v3-feat: var(--c-feat);

    /* Surface for the elements that mask rows passing beneath them: the
       loadout's sticky section headers and its tracker popover. The default
       aliases core's --background so dark mode tracks the window frame
       exactly. But core's light-mode value for it is the parchment texture,
       and a url() inside a var() resolves against whichever stylesheet uses
       the variable — from the vue bundle that's under /systems/archmage/,
       where the core asset doesn't exist, leaving nothing painted. Light
       mode therefore re-points the texture at core's copy, see below. */
    --v3-surface: var(--background);

    /* Light mode: core paints its windows with the parchment texture, so the
       masks match with the same texture. The url survives the build
       unrewritten (no such file in the repo to bundle) and resolves at
       runtime against the vue bundle's served path /systems/archmage/vue/ —
       the three ../ climb to the Foundry root, where core serves it. */
    body.theme-light & {
      --v3-surface: url('../../../ui/parchment.jpg') repeat;
      --placeholder-color: var(--color-dark-3);
    }

    /* Empty-field pulse accent (first-run attention on name/kin/class). */
    --v3-hint: var(--c-yellow);

    /* Placeholder prompt color: the V2 bundle defines the theme values as
       --input-placeholder-color on .archmage-appv2, an ancestor this sheet
       doesn't render under, so alias the same values here. */
    --placeholder-color: var(--color-light-4);

    --v3-font-display: #{$font-stack-secondary};
    --v3-font-label: #{$font-stack-label};
    --v3-font-base: #{$font-stack-base};

    font-family: $font-stack-base;
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--v3-font-display);
      font-weight: bold;
    }

    /* Inline-roll expressions, styled sheet-wide like the V2 sheet does; the
       spans arrive through v-html in child components, which the root's
       unscoped styles reach without :deep(). */
    .expression {
      color: var(--v3-expression);
      font-weight: bold;
    }

    /* Placeholder prompts, sheet-wide: brighter than the browser default and
       italic, and right-aligned while shown — i.e. while the field is empty.
       Typing restores the input's own text alignment; centered number inputs
       keep their own rules where more specific. */
    input::placeholder {
      color: var(--placeholder-color);
      font-style: italic;
    }

    height: 100%;
    position: relative;
    flex: 1;

    /* Required so the height stays pinned to the window: without it the
       min-content floor lets tall children (the sidebar) inflate this root
       past the form, and their overflow-y scrollbars never engage. */
    min-height: 0;

    /* Own the layout explicitly rather than relying on Foundry's .flexrow
       utility: the sidebar and right column must start at the top edge and
       stretch to the full height of the window. */
    display: flex;
    flex-direction: row;
    align-items: stretch;

    .sheet-controls {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        padding: 0;
        font-size: var(--font-size-10);
        line-height: 1;
      }
    }

    /* Narrow layout: single column beneath the command bar. The structural
       swap (sidebar -> tab) happens in the templates; everything here is
       reflow and restyling. These global rules out-specify the children's
       scoped styles (class count beats class + attribute). */
    &.is-narrow {
      flex-direction: column;

      /* Controls relocate over the command bar's right edge and grow to
         touch-friendly size. */
      .sheet-controls {
        top: 0.5rem;
        left: auto;
        right: 0.5rem;
        flex-direction: row;

        button {
          width: 1.75rem;
          height: 1.75rem;
          font-size: var(--font-size-16);
        }
      }

      /* The identity block doubles as the command bar: one row with the
         portrait shrunk, the name/subtitle left-aligned, and One Unique
         Thing clamped to a couple of lines (edit mode still opens the full
         ProseMirror allowance). */
      .sheet-command-bar {
        flex: 0 0 auto;
        border-bottom: 1px solid var(--color-border);

        .sheet-header {
          flex-direction: row;
          align-items: center;
          gap: 0.625rem;
          padding: 0.375rem 4.5rem 0.375rem 0.5rem;
          border-bottom: none;

          .header-portrait {
            align-self: center;

            img {
              height: 2.25rem;
            }
          }

          .header-id {
            flex: 1 1 auto;
            text-align: left;
          }

          .header-out {
            flex: 0 1 12rem;
            max-height: none;
            border-top: none;
            padding-top: 0;

            .out-label {
              display: none;
            }

            .out-text {
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
            }

            &.header-out--editing {
              max-height: 240px;

              .out-text {
                display: block;
                overflow-y: auto;
              }
            }
          }
        }
      }

      /* Vitals: HP and recoveries split the first row; the save tracks wrap
         onto their own row beneath. */
      .sheet-stats-header .stats-row {
        flex-wrap: wrap;
      }

      .sheet-stats-header .stats-unit--saves {
        flex-basis: 100%;
        border-right: none;
        border-top: 1px solid var(--color-border);
      }

      /* Resource tiles wrap into their own rows instead of squeezing onto a
         single line; each tile carries its own top border so wrapped rows
         stay separated. */
      .sheet-stats-header .stats-resources {
        flex-wrap: wrap;
        border-top: none;

        .unit {
          flex-grow: 1;
          flex-shrink: 1;
          flex-basis: 10rem;
          border-top: 1px solid var(--color-border);
        }
      }

      /* Tab strip: icon-only (labels are dropped via the tabs data in
         CharMainV3, tooltips survive through hideLabel) and scrollable for
         very small windows; links grow to touch-friendly size. */
      .sheet-main .section--tabs {
        overflow-x: auto;
      }

      .sheet-main .tab-link {
        padding: 0.5rem 0.625rem;
      }
    }
  }

  .sheet-right {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;

    /* Same height pin as .sheet-sidebar: without it this column rides at its
       content height instead of the window height and its internal scroll
       regions never engage. */
    height: 100%;

    /* The stats header pins to the top (flex: 0 0 auto on the header) and
       CharMainV3 grows to fill everything beneath it. */
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  /* Window-level rules: the window frame and form sit above the component
     root, so scoped selectors can't reach them. */
  .archmage-v3.character-sheet {
    .window-content {
      padding: 0;
    }

    .window-content > form {
      height: 100%;
      overflow: hidden;
    }
  }
</style>
