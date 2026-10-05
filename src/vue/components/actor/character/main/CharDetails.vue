<template>
	<section :class="classes">
		<Suspense>
			<Editor
				:owner="actor.owner"
				target="system.details.biography.value"
				button="true"
				editable="true"
				:content="actor.system.details.biography.value"
			/>
		</Suspense>
	</section>
</template>

<script>
import Editor from "@/components/parts/Editor.vue";
export default {
	name: "CharDetails",
	components: {
		Editor
	},
	props: ["actor", "owner", "tab", "flags"],
	setup(props) {
		const classes = `section section--details flexcol`;
		return {
			classes
		};
	}
};
</script>
