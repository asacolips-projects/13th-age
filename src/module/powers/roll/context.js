/**
 * Shared state for one run of the item roll pipeline.
 *
 * Historically ItemArchmage#roll threaded four mutable objects (the item
 * clone, the item updates, the actor updates and the chat message data)
 * through a dozen helper methods by reference. This class replaces that
 * parameter passing with a single state bag that every pipeline stage
 * receives: stages read what they need, write what they produce, and signal
 * an early exit via {@link PowerRollContext#abort}.
 */
export class PowerRollContext {
	/**
	 * Create the pipeline state for one item roll.
	 * @param {object} [options]
	 * @param {ItemArchmage} [options.item]  The item being rolled.
	 * @param {Event} [options.event]  The originating interaction event, when
	 *   the roll was triggered by a click. Callers that predate explicit event
	 *   passing fall back to the global `event`, matching previous behavior.
	 */
	constructor({ item, event = undefined } = {}) {
		/** The item being rolled. */
		this.item = item;

		/** The actor the item belongs to, if any. */
		this.actor = item?.itemActor ?? null;

		/**
		 * The originating interaction event, if any. Alt- and shift-key state
		 * is read from here instead of the global `event`.
		 * @type {Event|null}
		 */
		this.event = event ?? globalThis.event ?? null;

		/** Ephemeral, dirty clone of the item used for rendering. */
		this.clone = null;

		/** Deferred updates for the item, applied after the roll resolves. */
		this.itemUpdates = {};

		/** Deferred updates for the actor, applied after the roll resolves. */
		this.actorUpdates = {};

		/** The chat message data under construction. */
		this.chat = null;

		/** Roll data prepared from the actor, used to evaluate inline rolls. */
		this.rollData = undefined;

		/** The token representing the roller, if any. */
		this.token = null;

		/** User intent, gathered from the roll dialogs. */
		this.usageMode = "";
		this.consumeUsage = true;
		this.consumeResources = true;

		/**
		 * Descriptions of what the user deliberately changed in the roll
		 * dialog, for the "(modified)" label on the chat card.
		 * @type {string[]}
		 */
		this.modified = [];

		/** Results collected along the way. */
		this.critMod = 0;
		this.numTargets = 1;
		this.hitEval = null;
		this.sequencerAnim = undefined;

		/** Whether the embedded macro asked to suppress the chat message. */
		this.suppressMessage = false;

		/**
		 * The pipeline's final result: the created chat message, if any.
		 * @type {ChatMessage|undefined}
		 */
		this.result = undefined;

		/** Set by stages to stop the pipeline before the next stage runs. */
		this.aborted = false;

		/** Human-readable record of what the pipeline decided, for debugging. */
		this.log = [];
	}

	/**
	 * Stop the pipeline after the current stage, recording why.
	 * @param {string} [reason]  Why the pipeline stopped.
	 */
	abort(reason = "unknown") {
		this.aborted = true;
		this.log.push(reason);
	}
}
