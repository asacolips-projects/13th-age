export class ActorHelpersV2 {
  /**
   * Compute derived data for an actor.
   *
   * @param {object} actorData
   *   `actor.data` object to compute derived data for.
   */
  static prepareData(actorData) {
    ActorHelpersV2._prepareCharacterData(actorData);
    ActorHelpersV2._prepareNpcData(actorData);
    return actorData;
  }

  static _prepareCharacterData(actorData) {
    ActorHelpersV2._prepareAbilityScores(actorData);
    ActorHelpersV2._prepareDefenses(actorData);
  }

  static _prepareNpcData(actorData) {
    // Pass.
  }

  static _prepareIcons(actorData) {
    // Handle icons.
    if (actorData.system?.icons) {
      for (let v of Object.values(actorData.system.icons)) {
        if (v.results) {
          let results = {};
          for (let i = 0; i < v.bonus.value; i++) {
            results[i] = {
              // TODO: Make this dynamic.
              value: 6
            }
          }
          v.results = results;
        }
      }
    }
  }

  static _prepareAbilityScores(actorData) {
    let levelMultiplier = 1;
    if (actorData.system.attributes.level.value >= 5) {
      levelMultiplier = 2;
    }
    if (actorData.system.attributes.level.value >= 8) {
      levelMultiplier = 3;
    }

    for (let abl of Object.values(actorData.system.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.lvl = abl.mod + actorData.system.attributes.level.value;
      abl.dmg = abl.mod * levelMultiplier;
    }
  }

  static _prepareDefenses(actorData) {
    let data = actorData.system;
    let missingRecPenalty = Math.min(data.attributes.recoveries.value, 0);

    let acBonus = missingRecPenalty;
    let mdBonus = missingRecPenalty;
    let pdBonus = missingRecPenalty;

    if (actorData.items) {
      actorData.items.forEach((item) => {
        if (item.type === 'equipment') {
          acBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.ac);
          mdBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.md);
          pdBonus += ActorHelpersV2._getBonusOr0(item?.data?.data?.attributes?.pd);
        }
      });
    }

    // Sort numerically (the default sort compares as strings) and take [1], the median of the three ability mods.
    data.attributes.ac.value = data.attributes.ac.base + [data.abilities.dex.mod, data.abilities.con.mod, data.abilities.wis.mod].sort((a, b) => a - b)[1] + data.attributes.level.value + acBonus;
    data.attributes.pd.value = data.attributes.pd.base + [data.abilities.dex.mod, data.abilities.con.mod, data.abilities.str.mod].sort((a, b) => a - b)[1] + data.attributes.level.value + pdBonus;
    data.attributes.md.value = data.attributes.md.base + [data.abilities.int.mod, data.abilities.cha.mod, data.abilities.wis.mod].sort((a, b) => a - b)[1] + data.attributes.level.value + mdBonus;
  }

  static _getBonusOr0(type) {
    if (type && type.bonus) {
      return type.bonus;
    }
    return 0;
  }

  static _activatePortraitArtContextMenu(app, element) {
    // Accept either a jQuery wrapper or a raw element.
    const target = element instanceof HTMLElement ? element : (element?.[0] ?? element);
    // Note: ContextMenu.implementation.create() is AppV1-only (it throws for
    // ApplicationV2), so bind the menu by constructing it directly. The menu
    // callbacks close over `app`, so it isn't passed to the menu itself.
    const MenuClass = foundry.applications.ux.ContextMenu.implementation;
    new MenuClass(target, '.profile-img', [
      {
        label: game.i18n.localize('ARCHMAGE.CHARACTER.showPortrait'),
        icon: '<i class="fa fa-image-portrait"></i>',
        callback: () => {
          new foundry.applications.apps.ImagePopout({
            src: app.actor.img,
            window: {title: game.i18n.format('ARCHMAGE.CHARACTER.showPortraitTitle', {name: app.actor.name})},
            shareable: true,
            uuid: app.actor.uuid,
          }).render(true);
        }
      },
      {
        label: game.i18n.localize('ARCHMAGE.CHARACTER.showToken'),
        icon: '<i class="fas fa-circle-user"></i>',
        callback: () => {
          new foundry.applications.apps.ImagePopout({
            src: app.actor.prototypeToken.texture.src,
            window: {title: game.i18n.format('ARCHMAGE.CHARACTER.showTokenTitle', {name: app.actor.name})},
            shareable: true,
            uuid: app.actor.uuid,
          }).render(true);
        }
      }
    ], {jQuery: false});
  }
}

/**
 * Build the sheet context shared by the actor sheets and the character
 * settings window: the owner/editable basics, the actor's plain data with
 * source values and active-effect overrides, drag data, token and compendium
 * pack info, and sorted item/effect lists plus the fields locked by those
 * effects.
 *
 * Ported verbatim from the sheets' getData()/_prepareContext(), so the
 * context contract stays identical across them.
 *
 * @param {ActorArchmage} actor   The actor document to build context for.
 * @param {object} [extra]  Caller-specific fields (e.g. the sheet's
 *   `editable` flag or AppV1-only keys) added on top of the shared ones.
 * @returns {object} The prepared context.
 */
