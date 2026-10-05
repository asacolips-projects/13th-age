/**
 * Item relations: an item can list other items as its children
 * (`system.children`, an array of UUIDs). Adding the item to an actor also
 * adds its children, recursively, and deleting it from the actor deletes them.
 *
 * Outside of an actor, children are absolute UUIDs, usually of compendium
 * items. Once embedded, the parent's list is rewritten to point at the actor's
 * own copies, so that every link on an actor is between siblings.
 *
 * Both workflows run in ItemArchmage's batch-wise operation hooks, which are
 * awaited (unlike the preCreateItem/preDeleteItem hooks), so the children join
 * the very same database operation as their parent.
 *
 * Either can be skipped by passing `archmageChildren: false` in the operation,
 * e.g. `actor.createEmbeddedDocuments('Item', data, {archmageChildren: false})`.
 */

// An item embedded in an actor, including a token's synthetic actor. The
// actor part isn't checked when resolving: an embedded item's children are its
// siblings by construction, and the actor's own UUID changes when it's
// duplicated, imported or placed as an unlinked token.
const EMBEDDED_ITEM_UUID = /(?:^|\.)Actor\.[^.]+\.Item\.([^.]+)$/;

/**
 * The id of the actor item a child UUID points at, if it points at one.
 *
 * @param {string} uuid
 * @returns {string|undefined}
 */
function embeddedItemId(uuid) {
	return EMBEDDED_ITEM_UUID.exec(uuid)?.[1];
}

/**
 * Resolve one of an item's child UUIDs.
 *
 * @param {string} uuid  Child UUID, as found in `system.children`.
 * @param {Item} item    The item the UUID was listed on.
 * @returns {Promise<Item|null>}
 */
export async function resolveChild(uuid, item) {
	const actor = item.parent;
	if (actor?.documentName === "Actor") {
		const id = embeddedItemId(uuid);
		if (id) return actor.items.get(id) ?? null;
	}
	const child = await fromUuid(uuid);
	return child instanceof Item ? child : null;
}

/**
 * Find an item's progeny: its children, their children, and so on, depth
 * first. Children that can't be found are skipped, and each item is only
 * returned once, however many times it's listed, so loops can't recurse.
 *
 * @param {Item} item
 * @param {Set<string>} [seen]  UUIDs already visited. Internal.
 * @returns {Promise<Item[]>}
 */
export async function gatherChildren(item, seen = new Set([item.uuid])) {
	const progeny = [];
	for (const uuid of item.system.children ?? []) {
		const child = await resolveChild(uuid, item);
		if (!child || seen.has(child.uuid)) continue;
		seen.add(child.uuid);
		progeny.push(child, ...await gatherChildren(child, seen));
	}
	return progeny;
}

/**
 * The actor's items that list the given item as a child.
 *
 * @param {Item} item  An item embedded in an actor.
 * @returns {Item[]}
 */
export function findParents(item) {
	const actor = item.parent;
	if (actor?.documentName !== "Actor") return [];
	return actor.items.filter((parent) => (parent.system.children ?? []).some((uuid) => embeddedItemId(uuid) === item.id));
}

/**
 * For every item on the actor that's some other item's child, the names of
 * its parents.
 *
 * @param {Actor} actor
 * @returns {Map<string, string[]>}  Child item id to parent names.
 */
export function parentNamesById(actor) {
	const names = new Map();
	for (const parent of actor.items) {
		for (const uuid of parent.system.children ?? []) {
			const id = embeddedItemId(uuid);
			if (!id || !actor.items.has(id)) continue;
			if (!names.has(id)) names.set(id, []);
			names.get(id).push(parent.name);
		}
	}
	return names;
}

/**
 * Creation data for an actor's copy of a child.
 *
 * @param {Item} source
 * @returns {object}
 */
function childCopyData(source) {
	const data = source.pack ? game.items.fromCompendium(source) : source.toObject();
	delete data.folder;
	delete data.sort;
	data._id = foundry.utils.randomID();
	return data;
}

