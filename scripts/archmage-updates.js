Hooks.once("ready", () => {
  async function archCharUpdate() {
    var archmageType;
    let namesArray = [
      'Dumathoin',
      'Hussanma',
      'Respen',
      'Seidhr',
      'Vaghn'
    ];
    // Update active entities.
    for (let a of game.actors.entities) {
      if (!a.data.type) {
        if (namesArray.includes(a.name)) {
          archmageType = 'character';
        }
        else {
          archmageType = 'npc';
        }
        console.log(`Updating ${a.name} to ${archmageType}`);
        await a.update({"type": archmageType});
      }
      else {
        // Some new schema types aren't automatically converted.
        if (a.data.type === 'npc') {
          let update = false;
          if (!a.data.data.details.resistance || !a.data.data.details.resistance.label) {
            await a.update({'data.details.resistance.type': 'String'});
            await a.update({'data.details.resistance.label': 'Resistance'});
            update = true;
          }

          if (!a.data.data.details.vulnerability || !a.data.data.details.vulnerability.label) {
            update = true;
            await a.update({'data.details.vulnerability.type': 'String'});
            await a.update({'data.details.vulnerability.label': 'Vulnerability'});
          }

          if (update) {
            console.log(`Updating NPC labels for ${a.name}`);
          }
        }
      }
    }

    // Update compendium entities.
    for (let c of game.packs) {
      if (c.metadata.entity && c.metadata.entity == 'Actor') {
        let entities = await c.getContent();
        for (let a of entities) {
          if (!a.data.type) {
            if (namesArray.includes(a.name)) {
              archmageType = 'character';
            }
            else {
              archmageType = 'npc';
            }
            a.data.type = archmageType;

            console.log(`Updating [compendium] ${a.name} to ${archmageType}`);
            await c.updateEntity(a.data);
          }
        }
      }
    }
  }

  // Uncomment this to update all characters.
  // archCharUpdate();
});