export function buildSheetContext(actor, extra = {}) {
  const context = {};

  // Basic data.
  let isOwner = actor.isOwner;
  context.owner = isOwner;
  context.limited = actor.limited;
  context.cssClass = isOwner ? "editable" : "locked";
  context.isCharacter = actor.type === "character";
  context.config = CONFIG.ARCHMAGE;
  context.rollData = actor.getRollData(actor);

  // Convert the actor data into a more usable version.
  let actorData = actor.toObject(false);

  // Get drag data for later retrieval.
  const dragData = actor.toDragData();
  if (dragData.uuid.includes('Token.') && dragData.type !== 'Token') {
    dragData.type = 'Token';
  }

  context.dragData = dragData;

  // Add to our data object that the sheet will use.
  context.actor = actorData;
  context.data = actorData.system;
  context.actor.owner = context.owner;
  context.actor._source = foundry.utils.deepClone(actor._source);
  context.actor.overrides = foundry.utils.flattenObject(actor.overrides);
  context.actor.dragData = context.dragData;

  // Add token info if needed.
  if (actor?.token?.id) {
    if (!actor.token.actorLink && actor?.token?.id) {
      context.actor.prototypeToken.id = actor.prototypeToken.id;
      context.actor.prototypeToken.sceneId = actor.prototypeToken?.parent?.id;
    }
  }

  // Add pack info if needed.
  if (actor?.pack) {
    context.actor.pack = actor.pack;
  }

  // Sort items.
  context.actor.items = actorData.items;
  context.actor.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

  // Sort effects.
  context.actor.effects = actorData.effects;
  context.actor.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));

  // Retrieve a list of locked fields due to AEs.
  context.actor.lockedFields = [];
  actor.effects.forEach(ae => {
    const changes = ae.changes.map(c => c.key);
    context.actor.lockedFields = context.actor.lockedFields.concat(changes);
  });

  // Add the caller's own fields last so they can complement the shared ones.
  Object.assign(context, extra);

  return context;
}

/**
 * Sort items on drop, shared by the actor sheets' _onSortItem() overrides.
 *
 * Core resolves the drop target with `event.target.closest('[data-item-id]')`,
 * which is unsafe on these sheets: several elements *inside* an item row also
 * carry `data-item-id` (the name link, the uses/quantity counter, the feat
 * pips, the edit and delete controls). When the cursor was over any of those,
 * core resolved the drop target to that inner element and then scanned
 * `dropTarget.parentElement.children` for siblings, collecting the row's own
 * inner elements instead of the neighbouring rows. The resulting sort value
 * was computed against a bogus sibling list, which is why drops appeared to do
 * nothing, land in the wrong place, or shuffle unrelated items.
 *
 * @param {ActorArchmage} actor   The actor that owns the sorted items.
 * @param {DragEvent} event   The drop event.
 * @param {Item|object} item   The dropped item document, or its data.
 * @returns {Promise|void} Promise for the sort update, or void when the drop
 *   is ignored.
 */
export function sortItemDrop(actor, event, item) {
  const items = actor.items;
  const source = items.get(item.id ?? item._id);
  if (!source) return;

  // Always resolve the drop target to the item row, never a descendant.
  const dropTarget = event.target.closest('.item[data-item-id]');
  if (!dropTarget) return;
  const target = items.get(dropTarget.dataset.itemId);
  if (!target || source.id === target.id) return;

  // Work out whether the drop crossed into another group. The rendered lists
  // are the groups, so ask the destination list whether it holds the source
  // row rather than trying to re-derive the grouping from item data. Scoping
  // the lookup to that list also keeps it correct for items that appear in
  // more than one list (a power with a trigger shows up on both tabs).
  const crossGroup = !dropTarget.parentElement
    .querySelector(`:scope > .item[data-item-id="${source.id}"]`);
  const groupBy = actor.getFlag('archmage', 'sheetDisplay.powers.groupBy.value') ?? 'powerType';

  // A drop into another group is only meaningful for custom power groups,
  // where the group is free text stored on the power. Under the built-in
  // groupings the group is derived from the power's own data, so the row would
  // snap straight back to where it started with a new and meaningless sort
  // value - which read as "nothing moved". Ignore those drops instead.
  const regroup = crossGroup && source.type === 'power' && target.type === 'power' && groupBy === 'group';
  if (crossGroup && !regroup) return;

  // Identify sibling rows from the list the drop target lives in, skipping
  // anything that isn't itself an item row.
  const siblings = [];
  for (const el of dropTarget.parentElement.children) {
    if (!el.matches('.item[data-item-id]')) continue;
    const siblingId = el.dataset.itemId;
    if (!siblingId || siblingId === source.id) continue;
    const sibling = items.get(siblingId);
    if (sibling) siblings.push(sibling);
  }

  // Drop into the half of the row the cursor is actually over so the item
  // lands where it was released, rather than always above the target. Measure
  // against the summary line rather than the whole row: an expanded row is
  // mostly detail content, which would push the midpoint far off screen.
  const rect = (dropTarget.firstElementChild ?? dropTarget).getBoundingClientRect();
  const sortBefore = (event.clientY - rect.top) < (rect.height / 2);

  // Perform the sort.
  const sortUpdates = foundry.utils.performIntegerSort(source, {target, siblings, sortBefore});
  const updateData = sortUpdates.map(u => {
    const update = u.update;
    update._id = u.target._id;
    return update;
  });

  // Adopt the destination group. The target row already lives there, so its
  // own group value is the label to copy.
  if (regroup) {
    const sourceUpdate = updateData.find(u => u._id === source.id);
    if (sourceUpdate) sourceUpdate['system.group.value'] = target.system.group?.value ?? '';
  }

  return actor.updateEmbeddedDocuments('Item', updateData);
}
