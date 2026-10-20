import * as stages from "./stages.js";

/**
 * The default stage order of the item roll pipeline.
 *
 * Each stage receives the same {@link PowerRollContext} and may call
 * `ctx.abort()` to stop the pipeline after it finishes. The order mirrors
 * the original monolithic ItemArchmage#roll: gather user intent, consume
 * uses and resources, prepare the item clone, roll, render, evaluate hits,
 * run class triggers and macros, animate, and finally commit the updates
 * and create the chat message.
 *
 * @type {Array<Function>}
 */
export const defaultPipeline = [
	stages.usageMode,
	stages.temporaryOverrides,
	stages.consumeUses,
	stages.cloneItem,
	stages.consumeResources,
	stages.critMod,
	stages.classTriggers,
	stages.multiTargets,
	stages.prepareRollData,
	stages.rollTable,
	stages.getToken,
	stages.render,
	stages.evaluateHits,
	stages.postRollTriggers,
	stages.stokeFlag,
	stages.embeddedMacro,
	stages.animate,
	stages.commit
];

/**
 * Run the item roll pipeline.
 *
 * @param {PowerRollContext} ctx                     The pipeline state.
 * @param {Array<Function>}  [pipeline]              The stages to run, in
 *   order. Defaults to {@link defaultPipeline}.
 * @returns {Promise<void>} Resolves when the pipeline finishes or aborts.
 *   The created chat message, if any, is available as `ctx.result`.
 */
export async function runPipeline(ctx, pipeline = defaultPipeline) {
	for (const stage of pipeline) {
		await stage(ctx);
		if (ctx.aborted) break;
	}
}
