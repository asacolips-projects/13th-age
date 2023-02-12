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
  }

  /**
   * Update items on actors to have missing object keys.
   * @deprecated
   *
   * New keys have been added to actor items as of 1.0.6, so this update hook
   * ensures that all active actors have updated items.
   */
  async update1002() {
    return true;
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
    let actorUpdates = this.prepareMigrateActorData(token.actor);
    if (!token.actorLink && token.actor) {
      let itemUpdates = {};
      for (let item of token.actor.items) {
        let upd = this.prepareMigrateItemData(item);
        if (!foundry.utils.isEmpty(upd)) itemUpdates[item._id] = upd;
      }
      if (!foundry.utils.isEmpty(itemUpdates)) actorUpdates["items"] = itemUpdates;
    }
    return {
      '_id': token._id,
      'actorData': actorUpdates
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

    // Append PC migration for version 1.24.0
    if (this.versionBelow('1.24.0')) {
      updateData = this.__migratePCImprovedInitFlag(actor, updateData);
    }

    // Future updates will go here.

    // Return the final update object.
    return updateData;
  }

  /* -------------------------------------------*/

  /**
   * 1.19.0: Update NPC initiative to use value instead of mod.
   *
   * @param {object} actor Actor document to update.
   * @param {object} updateData Update data object to merge changes into.
   * @returns
   *   Update object.
   */
  __migrateNpcInit(actor, updateData={}) {
    if (!actor || actor.type != "npc") return updateData;
    const actorData = actor.system;
    return mergeObject(updateData, {
      'system.attributes.init.value': Number(actorData.attributes.init.value) + Number(actorData.attributes.level.value),
      'system.attributes.init.-=mod': null
    });
  }

  /* -------------------------------------------*/

  /**
   * 1.24.0: Update PC to drop improvedInitiative flag.
   *
   * @param {object} actor Actor document to update.
   * @param {object} updateData Update data object to merge changes into.
   * @returns
   *   Update object.
   */
  __migratePCImprovedInitFlag(actor, updateData={}) {
    if (!actor || actor.type != "character") return updateData;
    const actorData = actor.system;
    const bonus = actor.getFlag("archmage", "improvedIniative") ? 4 : 0;
    actor.unsetFlag("archmage", "improvedIniative");
    return mergeObject(updateData, {'system.attributes.init.value': Number(actorData.attributes.init.value) + bonus});
  }

  /* -------------------------------------------*/

  /**
   * Prepare update data for an item.
   *
   * @param {object} item Item document
   * @returns
   *   Update object compatible with item.update()
   */
   prepareMigrateItemData(item) {
    // Initialize with an empty update.
    let updateData = {};

    // Append Power for version 1.25.0
    if (this.versionBelow('1.25.0')) {
      updateData = this.__migratePowerCostToResources(item, updateData);
    }

    // Future updates will go here.

    // Return the final update object.
    return updateData;
  }

  /* -------------------------------------------*/

  /**
   * 1.25.0: Update NPC initiative to use value instead of mod.
   *
   * @param {object} actor Actor document to update.
   * @param {object} updateData Update data object to merge changes into.
   * @returns
   *   Update object.
   */
  __migratePowerCostToResources(item, updateData={}) {
    if (!item || item.type != "power" || !item.system.cost) return updateData;
    let val = item.system.cost?.value || "";
    let parsed = /^([\+-]*)([0-9]*)\s*(.+)$/.exec(val);
    if (parsed) {
      val = "";
      if (parsed[2]) {
        // Invert sign
        if (parsed[1] == "-") val += "+"; else val += "-";
        // Keep number and remainder
        val += parsed[2] + " " + parsed[3];
      } else {
        let str = parsed[3] || "";
        switch(str.toLowerCase()) {
          case "gain momentum": val = "+Momentum"; break;
          case "have momentum": val = "Momentum"; break;
          case "spend momentum": val = "-Momentum"; break;
          case "gain focus": val = "+Focus"; break;
          case "focus": val = "-Focus"; break;
          default: val = parsed[3]; break;
        }
      }
    }
    return mergeObject(updateData, {
      'system.resources.value': val,
      'system.-=cost': null
    });
  }

  /* -------------------------------------------*/


  /**
   * Main entrypoint to execute migrations.
   */
  async executeMigration() {
    // Exit early if the version matches.
    // @todo Update this for each new version that requires a migration.
    if (!this.versionBelow('1.25.0')) {
      return;
    }

    // Only run for GMs.
    if (!game.user.isGM) {
      return;
    }

    // Set a message.
    const version = game.system.version;
    ui.notifications.info(game.i18n.format('ARCHMAGE.MIGRATIONS.start', {version}), {permanent: false});

    if (this.versionBelow('1.19.0')) {
      ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.1_19_0'), {permanent: true});
    }

    if (this.versionBelow('1.24.0')) {
      ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.1_24_0'), {permanent: true});
    }

    if (this.versionBelow('1.25.0')) {
      ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.1_25_0'), {permanent: true});
    }

    // 1. Update world actors.
    const actors = Array.from(game.actors.values());
    console.log('TOOLKIT13: UPDATING ACTORS');
    ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.updateActors'));
    if (actors.length > 0) {
      for (let actor of actors) {
        // Attempt actor updates.
        try {
          await actor.update(this.prepareMigrateActorData(actor));
          for (let item of actor.items) {
            await item.update(this.prepareMigrateItemData(item));
          }
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for world actor ${actor.name}: ${error.message}`;
          console.error(error);
        }
      };
    }

    // 2. Update world items.
    const items = Array.from(game.items.values());
    console.log('TOOLKIT13: UPDATING ITEMS');
    ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.updateItems'));
    if (items.length > 0) {
      for (let item of items) {
        // Attempt item updates.
        try {
          await item.update(this.prepareMigrateItemData(item));
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for world item ${item.name}: ${error.message}`;
          console.error(error);
        }
      };
    }

    // 3. Update unlinked tokens in scenes.
    const scenes = game.scenes.contents; // Use .contents so that it's an array instead of a Collection.
    console.log('TOOLKIT13: UPDATING TOKENS');
    ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.updateTokens'));
    if (scenes.length > 0) {
      for (let scene of scenes) {
        const tokens = this.queryTokens(scene);
        const updates = [];
        tokens.forEach(token => {
          updates.push(this.prepareMigrateTokenData(token));
        });

        // Attempt scene updates.
        try {
          await scene.updateEmbeddedDocuments('Token', updates);
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for world scene ${scene.name}: ${error.message}`; //ERROR s is not defined
          console.error(error);
        }
      };
    }

    // 4. Update world compendiums (Actors, Scenes).
    console.log('TOOLKIT13: UPDATING COMPENDIUMS');
    ui.notifications.info(game.i18n.localize('ARCHMAGE.MIGRATIONS.updateCompendiums'));
    await this.migrateCompendiums();

    // 5. Update the migration version setting.
    game.settings.set('archmage', 'systemMigrationVersion', game.system.version);
    // @todo Determine why this fires too early.
    setTimeout(() => {
      console.log(`TOOLKIT13: UPDATING SYSTEM MIGRATION VERSION TO ${game.system.version}`);
      ui.notifications.info(game.i18n.format('ARCHMAGE.MIGRATIONS.complete', {version}), {permanent: true});
    }, 10000);
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
      if (token.isLinked && token.actorId && game.actors.has(token.actorId)) return false;
      return true;
    })

    return callbackFilter && tokens.length > 0 ? tokens.filter(token => callbackFilter(token)) : tokens;
  }

  /* -------------------------------------------*/

  async migrateCompendiums() {
    for ( let pack of game.packs ) {
      if ( pack.metadata.packageType !== "world" ) continue;
      // if ( pack.metadata.packageType !== "system" ) continue; // Auto-update system compendiums
      if ( !["Actor", "Scene", "Item"].includes(pack.documentName) ) continue;

      if (pack.documentName == 'Actor') {
        console.log('TOOLKIT13: UPDATING COMPENDIUM ACTORS');
        await this.migrateCompendiumActors(pack);
      }
      else if (pack.documentName == 'Scene') {
        console.log('TOOLKIT13: UPDATING COMPENDIUM TOKENS');
        await this.migrateCompendiumScenes(pack);
      }
      else if (pack.documentName == 'Item') {
        console.log('TOOLKIT13: UPDATING COMPENDIUM ITEMS');
        await this.migrateCompendiumItems(pack);
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
  async migrateCompendiumActors(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Retrieve documents.
    // await pack.migrate();
    const documents = await pack.getDocuments();
    let progress = 0;
    let count = 0;

    const packLabel = pack?.metadata?.label ?? '';
    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumActors', {pack: packLabel}), pct: 0});

    // Retrieve actors.
    const actors = callbackFilter ? documents.filter(actor => callbackFilter(actor)) : documents;
    const total = actors.length;
    if (total > 0) {
      for (let actor of actors) {
        count++;
        progress = Math.ceil(count / total * 100);
        SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumActors', {pack: packLabel}), pct: progress});
        try {
          await actor.update(this.prepareMigrateActorData(actor));
          for (let item of actor.items) {
            await item.update(this.prepareMigrateItemData(item));
          }
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for actor ${actor.name} in compendium ${packLabel}: ${error.message}`;
          console.error(error);
        }
      };
    }

    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumActors', {pack: packLabel}), pct: 100});

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
  async migrateCompendiumScenes(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Retrieve documents.
    // await pack.migrate();
    const scenes = await pack.getDocuments();
    const total = scenes.length;
    let progress = 0;
    let count = 0;

    const packLabel = pack?.metadata?.label ?? '';
    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumScenes', {pack: packLabel}), pct: 0});

    // Retrieve actros.
    if (total > 0) {
      for (let scene of scenes) {
        count++;
        progress = Math.ceil(count / total * 100);
        SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumScenes', {pack: packLabel}), pct: progress});

        const tokens = this.queryTokens(scene);
        const updates = [];

        tokens.forEach(token => {
          updates.push(this.prepareMigrateTokenData(token));
        });

        try {
          await scene.updateEmbeddedDocuments('Token', updates);
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for scene ${scene.name} in compendium ${packLabel}: ${error.message}`;
          console.error(error);
        }
      };
    }

    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumScenes', {pack: packLabel}), pct: 100});

    // Lock pack.
    await pack.configure({locked: wasLocked});
  }

  /* -------------------------------------------*/

  /**
   * Update items in world compendiums.
   *
   * @param {object} pack Compendium pack to migrate
   * @param {function} callbackFilter Optional callback filter to apply, using
   *   the same format as an array filter such as scene.tokens.filter();
   */
  async migrateCompendiumItems(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Retrieve documents.
    // await pack.migrate();
    const documents = await pack.getDocuments();
    let progress = 0;
    let count = 0;

    const packLabel = pack?.metadata?.label ?? '';
    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumItems', {pack: packLabel}), pct: 0});

    // Retrieve items.
    const items = callbackFilter ? documents.filter(item => callbackFilter(item)) : documents;
    const total = items.length;
    if (total > 0) {
      for (let item of items) {
        count++;
        progress = Math.ceil(count / total * 100);
        SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumItems', {pack: packLabel}), pct: progress});
        try {
          await item.update(this.prepareMigrateItemData(item));
        } catch (error) {
          error.message = `Failed Toolkit13 system migration for actor ${actor.name} in compendium ${packLabel}: ${error.message}`;
          console.error(error);
        }
      };
    }

    SceneNavigation.displayProgressBar({label: game.i18n.format('ARCHMAGE.MIGRATIONS.updateCompendiumItems', {pack: packLabel}), pct: 100});

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
