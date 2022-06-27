class ArchmageUpdateHandler {
  // Call hooks in the constructor.
  constructor() {
    Hooks.once('init', this.init.bind(this));
    Hooks.once('ready', this.runUpdates.bind(this));
  }

  // Register a hidden setting that we can use to track the version. In this
  // case, the version starts at 1000 and increases by 1 on each update. The
  // first number of the version should match the current major version of the
  // system/module to make it more clear which version the update is for.
  init() {
    game.settings.register('archmage', 'schemaVersion', {
      name: 'Current schema version for system updates.',
      hint: 'This schema version is separate from the system version and can be used to run sequential updates.',
      scope: 'world',
      config: false,
      default: 1000,
      type: Number,
    });
  }

  /**
   * Update runner.
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

  // @todo: finish refactoring this.
  async update1003() {
    // Query for actor NPCs.
    const actors = this.queryActors(a => a.type == 'npc');
    console.log(actors);

    // Iterate through scenes, querying unlinked NPC tokens for each.
    game.scenes.forEach(async s => {
      const tokens = this.queryTokens(s, t => t.actor.type == 'npc');
      console.log(tokens);

      const updates = [];
      tokens.forEach(token => {
        const update = {
          '_id': token.data._id,
          'actorData': this.migrateActor(token.actor)
        };
        updates.push(update);
      });

      // @todo: Uncomment this to enable migration.
      // await s.updateEmbeddedDocuments('Token', updates);
      console.log(updates);
    });

    this.queryCompendiums();
  }

  /**
   * Query the world for actors.
   *
   * @param {function} callbackFilter Callback filter to apply, using the same
   *   format as an array filter such as game.actors.filter();
   * @returns
   *   Collection of actors.
   */
  async queryActors(callbackFilter = null) {
    return callbackFilter ? game.actors.filter(a => callbackFilter(a)) : game.actors;
  }

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
    const tokens = scene.tokens.filter(t => {
      if (t.data.actorLink && t.data.actorId && game.actors.has(t.data.actorId)) return false;
      return true;
    })

    return callbackFilter ? tokens.filter(t => callbackFilter(t)) : tokens;
  }

  queryCompendiums() {
    for ( let p of game.packs ) {
      if ( p.metadata.package !== "world" ) continue;
      if ( !["Actor", "Item", "Scene"].includes(p.documentName) ) continue;

      if (p.documentName == 'Actor') {
        this.queryCompendiumActors(p, a => a.type == 'npc');
      }
      else if (p.documentName == 'Scene') {
        this.queryCompendiumScenes(p, t => t.data.type == 'npc');
      }
    }
  }

  async queryCompendiumActors(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    console.log('World foobar');

    // Retrieve documents.
    // await pack.migrate();
    const documents = await pack.getDocuments();

    // Retrieve actros.
    const actors = callbackFilter ? documents.filter(a => callbackFilter(a)) : documents;

    console.log(actors);

    // Lock pack.
    await pack.configure({locked: wasLocked});
  }

  async queryCompendiumScenes(pack, callbackFilter = null) {
    // Unlock pack.
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    console.log('Scene foobar');

    // Retrieve documents.
    // await pack.migrate();
    const documents = await pack.getDocuments();

    // Retrieve actros.
    documents.forEach(async s => {
      const tokens = this.queryTokens(s, t => t.actor.type == 'npc');
      console.log(tokens);
      const updates = [];
      tokens.forEach(token => {
        updates.push({
          '_id': token.data._id,
          actorData: this.migrateActor(token.actor)
        });
      });
      // @todo Uncomment to enable migrations
      // await s.updateEmbeddedDocuments('Token', updates);
      console.log(updates);
    });

    // Lock pack.
    await pack.configure({locked: wasLocked});
  }

  migrateActor(actor) {
    const actorData = actor.data.data;
    const updateData = {
      'data.attributes.init.value': Number(actorData.attributes.init.value) + Number(actorData.attributes.level.value),
      // 'data.attributes.init.-=mod': null
    };
    return updateData;
  }

  migrateToken(token) {
    const update = this.migrateActor(token.actor);
    console.log(update);
  }
}

// Instantiate the class and run updates.
new ArchmageUpdateHandler();
