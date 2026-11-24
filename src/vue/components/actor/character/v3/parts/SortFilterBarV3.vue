<template>
	<header class="sort-filter-bar">
		<!-- Leading control: a tab slots its own (e.g. the item index's and
        triggers tab's view popovers) here. -->
		<slot name="sort" />
		<div class="search-control">
			<div class="search-input">
				<!-- Unnamed: search is view state (v-model only). A name would
					put it on the sheet form's submit path, and with
					submitOnChange every change here would run a full
					actor.update for the whole form. -->
				<input :id="concat(id, '-filter')" v-model="search" type="text" :placeholder="localize('ARCHMAGE.search')">
				<button
					v-if="search"
					type="button"
					class="search-clear"
					:title="localize('ARCHMAGE.clear')"
					@click="search = null"
				>
					<i class="fas fa-times" />
				</button>
			</div>
		</div>
		<!-- Extra controls, e.g. a group-by select or the import button. -->
		<slot />
	</header>
</template>

<script setup>
/**
 * The filter/search control row the listing tabs share: a named slot for the
 * tab's sort/grouping controls (the item index and triggers tabs tuck their
 * sort — and grouping — into a popover there), a filter input, and a slot
 * for extra controls (the item index's import button). Search is a v-model;
 * the search's clear widget is owned here, resetting the model to null.
 */
import { concat, localize } from "@/methods/Helpers";

defineProps({
	// Prefix for the controls' ids and names, e.g. 'plan' -> plan-filter.
	id: { type: String, required: true }
});

const search = defineModel("search");
</script>

<style scoped lang="scss">
  // The control row, shared by the listing tabs: labels above slim inputs,
  // the search taking the remaining width, extra controls docking to the
  // bottom of the row.
  .sort-filter-bar {
    display: flex;
    gap: $padding-md;
    font-family: $font-stack-label;
    font-size: var(--font-size-12);
    padding: $padding-sm 0 $padding-md;
    border-bottom: 1px dashed var(--color-border);

    > div {
      flex: 0 auto;

      &.search-control {
        flex: 1;

        // Clear widget sits at the input's right edge, inside it.
        .search-input {
          position: relative;

          input[type="text"] {
            width: 100%;
            padding-right: 1.5em;
          }

          .search-clear {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            cursor: pointer;
            color: inherit;
            font-size: var(--font-size-12);
            line-height: 1;

            &:hover {
              text-shadow: 0 0 5px var(--v3-hover-glow);
            }
          }
        }
      }
    }

    label {
      display: block;
      width: 100%;
      font-weight: bold;
    }

    input[type="text"] {
      font-size: var(--font-size-10);
      font-family: $font-stack-label;
      text-align: left;
      font-weight: normal;
    }
  }
</style>
