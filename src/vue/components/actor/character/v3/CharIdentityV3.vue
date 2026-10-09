<template>
	<!-- Wide layout: hero banner. The portrait bleeds across a fixed-height
       area with the name docked to its bottom edge. The profile-img class
       goes on the hero itself: ContextMenu injects the menu into the matched
       element and forces an inline `position: relative` on it that it never
       removes, so the hook must live on an element that is already
       relative — putting it on the absolutely-positioned portrait layer
       would knock the image out of the banner for good. -->
	<header v-if="!narrow" class="sheet-header sheet-header--hero">
		<div class="header-hero profile-img">
			<div class="header-portrait" :class="{ 'portrait--round': portraitRound, 'portrait--frame': portraitFrame, 'portrait--full': portraitFull }">
				<img
					:src="actor?.img"
					:alt="localize('ARCHMAGE.avatarAlt')"
					:title="actor?.name"
					data-edit="img"
					data-action="onEditImage"
					:data-tooltip="tooltip('portrait')"
				>
			</div>

			<!-- Name + subtitle, or their edit fields -->
			<div class="header-id flexcol" :class="{ 'header-id--editing': editing }">
				<template v-if="!editing">
					<h1 class="char-name">{{ actor?.name }}</h1>
					<p v-if="subtitle" class="char-subtitle">{{ subtitle }}</p>
				</template>
				<template v-else>
					<input v-model="actor.name" type="text" name="name" :placeholder="localize('ARCHMAGE.name')">
					<AutocompleteInput
						v-model="actor.system.details.race.value"
						name="system.details.race.value"
						:placeholder="kinLabel"
						:suggestions="kinSuggestions"
						:input-class="{ 'field-empty': isBlank(actor.system.details.race.value) }"
					/>
					<AutocompleteInput
						v-model="actor.system.details.class.value"
						name="system.details.class.value"
						:placeholder="localize('ARCHMAGE.class')"
						:suggestions="classSuggestions"
						:input-class="{ 'field-empty': isBlank(actor.system.details.class.value) }"
					/>
					<input
						v-model="actor.system.attributes.level.value"
						type="number"
						name="system.attributes.level.value"
						:class="{ 'field-empty': isZeroish(actor.system.attributes.level.value) }"
						min="0"
						max="10"
					>
				</template>
			</div>
		</div>

		<!-- One Unique Thing, hidden by the character settings flag like the
       v2 sidebar's OUT block. -->
		<div v-if="showOut" class="header-out" :class="{ 'header-out--editing': editing }">
			<h2 class="out-label">{{ localize('ARCHMAGE.oneUniqueThing') }}</h2>
			<!-- Display shows the enriched HTML; edit mode swaps in a full
           ProseMirror editor (same mechanism as the notes tab). -->
			<div v-if="!editing" class="out-text" v-html="outEnriched" />
			<div v-else ref="outEditorHost" class="out-editor" />
		</div>
	</header>

	<!-- Narrow layout: compact command bar, one row — portrait thumb,
       name/subtitle left-aligned, One Unique Thing clamped to a couple of
       lines. Here the portrait wrapper is in the normal flow, so the
       profile-img hook can live on it directly. -->
	<header v-else class="sheet-header sheet-header--bar">
		<div class="header-portrait profile-img" :class="{ 'portrait--round': portraitRound, 'portrait--frame': portraitFrame }">
			<img
				:src="actor?.img"
				:alt="localize('ARCHMAGE.avatarAlt')"
				:title="actor?.name"
				data-edit="img"
				data-action="onEditImage"
				:data-tooltip="tooltip('portrait')"
			>
		</div>

		<!-- Name + subtitle, or their edit fields -->
		<div class="header-id flexcol" :class="{ 'header-id--editing': editing }">
			<template v-if="!editing">
				<h1 class="char-name">{{ actor?.name }}</h1>
				<p v-if="subtitle" class="char-subtitle">{{ subtitle }}</p>
			</template>
			<template v-else>
				<input v-model="actor.name" type="text" name="name" :placeholder="localize('ARCHMAGE.name')">
				<AutocompleteInput
					v-model="actor.system.details.race.value"
					name="system.details.race.value"
					:placeholder="kinLabel"
					:suggestions="kinSuggestions"
					:input-class="{ 'field-empty': isBlank(actor.system.details.race.value) }"
				/>
				<AutocompleteInput
					v-model="actor.system.details.class.value"
					name="system.details.class.value"
					:placeholder="localize('ARCHMAGE.class')"
					:suggestions="classSuggestions"
					:input-class="{ 'field-empty': isBlank(actor.system.details.class.value) }"
				/>
				<input
					v-model="actor.system.attributes.level.value"
					type="number"
					name="system.attributes.level.value"
					:class="{ 'field-empty': isZeroish(actor.system.attributes.level.value) }"
					min="0"
					max="10"
				>
			</template>
		</div>

		<!-- One Unique Thing, hidden by the character settings flag like the
       v2 sidebar's OUT block. -->
		<div v-if="showOut" class="header-out" :class="{ 'header-out--editing': editing }">
			<h2 class="out-label">{{ localize('ARCHMAGE.oneUniqueThing') }}</h2>
			<div v-if="!editing" class="out-text" v-html="outEnriched" />
			<div v-else ref="outEditorHost" class="out-editor" />
		</div>
	</header>
