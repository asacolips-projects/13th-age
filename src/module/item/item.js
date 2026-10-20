import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import { PowerRollContext } from "../powers/roll/context.js";
import { runPipeline } from "../powers/roll/pipeline.js";
import { isPowerFieldVisible, powerFieldKeys } from "./power-fields.mjs";
import { addProgenyToCreation, addProgenyToDeletion, findParents, gatherChildren, unlinkDeletedChildren } from "./item-relations.mjs";

const INLINE_ROLL_REGEX = /(\[\[.+?\]\])/;

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class ItemArchmage extends Item {

	get itemActor() {
		return this.actor ?? game.user.character;
	}

	/* -------------------------------------------- */
	/*  Relations                                   */
	/* -------------------------------------------- */

	/**
	 * This item's progeny: its children, and theirs, and so on.
	 *
	 * @returns {Promise<ItemArchmage[]>}
	 */
	async gatherChildren() {
		return gatherChildren(this);
	}

	/**
	 * The items on the same actor that list this one as a child.
	 *
	 * @type {ItemArchmage[]}
	 */
	get parentItems() {
		return findParents(this);
	}

	/** @inheritDoc */
	static async _preCreateOperation(documents, operation, user) {
		if (await super._preCreateOperation(documents, operation, user) === false) return false;
		await addProgenyToCreation(documents, operation, user);
	}

	/** @inheritDoc */
	static async _preDeleteOperation(documents, operation, user) {
		if (await super._preDeleteOperation(documents, operation, user) === false) return false;
		await addProgenyToDeletion(documents, operation);
	}

	/** @inheritDoc */
	static async _onDeleteOperation(documents, operation, user) {
		await super._onDeleteOperation(documents, operation, user);
		// Post-operation events run on every client. Only the one that asked for
		// the deletion tidies up after it.
		if (user.id === game.user.id) await unlinkDeletedChildren(documents, operation);
	}

	prepareDerivedData() {
		super.prepareDerivedData();
		if (!this.img || this.img == CONFIG.DEFAULT_TOKEN) {
			if (CONFIG.ARCHMAGE.defaultTokens[this.type]) {
				this.img = CONFIG.ARCHMAGE.defaultTokens[this.type];
			}
			else {
				this.img = CONST.DEFAULT_TOKEN;
			}
		}

		if (this.type == "loot" || this.type == "tool") {
			let model = game.data.model.Item[this.type];
			if (!this.system.quantity) this.system.quantity = model.quantity;
		}

		// Powers created before secondary usage existed have no fields for it yet.
		if (this.type == "power") {
			const model = game.data?.model?.Item?.power ?? {};
			const defaults = {
				powerUsageSecondary: { type: "String", value: "" },
				quantitySecondary: { type: "Number", value: null },
				maxQuantitySecondary: { type: "String", value: null }
			};
			for (const [key, fallback] of Object.entries(defaults)) {
				if (!this.system[key]) {
					this.system[key] = foundry.utils.deepClone(model[key] ?? fallback);
				}
			}
		}
	}

	/**
	 * Roll the item to Chat, creating a chat card.
	 *
	 * The roll runs as a pipeline of stages sharing one
	 * {@link PowerRollContext}: gathering user intent, consuming uses and
	 * resources, preparing the item clone, rolling, rendering, evaluating
	 * hits, running class triggers and macros, animating, and finally
	 * committing the updates and creating the chat message.
	 *
	 * @param {Event} [event]  The originating interaction event, when the
	 *   roll was triggered by a click. Defaults to the global `event` for
	 *   callers that don't pass one.
	 * @returns {Promise<ChatMessage|undefined>} The created chat message, or
	 *   undefined when the roll was aborted or its message suppressed.
	 */
	async roll(event) {
		const ctx = new PowerRollContext({ item: this, event });
		await runPipeline(ctx);
		return ctx.result;
	}

	async rollFeat(featId) {
		let feat = this.system.feats[featId];
		if (!feat || !feat.isActive.value) return;

		// Process uses
		let updateData = {};
		if (feat.quantity?.value != undefined && feat.quantity?.value != null) {
			let path = `system.feats.${featId}.quantity.value`;
			updateData[path] = feat.quantity.value - 1;

			if (updateData[path] < 0) {
				let stop = false;
				await Dialog.confirm({
					title: game.i18n.localize("ARCHMAGE.CHAT.NoUses"),
					content: game.i18n.localize("ARCHMAGE.CHAT.NoUsesMsg"),
					yes: () => {
						updateData[path] = 0;
					},
					no: () => {
						stop = true;
					},
					defaultYes: false
				});
				if (stop) return;
			}
		}

		const template = `systems/archmage/templates/chat/feat-card.html`;
		const templateData = {
			actor: this.itemActor,
			tokenId: null, // token ? `${token.scene.id}.${token.id}` : null,
			item: this,
			feat: feat,
			featName: game.i18n.localize(`ARCHMAGE.CHAT.${feat.tier.value}`)
		};
		// Basic chat message data
		const actor = this.itemActor ?? game.user.character;
		const chatData = {
			user: game.user.id,
			speaker: {
				actor: actor?.id ?? null,
				token: null,
				alias: actor?.name ?? null,
				scene: game.user.viewedScene
			}
		};

		// Render the template
		chatData.content = await foundry.applications.handlebars.renderTemplate(template, templateData);

		// Enrich the message to parse inline rolls.
		let rollData = this.itemActor?.getRollData(this) ?? {};
		chatData.content = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			chatData.content,
			{ rolls: true, rollData: rollData }
		);

		// Perform updates.
		if (!foundry.utils.isEmpty(updateData)) this.update(updateData, {});

		return game.archmage.ArchmageUtility.createChatMessage(chatData);
	}

	/**
	 * Collect the item's pools of uses, in the order they get spent.
	 *
	 * Powers can track a secondary pool of uses on top of the primary one, for
	 * cases such as the paladin's Smite Evil ("once per battle, plus an
	 * additional [[@cha.mod]] times per day"). The secondary pool is only spent
	 * once the primary one has run out.
	 *
	 * @returns {Array<object>}  One entry per tracked pool, each holding the
	 *   update path of its uses, the uses left, and its usage type. Pools which
	 *   aren't tracked at all (null uses) are omitted.
	 */
	usagePools() {
		const pools = [];
		if (this.system.quantity?.value != null) {
			pools.push({
				path: "system.quantity.value",
				uses: Number(this.system.quantity.value),
				usage: this.system.powerUsage?.value
			});
		}
		if (this.type == "power" && this.system.quantitySecondary?.value != null) {
			pools.push({
				path: "system.quantitySecondary.value",
				uses: Number(this.system.quantitySecondary.value),
				usage: this.system.powerUsageSecondary?.value
			});
		}
		return pools;
	}

	/**
	 * Resolve a maximum uses field, which may hold an inline roll.
	 *
	 * Max uses are stored as strings so that they can be expressed relative to
	 * the actor, such as "[[@cha.mod]]" for the paladin's Smite Evil.
	 *
	 * @param {string} field    Name of the field to resolve, either 'maxQuantity'
	 *   or 'maxQuantitySecondary'.
	 * @returns {Promise<number | null>}  The numeric maximum, or null if the field
	 *   is empty or doesn't resolve to a number.
	 */
	async resolveMaxQuantity(field = "maxQuantity") {
		const raw = this.system?.[field]?.value;
		if (raw === null || raw === undefined || raw === "") return null;
		if (typeof raw === "number") return raw;

		// Substitute any inline rolls with their totals before parsing.
		let formula = String(raw).trim();
		let ir;
		while ((ir = INLINE_ROLL_REGEX.exec(formula))) {
			const rolls = ArchmageRolls.getInlineRolls(ir[1], this.itemActor?.getRollData(this) ?? {});
			if (!rolls) break;
			await ArchmageRolls.rollAll(rolls, this.itemActor);
			formula = formula.replace(ir[1], rolls[0].total);
		}

		const max = Number(formula);
		return Number.isFinite(max) ? Math.max(Math.floor(max), 0) : null;
	}

	/**
	 * Roll an item's recharge, and update its quantity based on the maxQuantity.
	 *
	 * @param {object} options      Options to pass during execution.
	 * @param {boolean} options.createMessage  Whether or not to render chat messages.
	 * @param {boolean} options.secondary  Recharge the power's secondary pool of
	 *   uses rather than the primary one. Secondary pools have no attempt
	 *   counter, so the "recharge once per day" setting doesn't limit them.
	 * @returns {Promise<object>}  A promise resolving to an object with roll results.
	 */
	async recharge({ createMessage=true, secondary=false }={}) {
		// Only update for recharge powers/items.
		if (this.system?.powerUsage?.value !== "recharge") return;
		// Only update for owned items.
		if (!this.actor) return;

		// And only if recharge is feasible
		// if (recharge <= 0 || recharge > 20) return;

		// If a recharge power does not have a recharge value, assume 16+
		let recharge = Number(this.system?.recharge?.value) || 16;

		let actor = this.actor;

		const quantityKey = secondary ? "quantitySecondary" : "quantity";
		let maxQuantity = await this.resolveMaxQuantity(secondary ? "maxQuantitySecondary" : "maxQuantity") ?? 1;
		let currQuantity = this.system?.[quantityKey]?.value ?? 0;
		if (maxQuantity - currQuantity <= 0) return;
		let rechAttempts = this.system?.rechargeAttempts?.value ?? 0;

		let roll = new Roll("d20");
		await roll.roll();

		let rechargeSuccessful = roll.total >= Number(recharge);

		if (createMessage) {
			// Basic template rendering data
			const template = `systems/archmage/templates/chat/recharge-card.html`;
			const token = actor?.token;

			// Basic chat message data
			const chatData = {
				user: game.user.id,
				type: CONST.CHAT_MESSAGE_STYLES.ROLL,
				roll: roll,
				speaker: game.archmage.ArchmageUtility.getSpeaker(actor)
			};

			const templateData = {
				actor: actor,
				title: this.name,
				tokenId: token ? `${token.id}` : null,
				success: rechargeSuccessful,
				data: chatData
			};

			// Render the template
			chatData.content = await foundry.applications.handlebars.renderTemplate(template, templateData);

			await game.archmage.ArchmageUtility.createChatMessage(chatData);
		}

		// Update the item.
		if (rechargeSuccessful) {
			await this.update({
				[`system.${quantityKey}.value`]: Number(currQuantity) + 1
			});
		}
		else if (!secondary) {
			// Record recharge attempt
			await this.update({
				system: { rechargeAttempts: { value: Number(rechAttempts) + 1 } }
			});
		}

		return {
			roll: roll,
			total: roll.total,
			target: recharge,
			success: rechargeSuccessful
		};
	}

	/* -------------------------------------------- */
	/*  Chat Card Data
  /* -------------------------------------------- */

	async getChatData(htmlOptions, skipInlineRolls) {
		const data = this[`_${this.type}ChatData`]();
		if (!skipInlineRolls) {
			htmlOptions = foundry.utils.mergeObject(htmlOptions ?? {}, { async: false });
			data.description.value = data.description.value !== undefined
				? (await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					data.description.value,
					htmlOptions
				))
				: "";
		}
		return data;
	}

	_prepareActiveEffectsData(data) {
		data.activeEffects = [...this.effects.values()].map((effect) => {
			return {
				uuid: effect.uuid,
				img: effect.img,
				name: effect.name,
				id: effect.id,
				flags: effect.flags,
				description: effect?.description
			};
		});
	}

	_powerChatData() {
		const data = foundry.utils.duplicate(this.system);
		const tags = [
			{
				label: game.i18n.localize("ARCHMAGE.CHAT.actionType"),
				value: CONFIG.ARCHMAGE.actionTypes[data.actionType.value]
			},
			{
				label: game.i18n.localize("ARCHMAGE.CHAT.powerUsage"),
				// Powers tracking two pools of uses list both, e.g. "Once per battle / Daily".
				value: data.powerUsageSecondary?.value
					? `${CONFIG.ARCHMAGE.powerUsages[data.powerUsage.value]} / ${CONFIG.ARCHMAGE.powerUsages[data.powerUsageSecondary.value]}`
					: CONFIG.ARCHMAGE.powerUsages[data.powerUsage.value]
			},
			{
				label: game.i18n.localize("ARCHMAGE.CHAT.powerSource"),
				value: CONFIG.ARCHMAGE.powerSources[data.powerSource.value]
			},
			{
				label: game.i18n.localize("ARCHMAGE.CHAT.powerType"),
				value: CONFIG.ARCHMAGE.powerTypes[data.powerType.value]
			},
			{
				label: data.powerLevel !== undefined ? data.powerLevel.label : "Level",
				value: `${game.i18n.localize("ARCHMAGE.level")} ${data.powerLevel !== undefined ? data.powerLevel.value : this.itemActor?.system.details.level.value}`
			}
		];

		const propKeys = powerFieldKeys({ group: "property" });
		const properties = propKeys.map((k) => {
			return {
				label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
				value: data[k] ? data[k].value : null
			};
		});

		let feats = [];
		if (data.feats) {
			feats = Object.values(data.feats).map((f) => {
				return {
					label: f.tier ? f.tier.value : null,
					description: f.description ? f.description.value : null,
					isActive: f.isActive ? f.isActive.value : null
				};
			});
		}

		// Spell level entries are only shown once the power is high enough level.
		const effectKeys = powerFieldKeys({ group: "effect" })
			.filter((k) => isPowerFieldVisible({ system: data }, k, this.actor));

		const effects = effectKeys.map((k) => {
			return {
				label: data[k] ? game.i18n.localize(`ARCHMAGE.CHAT.${k}`) : null,
				value: data[k] ? data[k].value : null
			};
		});

		this._prepareActiveEffectsData(data);

		data.tags = tags.filter((t) => t.value !== null && t.value !== undefined && t.value != "");
		data.properties = properties.filter((p) => p.value !== null && p.value !== undefined && p.value != "");
		data.feats = feats.filter((f) => f.description !== null && f.description !== undefined && f.description !== "");
		data.effects = effects.filter((e) => e.value !== null && e.value !== undefined && e.value != "");
		data.effect = {
			label: game.i18n.localize(`ARCHMAGE.CHAT.effect`),
			value: data.effect.value
		};
		data.special = {
			label: game.i18n.localize(`ARCHMAGE.CHAT.special`),
			value: data.special.value
		};
		return data;
	}

	_equipmentChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

	_actionChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

	_traitChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

	_nastierSpecialChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

	_toolChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

	_lootChatData() {
		const data = foundry.utils.duplicate(this.system);
		this._prepareActiveEffectsData(data);
		return data;
	}

