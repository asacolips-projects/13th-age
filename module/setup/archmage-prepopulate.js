/**
 * Class that can be used to query toolkit13.com.
 */
export class ArchmagePrepopulate {
  validClasses = [
    'barbarian',
    'bard',
    'cleric',
    'fighter',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'wizard',
    'chaosmage',
    'commander',
    'druid',
    'monk',
    'necromancer',
    'occultist'
  ];

  validRaces = [
    'darkelf',
    'dragonspawn',
    'dragonic',
    'dwarf',
    'dwarfforged',
    'forgeborn',
    'gnome',
    'halfelf',
    'halforc',
    'halfling',
    'highelf',
    'holyone',
    'aasimar',
    'human',
    'tiefling',
    'demontouched',
    'woodelf'
  ];

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
    let classPacks = await game.packs.filter(p => classes.includes(this.cleanClassName(p.metadata.name)));
    let content = {};
    let cleanRace = this.cleanClassName(race);

    if (race != '' && this.validRaces.includes(cleanRace)) {
      let racePack = await game.packs.find(p => p.metadata.name == 'races');
      let pack = await racePack.getContent();
      for (let entry of pack) {
        let raceNamesArray = entry.data.data.group.value.split('/').map(n => this.cleanClassName(n));
        if (raceNamesArray.includes(cleanRace)) {
          content[cleanRace] = {
            name: race,
            content: [entry]
          };
        }
      }
    }

    for (let i = 0; i < classPacks.length; i++) {
      let pack = await classPacks[i].getContent();
      content[this.cleanClassName(classPacks[i].metadata.name)] = {
        name: classPacks[i].metadata.label,
        content: pack
      };
    }
    
    if (classPacks.length > 1) {
      let key = "Multiclass Feats";
      let pack = await game.packs.find(p => p.metadata.label == key).getContent();
      let powers = pack.filter(e => 
        classes.includes(e.data.name.split('(').map(n => this.cleanClassName(n)).pop())
      );
      if (powers.length > 0) {content[key] = {name: key, content: powers};}
    }

    let key = "General Feats";
    let pack = await game.packs.find(p => p.metadata.label == key).getContent();
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
    let pack = await game.packs.find(p => p.metadata.name == 'classes' && p.metadata.entity == 'JournalEntry');
    let entries = await pack.getContent();
    let content = {};
    for (let i = 0; i < entries.length; i++) {
      content[this.cleanClassName(entries[i].data.name)] = entries[i].data.content;
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
   *
   * @returns {array}
   *   Nested array of powers sorted by level, type, and name, grouped within
   *   power type. Each power has a simplified data structure compared to its
   *   compendium equivalent.
   */
  getPowersFromPack(powersArray) {
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
        a.data.data.powerType.value,
        a.data.data.powerLevel.value,
        a.data.name
      ];
      let bSort = [
        b.data.data.powerType.value,
        b.data.data.powerLevel.value,
        b.data.name
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
        uuid: p.data._id,
        title: p.data.name,
        usage: p.data.data.powerUsage.value,
        usageClass: p.data.data.powerUsage.value ? this.getPowerClasses(p.data.data.powerUsage.value)[0] : 'other',
        powerType: p.data.data.powerType.value,
        level: p.data.data.powerLevel.value,
        powerData: p.data,
        powerCard: chatData,
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
  async renderDialog(classes = [], race = '') {
    let compendiumClasses = classes.filter(a => this.validClasses.includes(a));
    let classCompendiums = await this.getCompendiums(compendiumClasses, race);

    if (classes.length < 1 || Object.keys(classCompendiums).length < 1) {
      ui.notifications.error(`No class has been added to this character. Add a class before attempting to import powers.`);
      return false;
    }

    let classJournals = await this.getJournals();
    let templateData = {
      tabs: []
    };

    for (let [classKey, classObject] of Object.entries(classCompendiums)) {
      let classPowerPage = await this.renderPowerPage({
        powers: this.getPowersFromPack(classObject.content),
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
        initial: templateData.tabs[1] && !this.validClasses.includes(templateData.tabs[0].key) ? templateData.tabs[1].key : templateData.tabs[0].key,
        callback: () => {}
      }
    };
  }
}