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
      let raceAr = [race];
      if (race.includes(" ")) raceAr.push(race.replace(" ", "-"));
      raceAr = raceAr.map(applyKinAliasMap);
      for (let i=0; i < validRaces.length; i++) {
        let regexRace = new RegExp("(\\W|^)(" + validRaces[i] + ")(\\W|$)", "i");
        for (const race of raceAr) {
          if (race.match(regexRace)) {
            for (let j = 0; j < racePacks.length; j++) {
              let pack = await racePacks[j].getDocuments();
              for (let entry of pack) {
                let sourceName = entry.system?.powerSourceName?.value ?? entry.system.group.value;
                let raceNamesArray = sourceName.split('/');
                if (raceNamesArray.some(n => regexRace.test(n))) {
                  let raceName = race.match(regexRace)[0].toLowerCase().replaceAll(/\(|\)|\//g,"").trim();
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
   * Retrieve CSS classes for each power type.
   *
   * @param {string} inputString
   *
   * @returns {array}
   *   Returns an array with key 0 as the usage string, and key 1 as the
   *   recharge value.
   */
  getPowerClasses(inputString) {
    // Get the appropriate usage.
    let usage = 'other';
    let recharge = 0;
    let usageString = inputString !== null ? inputString.toLowerCase() : '';
    if (usageString.includes('will')) {
      usage = 'at-will';
    }
    else if (usageString.includes('recharge')) {
      usage = 'recharge';
      if (usageString.includes('16')) {
        recharge = 16;
      }
      else if (usageString.includes('11')) {
        recharge = 11;
      }
      else if (usageString.includes('6')) {
        recharge = 6;
      }
    }
    else if (usageString.includes('battle')
      || usageString.includes('cyclic')) {
      usage = 'once-per-battle';
    }
    else if (usageString.includes('daily')) {
      usage = 'daily';
    }

    return [usage, recharge];
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
      // Return a simplified data object.
      .map(async p => {
        let chatData = await p.getChatData();
        chatData.feats.forEach(f => {
          f.isActive = true;
        });

        return {
          uuid: p._id,
          title: p.name,
          usage: p.system.powerUsage.value,
          usageClass: p.system.powerUsage.value ? this.getPowerClasses(p.system.powerUsage.value)[0] : 'other',
          powerType: p.system.powerType.value,
          level: p.system.powerLevel.value,
          powerData: p,
          powerCard: chatData,
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

    // Rearrange the powers into groups by type.
    let powersByGroup = [];
    powersByGroup = foundry.utils.duplicate(preSorted).reduce((powerGroup, power) => {
      if (power.powerType) {
        let group = power.powerType ? power.powerType : 'other';
        let level = power.level ?? 1;
        if (!powerGroup[group]) {
          powerGroup[group] = [];
        }
        if (!powerGroup[group][level]) {
          powerGroup[group][level] = [];
        }
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

    let sorted = Object.keys(powersByGroup)
    // Sort them based on the sorting array.
    .sort((a,b) => {
      return groupSortingArray.indexOf(a) - groupSortingArray.indexOf(b);
    })
    // Build a new object from the sorted keys.
    .reduce(
      (obj, key) => {
        obj[key] = powersByGroup[key];
        return obj;
      }, {}
    );

    return sorted;
  }

  /**
   * Render a class' power page.
   *
   * @param {object} classData
   *   Object of class data with the keys powers, name, classContent, and
   *   machineName.
   *
   * @returns {string}
   *   Rendered template.
   */
  async renderPowerPage(classData) {
    let template = `systems/archmage/templates/prepopulate/powers--list.html`;
    let templateData = {
      powers: classData.powers,
      className: classData.name,
      classContent: classData.classContent,
      class: classData.machineName,
      itemType: 'power'
    };
    return await foundry.applications.handlebars.renderTemplate(template, templateData);
  }

  /**
   * Prepare data for rendered dialog.
   *
   * @param {array} classes
   *   Array of classes to render the dialog content for, e.g. ['bard'].
   *
   * @returns {object|false}
   *   Object with the keys powers, content, options, and tabs.
   */
  async renderDialog(classes = [], race = '', actor = null) {
    let validClasses = Object.keys(CONFIG.ARCHMAGE.classList);
    let compendiumClasses = classes.filter(a => validClasses.includes(a));
    let classCompendiums = await this.getCompendiums(compendiumClasses, race);

    let classJournals = await this.getJournals();
    let templateData = {
      tabs: []
    };

    for (let [classKey, classObject] of Object.entries(classCompendiums)) {
      classKey = this.cleanClassName(classKey);
      let classPowerPage = await this.renderPowerPage({
        powers: await this.getPowersFromPack(classObject.content, actor),
        className: classObject.name,
        classContent: classJournals[classKey],
        machineName: classKey
      });
      templateData.tabs.push({
        name: classObject.name,
        key: classKey,
        content: classPowerPage,
      });
    }

    templateData.showTabs = templateData.tabs.length > 1;

    let template = `systems/archmage/templates/prepopulate/tabs-content.html`;
    let content = await foundry.applications.handlebars.renderTemplate(template, templateData);
    let options = {
      width: 1080,
      height: 1080,
      resizable: true,
      classes: ['archmage-prepopulate']
    };
    let powers = Object.values(classCompendiums).reduce((accumulator, current) => {
      return accumulator.concat(current.content);
    }, []);
    return {
      powers: powers,
      content: content,
      options: options,
      tabs: {
        navSelector: '.tabs-primary',
        contentSelector: '.tabs-primary-content',
        initial: templateData.tabs[1] && !validClasses.includes(templateData.tabs[0].key) ? templateData.tabs[1].key : templateData.tabs[0].key,
        callback: () => {}
      }
    };
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
