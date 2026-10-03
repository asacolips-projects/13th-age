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
   * Every compendium the importer can offer: this system's item compendiums
   * that hold at least one power.
   *
   * @param {Set<string>} defaults
   *   Collection IDs of the compendiums selected by default, which are listed
   *   even if the user couldn't otherwise see them, as they always have been.
   *
   * @returns {array}
   *   Compendium collections.
   */
  getPowerPacks(defaults = new Set()) {
    return game.packs.filter(p => p.documentName === 'Item'
      && (!p.metadata.system || p.metadata.system === game.system.id)
      && (p.visible || defaults.has(p.collection))
      && p.index.some(e => e.type === 'power'));
  }

  /**
   * The compendiums a character's powers come from by default.
   *
   * @param {array} classes
   *   Array of clean class names, such as ['fighter','barbarian'].
   * @param {string} race
   *   Character race.
   *
   * @returns {Set<string>}
   *   Collection IDs of the compendiums.
   */
  getDefaultPacks(classes = [], race = '') {
    const secondEdition = game.settings.get('archmage', 'secondEdition');
    // The 2e version of a compendium, when there is one, replaces the 1e one.
    const preferred = (packs1e, packs2e) => secondEdition && packs2e.length ? packs2e : packs1e;
    const ids = new Set();
    const add = packs => packs.forEach(p => ids.add(p.collection));

    // Kin powers.
    if (race != '') {
      add(preferred(
        game.packs.filter(p => p.metadata.name == 'races'),
        game.packs.filter(p => p.metadata.name == 'kin-powers-2e')
      ));
    }

    // Class powers.
    let classPackCount = 0;
    for (const cls of classes) {
      const packs = preferred(
        game.packs.filter(p => cls === this.cleanClassName(p.metadata.name, true) && !p.metadata.name.includes("2e")),
        game.packs.filter(p => cls === this.cleanClassName(p.metadata.name, true) && p.metadata.name.includes("2e"))
      );
      classPackCount += packs.length;
      add(packs);
    }

    // Animal companion, for the classes that have one.
    if (classes.some(cls => this.animalCompanionClasses().includes(cls))) {
      add(game.packs.filter(p => p.metadata.label == "Animal Companion"));
    }

    // Multiclass feats.
    if (classPackCount > 1) {
      add(game.packs.filter(p => p.metadata.label == "Multiclass Feats"));
    }

    // General feats.
    add(preferred(
      game.packs.filter(p => p.metadata.label == "General Feats"),
      game.packs.filter(p => p.metadata.name == "universal-feats-2e")
    ));

    return ids;
  }

  /**
   * Classes whose tab the animal companion's powers are listed on.
   *
   * @returns {array}
   */
  animalCompanionClasses() {
    return game.settings.get('archmage', 'secondEdition') ? ['druid'] : ['ranger', 'druid'];
  }

  /**
   * The race tabs a character's race calls for.
   *
   * @param {string} race
   *   Character race.
   *
   * @returns {array}
   *   Objects with the tab's `key` and `label`, and the `regex` that a kin
   *   power's source has to match to be listed on it.
   */
  getRaceTabs(race = '') {
    if (race == '') return [];
    const race_str = applyKinAliasMap(race);
    const tabs = new Map();
    for (const validRace of Object.values(CONFIG.ARCHMAGE.raceList)) {
      const regexRace = new RegExp("(\\W|^)(" + validRace + ")(\\W|$)", "i");
      let match = race_str.match(regexRace);
      // Also handle dashes vs. spaces
      if (!match) match = race_str.replace(" ", "-").match(regexRace);
      if (!match) match = race_str.replace("-", " ").match(regexRace);
      if (!match) continue;
      const raceName = match[0].toLowerCase().replaceAll(/\(|\)|\//g,"").trim();
      const key = this.cleanClassName(raceName);
      if (!tabs.has(key)) tabs.set(key, {key: key, label: raceName, regex: regexRace});
    }
    return [...tabs.values()];
  }

  /**
   * The keys of the tabs a power from a default compendium is listed on.
   *
   * Kin powers and multiclass feats only go where the character's race and
   * classes call for them, and are otherwise left out.
   *
   * @param {CompendiumCollection} pack
   *   Compendium the power comes from.
   * @param {Item} doc
   *   The power.
   * @param {object} source
   *   The import's `classes`, `raceTabs` and `featsKey`.
   *
   * @returns {array}
   *   Tab keys, which may be empty.
   */
  routePower(pack, doc, source) {
    const {name, label} = pack.metadata;
    const sourceName = doc.system?.powerSourceName?.value ?? doc.system?.group?.value ?? '';

    if (['races', 'kin-powers-2e'].includes(name)) {
      const raceNames = sourceName.split('/');
      return source.raceTabs.filter(tab => raceNames.some(n => tab.regex.test(n))).map(tab => tab.key);
    }
    if (label == "Multiclass Feats") {
      return source.classes.includes(this.cleanClassName(sourceName, true)) ? [MULTICLASS_KEY] : [];
    }
    if (label == "General Feats" || name == "universal-feats-2e") {
      return [source.featsKey];
    }
    if (label == "Animal Companion") {
      return this.animalCompanionClasses().filter(cls => source.classes.includes(cls));
    }
    const className = this.cleanClassName(name, true);
    return source.classes.includes(className) ? [className] : [];
  }

  /**
   * The powers in a compendium, loaded once per import.
   *
   * @param {CompendiumCollection} pack
   * @param {Map<string, Item[]>} cache
   *
   * @returns {Promise<Item[]>}
   */
  async getPackPowers(pack, cache) {
    if (!cache.has(pack.collection)) {
      cache.set(pack.collection, await pack.getDocuments({type: 'power'}));
    }
    return cache.get(pack.collection);
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
   * @param {boolean} preselectFeatures
   *   Whether class features start out ticked, as they do for the
   *   character's own classes.
   *
   * @returns {array}
   *   Power types, each with its levels, each with its custom groups, each
   *   with its rows sorted by name. Each row has a simplified data structure
   *   compared to its compendium equivalent, and its children's rows.
   */
  async getPowersFromPack(powersArray, actor = null, docs = new Map(), preselectFeatures = true) {
    // Get an array of powers currently on the actor. This is used later to preselect class features.
    let actorPowers = actor?.items ? actor.items.filter(i => i.type == 'power').map(i => i.system.powerOriginName.value) : [];
    const classFeat = game.i18n.localize('ARCHMAGE.classFeat').toLocaleLowerCase();
    const preselect = p => preselectFeatures
      && p.system.powerType?.value === 'feature'
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
    const actorLevel = Number(actor?.system?.attributes?.level?.value);
    const withinLevel = doc => {
      const level = Number(doc.system.powerLevel?.value);
      return !level || !Number.isFinite(actorLevel) || level <= Math.max(actorLevel, level);
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
   *   Object with a `packs` array (every compendium that can be imported from,
   *   and whether it's enabled), a `tabs` array (one per class, each with its
   *   journal content and its powers, in sections), a `docs` map of the
   *   compendium documents the selection is resolved against, by UUID, and
   *   what's needed to rebuild the tabs when a compendium is toggled.
   */
  async getImportData(classes = [], race = '', actor = null) {
    const validClasses = Object.keys(CONFIG.ARCHMAGE.classList);
    const compendiumClasses = classes.filter(a => validClasses.includes(a));
    const defaults = this.getDefaultPacks(compendiumClasses, race);
    const secondEdition = game.settings.get('archmage', 'secondEdition');
    const featsLabel = secondEdition && game.packs.some(p => p.metadata.name == "universal-feats-2e")
      ? "Universal Feats"
      : "General Feats";

    const importData = {
      packs: this.getPowerPacks(defaults)
        .map(p => ({
          id: p.collection,
          label: p.title,
          packageLabel: packageLabel(p),
          // One the character's own tabs are made from.
          isDefault: defaults.has(p.collection),
          // For a default compendium, whether it's listed on the character's
          // own tabs.
          listed: defaults.has(p.collection),
          // Whether it's listed on the "other" tab, or for a default
          // compendium, what the character's own tabs leave out of it.
          enabled: false,
          // The rest is worked out when the tabs are built: which of the
          // character's tabs it has powers for, whether it has any powers
          // they leave out, and whether it's the only default compendium for
          // its tabs, which is then always listed.
          ownTabs: [],
          hasRest: !defaults.has(p.collection),
          locked: false
        })),
      tabs: [],
      docs: new Map(),
      source: {
        actor: actor,
        classes: compendiumClasses,
        raceTabs: this.getRaceTabs(race),
        featsKey: this.cleanClassName(featsLabel),
        featsLabel: featsLabel,
        journals: await this.getJournals(),
        packCache: new Map()
      }
    };
    await this.buildTabs(importData);

    // Prefer opening on a real class rather than a grab-bag tab such as the
    // general feats, and never on the "other" tab unless there's nothing else.
    const tabs = importData.tabs;
    const own = tabs.filter(tab => tab.key !== OTHER_KEY);
    importData.defaultTab = own[1] && !validClasses.includes(own[0].key)
      ? own[1].key
      : (own[0] ?? tabs[0])?.key;
    // Marked here rather than left to the tab nav, which isn't rendered at all
    // when there's only one class to show.
    const initial = tabs.find(tab => tab.key === importData.defaultTab);
    if (initial) initial.active = true;

    return importData;
  }

  /**
   * List one of the import's compendiums or stop listing it, and rebuild the
   * tabs.
   *
   * @param {object} importData
   *   As returned by getImportData().
   * @param {string} id
   *   Collection ID of the compendium.
   * @param {string} option
   *   'listed' for a default compendium's place on the character's own tabs,
   *   'enabled' for its place on the "other" tab.
   * @param {boolean} value
   */
  async setPackOption(importData, id, option, value) {
    const pack = importData.packs.find(p => p.id === id);
    if (!pack || !['listed', 'enabled'].includes(option)) return;
    if (option === 'listed' && (!pack.isDefault || pack.locked)) return;
    pack[option] = value;
    await this.buildTabs(importData);
  }

  /**
   * (Re)build the import's tabs from its enabled compendiums.
   *
   * Listed default compendiums are spread over the character's tabs.
   * Enabled ones go on the "other" tab, minus anything that belongs on the
   * character's tabs. A default compendium that's the only one for each of
   * its tabs is locked, since unlisting it would just empty them.
   *
   * Each tab is made of sections: one for a class' own tab, one per
   * compendium on the "other" tab. A section whose powers haven't changed
   * since the last build is kept as it was. The "other" tab is always there,
   * as it's where compendiums are chosen.
   *
   * @param {object} importData
   *   As returned by getImportData().
   */
  async buildTabs(importData) {
    const source = importData.source;
    const previous = new Map(importData.tabs.flatMap(tab => tab.sections).map(section => [section.key, section]));

    // Which powers go on which tab, and for the "other" tab, by compendium.
    const routed = new Map();
    const add = (tabKey, pack, doc) => {
      const sectionKey = tabKey === OTHER_KEY ? `${OTHER_KEY}/${pack.collection}` : tabKey;
      if (!routed.has(tabKey)) routed.set(tabKey, new Map());
      const sections = routed.get(tabKey);
      if (!sections.has(sectionKey)) sections.set(sectionKey, {label: tabKey === OTHER_KEY ? pack.title : '', docs: []});
      sections.get(sectionKey).docs.push(doc);
    };
    // The default compendiums each of the character's tabs could draw on,
    // listed or not.
    const tabSources = new Map();
    for (const packData of importData.packs) {
      const {id, isDefault, listed, enabled} = packData;
      if (!isDefault && !enabled) continue;
      const pack = game.packs.get(id);
      if (!pack) continue;
      const ownTabs = new Set();
      let rest = 0;
      for (const doc of await this.getPackPowers(pack, source.packCache)) {
        const tabKeys = isDefault ? this.routePower(pack, doc, source) : [];
        for (const tabKey of tabKeys) {
          ownTabs.add(tabKey);
          if (listed) add(tabKey, pack, doc);
        }
        if (!tabKeys.length) {
          rest++;
          if (enabled) add(OTHER_KEY, pack, doc);
        }
      }
      if (!isDefault) continue;
      packData.ownTabs = [...ownTabs];
      packData.hasRest = rest > 0;
      for (const tabKey of ownTabs) {
        if (!tabSources.has(tabKey)) tabSources.set(tabKey, new Set());
        tabSources.get(tabKey).add(id);
      }
    }
    for (const packData of importData.packs) {
      packData.locked = packData.ownTabs.length > 0
        && packData.ownTabs.every(tabKey => tabSources.get(tabKey).size === 1);
    }

    // Tabs in a fixed order: race, classes, multiclass feats, general feats
    // and anything else.
    const tabInfo = [
      ...source.raceTabs.map(({key, label}) => ({key, label})),
      ...source.classes.map(key => ({key, label: CONFIG.ARCHMAGE.classList[key]})),
      {key: MULTICLASS_KEY, label: "Multiclass Feats"},
      {key: source.featsKey, label: source.featsLabel},
      {key: OTHER_KEY, label: game.i18n.localize('ARCHMAGE.PREPOPULATE.other')}
    ];
    const tabs = [];
    for (const {key, label} of tabInfo) {
      if ((!routed.has(key) && key !== OTHER_KEY) || tabs.some(tab => tab.key === key)) continue;
      const sections = [];
      for (const [sectionKey, {label: sectionLabel, docs}] of routed.get(key) ?? []) {
        const signature = docs.map(doc => doc.uuid).sort().join();
        const old = previous.get(sectionKey);
        if (old?.signature === signature) {
          sections.push(old);
          continue;
        }
        sections.push({
          key: sectionKey,
          label: sectionLabel,
          signature: signature,
          powerGroups: await this.getPowersFromPack([...docs], source.actor, importData.docs, key !== OTHER_KEY)
        });
      }
      sections.sort((a, b) => a.label.localeCompare(b.label));
      tabs.push({
        key: key,
        label: label,
        classContent: source.journals[key] ?? '',
        sections: sections,
        active: false,
        opened: false
      });
    }
    importData.tabs = tabs;
  }
}

/**
 * Tab keys that aren't a race or a class.
 */
const MULTICLASS_KEY = 'multiclassfeats';
const OTHER_KEY = 'other';

/**
 * The name of the system, module or world a compendium comes from.
 */
function packageLabel(pack) {
  const {packageType, packageName} = pack.metadata;
  if (packageType === 'system') return game.i18n.localize('ARCHMAGE.PREPOPULATE.systemPacks');
  if (packageType === 'module') return game.modules.get(packageName)?.title ?? packageName;
  return game.world.title;
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