</template>

<script setup>
import { ref, computed, inject, watch, nextTick } from "vue";
import { isBlank, isSecondEdition, isZeroish, localize, tooltip } from "@/methods/Helpers";
import { useProseMirrorEditor } from "@/composables/useProseMirrorEditor";
import AutocompleteInput from "@/components/parts/AutocompleteInput.vue";

const props = defineProps(["actor"]);

// Kin and class name completion: the same lists the power importer routes on
// (CONFIG.ARCHMAGE.classList / raceList, whose values are localized into
// display names at setup). A picked name cleans back to the importer's keys,
// e.g. "Chaos Mage" -> "chaosmage".
const classSuggestions = Object.values(CONFIG.ARCHMAGE.classList).sort((a, b) => a.localeCompare(b));
const kinSuggestions = Object.values(CONFIG.ARCHMAGE.raceList).sort((a, b) => a.localeCompare(b));

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject("editMode", ref(false));

// The sheet root broadcasts the layout switch the same way: the sidebar
// renders the hero banner, the narrow command bar renders the compact row.
const narrow = inject("narrowLayout", ref(false));

// The real document provides a UUID for ProseMirror's relative links.
const actorDocument = inject("actorDocument");

// Non-reactive: the setting read is cached once per mount, like the V2
// sheet's use.
const secondEdition = computed(isSecondEdition);
const kinLabel = computed(() => secondEdition.value ? localize("ARCHMAGE.kin") : localize("ARCHMAGE.race"));

const subtitle = computed(() => {
	const parts = [
		props.actor?.system?.details?.race?.value,
		props.actor?.system?.details?.class?.value,
		props.actor?.system?.attributes?.level?.value
	].filter((part) => part !== undefined && part !== null && part !== "");
	return parts.join(" · ");
});
const outRaw = computed(() => props.actor?.system?.details?.out?.value ?? "");
const outEnriched = ref("");

// One Unique Thing: display shows enriched HTML; edit mode swaps the field for
// a full ProseMirror editor bound to the document field (created on demand via
// the edit-mode watch). Enrichment is async-only, so the rendered HTML lives
// in a ref fed by a watcher.
const outEditorHost = ref(null);
const outField = "system.details.out.value";

// The character settings flag shared with the v2 sidebar's OUT block. When
// set, the block is gone in both layouts, so the edit-mode watcher must not
// try to mount the ProseMirror editor into a host that isn't rendered.
const showOut = computed(() => props.actor?.flags?.archmage?.hideOneUniqueThing !== true);

const { enrich: enrichOut, mountEditor: mountOutEditor } = useProseMirrorEditor({
	host: outEditorHost,
	field: outField,
	getValue: () => outRaw.value,
	owner: () => props.actor?.owner,
	documentUUID: actorDocument?.uuid
});

watch(outRaw, async (raw) => {
	const enriched = await enrichOut(raw);
	// Skip stale resolutions if the value changed while enriching.
	if (outRaw.value === raw) outEnriched.value = enriched;
}, { immediate: true });

watch(editing, (value) => {
	if (value && showOut.value) nextTick(mountOutEditor);
});

// Portrait treatment flags (the round/frame ones the V2 sheets honor, plus
// the V3-only full-artwork opt-out of the banner crop — hero only; the
// command bar's thumb never crops).
const archmageFlags = computed(() => props.actor?.flags?.archmage ?? {});
const portraitRound = computed(() => archmageFlags.value.portraitRound === true);
const portraitFrame = computed(() => archmageFlags.value.portraitFrame === true);
const portraitFull = computed(() => archmageFlags.value.portraitFull === true);
</script>

<!-- Two layouts, branched in the template on the sheet root's narrow flag:
     the sidebar's vertical hero banner, and the narrow command bar's single
     compact row. Only the shared field/editor internals are common; each
     variant owns its own geometry, so neither reaches into the other. -->