/*   static chatListeners(html) {

    // Chat card actions
    html.on('click', '.card-buttons button', ev => {
      ev.preventDefault();

      // Extract card data
      const button = $(ev.currentTarget),
        messageId = button.parents('.message').attr("data-message-id"),
        senderId = game.messages.get(messageId).user.id,
        card = button.parents('.chat-card');

      // Confirm roll permission
      if (!game.user.isGM && (game.user.id !== senderId)) return;

      // Get the Actor from a synthetic Token
      let actor;
      const tokenKey = card.attr("data-token-id");
      if (tokenKey) {
        const [sceneId, tokenId] = tokenKey.split(".");
        let token;
        if (sceneId === canvas.scene.id) token = canvas.tokens.get(tokenId);
        else {
          const scene = game.scenes.get(sceneId);
          if (!scene) return;
          let tokenData = scene.data.tokens.find(t => t.id === Number(tokenId));
          if (tokenData) token = new Token(tokenData);
        }
        if (!token) return;
        actor = Actor.fromToken(token);
      } else actor = game.actors.get(card.attr('data-actor-id'));

      // Get the Item
      if (!actor) return;
      const itemId = card.attr("data-item-id");
      let itemData = actor.items.find(i => i.id === itemId);
      if (!itemData) return;
      const item = new CONFIG.Item.documentClass(itemData, { actor: actor });

      // Get the Action
      const action = button.attr("data-action");

      // Weapon attack
      if (action === "weaponAttack") item.rollWeaponAttack(ev);
      else if (action === "weaponDamage") item.rollWeaponDamage(ev);
      else if (action === "weaponDamage2") item.rollWeaponDamage(ev, true);

      // Spell actions
      else if (action === "spellAttack") item.rollSpellAttack(ev);
      else if (action === "spellDamage") item.rollSpellDamage(ev);

      // Feat actions
      else if (action === "featAttack") item.rollFeatAttack(ev);
      else if (action === "featDamage") item.rollFeatDamage(ev);

      // Consumable usage
      else if (action === "consume") item.rollConsumable(ev);

      // Tool usage
      else if (action === "toolCheck") item.rollToolCheck(ev);
    });
  } */
}

