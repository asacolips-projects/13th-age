import ArchmageRolls from "../../rolls/ArchmageRolls.mjs";
import { MacroUtils } from "../../setup/utility-classes.js";
import preCreateChatMessageHandler from "../../hooks/preCreateChatMessageHandler.mjs";
import { isSpellLevelKey } from "../../item/power-fields.mjs";
import { powerUsageColor } from "../../item/power-usage.mjs";

const RETAIN_FOCUS_REGEX = /retain focus.+(\d+)[^\d]+(\d+)/i;
const INLINE_ROLL_REGEX = /(\[\[.+?\]\])/;

/**
 * The stages of the item roll pipeline, in the order they run.
 *
 * Each stage is an async function receiving the {@link PowerRollContext}.
 * A stage signals an early exit by calling `ctx.abort()`, which stops the
 * pipeline before the next stage runs. The stages are executed by
 * `runPipeline` in pipeline.js; `ItemArchmage#roll` builds the context and
 * kicks the pipeline off.
 *
 * The stages correspond to the former `_roll*` and `_handle*` methods of
 * ItemArchmage, moved here essentially unchanged: `this` became `ctx.item`,
 * the update objects threaded by reference became `ctx.itemUpdates` and
 * `ctx.actorUpdates`, and the global `event` became `ctx.event`.
 */

