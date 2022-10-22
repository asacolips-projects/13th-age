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
  cleanClassName(className) {
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
    let validRaces = Object.keys(CONFIG.ARCHMAGE.raceList);
    let classPacks = await game.packs.filter(p => classes.includes(this.cleanClassName(p.metadata.name)));
    let content = {};
    let cleanRace = this.cleanClassName(race);

    // Load racial powers
    if (race != '' && validRaces.includes(cleanRace)) {
      let racePack = await game.packs.find(p => p.metadata.name == 'races');
      let pack = await racePack.getDocuments();
      for (let entry of pack) {
        let sourceName = entry.system?.powerSourceName?.value ?? entry.system.group.value;
        let raceNamesArray = sourceName.split('/').map(n => this.cleanClassName(n));
        if (raceNamesArray.includes(cleanRace)) {
          if (cleanRace in content) {
            content[cleanRace].content.push(entry);
          } else {
            content[cleanRace] = {
              name: race,
              content: [entry]
            };
          }
        }
      }
    }

    // Load class powers
    for (let i = 0; i < classPacks.length; i++) {
      let pack = await classPacks[i].getDocuments();
      content[this.cleanClassName(classPacks[i].metadata.name)] = {
        name: classPacks[i].metadata.label,
        content: pack
      };
    }
    // Add animal companion to druid and ranger
    for (let key of ["ranger", "druid"]) {
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
        return classes.includes(this.cleanClassName(sourceName))
      });
      if (powers.length > 0) {content[key] = {name: key, content: powers};}
    }

    // Load general feats
    let key = "General Feats";
    let pack = await game.packs.find(p => p.metadata.label == key).getDocuments();
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
    let packs = await game.packs.filter(p => CONFIG.ARCHMAGE.classPacks.includes(p.metadata.name) && p.documentName == 'JournalEntry');
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
    else if (usageString.includes('battle')) {
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
  getPowersFromPack(powersArray, actor = null) {
    // Get an array of powers currently on the actor. This is used later to preselect class features.
    let actorPowers = actor?.items ? actor.items.filter(i => i.type == 'power').map(i => i.system.powerOriginName.value) : [];
    // Presort all of the powers by level, type, and name.
    let preSorted = powersArray.sort((a, b) => {
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
    .map(p => {
      let chatData = p.getChatData();
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
        selected: p.system.powerType.value === 'feature'
          && ['class', 'race'].includes(p.system.powerSource.value)
          && !actorPowers.includes(p.system.powerOriginName.value)
      };
    });

    // Rearrange the powers into groups by type.
    let powersByGroup = [];
    powersByGroup = duplicate(preSorted).reduce((powerGroup, power) => {
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
    return await renderTemplate(template, templateData);
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
      let classPowerPage = await this.renderPowerPage({
        powers: this.getPowersFromPack(classObject.content, actor),
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
    let content = await renderTemplate(template, templateData);
    let options = {
      width: 1080,
      height: 1080,
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
