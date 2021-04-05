/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  ui.notifications.warn(`Applying System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors.entities ) {
    try {
      const updateData = migrateActorData(a.data);
      if ( !isObjectEmpty(updateData) ) {
        console.log(`Migrating Actor entity ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
      // Actor Data Cleanup
      cleanActorData(a.data);
    } catch(err) {
      err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  // for ( let i of game.items.entities ) {
    // try {
      // const updateData = migrateItemData(i.data);
      // if ( !isObjectEmpty(updateData) ) {
        // console.log(`Migrating Item entity ${i.name}`);
        // await i.update(updateData, {enforceTypes: false});
      // }
    // } catch(err) {
      // err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
      // console.error(err);
    // }
  // }

  // Migrate Actor Override Tokens
  // for ( let s of game.scenes.entities ) {
    // try {
      // const updateData = migrateSceneData(s.data);
      // if ( !isObjectEmpty(updateData) ) {
        // console.log(`Migrating Scene entity ${s.name}`);
        // await s.update(updateData, {enforceTypes: false});
      // }
    // } catch(err) {
      // err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
      // console.error(err);
    // }
  // }

  // Migrate World Compendium Packs
  // for ( let p of game.packs ) {
    // if ( p.metadata.package !== "world" ) continue;
    // if ( !["Actor", "Item", "Scene"].includes(p.metadata.entity) ) continue;
    // await migrateCompendium(p);
  // }

  // Set the migration as complete
  // game.settings.set("archmage", "systemMigrationVersion", game.system.data.version);
  // ui.notifications.info(`System Migration to version ${game.system.data.version} completed!`, {permanent: true});
  
  
  ui.notifications.info(`Migration finished. Have fun!`, {permanent: true});
};

/* -------------------------------------------- */

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export const migrateActorData = function(actor) {
  const updateData = {};

  // Actor Data Updates
  // TODO: call specific one-shot migrations here  

  // Migrate Owned Items
  // if ( !actor.items ) return updateData;
  // let hasItemUpdates = false;
  // const items = actor.items.map(i => {

    // Migrate the Owned Item
    // let itemUpdate = migrateItemData(i);

    // Update the Owned Item
    // if ( !isObjectEmpty(itemUpdate) ) {
      // hasItemUpdates = true;
      // return mergeObject(i, itemUpdate, {enforceTypes: false, inplace: false});
    // } else return i;
  // });
  // if ( hasItemUpdates ) updateData.items = items;
  return updateData;
};

/* -------------------------------------------- */

/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actorData) {
  console.log("Cleaning Actor data...");

  // Scrub system data
  const model = game.system.model.Actor[actorData.type];
  actorData.data = filterObject(actorData.data, model);

  // Return the scrubbed data
  return actorData;
}


/* -------------------------------------------- */