/**
 * Determine what the user is trying to do, for powers that sustain or end
 * with a final verse.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function usageMode(ctx) {
	const item = ctx.item;
	let retVal = "";

	// If we have a song sustain reminder check what we want to do
	if (item.type == "power"
		&& item.system.sustainedEffect.value
		&& item.system.finalVerse.value) {
		let hasReminder = false;
		const name = game.i18n.format("ARCHMAGE.CHAT.sustainPower", { power: item.name, target: item.system.sustainOn.value });
		if (item.itemActor?.effects) {
			item.itemActor.effects.forEach((e) => {
				if (e.name == name) hasReminder = true;
			});
		}

		if (!hasReminder) {
			ctx.usageMode = "openingEffect";
			return;
		}

		await Dialog.confirm({
			title: game.i18n.localize("ARCHMAGE.CHAT.sustainedOrFinalTitle"),
			content: game.i18n.localize("ARCHMAGE.CHAT.sustainedOrFinal"),
			yes: () => {
				retVal = "finalverse";
			},
			no: () => {
				retVal = "sustainedEffect";
			},
			defaultYes: false
		});
	}

	ctx.usageMode = retVal;
}

/**
 * For powers with a level, show a dialog to set level and consume-usage.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function temporaryOverrides(ctx) {
	const item = ctx.item;
	let overrides = {};
	// Descriptions of what the *user* deliberately changed, for the "(modified)" label on the
	// chat card. Only the dialog below writes to this. Automatic adjustments - the "Cast at
	// Actor Level" flag in particular - are not modifications and must never land here, which is
	// why this is recorded at the point of choice instead of inferred later by comparing levels.
	let modified = [];
	if (item.type != "power") {
		ctx.overrides = overrides;
		ctx.modified = modified;
		return;
	}
	// Powers store their level as a number or a numeric string, so normalize before comparing.
	let baseLvl = Number(item.system.powerLevel?.value ?? 0);
	if (!Number.isFinite(baseLvl)) baseLvl = 0;
	if (item.itemActor?.getFlag("archmage", "overridePowerLevel")) {
		baseLvl = Math.max(item.itemActor.system.attributes.level.value, baseLvl);
	}

	const pools = item.usagePools();
	const hasUses = pools.length > 0;
	const usesLeft = pools.reduce((total, pool) => total + pool.uses, 0);
	const hasResources = !!item.system.resources?.value;
	const resourcesStr = item.system.resources?.value ?? "";

	// Collect levels that have a spellLevelN entry with content.
	const spellLevels = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
		.filter((n) => item.system[`spellLevel${n}`]?.value);
	const hasSpellLevels = spellLevels.length > 0;

	// Skip the dialog if alt isn't held, or there's nothing for it to display.
	if (!ctx.event?.altKey || (!hasSpellLevels && !hasUses && !hasResources)) {
		overrides["system.powerLevel.value"] = baseLvl;
		ctx.overrides = overrides;
		ctx.modified = modified;
		return;
	}

	const content = `
      <form>
        ${hasUses ? `
        <div class="form-group">
          <label>
            ${game.i18n.localize("ARCHMAGE.CHAT.consumeUsage")}
            ${usesLeft <= 0 ? `<i class="fas fa-triangle-exclamation" data-tooltip="${game.i18n.localize("ARCHMAGE.CHAT.NoUses")}"></i>` : ""}
          </label>
          <input type="checkbox" name="consumeUsage" checked/>
        </div>` : ""}
        ${hasResources ? `
        <div class="form-group">
          <label>
            ${game.i18n.localize("ARCHMAGE.CHAT.consumeResources")}
            <i class="fas fa-circle-info" data-tooltip="${resourcesStr.replace(/"/g, "&quot;")}"></i>
          </label>
          <input type="checkbox" name="consumeResources" checked/>
        </div>` : ""}
      </form>`;

	const result = await new Promise((resolve) => {
		let resolved = false;
		const makeCallback = (lvl) => (event, button) => {
			const form = button.form;
			const finalLvl = lvl ?? (hasSpellLevels ? Number(form.level.value) : baseLvl);
			const consume = hasUses ? form.consumeUsage.checked : true;
			const consumeRes = hasResources ? form.consumeResources.checked : true;
			overrides["system.powerLevel.value"] = finalLvl;
			// Compared against the level the dialog defaulted to, not the one stored on the power:
			// the question is whether the user picked something other than what would have happened
			// anyway. Both sides are numbers by this point.
			if (finalLvl !== baseLvl) {
				modified.push(game.i18n.format("ARCHMAGE.CHAT.modifiedLevel", { level: finalLvl }));
			}
			if (!consume) modified.push(game.i18n.localize("ARCHMAGE.CHAT.modifiedNoUsage"));
			if (!consumeRes) modified.push(game.i18n.localize("ARCHMAGE.CHAT.modifiedNoResources"));
			ctx.overrides = overrides;
			ctx.consumeUsage = consume;
			ctx.consumeResources = consumeRes;
			ctx.modified = modified;
			resolved = true;
			resolve({ overrides, consumeUsage: consume, consumeResources: consumeRes, modified });
		};

		let buttons;
		if (hasSpellLevels) {
			const allOdd = spellLevels.every((n) => n % 2 === 1);
			const floorLevel = Math.max(1, spellLevels[0] - (allOdd ? 2 : 1));
			const allLevels = [...new Set([...spellLevels, floorLevel, baseLvl])].sort((a, b) => a - b);
			buttons = allLevels.map((n) => ({
				action: `level${n}`,
				label: `${n}`,
				icon: n === baseLvl ? "fas fa-circle-dot" : undefined,
				default: n === baseLvl,
				callback: makeCallback(n)
			}));
		}
		else {
			buttons = [{
				action: "normal",
				label: game.i18n.localize("ARCHMAGE.CHAT.powerRollUse"),
				default: true,
				callback: makeCallback(null)
			}];
		}

		new foundry.applications.api.DialogV2({
			window: { title: `${game.i18n.localize("ARCHMAGE.CHAT.powerRollTitle")}: ${item.name}` },
			content,
			buttons,
			close: () => {
				if (!resolved) resolve(null);
			}
		}).render({ force: true });
	});

	// The dialog was closed without a choice: stop the pipeline.
	if (!result) ctx.abort("rollDialogDismissed");
}

/**
 * Check remaining uses, honoring the consume-usage choice from the dialog.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function consumeUses(ctx) {
	const item = ctx.item;
	// If we have a special usage mode skip this check
	if (!["", "openingEffect"].includes(ctx.usageMode)) return;
	// Only check uses on owned items.
	if (!item.actor) return;
	// Respect the consume-usage choice from the power roll dialog.
	if (!ctx.consumeUsage) return;
	// Update uses left
	const pools = item.usagePools();
	if (!pools.length) return;
	if (item.system.powerUsage?.value == "cyclic"
		&& item.actor.system.attributes.escalation.value > 0
		&& item.actor.system.attributes.escalation.value % 2 == 0
		&& pools[0].uses > 0) {
		// Cyclic power, E.D. even, do not consume uses
		return;
	}
	// Spend from the first pool with uses left, falling back to the primary
	// one (which is then reported as expended) when they're all empty.
	const pool = pools.find((p) => p.uses > 0) ?? pools[0];
	let uses = pool.uses;
	ctx.itemUpdates[pool.path] = Math.max(uses - 1, 0);
	if (uses == 0 && !ctx.event?.shiftKey && ["power", "equipment", "loot", "tool"].includes(item.type)
		&& pool.usage != "at-will") {
		let use = false;
		await Dialog.confirm({
			title: game.i18n.localize("ARCHMAGE.CHAT.NoUses"),
			content: game.i18n.localize("ARCHMAGE.CHAT.NoUsesMsg"),
			yes: () => {
				use = true;
			},
			no: () => {},
			defaultYes: false
		});
		if (!use) ctx.abort("noUsesRemaining");
	}
}

/**
 * Make an ephemeral clone of the item which the pipeline can dirty during
 * processing, applying the overrides chosen in the roll dialog.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function cloneItem(ctx) {
	const item = ctx.item;
	ctx.clone = item.clone(ctx.overrides ?? {}, { save: false, keepId: true });

	// Override level if the actor has the related flag
	if (item.itemActor?.getFlag("archmage", "overridePowerLevel") && item.type == "power") {
		ctx.clone.system.powerLevel.value = Math.max(
			item.itemActor.system.attributes.level.value,
			ctx.clone.system.powerLevel.value
		);
	}
}

/**
 * Check and consume the item's resources, if it declares any.
 * @param {PowerRollContext} ctx  The pipeline state.
 * @returns {Promise<void>}
 */