<style scoped lang="scss">
  .sheet-header {
    display: flex;
  }

  /* ---- Wide (sidebar): hero banner ------------------------------- */

  .sheet-header--hero {
    flex-direction: column;
    gap: 0.5rem;

    /* Hero banner: fixed height, portrait bleeding across it, identity text
       docked to the bottom edge. isolation contains the negative-z portrait
       layer; the layer still receives clicks, so the image stays editable in
       the gaps around the text. */
    .header-hero {
      position: relative;
      isolation: isolate;
      flex: 0 0 auto;
      height: 225px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .header-portrait {
      position: absolute;
      inset: 0;
      z-index: -1;

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        /* Faces sit near the top of most portraits. */
        object-position: center top;
      }

      /* A circle crop can't fill the banner, so "round" softens the corners
         instead; "frame" becomes an inset ring around the bleed. */
      &.portrait--round img {
        border-radius: 20px;
      }

      &.portrait--frame::after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px solid var(--c-white--75);
        pointer-events: none;
      }

      /* Full artwork letterboxes inside the banner instead of being cropped
         to fill it. */
      &.portrait--full img {
        object-fit: contain;
      }
    }

    .header-id {
      position: relative;
      min-width: 0;
      padding: 1rem 0 0.25rem;
      text-align: center;

      /* 25% black scrim behind the text. A two-axis mask intersection feathers
         all four edges, and the fade stays inside the block (matching the
         padding) so nothing spills past the banner onto the sheet below. */
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: var(--c-black--75);
        mask-image:
          linear-gradient(to bottom, transparent, black 1.5em, black);
        mask-composite: intersect;
      }

      .char-name {
        margin: 0;
        font-family: var(--v3-font-display);
        font-weight: normal;
        font-size: var(--font-size-24);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px var(--c-black), 0 0 10px var(--c-black--50);
        color: var(--color-light-1);
      }

      .char-subtitle {
        margin: 0;
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px var(--c-black), 0 0 10px var(--c-black--50);
        color: var(--color-light-3);
      }
    }

    .header-out {
      /* The hero bleeds edge to edge, so the OUT block carries the gutter the
         header's old padding used to provide. */
      padding: 0.5rem;
      border-bottom: 1px solid var(--color-border);

      .out-label {
        margin: 0 0 0.25rem;
        font-family: var(--v3-font-display);
        font-size: var(--font-size-12);
        font-weight: normal;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary);
      }
    }
  }

  /* ---- Narrow (command bar): single compact row ------------------- */

  .sheet-header--bar {
    flex-direction: row;
    align-items: center;
    gap: 0.625rem;

    .header-portrait {
      align-self: center;

      img {
        height: 2.25rem;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        border-radius: 4px;
      }

      /* On a thumb the classic treatments work as-is. */
      &.portrait--round,
      &.portrait--round img {
        border-radius: 50%;
      }

      &.portrait--frame {
        border: 2px solid var(--c-white--75);
        padding: 2px;
      }
    }

    .header-id {
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;

      .char-name {
        margin: 0;
        font-family: var(--v3-font-display);
        font-weight: normal;
        font-size: var(--font-size-24);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .char-subtitle {
        margin: 0;
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .header-out {
      flex: 0 1 12rem;
      border-bottom: 1px solid var(--color-border);
      padding: 0 0.75rem 0.75rem;
      overflow-y: auto;

      /* The bar has no room for the label. */
      .out-label {
        display: none;
      }

      .out-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
  }

  /* ---- Shared: identity entry fields ------------------------------ */

  .header-id {
    /* Editing insets the fields from the header's edges — the display text is
       scrimmed and centered, but raw inputs running edge to edge read as
       cramped against the banner/frame. Sits after the variant blocks so the
       longhand wins the padding-inline axes of their shorthand. */
    &.header-id--editing {
      padding-inline: 0.75rem;
    }

    /* :deep(): the kin/class fields are AutocompleteInput children, whose
       inputs carry no scope attribute of their own. */
    input,
    :deep(input) {
      display: block;
      width: 100%;
      margin-bottom: 0.5rem;
      background: var(--v3-surface);
      font-family: var(--v3-font-display);
      font-weight: normal;
    }
  }

  /* ---- Shared: One Unique Thing ----------------------------------- */

  .header-out {
    .out-text {
      margin: 0;
      white-space: normal;

      /* Enriched HTML arrives wrapped in <p>; the browser's default margins
         would pad the tight header block. */
      :deep(p) {
        margin: 0;
      }
    }

    /* Activating a ProseMirror editor restructures .editor into a menu bar
       plus an .editor-container (whose flex basis collapses without help).
       Unlike the V2 sheet's wrapped menu in _sheet.scss, the header block is
       height-capped, so the menu keeps to one scrollable row and the writing
       area gets the rest. */
    :deep(prose-mirror.editor) {
      display: flex;
      flex-direction: column;
      min-height: 200px;

      > menu,
      .editor-menu {
        position: relative;
        inset: auto;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        height: auto;
        max-height: none;
        overflow-x: auto;
        overflow-y: hidden;

        /* Buttons keep their natural width and let the row scroll under
           them rather than being squashed to fit. */
        button {
          flex: none;
        }
      }

      .editor-container {
        margin-top: 0;
        padding-top: 0;
        flex: 1 1 auto;
        min-height: 3rem;
        overflow-y: auto;
      }

      .editor-content {
        min-height: 100%;
      }
    }
  }
</style>
