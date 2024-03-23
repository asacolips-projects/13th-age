/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    "systems/archmage/templates/active-effects/effect.html",

    "systems/archmage/templates/actors/actor-character-sheet-vue.html",
    "systems/archmage/templates/actors/actor-npc-sheet-vue.html",

    "systems/archmage/templates/chat/action-card.html",
    "systems/archmage/templates/chat/command-card.html",
    "systems/archmage/templates/chat/consumable-card.html",
    "systems/archmage/templates/chat/equipment-card.html",
    "systems/archmage/templates/chat/feat-card.html",
    "systems/archmage/templates/chat/icon-relationship-card.html",
    "systems/archmage/templates/chat/loot-card.html",
    "systems/archmage/templates/chat/nastierspecial-card.html",
    "systems/archmage/templates/chat/power-card.html",
    "systems/archmage/templates/chat/recharge-card.html",
    "systems/archmage/templates/chat/recovery-card.html",
    "systems/archmage/templates/chat/recovery-dialog.html",
    "systems/archmage/templates/chat/rest-full-card.html",
    "systems/archmage/templates/chat/rest-short-card.html",
    "systems/archmage/templates/chat/roll-dialog.html",
    "systems/archmage/templates/chat/save-card.html",
    "systems/archmage/templates/chat/skill-check-card.html",
    "systems/archmage/templates/chat/tool-card.html",
    "systems/archmage/templates/chat/tool-roll-dialog.html",
    "systems/archmage/templates/chat/trait-card.html",

    "systems/archmage/templates/items/item-action-sheet.html",
    "systems/archmage/templates/items/item-class-sheet.html",
    "systems/archmage/templates/items/item-equipment-sheet.html",
    "systems/archmage/templates/items/item-loot-sheet.html",
    "systems/archmage/templates/items/item-nastier-special-sheet.html",
    "systems/archmage/templates/items/item-power-sheet.html",
    "systems/archmage/templates/items/item-tool-sheet.html",
    "systems/archmage/templates/items/item-trait-sheet.html",

    "systems/archmage/templates/prepopulate/powers--list.html",
    "systems/archmage/templates/prepopulate/tabs-content.html",

    "systems/archmage/templates/sidebar/apps/archmage-help.html",
    "systems/archmage/templates/sidebar/apps/a11y-preview.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
