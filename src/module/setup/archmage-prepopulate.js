/**
 * Class that can be used to query toolkit13.com.
 */
export class ArchmagePrepopulate {

  constructor() {
    // Pass.
  }

  /**
   * Return class machine name.
   *
   * @param {string} className
   *   Class name such as 'Chaos Mage'.
   *
   * @returns {string}
   *   Clean class name, such as 'chaosmage'.
   */
  cleanClassName(className, drop2e=false) {
    if (drop2e) className = className.toLowerCase().replace('-2e','').replace('2e','');
    return className ? className.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
  }

  /**
   * Retrieve compendium powers.
   *
   * @param {array} classes
   *   Array of clean class names, such as ['fighter','barbarian'].
   * @param {string} race
   *   Character race.
   *
   * @returns {object}
   *   Array with keys equal to each class name, with each entry being an object
   *   with the keys 'name' and 'content' for each result.
   */
  async getCompendiums(classes = [], race = '') {
    let validRaces = Object.values(CONFIG.ARCHMAGE.raceList);
    let racePacks = await game.packs.filter(p => p.metadata.name == 'races');
    if (game.settings.get('archmage', 'secondEdition')) {
      let racePacks2e = await game.packs.filter(p => p.metadata.name == 'kin-powers-2e');
      if (racePacks2e.length > 0) racePacks = racePacks2e;
    }
    // Search class packs by class
    let classPacks = {};
    for (const cls of classes) {
      classPacks[cls] = await game.packs.filter(p => cls === this.cleanClassName(p.metadata.name, true) && !p.metadata.name.includes("2e"));
      if (game.settings.get('archmage', 'secondEdition')) {
        // Check if we have a 2e version
        let classPack2e = await game.packs.filter(p => cls === this.cleanClassName(p.metadata.name, true) && p.metadata.name.includes("2e"));
        if (classPack2e.length > 0) classPacks[cls] = classPack2e;
      }
    }
    // Reduce back to flat array of packs
    classPacks = Object.values(classPacks).reduce((a,b) => a.concat(b))
    let content = {};

    // Load racial powers
    if (race != '' && racePacks.length > 0) {
      let race_str = applyKinAliasMap(race);
      for (let i=0; i < validRaces.length; i++) {
        let regexRace = new RegExp("(\\W|^)(" + validRaces[i] + ")(\\W|$)", "i");
        let match = race_str.match(regexRace);
        // Also handle dashes vs. spaces
        if (!match) match = race_str.replace(" ", "-").match(regexRace)
        if (!match) match = race_str.replace("-", " ").match(regexRace)
        if (match) {
          for (let j = 0; j < racePacks.length; j++) {
            let pack = await racePacks[j].getDocuments();
            for (let entry of pack) {
              let sourceName = entry.system?.powerSourceName?.value ?? entry.system.group.value;
              let raceNamesArray = sourceName.split('/');
              if (raceNamesArray.some(n => regexRace.test(n))) {
                let raceName = match[0].toLowerCase().replaceAll(/\(|\)|\//g,"").trim();
                if (raceName in content) {
                  content[raceName].content.push(entry);
                } else {
                  content[raceName] = {
                    name: raceName,
                    content: [entry]
                  };
                }
              }
            }
          }
        }
      }
    }

    // Load class powers
    for (let i = 0; i < classPacks.length; i++) {
      let pack = await classPacks[i].getDocuments();
      let className = this.cleanClassName(classPacks[i].metadata.name, true);
      content[className] = {
        name: CONFIG.ARCHMAGE.classList[className],
        content: pack.concat(content[className]?.content || [])
      };
    }
    // Add animal companion to druid and ranger
    let animalCompanionClasses = ["ranger", "druid"];
    if (game.settings.get('archmage', 'secondEdition')) animalCompanionClasses = ["druid"];
    for (let key of animalCompanionClasses) {
      if (classes.includes(key)) {
        let pack = await game.packs.find(p => p.metadata.label == "Animal Companion").getDocuments();
        content[key].content = pack.concat(content[key].content);
      }
    }

    // Load multiclass powers
    if (classPacks.length > 1) {
      let key = "Multiclass Feats";
      let pack = await game.packs.find(p => p.metadata.label == key).getDocuments();
      let powers = pack.filter(e => {
        let sourceName = e.system?.powerSourceName?.value ?? e.system.group.value;
        return classes.includes(this.cleanClassName(sourceName, true))
      });
      if (powers.length > 0) {content[key] = {name: key, content: powers};}
    }

    // Load general feats
    let key = "General Feats";
    let pack = await game.packs.find(p => p.metadata.label == key).getDocuments();
    if (game.settings.get('archmage', 'secondEdition')) {
      key = "Universal Feats";
      let pack2e = game.packs.find(p => p.metadata.name == "universal-feats-2e");
      if (pack2e) pack = await pack2e.getDocuments();
    }
    content[key] = {name: key, content: pack};

    return content;
  }

  /**
   * Retrieve compendium journal entries.
   *
   * @returns {object}
   *   Array with keys equal to each class name, with each entry being the
   *   pack content.
   */
  async getJournals() {
    let packs = await game.packs.filter(p => CONFIG.ARCHMAGE.classPacks.includes(p.metadata.name) && p.documentName == 'JournalEntry' && !p.metadata.name.includes("2e"));
    let packs2e = [];
    if (game.settings.get('archmage', 'secondEdition')) {
      packs2e = await game.packs.filter(p => CONFIG.ARCHMAGE.classPacks.includes(p.metadata.name) && p.documentName == 'JournalEntry' && p.metadata.name.includes("2e"));
    }
    // Load 2e stuff later so it overrides 1e stuff if present
    packs = packs.concat(packs2e);
    let entries = [];
    for (let i = 0; i < packs.length; i++) {
      let pack = await packs[i].getDocuments();
      entries = entries.concat(pack);
    }
    let content = {};
    for (let i = 0; i < entries.length; i++) {
      content[this.cleanClassName(entries[i].name)] = Array.from(entries[i].pages)[1]?.text?.content;
    }
    return content;
  }

  /**
   * Retrieve sorted powers from pack.
   *
   * @param {array} powersArray
   *   Array of compendium pack content.
   * @param {object} actor
   *   Actor document to evaluate for power filtering.
   *
   * @returns {array}
   *   Nested array of powers sorted by level, type, and name, grouped within
   *   power type. Each power has a simplified data structure compared to its
   *   compendium equivalent.
   */
  async getPowersFromPack(powersArray, actor = null) {
    // Get an array of powers currently on the actor. This is used later to preselect class features.
    let actorPowers = actor?.items ? actor.items.filter(i => i.type == 'power').map(i => i.system.powerOriginName.value) : [];
    // Presort all of the powers by level, type, and name.
    let preSorted = await Promise.all(
      powersArray.sort((a, b) => {
        function sortTest(a, b) {
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        }
        let aSort = [
          a.system.powerType.value,
          a.system.powerLevel.value,
          a.name
        ];
        let bSort = [
          b.system.powerType.value,
          b.system.powerLevel.value,
          b.name
        ];
        return sortTest(aSort[0], bSort[0]) || sortTest(aSort[1], bSort[1]) || sortTest(aSort[2], bSort[2]);
      })
      // Return a simplified data object. The power itself is passed along as
      // plain data, which is what the sheets' power renderer takes.
      .map(async p => {
        return {
          id: p.id,
          power: p.toObject(false),
          powerType: p.system.powerType.value,
          level: p.system.powerLevel.value,
          // selected: p.system.powerType.value === 'feature'
            // && ['class', 'race'].includes(p.system.powerSource.value)
            // && !actorPowers.includes(p.system.powerOriginName.value)
          selected: p.system.powerType.value === 'feature'
            && !p.name.toLocaleLowerCase().startsWith(game.i18n.localize('ARCHMAGE.classFeat').toLocaleLowerCase())
            && actorPowers.length == 0
            && p.system.powerSource.value === 'class'
        };
      })
    );

    // Rearrange the powers into groups by type, then by level within a group.
    const powersByGroup = preSorted.reduce((powerGroup, power) => {
      if (power.powerType) {
        let group = power.powerType ? power.powerType : 'other';
        let level = power.level ?? 1;
        powerGroup[group] ??= {};
        powerGroup[group][level] ??= [];
        powerGroup[group][level].push(power);
      }
      return powerGroup;
    }, {});

    // Sort the powers by group.
    let groupSortingArray = [
      'feature',
      'talent',
      'flexible',
      'power',
      'spell',
      'other'
    ];

    return Object.keys(powersByGroup)
      // Sort them based on the sorting array.
      .sort((a, b) => groupSortingArray.indexOf(a) - groupSortingArray.indexOf(b))
      // Flatten each group's levels into an ordered array, so that the listing
      // doesn't have to walk a sparse object keyed by level.
      .map(type => ({
        type: type,
        levels: Object.keys(powersByGroup[type])
          .sort((a, b) => Number(a) - Number(b))
          .map(level => ({level: Number(level), powers: powersByGroup[type][level]}))
      }));
  }

  /**
   * Gather everything the power importer needs to display.
   *
   * @param {array} classes
   *   Array of classes to gather powers for, e.g. ['bard'].
   * @param {string} race
   *   Character race.
   * @param {object|null} actor
   *   Actor the powers would be imported onto, used to preselect class features.
   *
   * @returns {object}
   *   Object with a `tabs` array (one per class, each with its journal content
   *   and its grouped powers) and a flat `powers` array of the compendium
   *   documents the selection is resolved against.
   */
  async getImportData(classes = [], race = '', actor = null) {
    const validClasses = Object.keys(CONFIG.ARCHMAGE.classList);
    const compendiumClasses = classes.filter(a => validClasses.includes(a));
    const classCompendiums = await this.getCompendiums(compendiumClasses, race);
    const classJournals = await this.getJournals();

    const tabs = [];
    for (let [classKey, classObject] of Object.entries(classCompendiums)) {
      classKey = this.cleanClassName(classKey);
      tabs.push({
        key: classKey,
        label: classObject.name,
        classContent: classJournals[classKey] ?? '',
        powerGroups: await this.getPowersFromPack(classObject.content, actor),
        active: false,
        opened: false
      });
    }

    // Prefer opening on a real class rather than a grab-bag tab such as the
    // general feats.
    const defaultTab = tabs[1] && !validClasses.includes(tabs[0].key)
      ? tabs[1].key
      : tabs[0]?.key;
    // Marked here rather than left to the tab nav, which isn't rendered at all
    // when there's only one class to show.
    const initial = tabs.find(tab => tab.key === defaultTab);
    if (initial) initial.active = true;

    const powers = Object.values(classCompendiums).reduce((accumulator, current) => {
      return accumulator.concat(current.content);
    }, []);

    return {tabs, defaultTab, powers};
  }
}

function applyKinAliasMap (kin) {
  const kinAliasMap = {
    'high elf': /(light elf|bright elf)/i,
    'wood elf': /(gr[ae]y elf|wild elf|green elf)/i,
    'silver elf': /(drow|silver ?folk|dark elf)/i,
    'troll-kin': /(druid('s )?folk|wood troll|half-orc|trollkin)/i,
    'dragonic': /dragon(born|spawn)/i,
    'forgeborn': /dwarf-forged/i,
    'tiefling': /demon-?touched/i,
    'holy one': /aasimar/i,
  }

  for (const [alias, regex] of Object.entries(kinAliasMap)) {
    if (kin.match(regex)) {
      return alias;
    }
  }
  return kin;
}
