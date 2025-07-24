/**
 * Adapted from the PF2e system: https://github.com/foundryvtt/pf2e/blob/master/src/scripts/register-module-art.ts
 *
 * The PF2e version above is licensed under the Apache 2.0 license: https://www.apache.org/licenses/LICENSE-2.0
 * This version is licensed under the MIT license, per the rest of this repository.
 */

/**
 * Pull actor and token art from module.json files, which will replace default images on compendium actors and their
 * prototype tokens
 */
async function registerModuleArt() {
  // First, clear out the existing map entries and get the active module list.
  game.archmage.system.moduleArt.map.clear();
  const activeModules = [
    ['archmage', game.system],
    ...[...game.modules.entries()].filter(([_key, m]) => m.active)
  ];

  // Iterate over each module and check to see if there's a map.
  for (const [moduleKey, foundryModule] of activeModules) {
    // If the pf2e token pack isn't enabled, skip the system map.
    if (['archmage', '13th-age-core-2e-gamma', '13th-age-core-2e'].includes(moduleKey) && !game.modules.get('pf2e-tokens-bestiaries')?.active) {
      continue;
    }
    // We can skip the pf2e-tokens-bestiaries map since we've provided our own in the
    // system itself.
    if (moduleKey == 'pf2e-tokens-bestiaries') {
      continue;
    }
    // Otherwise, load this module's art map.
    const moduleArt = await getArtMap(foundryModule.flags?.[moduleKey]?.["archmage-art"]);
    if (!moduleArt) continue;

    // We found an art map, so iterate over the packs and entries in that map.
    for (const [packName, art] of Object.entries(moduleArt)) {
      // Handle packnames keyed by module as well as system packs.
      const fullPackName = packName.includes('.') ? packName : `archmage.${packName}`;
      // Load the compendium pack.
      const pack = game.packs.get(fullPackName);
      if (!pack) {
        console.warn(
          `13th Age System | Failed pack lookup from module art registration (${moduleKey}): ${fullPackName}`
        );
        continue;
      }

      // Use the pack index to iterate through each actor..
      const index = pack.indexed ? pack.index : await pack.getIndex();
      for (const [actorId, paths] of Object.entries(art)) {
        // Retrieve the actor.
        const record = index.get(actorId);
        if (!record) continue;

        // Set the index image to the map image for this actor.
        record.img = paths.actor;
        // Update the map to reference the art object.
        game.archmage.system.moduleArt.map.set(`Compendium.${fullPackName}.${actorId}`, paths);
      }
    }
  }
}

/**
 * Get the art entry for usage in the system's art map.
 *
 * @param {object|string|null} art Art object used for the map entry.
 *   If supplied as a string, assume it's a JSON file andtry to load it via fetch().
 *
 * @returns {object|null} Art object, or null.
 */
async function getArtMap(art) {
  // Exit early if null.
  if (!art) {
    return null;
  }
  // Return the object directly if it's a valid art map.
  else if (isModuleArt(art)) {
    return art;
  }
  // Instead of being in a module.json file, the art map is in a separate JSON file referenced by path.
  else if (typeof art === "string") {
    // Try to load the map via fetch().
    try {
      const response = await fetch(art);
      if (!response.ok) {
        console.warn(`13th Age System | Failed loading art mapping file at ${art}`);
        return null;
      }
      const map = await response.json();
      return isModuleArt(map) ? map : null;
    }
    // Otherwise, output our error.
    catch (error) {
      if (error instanceof Error) {
        console.warn(`13th Age System | ${error.message}`);
      }
    }
  }

  return null;
}

/**
 * Determine if a given object matches the expected art structure.
 *
 * @param {object} record Object to test and determine whether it's a
 *   valid art object or not.
 * @returns {boolean}
 */
function isModuleArt(record) {
  return (
    // If this is an object...
    isObject(record) &&
    // Iterate over the array and test each entry. We then repeat this general
    // structure for each layer of the object props, and our final test is whether
    // the art object has an `actor` string, a `token` string, and either no scale,
    // or a scale that's numeric.
    Object.values(record).every(
      (packToArt) =>
        isObject(packToArt) &&
        Object.values(packToArt).every(
          (art) =>
            isObject(art) &&
            typeof art.actor === "string" &&
            (typeof art.token === "string" ||
              (isObject(art.token) &&
                typeof art.token.img === "string" &&
                (art.token.scale === undefined || typeof art.token.scale === "number")
              )
            ) // typeof art.token === "string"
        ) // Object.values(packToArt).every
    ) // Object.values(record).every
  );
}

/**
 * Helper function to determine if the supplied variable is an object.
 *
 * @param {mixed} obj Object to test.
 * @returns {boolean}
 */
function isObject(obj) {
  return typeof obj == 'object' && !Array.isArray(obj);
}

export { registerModuleArt };
