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
      const page = Array.from(entries[i].pages)[1];
      if (!page?.text?.content) continue;
      // Journal text is stored raw, so its @UUID links and other enrichers have
      // to be resolved here: the importer drops this straight into the DOM.
      content[this.cleanClassName(entries[i].name)] = await foundry.applications.ux.TextEditor.implementation.enrichHTML(page.text.content, {
        secrets: false,
        relativeTo: page
      });
    }
    return content;
  }

  /**
   * Retrieve sorted powers from pack.
   *
   * Powers another power in the same list grants (`system.children`) are
   * listed under that power rather than on their own. Anything that would
   * leave a power out of the listing altogether, such as two powers granting
   * each other, puts it back at the top.
   *
   * @param {array} powersArray
   *   Array of compendium pack content.
   * @param {object} actor
   *   Actor document to evaluate for power filtering.
   * @param {Map<string, Item>} docs
   *   Filled with every document listed, by UUID, including children from
   *   other packs, so that the selection can be resolved against it.
   *
   * @returns {array}
   *   Power types, each with its levels, each with its custom groups, each
   *   with its rows sorted by name. Each row has a simplified data structure
   *   compared to its compendium equivalent, and its children's rows.
   */
  async getPowersFromPack(powersArray, actor = null, docs = new Map()) {
    // Get an array of powers currently on the actor. This is used later to preselect class features.
    let actorPowers = actor?.items ? actor.items.filter(i => i.type == 'power').map(i => i.system.powerOriginName.value) : [];
    const classFeat = game.i18n.localize('ARCHMAGE.classFeat').toLocaleLowerCase();
    const preselect = p => p.system.powerType?.value === 'feature'
      && !p.name.toLocaleLowerCase().startsWith(classFeat)
      && actorPowers.length == 0
      && p.system.powerSource?.value === 'class';

    // Presort all of the powers by level, type, and name.
    const sortTest = (a, b) => a < b ? -1 : (a > b ? 1 : 0);
    const sorted = powersArray.sort((a, b) => {
      return sortTest(a.system.powerType.value, b.system.powerType.value)
        || sortTest(a.system.powerLevel.value, b.system.powerLevel.value)
        || sortTest(a.name, b.name);
    });
    for (const p of sorted) docs.set(p.uuid, p);

    // Children, as listed on each power, resolved once each.
    const childrenOf = new Map();
    const resolve = async (doc) => {
      if (childrenOf.has(doc.uuid)) return childrenOf.get(doc.uuid);
      const children = [];
      childrenOf.set(doc.uuid, children);
      for (const uuid of doc.system.children ?? []) {
        const child = docs.get(uuid) ?? await fromUuid(uuid);
        if (!(child instanceof Item)) continue;
        docs.set(child.uuid, child);
        children.push(child);
        await resolve(child);
      }
      return children;
    };
    for (const p of sorted) await resolve(p);

    // A power is listed at the top unless one of the other powers here grants
    // it. Then any power still out of reach of the top ones is put back.
    const listed = new Set(sorted.map(p => p.uuid));
    const granted = new Set(sorted.flatMap(p => childrenOf.get(p.uuid)).map(c => c.uuid).filter(u => listed.has(u)));
    const roots = sorted.filter(p => !granted.has(p.uuid));
    const reachable = new Set();
    const reach = (doc) => {
      if (reachable.has(doc.uuid)) return;
      reachable.add(doc.uuid);
      childrenOf.get(doc.uuid)?.forEach(reach);
    };
    roots.forEach(reach);
    for (const p of sorted) {
      if (reachable.has(p.uuid)) continue;
      roots.push(p);
      reach(p);
    }

    // Return a simplified data object. The power itself is passed along as
    // plain data, which is what the sheets' power renderer takes. A row's key
    // is the path of UUIDs from the top, since a power granted by two others
    // is listed under each.
    //
    // Children follow their parent's tick, but only up to the actor's level:
    // a power that grants its higher level versions shouldn't bring them all
    // along at once. Children without a level always follow.
    const actorLevel = Number(actor?.system?.attributes?.level?.value);
    const withinLevel = doc => {
      const level = Number(doc.system.powerLevel?.value);
      return !level || !Number.isFinite(actorLevel) || level <= actorLevel;
    };
    const toRow = (doc, parentKey = null, parentSelected = false, lineage = []) => {
      const key = parentKey ? `${parentKey}>${doc.uuid}` : doc.uuid;
      const inLevel = withinLevel(doc);
      const selected = parentKey ? parentSelected && inLevel : preselect(doc);
      return {
        key: key,
        uuid: doc.uuid,
        power: doc.toObject(false),
        powerType: doc.system.powerType?.value,
        level: doc.system.powerLevel?.value,
        group: doc.system.group?.value ?? '',
        // Whether ticking the parent ticks this too.
        withinLevel: inLevel,
        selected: selected,
        children: (childrenOf.get(doc.uuid) ?? [])
          .filter(child => child.uuid !== doc.uuid && !lineage.includes(child.uuid))
          .map(child => toRow(child, key, selected, [...lineage, doc.uuid]))
      };
    };
    const rows = roots.map(p => toRow(p));

    // Rearrange the powers into groups by type, then by level within a type,
    // then by custom group within a level.
    const powersByGroup = rows.reduce((powerGroup, power) => {
      if (power.powerType) {
        let group = power.powerType ? power.powerType : 'other';
        let level = power.level ?? 1;
        powerGroup[group] ??= {};
        powerGroup[group][level] ??= {};
        powerGroup[group][level][power.group] ??= [];
        powerGroup[group][level][power.group].push(power);
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
      // Flatten each group's levels and custom groups into ordered arrays, so
      // that the listing doesn't have to walk sparse objects. Powers without a
      // custom group come first.
      .map(type => ({
        type: type,
        levels: Object.keys(powersByGroup[type])
          .sort((a, b) => Number(a) - Number(b))
          .map(level => ({
            level: Number(level),
            groups: Object.keys(powersByGroup[type][level])
              .sort((a, b) => a === '' ? -1 : (b === '' ? 1 : a.localeCompare(b)))
              .map(name => ({name: name, powers: powersByGroup[type][level][name]}))
          }))
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
   *   and its grouped powers) and a `docs` map of the compendium documents
   *   the selection is resolved against, by UUID.
   */
  async getImportData(classes = [], race = '', actor = null) {
    const validClasses = Object.keys(CONFIG.ARCHMAGE.classList);
    const compendiumClasses = classes.filter(a => validClasses.includes(a));
    const classCompendiums = await this.getCompendiums(compendiumClasses, race);
    const classJournals = await this.getJournals();

    const tabs = [];
    const docs = new Map();
    for (let [classKey, classObject] of Object.entries(classCompendiums)) {
      classKey = this.cleanClassName(classKey);
      tabs.push({
        key: classKey,
        label: classObject.name,
        classContent: classJournals[classKey] ?? '',
        powerGroups: await this.getPowersFromPack(classObject.content, actor, docs),
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

    return {tabs, defaultTab, docs};
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