export async function consumeResources(ctx) {
	const item = ctx.item;
	// Updates resources if field is set
	let resStr = item.system.resources?.value;
	if (!resStr) return;

	// Exit early with no actor.
	if (!item.actor) return;

	// Respect the consume-resources choice from the power roll dialog.
	if (!ctx.consumeResources) return;

	let resources = resStr.split(",").map((res) => res.trim());
	let res = item.actor.system.resources;
	let filter = /^([+-]*)([0-9]*)\s*(.+)$/;
	let newResStr = [];
	for (let resource of resources) {

		// Handle inline rolls
		let ir = INLINE_ROLL_REGEX.exec(resource);
		let rolls;
		let origResource = resource;
		if (ir) {
			rolls = ArchmageRolls.getInlineRolls(resource, item.actor?.getRollData(ctx.clone));
			await ArchmageRolls.rollAll(rolls, item.actor);
			resource = resource.replace(ir[1], rolls[0].total);
		}

		// Then process the item
		let parsed = filter.exec(resource);
		if (parsed) {
			let sign = parsed[1];
			let num = parsed[2] ? Number(parsed[2]) : null;
			if (num) num = (sign == "-") ? num * -1 : num;
			let str = parsed[3].toLowerCase();

			// Command points
			if (res.perCombat.commandPoints.enabled && num
				&& (str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.commandPoints").toLowerCase()
				|| str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.commandPoint").toLowerCase()
				)) {
				let path = "system.resources.perCombat.commandPoints.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughCP");
				let resObj = res.perCombat.commandPoints;
				let stop = await processResource(
					ctx, path, sign, num, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Ki
			else if (res.spendable.ki.enabled && num
				&& str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.ki").toLowerCase()) {
				let path = "system.resources.spendable.ki.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughKi");
				let resObj = res.spendable.ki;
				let stop = await processResource(
					ctx, path, sign, num, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Momentum
			else if (res.perCombat.momentum.enabled
				&& str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.momentum").toLowerCase()) {
				let path = "system.resources.perCombat.momentum.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNoMomentum");
				let resObj = res.perCombat.momentum;
				let stop = await processResource(
					ctx, path, sign, null, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Focus
			else if (res.perCombat.focus.enabled
				&& str == (game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.focus").toLowerCase())) {
				let path = "system.resources.perCombat.focus.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNoFocus");
				let resObj = res.perCombat.focus;
				let stop = await processResource(
					ctx, path, sign, null, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Combat Rhythm - TODO: deprecated, remove at some future point far from end of 2e playtest
			else if (res.perCombat.rhythm?.enabled
				&& (str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense").toLowerCase()
				|| str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense").toLowerCase())) {
				let path = "system.resources.perCombat.rhythm.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNoRhythm");
				let resObj = res.perCombat.rhythm;
				let opt = (str == game.i18n.localize("ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense").toLowerCase())
					? "offense"
					: "defense";
				let stop = await processResource(
					ctx, path, sign, null, resObj, msg, opt
				);
				if (stop) return ctx.abort("noResources");
			}

			// Bravado
			else if (res.perCombat.bravado.enabled && num
				&& str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.bravado").toLowerCase()) {
				let path = "system.resources.perCombat.bravado.current";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNotEnoughBravado");
				let resObj = res.perCombat.bravado;
				let stop = await processResource(
					ctx, path, sign, num, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Recoveries
			else if ((str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.recoveries").toLowerCase()
				|| str == game.i18n.localize("ARCHMAGE.CHARACTER.RESOURCES.recovery").toLowerCase()) && num) {
				let path = "system.attributes.recoveries.value";
				let msg = game.i18n.localize("ARCHMAGE.UI.errNoRecoveries");
				let resObj = item.actor.system.attributes.recoveries;
				let stop = await processResource(
					ctx, path, sign, num, resObj, msg
				);
				if (stop) return ctx.abort("noResources");
			}

			// Custom resources
			else {
				for (let idx of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
					let resourcePathName = `custom${idx}`;
					let resourceName = res.spendable[resourcePathName].label;
					if (!resourceName) continue; // Skip unnamed resources
					let resNm = resourceName.toLowerCase();
					if (res.spendable[resourcePathName].enabled && (str.includes(resNm) || resNm.includes(str))) {
						let path = `system.resources.spendable.${resourcePathName}.current`;
						let msg = game.i18n.format("ARCHMAGE.UI.errNoCustomResource", { res: resourceName });
						let resObj = res.spendable[resourcePathName];
						let stop = await processResource(
							ctx, path, sign, num, resObj, msg
						);
						if (stop) return ctx.abort("noResources");
					}
				}
			}
		}

		// If there were inline rolls, replace formula with rolled value
		if (ir) resource = origResource.replace(ir[1], rolls[0].inlineRoll.outerHTML);
		newResStr.push(resource);
	}

	// Reconstruct the processed value
	ctx.clone.system.resources.value = newResStr.join(", ");
}

/**
 * Apply one resource cost to the actor's pending updates, confirming with the
 * user when the resource would go negative or is already spent.
 *
 * The former ItemArchmage#_rollProcessResource. Its unused `itemUpdateData`
 * parameter is dropped; only actor updates were ever written here.
 *
 * @param {PowerRollContext} ctx  The pipeline state.
 * @param {string} path      The update path of the resource.
 * @param {string} sign      The leading sign of the cost, "" for an override.
 * @param {number|null} num  The numeric cost, null for binary resources.
 * @param {object} resObj    The resource's data.
 * @param {string} msg       The localization key of the "not enough" warning.
 * @param {string|null} opt  A value to store instead of a boolean, for the
 *   deprecated rhythm resource.
 * @returns {Promise<boolean>} Whether to stop the roll.
 */
async function processResource(ctx, path, sign, num, resObj, msg, opt=null) {
	let stop = false;
	let curr = resObj.current;
	// Recoveries are stored as 'value'
	if (curr == undefined) curr = resObj.value;

	// Number resource case
	if (num != null) {
		// No sign means override
		ctx.actorUpdates[path] = sign ? curr + num : num;
		if (ctx.actorUpdates[path] < 0) {
			await Dialog.confirm({
				title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
				content: msg,
				yes: () => {},
				no: () => {
					stop = true;
				},
				defaultYes: false
			});
			if (path != "system.attributes.recoveries.value") ctx.actorUpdates[path] = 0;
		}
	}

	// Binary (and rhythm) case
	else if (sign) {
		// Resource update case
		if (sign == "+") {
			let val = (typeof curr == "number") ? 1 : true;
			ctx.actorUpdates[path] = opt ? opt : val;
		}
		else {
			if (!curr) {
				await Dialog.confirm({
					title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
					content: msg,
					yes: () => {},
					no: () => {
						stop = true;
					},
					defaultYes: false
				});
			}
			let val = (typeof curr == "number") ? 0 : false;
			ctx.actorUpdates[path] = opt ? "none" : val;
		}
	}
	// Resource test case
	else if (!curr || curr == "none" || curr == 0) {
		await Dialog.confirm({
			title: game.i18n.localize("ARCHMAGE.CHAT.NoResources"),
			content: msg,
			yes: () => {},
			no: () => {
				stop = true;
			},
			defaultYes: false
		});
	}

	// Handle maximum
	let resMax = resObj.max;
	if (resMax && ctx.actorUpdates[path] > resMax) ctx.actorUpdates[path] = resMax;

	return stop;
}

/**
 * Resolve the item's critical modifier, rolling any inline formula it holds.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function critMod(ctx) {
	const item = ctx.item;
	let res = 0;
	let mod = item.system.critMod?.value;
	if (!mod) {
		ctx.critMod = res;
		return;
	}

	// Handle inline rolls
	let ir = INLINE_ROLL_REGEX.exec(mod);
	if (ir) {
		const rolls = ArchmageRolls.getInlineRolls(mod, item.actor?.getRollData(ctx.clone));
		await ArchmageRolls.rollAll(rolls, item.actor);
		res = rolls[0].total;
		ctx.clone.system.critMod.value = rolls[0].inlineRoll.outerHTML;
	}
	else {
		res = parseInt(mod, 10);
	}
	ctx.critMod = res;
}

/**
 * Handle special class triggers that modify the attack line.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function classTriggers(ctx) {
	await handleFighterCombatRhythm(ctx);  // TODO: deprecated, remove at some future point far from end of 2e playtest
	await handleFighterMomentum(ctx);
}

/**
 * Replicate attack rolls as needed for attacks with multiple targets.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function multiTargets(ctx) {
	// Replicate attack rolls as needed for attacks
	let numTargets = { targets: 1, rolls: [] };
	if (["power", "action"].includes(ctx.clone.type)) {
		let atk = ArchmageRolls.addAttackMod(ctx.clone);
		ctx.clone.system.attack.value = atk.attackLine;
		if (game.settings.get("archmage", "multiTargetAttackRolls")) {
			numTargets = await ArchmageRolls.rollItemTargets(ctx.clone);
			let adj = ArchmageRolls.rollItemAdjustAttacks(
				ctx.clone,
				atk.attackLine,
				numTargets,
				atk.numManualAttacks
			);
			ctx.clone.system.attack.value = adj.line;
			numTargets.targets = adj.atks;
			if (numTargets.targetLine) ctx.clone.system.target.value = numTargets.targetLine;
		}
	}
	ctx.numTargets = numTargets.targets;
}

/**
 * Prepare the actor's roll data for inline roll evaluation.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function prepareRollData(ctx) {
	ctx.rollData = ctx.item.itemActor?.getRollData(ctx.item);
}

/**
 * Roll the item's roll table, if it declares one, storing the drawn result.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function rollTable(ctx) {
	// Handle rollTable
	if (ctx.item.system.rollTable?.value) {
		let table;
		// Try to interpret input as UUID
		let uuid = ctx.item.system.rollTable.value.match(/^@UUID\[([^\s]+)\]/);
		if (uuid) table = await fromUuid(uuid[1]);
		if (table && table.documentName != "RollTable") {
			table = undefined;
			ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.errNotTable"));
		}
		if (!table) {
			// Treat as plain text, and load table from world first
			table = game.tables.find((t) => t.name === ctx.item.system.rollTable.value);
		}
		if (!table) {
			// If not present in world, load system's from compendium
			let pack = await game.packs.get("archmage.system-rolltables").getDocuments();
			table = pack.find((t) => t.name === ctx.item.system.rollTable.value);
		}
		if (table) {
			// If we do have a table, roll on it
			let roll = new Roll(table.formula, ctx.rollData);
			let res = await table.draw({ roll: roll, displayChat: false });
			// Now override system.rollTable with rolled result
			try {
				ctx.clone.system.rollTable.label = ctx.clone.system.rollTable.value;
				ctx.clone.system.rollTable.value = res.results[0].text;
			}
			catch(ex) {
				ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errOnlyTextRolltables"));
			}
		}
	}
}

/**
 * Find the token to attribute animations and the speaker to.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function getToken(ctx) {
	let tokens = canvas?.tokens?.controlled;
	let token = tokens ? tokens[0] : null;
	if (!token || token.actor != ctx.item.itemActor) {
		tokens = ctx.item.itemActor?.getActiveTokens(true);
		token = tokens && tokens.length > 0 ? tokens[0] : null;
	}
	ctx.token = token;
}

/**
 * Render the chat card template into the message data.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function render(ctx) {
	const item = ctx.item;

	// Basic template rendering data
	const template = `systems/archmage/templates/chat/${item.type.toLowerCase()}-card.html`;

	// Basic chat message data
	let chatData = {
		user: game.user.id,
		speaker: game.archmage.ArchmageUtility.getSpeaker(item.itemActor)
	};

	// Toggle default roll mode
	let messageMode = game.settings.get("core", "messageMode");
	chatData = ChatMessage.applyMode(chatData, messageMode);

	// Render the template
	chatData.content = await foundry.applications.handlebars.renderTemplate(template, {
		actor: item.itemActor,
		tokenId: null, // token ? `${token.scene.id}.${token.id}` : null,
		item: ctx.clone,
		data: await ctx.clone.getChatData({ rollData: ctx.rollData }, true),
		usageClass: getUsageClass(ctx.clone),
		// The roll dialog reports what the user changed; we don't try to infer it from the values.
		modifiedTooltip: ctx.modified.length ? ctx.modified.join(", ") : null
	});

	// Enrich the message to parse inline rolls.
	chatData.content = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
		chatData.content,
		{ rolls: true, rollData: ctx.rollData }
	);

	ctx.chat = chatData;
}

/**
 * Evaluate the rendered attack line against the targets: rewrite the card
 * content with hit/miss outcomes and prepare Sequencer animations.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function evaluateHits(ctx) {
	let [sequencerAnim, hitEvalRes] = preCreateChatMessageHandler.handle(ctx.chat, {
		targets: ctx.numTargets,
		type: ctx.clone.type,
		actor: ctx.item.itemActor ?? null,
		item: ctx.clone,
		token: ctx.token,
		powerLevel: ctx.clone.system.powerLevel?.value,
		sequencer: ctx.clone.system.sequencer,
		usageMode: ctx.usageMode,
		critMod: ctx.critMod
	}, null);
	ctx.sequencerAnim = sequencerAnim;
	ctx.hitEval = hitEvalRes;
}

/**
 * Run the post-roll class triggers: monk forms, songs, breath spells and
 * retained focus.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function postRollTriggers(ctx) {
	await handleMonkFormAC(ctx);
	await handleSong(ctx);
	await handleBreathSpell(ctx);
	await handleRetainFocus(ctx);
}

/**
 * Set a flag for stoke adjustments.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function stokeFlag(ctx) {
	if (!CONFIG.ARCHMAGE.is2e) return;
	const item = ctx.item;
	if (item.itemActor?.type === "npc" && item.itemActor?.system?.resources?.spendable?.stoke?.enabled) {
		if (game.combat?.combatant) {
			const combatantUuid = game.combat.combatant?.actor?.uuid;
			const breathString = game.i18n.localize("ARCHMAGE.CHAT.breath").toLocaleLowerCase()
				.trim();
			if (combatantUuid && combatantUuid == item.itemActor.uuid
				&& item.name.toLocaleLowerCase().includes(breathString)) {
				// This will be set to false at the start of the actor's turn.
				await item.itemActor.update({ "system.resources.spendable.stoke.breathUsed": true });
			}
		}
	}
}

/**
 * Run the item's embedded macro, if it has one, letting it modify the
 * pipeline state.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function embeddedMacro(ctx) {
	const item = ctx.item;

	// Extra data accessible as "archmage" in embedded macros
	let macro_data = {
		item: ctx.clone,
		itemUpdates: ctx.itemUpdates,
		actorUpdates: ctx.actorUpdates,
		chat: ctx.chat,
		hitEval: ctx.hitEval,
		seqAnim: ctx.sequencerAnim,
		suppressMessage: false,
		usageMode: ctx.usageMode
	};

	// If there is an embedded macro attempt to execute it
	if (ctx.clone.system.embeddedMacro?.value.length > 0) {

		if (!game.user.hasPermission("MACRO_SCRIPT")) {
			ui.notifications.warn(game.i18n.localize("ARCHMAGE.CHAT.embeddedMacroPermissionError"));
			ctx.macroResult = macro_data;
			return;
		}

		// Add variables to the evaluation scope
		const speaker = ChatMessage.implementation.getSpeaker();
		const character = game.user.character;
		const actor = item.itemActor;

		// Run our own function to bypass macro parameters limitations - based on Foundry's _executeScript
		const AsyncFunction = (async function () {}).constructor;
		try {
			const fn = new AsyncFunction("speaker", "actor", "token", "character", "archmage", ctx.clone.system.embeddedMacro.value);
			// Attempt script execution
			await fn.call(item, speaker, actor, ctx.token, character, macro_data);
		}
		catch(ex) {
			ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errMacroSyntax"));
			console.error(`Embedded macro for '${item.name}' failed with: ${ex}`, ex);
		}
	}

	// Unpack macro data in case a sloppy macro replaces instead of modifying variables
	ctx.clone = macro_data.item;
	ctx.itemUpdates = macro_data.itemUpdates;
	ctx.actorUpdates = macro_data.actorUpdates;
	ctx.chat = macro_data.chat;
	ctx.hitEval = macro_data.hitEval;
	ctx.sequencerAnim = macro_data.seqAnim;
	ctx.suppressMessage = macro_data.suppressMessage;
	ctx.macroResult = macro_data;
}

/**
 * Perform dice-so-nice 3d dice animations and play the Sequencer animation.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function animate(ctx) {
	const chatData = ctx.chat;

	// If 3d dice are enabled, handle them first.
	if (game.dice3d && !game.settings.get("dice-so-nice", "animateInlineRoll")) {
		let contentHtml = $(chatData.content);
		let rolls = [];
		let damageRolls = [];

		if (contentHtml.length > 0) {
			// Find all property rows.
			let $rows = contentHtml.find(".card-prop");
			if ($rows.length > 0) {
				// Iterate over properties.
				$rows.each(function (index) {
					let $row_self = $(this);
					// The machine field name stamped by the card template.
					const rowProp = this.dataset?.prop ?? null;
					// Attack or Target rows - keep all, in right order
					if (["attack", "target", "resources", "effect"].includes(rowProp)) {
						let $roll_html = $row_self.find(".inline-result");
						if ($roll_html.length > 0) {
							$roll_html.each(function (i, e) {
								let roll = Roll.fromJSON(unescape(e.dataset.roll));
								if (rowProp === "attack" && roll.terms[0].faces != 20) {
									// Not an attack roll, usually a target roll, roll first
									rolls.unshift(roll);
								}
								else rolls.push(roll);
							});
						}
					}
					// Hit or Spell level rows - keep only the last
					else if (rowProp === "hit" || isSpellLevelKey(rowProp)) {
						let newDamageRolls = [];
						let $roll_html = $row_self.find(".inline-result");
						if ($roll_html.length > 0) {
							$roll_html.each(function (i, e) {
								let roll = Roll.fromJSON(unescape(e.dataset.roll));
								newDamageRolls.push(roll);
							});
						}
						if (newDamageRolls.length > 0) damageRolls = newDamageRolls; // Animate only relevant rolls
					}
				});
			}

			// If we have roll data, handle a 3d roll.
			rolls = rolls.concat(damageRolls);
			if (rolls.length > 0) {
				for (let roll of rolls) {
					await game.archmage.ArchmageUtility.show3DDiceForRoll(roll, chatData);
				}
			}
		}
	}

	// Play sequencer animation after the dice, if we got any
	if (ctx.sequencerAnim) ctx.sequencerAnim.play();
}

/**
 * Apply the deferred item and actor updates, stamp the reroll flags, and
 * create the chat message.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
export async function commit(ctx) {
	const item = ctx.item;

	// Perform updates.
	if (!foundry.utils.isEmpty(ctx.itemUpdates)) item.update(ctx.itemUpdates, {});
	// Only update the actor for owned items.
	if (!foundry.utils.isEmpty(ctx.actorUpdates)) item.actor?.update(ctx.actorUpdates);

	if (ctx.suppressMessage) {
		ctx.abort("messageSuppressed");
		return;
	}

	// Handle flags for rerolls.
	ctx.chat.flags = ctx.chat.flags ?? {};
	ctx.chat.flags.archmage = {
		// Add flags for IDs and targets.
		actor: item.itemActor?.uuid ?? false,
		item: ctx.clone.uuid,
		targets: [...game.user.targets.map((t) => t.document.uuid)],
		numTargets: ctx.numTargets
	};

	ctx.result = await game.archmage.ArchmageUtility.createChatMessage(ctx.chat);
}

/* -------------------------------------------- */
/*  Class triggers and post-roll effects        */
/* -------------------------------------------- */

/**
 * Check if we are rolling a monk form, add related AC active effect.
 * The former ItemArchmage#_handleMonkFormAC.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleMonkFormAC(ctx) {
	const item = ctx.item;
	if (ctx.clone.type != "power") return;
	if (!item.itemActor?.system.details.detectedClasses?.includes("monk")) return;

	const effects = item.itemActor?.effects;
	const group = ctx.clone.system.group.value?.toLowerCase();
	let bonusMagnitudeMap = {};
	bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.opening")] = 1;
	bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.flow")] = 2;
	bonusMagnitudeMap[game.i18n.localize("ARCHMAGE.MONKFORMS.finishing")] = 3;
	if (!Object.keys(bonusMagnitudeMap).includes(group)) return;
	let bonusMagnitude = bonusMagnitudeMap[group];

	// Check for other monk AC bonuses
	let effectsToDelete = [];
	let alreadyHasBetterBonus = false;
	if (effects) {
		effects.forEach((e) => {
			if (e.name == game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel")) {
				if (Number(e.changes[0].value) <= bonusMagnitude) {
					effectsToDelete.push(e.id);
				}
				else alreadyHasBetterBonus = true;
			}
		});
	}
	await item.itemActor?.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);

	if (alreadyHasBetterBonus) return;

	// Now create new AC bonus effect
	let effectData = {
		name: game.i18n.localize("ARCHMAGE.MONKFORMS.aelabel"),
		img: "icons/svg/shield.svg",
		changes: [{
			key: "system.attributes.ac.value",
			value: bonusMagnitude,
			type: "add"
		}]
	};
	MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfNextTurn);
	await item.itemActor?.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * If this power sets the opposite combat rhythm to the current one, roll the
 * attack with advantage.
 * TODO: deprecated, remove at some future point far from end of 2e playtest
 * The former ItemArchmage#_handleFighterCombatRhythm.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleFighterCombatRhythm(ctx) {
	if (ctx.clone.type != "power") return;
	if (!ctx.item.itemActor?.system.resources?.perCombat?.rhythm?.enabled) return;
	if (!ctx.actorUpdates["system.resources.perCombat.rhythm.current"]) return;

	// If this power sets offense and we are in defense and vice-versa roll 2d20kh.
	if (
		(ctx.item.itemActor.system.resources.perCombat.rhythm.current == "defense"
			&& ctx.actorUpdates["system.resources.perCombat.rhythm.current"] == "offense")
			|| (ctx.item.itemActor.system.resources.perCombat.rhythm.current == "offense"
			&& ctx.actorUpdates["system.resources.perCombat.rhythm.current"] == "defense")
	) {
		// Replace "1d20" and "d20" in the attack line with "2d20kh"
		const attackLine = ctx.clone.system.attack.value;
		ctx.clone.system.attack.value = attackLine.replace("1d20", "d20").replace("d20", "2d20kh");
	}
}

/**
 * If the fighter has momentum, roll the attack with advantage.
 * The former ItemArchmage#_handleFighterMomentum.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleFighterMomentum(ctx) {
	if (!game.settings.get("archmage", "secondEdition")
		|| ctx.clone.type != "power"
		|| ctx.clone.system.powerSource.value != "class"
		|| !ctx.item.itemActor?.system?.details?.detectedClasses?.includes("fighter")
		|| !ctx.item.itemActor?.system.resources?.perCombat?.momentum?.enabled
		|| !ctx.item.itemActor?.system.resources?.perCombat?.momentum?.current
		|| ctx.clone.system.powerSourceName.value.toLowerCase() != game.i18n.localize("fighter").toLowerCase()
	) return;

	// Replace "1d20" and "d20" in the attack line with "2d20kh"
	const attackLine = ctx.clone.system.attack.value;
	ctx.clone.system.attack.value = attackLine.replace("1d20", "d20").replace("d20", "2d20kh");
}

/**
 * Manage the sustain reminder effect of songs.
 * The former ItemArchmage#_handleSong.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleSong(ctx) {
	const item = ctx.item;
	if (ctx.clone.type != "power") return;
	if (!ctx.clone.system.sustainedEffect.value) return;

	const name = game.i18n.format("ARCHMAGE.CHAT.sustainPower",
		{ power: ctx.clone.name, target: ctx.clone.system.sustainOn.value });

	if (ctx.usageMode == "finalverse") {
		// Remove reminder if present
		let effectsToDelete = [];
		item.itemActor?.effects.forEach((e) => {
			if (e.name == name) effectsToDelete.push(e.id);
		});
		await item.itemActor?.deleteEmbeddedDocuments("ActiveEffect", effectsToDelete);
	}
	else {
		// Check if we already have the reminder
		let alreadyHasEffect = false;
		item.itemActor?.effects.forEach((e) => {
			if (e.name == name) alreadyHasEffect = true;
		});
		if (!alreadyHasEffect) {
			// Create the reminder
			let effectData = {
				name: name,
				img: ctx.clone.img ? ctx.clone.img : "icons/svg/sound.svg",
				flags: {
					archmage: {
						tooltip: name
					}
				}
			};
			MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfEachTurn);
			await item.itemActor?.createEmbeddedDocuments("ActiveEffect", [effectData]);
		}
	}
}

/**
 * Manage the reuse reminder effect of 1e breath weapons.
 * The former ItemArchmage#_handleBreathSpell.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleBreathSpell(ctx) {
	// This is only relevant for 1e
	if (game.settings.get("archmage", "secondEdition")) return;

	const item = ctx.item;
	if (ctx.clone.type != "power") return;
	if (!ctx.clone.system.breathWeapon.value) return;

	const name = game.i18n.format("ARCHMAGE.CHAT.reuseBreath", { power: ctx.clone.name });

	// Check if we already have the effect
	let alreadyHasEffect = false;
	item.itemActor?.effects.forEach((e) => {
		if (e.name == name) alreadyHasEffect = true;
	});
	if (!alreadyHasEffect) {
		let effectData = {
			name: name,
			img: ctx.clone.img ? ctx.clone.img : "icons/svg/sound-off.svg",
			flags: {
				archmage: {
					tooltip: name
				}
			}
		};
		MacroUtils.setDuration(effectData, CONFIG.ARCHMAGE.effectDurationTypes.StartOfEachTurn);
		await item.itemActor?.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}

/**
 * If the power's "always" trigger was met, refund the focus cost and mark
 * the trigger as active on the card.
 * The former ItemArchmage#_handleRetainFocus.
 * @param {PowerRollContext} ctx  The pipeline state.
 */
async function handleRetainFocus(ctx) {
	const item = ctx.item;
	if (ctx.clone.type != "power") return;
	if (item.itemActor?.system.resources?.perCombat?.focus?.enabled != true) return;

	const match = ctx.clone.system.always?.value?.match(RETAIN_FOCUS_REGEX);
	if (match) {
		const low = parseInt(match[1]);
		const high = parseInt(match[2]);
		const naturalRoll = ctx.hitEval.$rolls[0].d20result;
		if (naturalRoll >= low && naturalRoll <= high) {
			delete ctx.actorUpdates["system.resources.perCombat.focus.current"];

			// Mark the "always" trigger row active. Keyed on the machine
			// data-prop the template stamps, not the localized label.
			ctx.chat.content = ctx.chat.content.replace(
				`<div class="card-prop" data-prop="always">`,
				`<div class="card-prop trigger-active" data-prop="always">`
			);
		}
	}
}

/**
 * The card colours by the usage of whichever pool of uses is being drawn
 * from, so it matches the sheet.
 * The former ItemArchmage#_getUsageClass.
 * @param {Item} item  The item being rendered.
 * @returns {string} The usage color class.
 */
function getUsageClass(item) {
	return powerUsageColor(item, item?.actor);
}
