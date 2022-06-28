class ArchmageUpdateHandler {
  // Call hooks in the constructor.
  constructor() {
    Hooks.once('init', this.init.bind(this));
    Hooks.once('ready', this.executeMigration.bind(this));
    // @deprecated: Remove this in a future version.
    // Hooks.once('ready', this.runUpdates.bind(this));
  }

  // Register a hidden setting that we can use to track the version. In this
  // case, the version starts at 1000 and increases by 1 on each update. The
  // first number of the version should match the current major version of the
  // system/module to make it more clear which version the update is for.
  init() {
    // @deprecated: Remove this in a future version.
    game.settings.register('archmage', 'schemaVersion', {
      name: 'Current schema version for system updates.',
      hint: 'This schema version is separate from the system version and can be used to run sequential updates.',
      scope: 'world',
      config: false,
      default: 1000,
      type: Number,
    });

    // Added in version 1.19.0
    game.settings.register('archmage', 'systemMigrationVersion', {
      name: 'Current version of the system prior to migration.',
      hint: 'This version is updated to the current system version upon loading a world.',
      scope: 'world',
      config: false,
      default: '1.17.0',
      type: String,
    });
  }

  /**
   * Update runner.
   * @deprecated
   *
   * This method is called once in the ready hook and it gets the current
   * schema version and attempts to run the next one, if it exists.
   */
  async runUpdates() {
    if (game.user.isGM) {
      console.log('Running updates');
      // Retrieve the schema version.
      this.schema = game.settings.get('archmage', 'schemaVersion');
      var runUpdates = true;
      var currentUpdate;

      // Re-run for as many updates there are currently.
      while (runUpdates) {
        // Increase the version to fire updates for the next update.
        this.schema++;
        currentUpdate = `update${this.schema}`;

        // If the method exists, we need to run it.
        if (typeof this[currentUpdate] === 'function') {
          // Run the update and wait for its result.
          // eslint-disable-next-line no-console
          console.log(`Performing archmage update ${currentUpdate}`);
          let result = await this[currentUpdate]();

          // If the result was anything other than false, bump update the schema
          // version setting with the number we just ran the update for.
          if (result !== false) {
            // eslint-disable-next-line no-console
            console.log(`Completed archmage update ${currentUpdate}`);
            // game.settings.set('archmage', 'schemaVersion', this.schema);
          }
          // Otherwise, note the failure and break from the loop.
          else {
            // eslint-disable-next-line no-console
            console.log(`Unable to complete update ${currentUpdate}`);
            runUpdates = false;
          }
        }
        // Otherwise, break from the loop.
        else {
          runUpdates = false;
        }
      }
    }
  }

  /**
   * Update untyped characters.
   * @deprecated
   *
   * In this example, we're looping through untyped characters and compendium
   * entries and making sure they have a type.
   */
  async update1001() {
    // This is just an example of how to update actor data that was resolved
    // in a previous version of the system, so let's exit early.
    return true;

    // var archmageType;
    // // Example array of actors to convert into characters.
    // let namesArray = [
    //   'Dumathoin',
    //   'Hussanma',
    //   'Respen',
    //   'Seidhr',
    //   'Vaghn'
    // ];
    // // Update active entities.
    // for (let a of game.actors) {
    //   if (!a.data.type) {
    //     if (namesArray.includes(a.name)) {
    //       archmageType = 'character';
    //     }
    //     else {
    //       archmageType = 'npc';
    //     }
    //     console.log(`Updating ${a.name} to ${archmageType}`);
    //     await a.update({ "type": archmageType });
    //   }
    //   else {
    //     // Some new schema types aren't automatically converted.
    //     if (a.data.type === 'npc') {
    //       let update = false;
    //       if (!a.data.data.details.resistance || !a.data.data.details.resistance.label) {
    //         await a.update({ 'data.details.resistance.type': 'String' });
    //         await a.update({ 'data.details.resistance.label': 'Resistance' });
    //         update = true;
    //       }

    //       if (!a.data.data.details.vulnerability || !a.data.data.details.vulnerability.label) {
    //         update = true;
    //         await a.update({ 'data.details.vulnerability.type': 'String' });
    //         await a.update({ 'data.details.vulnerability.label': 'Vulnerability' });
    //       }

    //       if (update) {
    //         console.log(`Updating NPC labels for ${a.name}`);
    //       }
    //     }
    //   }
    // }

    // // Update compendium entities.
    // for (let c of game.packs) {
    //   if (c.documentName && c.documentName == 'Actor') {
    //     let entities = await c.getDocuments();
    //     for (let a of entities) {
    //       if (!a.data.type) {
    //         if (namesArray.includes(a.name)) {
    //           archmageType = 'character';
    //         }
    //         else {
    //           archmageType = 'npc';
    //         }
    //         a.data.type = archmageType;

    //         console.log(`Updating [compendium] ${a.name} to ${archmageType}`);
    //         await c.updateEntity(a.data);
    //       }
    //     }
    //   }
    // }
  }

  /**
   * Update items on actors to have missing object keys.
   * @deprecated
   *
   * New keys have been added to actor items as of 1.0.6, so this update hook
   * ensures that all active actors have updated items.
   */
  async update1002() {
    // Define merge options.
    // let insertKeys, insertValues, overwrite, inplace;
    // var mergeOptions = {insertKeys=true, insertValues=false, overwrite=false, inplace=false}={};
    // // Update active entities.
    // for (let a of game.actors) {
    //   if (a.data.type == 'character') {
    //     // Update each item with the new model.
    //     let items = [];
    //     items = duplicate(a.data.items);
    //     for (let i = 0; i < items.length; i++) {
    //       if (items[i].type == 'power') {
    //         // Duplicate the item and update it with the template structure.
    //         let item = items[i].data;
    //         let powerTemplate = duplicate(game.system.template.item.power);
    //         items[i].data = mergeObject(powerTemplate, item, mergeOptions);
    //       }
    //     }
    //     // Update the actor entity.
    //     console.log(`Updated items for ${a.name}`)
    //     await a.update({items: items});
    //   }
    // }
  }

  /* -------------------------------------------*/

  /**
   * Prepare update data for an unlinked token actor.
   *
   * @param {object} token Token document.
   * @returns
   *   Update object compatible with scene.updateEmbeddedDocuments('Token', updateData)
   */
   prepareMigrateTokenData(token) {
    return {
      '_id': token.data._id,
      'actorData': this.prepareMigrateActorData(token.actor)
    }
  }

  /* -------------------------------------------*/

  /**
   * Prepare update data for an actor.
   *
   * @param {object} actor Actor document
   * @returns
   *   Update object compatible with actor.update()
   */
   prepareMigrateActorData(actor) {
    // Initialize with an empty update.
    let updateData = {};

    // Append NPC migration for version 1.19.0.
    if (this.versionBelow('1.19.0')) {
      updateData = this.__migrateNpcInit(actor, updateData);
    }

    // Future updates will go here.

    // Return the final update object.
    return updateData;
  }

  /* -------------------------------------------*/

  /**
   * Update NPC initiative to use value instead of mod.
   *
   * @param {object} actor Actor document to update.
   * @param {object} updateData Update data object to merge changes into.
   * @returns
   *   Update object.
   */
  __migrateNpcInit(actor, updateData={}) {
    const actorData = actor.data.data;
    return mergeObject(updateData, {
      'data.attributes.init.value': Number(actorData.attributes.init.value) + Number(actorData.attributes.level.value),
      'data.attributes.init.-=mod': null
    });
  }

  /* -------------------------------------------*/

  /**
   * Main entrypoint to execute migrations.
   */
  async executeMigration() {
    // Exit early if the version matches.
    // @todo Update this to 1.19.0 to enable migrations.
    if (!this.versionBelow('1.17.0')) {
      return;
    }

    // Set a message.
    const version = game.system.data.version;
    ui.notifications.info(game.i18n.format('ARCHMAGE.MIGRATIONS.start', {version}), {permanent: false});

    if (this.versionBelow('1.19.0')) {
      ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.1_19_0'), {permanent: true});
    }

    // @todo: This will need to be expanded to support other actor types.

    // 1. Update world actors.
    const actors = this.queryActors(actor => actor.type == 'npc');
    console.log('TOOLKIT13: UPDATING ACTORS');
    actors.forEach(async actor => {
      // @todo: Uncomment this to enable migration.
      // await actor.update(this.prepareMigrateActorData(actor));
    });

    // 2. Update unlinked tokens in scenes.
    console.log('TOOLKIT13: UPDATING TOKENS');
    game.scenes.forEach(async scene => {
      const tokens = this.queryTokens(scene, token => token.actor.type == 'npc');
      const updates = [];
      tokens.forEach(token => {
        updates.push(this.prepareMigrateTokenData(token));
      });

      // @todo: Uncomment this to enable migration.
      // await s.updateEmbeddedDocuments('Token', updates);
    });

    // 3. Update world compendiums (Actors, Scenes).
    await this.queryCompendiums();

    // 4. Update the migration version setting.
    //@todo: Uncomment this to enable migration.
    console.log(`TOOLKIT13: UPDATING SYSTEM MIGRATION VERSION TO ${game.system.data.version}`);
    // game.settings.set('archmage', 'systemMigrationVersion', game.system.data.version);
    ui.notifications.info(game.i18n.format('ARCHMAGE.MIGRATIONS.complete', {version}), {permanent: true});
  }

  /* -------------------------------------------*/

  /**
   * Query the world for actors.
   *
   * @param {function} callbackFilter Callback filter to apply, using the same
   *   format as an array filter such as game.actors.filter();
   * @returns
   *   Collection of actors.
   */
  queryActors(callbackFilter = null) {
    return callbackFilter ? game.actors.filter(actor => callbackFilter(actor)) : game.actors;
  }

  /* -------------------------------------------*/

  /**
   * Query a  scene for unlinked tokens.
   *
   * @param {object} scene Scene to query for tokens from.
   * @param {function} callbackFilter Callback filter to apply, using the same
   *   format as an array filter such as scene.tokens.filter();
   * @returns
   *   Collection of tokens for the scene.
   */
  queryTokens(scene, callbackFilter = null) {
    // Filter for tokens that are unlinked only.
    const tokens = scene.tokens.filter(token => {
      if (token.data.actorLink && token.data.actorId && game.actors.has(token.data.actorId)) return false;
      return true;
    })

    return callbackFilter ? tokens.filter(token => callbackFilter(token)) : tokens;
  }

  /* -------------------------------------------*/

  async queryCompendiums() {
    for ( let pack of game.packs ) {
      if ( pack.metadata.package !== "world" ) continue;
      if ( !["Actor", "Item", "Scene"].includes(pack.documentName) ) continue;

      if (pack.documentName == 'Actor') {
        console.log('TOOLKIT13: UPDATING COMPENDIUM ACTORS');
        await this.queryCompendiumActors(pack, actor => actor.type == 'npc');
      }
      else if (pack.documentName == 'Scene') {
        console.log('TOOLKIT13: UPDATING COMPENDIUM TOKENS');
        await this.queryCompendiumScenes(pack, token => token.actor.type == 'npc');
      }
    }
  }

  /* -------------------------------------------*/

  /**
   * Update actors in world compendiums.
   *
   * @param {object} pack Compendium pack to migrate
   * @param {function} callbackFilter Optional callback filter to apply, using
   *   the same format as an array filter such as scene.tokens.filter();
   */
  async queryCompendiumActors(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Retrieve documents.
    // await pack.migrate();
    const documents = await pack.getDocuments();

    // Retrieve actros.
    const actors = callbackFilter ? documents.filter(actor => callbackFilter(actor)) : documents;
    actors.forEach(async actor => {
      // @todo: Uncomment this to enable migration.
      // actor.update(this.prepareMigrateActorData(actor));
    });

    // Lock pack.
    await pack.configure({locked: wasLocked});
  }

  /* -------------------------------------------*/

  /**
   * Update scenes in world compendiums.
   *
   * @param {object} pack Compendium pack to migrate
   * @param {function} callbackFilter Optional callback filter to apply, using
   *   the same format as an array filter such as scene.tokens.filter();
   */
  async queryCompendiumScenes(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Retrieve documents.
    // await pack.migrate();
    const scenes = await pack.getDocuments();

    // Retrieve actros.
    scenes.forEach(async scene => {
      const tokens = this.queryTokens(scene, token => callbackFilter(token));
      const updates = [];
      console.log(tokens);
      tokens.forEach(token => {
        updates.push(this.prepareMigrateTokenData(token));
      });
      // @todo: Uncomment this to enable migration.
      // await s.updateEmbeddedDocuments('Token', updates);
    });

    // Lock pack.
    await pack.configure({locked: wasLocked});
  }

  /* -------------------------------------------*/

  /**
   * Determine if the provided version is newer than the world's version.
   *
   * @param {string} version Version of the system to compare the world's
   *   system version against.
   * @returns
   *   True if the version is greater than the world's current version, false
   *   otherwise.
   */
  versionBelow(version) {
    const worldVersion = game.settings.get('archmage', 'systemMigrationVersion') ?? '1.17.0';
    return isNewerVersion(version, worldVersion);
  }
}

// Instantiate the class and run updates.
new ArchmageUpdateHandler();