/**
 * Add the progeny of the items being created on an actor to the same
 * creation, and link each parent to its new children.
 *
 * Children can be left out through a parent's
 * `flags.archmage.excludeChildren`: paths of child UUIDs, as listed on each
 * item on the way down, joined by '>'. Leaving a child out leaves out its own
 * children too. The flag is only read here, never stored. The power importer
 * uses it for the children that were unticked.
 *
 * @param {Item[]} documents                  Pending documents, which are appended to.
 * @param {DatabaseCreateOperation} operation
 * @param {BaseUser} user
 */
export async function addProgenyToCreation(documents, operation, user) {
	const actor = operation.parent;
	const exclusions = new Map();
	for (const doc of documents) {
		const excluded = doc._source.flags?.archmage?.excludeChildren;
		if (!excluded) continue;
		exclusions.set(doc, new Set(excluded));
		delete doc._source.flags.archmage.excludeChildren;
	}

	if (operation.archmageChildren === false || actor?.documentName !== "Actor") return;
	if (!documents.some((doc) => doc.system.children?.length)) return;

	// Parents link to their children's UUIDs, so every id has to be known before
	// anything is saved, rather than left to the server.
	if (!operation.keepId) {
		for (const doc of documents) doc.updateSource({ _id: foundry.utils.randomID() });
		operation.keepId = true;
	}

	const missing = [];

	// Children are created from the UUIDs listed on the item they're copied from,
	// then the copy's list is replaced by the UUIDs of the copies of its children.
	const expand = async (doc, excluded, path, lineage) => {
		const links = [];
		for (const uuid of doc.system.children ?? []) {
			const source = await fromUuid(uuid);
			if (!(source instanceof Item)) {
				missing.push(uuid);
				continue;
			}
			// Paths are made of the children's own UUIDs, which is how the importer
			// knows them, however they're written in the list.
			const childPath = [...path, source.uuid];
			if (excluded.has(childPath.join(">")) || lineage.includes(source.uuid)) continue;
			const data = childCopyData(source);
			const child = new doc.constructor(data, { parent: actor });
			// Children go through the same per-document checks as their parent.
			if (await child._preCreate(data, operation, user) === false) continue;
			if (Hooks.call("preCreateItem", child, data, operation, user.id) === false) continue;
			documents.push(child);
			links.push(`${actor.uuid}.Item.${child.id}`);
			await expand(child, excluded, childPath, [...lineage, source.uuid]);
		}
		if (doc.system.children?.length || links.length) doc.updateSource({ "system.children": links });
	};

	for (const doc of [...documents]) {
		const lineage = [doc._stats?.compendiumSource].filter(Boolean);
		await expand(doc, exclusions.get(doc) ?? new Set(), [], lineage);
	}

	if (missing.length) {
		console.warn(`Archmage | ${missing.length} child item(s) could not be found:`, missing);
		ui.notifications.warn(game.i18n.format("ARCHMAGE.ITEM.childrenMissing", { count: missing.length }));
	}
}

/**
 * Add the progeny of the items being deleted from an actor to the same
 * deletion. Only the actor's own items are ever deleted.
 *
 * @param {Item[]} documents                  Pending documents, which are appended to.
 * @param {DatabaseDeleteOperation} operation
 */
export async function addProgenyToDeletion(documents, operation) {
	const actor = operation.parent;
	if (operation.archmageChildren === false || operation.deleteAll || actor?.documentName !== "Actor") return;
	const ids = new Set(operation.ids);
	for (const doc of [...documents]) {
		for (const child of await gatherChildren(doc)) {
			if (child.parent !== actor || ids.has(child.id)) continue;
			ids.add(child.id);
			operation.ids.push(child.id);
			documents.push(child);
		}
	}
}

/**
 * Drop links to deleted items from the parents that are left.
 *
 * @param {Item[]} documents                  The deleted documents.
 * @param {DatabaseDeleteOperation} operation
 */
export async function unlinkDeletedChildren(documents, operation) {
	const actor = operation.parent;
	if (actor?.documentName !== "Actor") return;
	const deleted = new Set(documents.map((doc) => doc.id));
	const updates = actor.items
		.filter((item) => !deleted.has(item.id))
		.filter((item) => (item.system.children ?? []).some((uuid) => deleted.has(embeddedItemId(uuid))))
		.map((item) => ({
			_id: item.id,
			"system.children": item.system.children.filter((uuid) => !deleted.has(embeddedItemId(uuid)))
		}));
	if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
}
