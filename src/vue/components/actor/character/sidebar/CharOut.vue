<template>
	<section v-if="!actor.flags.archmage?.hideOneUniqueThing" class="section section--out flexcol">
		<h2 class="unit-title">{{ localize('ARCHMAGE.oneUniqueThing') }}</h2>
		<div class="out">
			<Suspense>
				<Editor
					:owner="actor.owner"
					target="system.details.out.value"
					button="true"
					editable="true"
					:content="actor.system.details.out.value"
				/>
			</Suspense>
		</div>
	</section>
</template>

<script>
import { localize } from "@/methods/Helpers";
import Editor from "@/components/parts/Editor.vue";
export default {
	name: "CharOut",
	components: {
		Editor
	},
	props: ["actor", "owner"],
	setup() {
		return { localize };
	},
	data() {
		return {};
	},
	computed: {},
	async mounted() {
	},
	methods: { /* See created. */}
};
</script>
