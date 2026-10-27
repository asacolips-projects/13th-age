<template>
	<section class="unit unit--defenses">
		<p class="unit-value flexrow">
			<span class="defense"><span class="defense-label">AC</span> {{ actor?.system?.attributes?.ac?.value }}</span>
			<span class="defense"><span class="defense-label">PD</span> {{ actor?.system?.attributes?.pd?.value }}</span>
			<span class="defense"><span class="defense-label">MD</span> {{ actor?.system?.attributes?.md?.value }}</span>
		</p>

		<!-- Resistances & vulnerabilities: free text, so edit mode mounts each
		as a full-width stacked input. In play, only fields with content
		render, as compact read-only rows. Each field edits through the
		document via useDocumentField — unnamed, so the form's
		submitOnChange doesn't also carry it — and rolls back if the write
		is rejected. -->
		<div v-if="editing" class="resist-vuln-edit">
			<label class="resist-vuln-field">
				<span class="field-label">
					{{ localize('ARCHMAGE.resistance') }}
					<i class="fas fa-circle-info" :data-tooltip="localize('ARCHMAGE.commaSeparatedHint')" data-tooltip-direction="UP" />
				</span>
				<input v-model="resistance.value" type="text" @change="resistance.write">
			</label>
			<label class="resist-vuln-field">
				<span class="field-label">
					{{ localize('ARCHMAGE.vulnerability') }}
					<i class="fas fa-circle-info" :data-tooltip="localize('ARCHMAGE.commaSeparatedHint')" data-tooltip-direction="UP" />
				</span>
				<input v-model="vulnerability.value" type="text" @change="vulnerability.write">
			</label>
		</div>
		<div v-else-if="hasResistVuln" class="resist-vuln-view">
			<p v-if="actor.system.details.resistance.value" class="resist-vuln">
				<span class="defense-label">{{ localize('ARCHMAGE.resistance') }}</span>
				{{ actor.system.details.resistance.value }}
			</p>
			<p v-if="actor.system.details.vulnerability.value" class="resist-vuln">
				<span class="defense-label">{{ localize('ARCHMAGE.vulnerability') }}</span>
				{{ actor.system.details.vulnerability.value }}
			</p>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import { localize } from "@/methods/Helpers";
import { useDocumentField } from "@/composables/useDocumentField";

const props = defineProps(["actor"]);

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject("editMode", ref(false));

// The resist/vuln fields edit through the document via useDocumentField:
// local values that roll back when a write is rejected.
const resistance = useDocumentField(() => props.actor, () => "system.details.resistance.value");
const vulnerability = useDocumentField(() => props.actor, () => "system.details.vulnerability.value");

const hasResistVuln = computed(() => Boolean(
	props.actor?.system?.details?.resistance?.value || props.actor?.system?.details?.vulnerability?.value
));
</script>

<style scoped lang="scss">
.unit-value {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-14);

  span {
    text-align: center;
  }
}

.defense-label {
  margin-right: 0.25rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* Full-width stacked free-text inputs (edit mode). */
.resist-vuln-edit {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.5rem;

  .resist-vuln-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;

    input[type='text'] {
      width: 100%;
      min-width: 0;
    }
  }
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  font-size: var(--font-size-11);
  color: var(--color-text-secondary);

  i {
    cursor: help;
  }
}

/* Compact read-only rows (view mode). */
.resist-vuln-view {
  margin-top: 0.25rem;

  .resist-vuln {
    margin: 0;
    font-size: var(--font-size-12);
    text-align: left;
  }
}
</style>
