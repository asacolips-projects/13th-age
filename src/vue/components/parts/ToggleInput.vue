<template>
	<!-- Usage: -->
	<!--
    <ToggleInput>
      <template v-slot:edit><input type="text" name="foobar" v-model="foobar"></template>
      <template v-slot:display>{{foobar}}</template>
    </ToggleInput>
   -->
	<div class="edit-wrapper">
		<div :ref="'toggle-input'" :class="'input-edit' + (active ? ' active' : '')" @click="toggleEdit">
			<slot name="edit" />
		</div>
		<div class="input-display" @click="toggleEdit">
			<slot name="display" />
		</div>
		<a :class="'input-edit-toggle fas ' + (active ? 'fa-check' : 'fa-edit')" tabindex="0" @click="toggleExternal" @focus="toggleEdit" />
	</div>
</template>

<script>
export default {
	name: "ToggleInput",
	props: ["closeInputs"],
	data() {
		return {
			active: false
		};
	},
	computed: {},
	watch: {
		closeInputs: {
			handler() {
				this.watchForToggle();
			}
		}
	},
	methods: {
		toggleEdit(event) {
			// Determine if this is an input or not.
			const isInput = ["INPUT", "SELECT", "OPTION"].includes(event.target.tagName);

			// Toggle the state if this isn't an input, otherwise persist it.
			this.active = !isInput ? !this.active : this.active;

			// If we're active, select the first input.
			if (this.active && !isInput) {
				const $parent = $(event.target).parents(".edit-wrapper");
				const $el = $parent.find("input,select").first();
				if ($el.length > 0) {
					setTimeout(() => {
						$el.focus().trigger("select");
					}, 100);
				}
			}

			// If we're no longer active, blur the toggle.
			if (!this.active) {
				if (event.target.classList.contains("input-edit-toggle")) {
					event.target.blur();
				}
			}
		},
		// Method used to toggle the state when triggered by an external update.
		watchForToggle() {
			if (this.active && this.closeInputs) {
				this.active = false;
			}
		}
	}
};
</script>

<style lang="scss">
.archmage-vue {
  .input-edit-toggle {
    position: absolute;
    top: 0;
    right: auto;
    left: -9999px;
    z-index: $z-overlay;
    display: block;
    padding: 6px;
  }

  .edit-wrapper {
    position: relative;

    &:hover,
    &:focus {
      .input-edit-toggle {
        color: $c-blue;
        left: auto;
        right: 0;
      }
    }

    .input-edit-toggle {
      &:hover,
      &:focus {
        color: $c-blue;
        left: auto;
        right: 0;
      }
    }
  }

  .input-edit {
    position: absolute;
    width: auto;
    min-width: 100%;
    background: $c-white;
    box-shadow: 0 0 15px 5px $c-black--50;
    padding: 13px;
    // height: 50px;
    border-radius: 8px;
    top: 0;
    left: 0;
    z-index: $z-higher;
    display: none;

    &.active {
      display: block;
    }

    input,
    select {
      margin: 0 $padding-sm $padding-sm 0;
    }
  }
}
</style>
