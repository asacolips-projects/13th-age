export const ARCHMAGE = {};
export const FLAGS = {};

ARCHMAGE.statusEffects = [
  // Dead.
  {
    id: "dead",
    name: "ARCHMAGE.EFFECT.StatusDead",
    icon: "icons/svg/skull.svg",
    journal: "ig1kzvpojsk20dbt",
  },
  // Staggered
  {
    id: "staggered",
    name: "ARCHMAGE.EFFECT.StatusStaggered",
    icon: "icons/svg/blood.svg",
    journal: "oqkyq1xn6xi2ajmi",
  },
  // Unconscious.
  {
    id: "unconscious",
    name: "ARCHMAGE.EFFECT.StatusUnconscious",
    icon: "icons/svg/unconscious.svg",
    journal: "u9VHMyTBvK4lLbPa",
    changes: [
      {
        key: 'system.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Charmed.
  {
    id: "charmed",
    name: "ARCHMAGE.EFFECT.StatusCharmed",
    icon: "icons/svg/heal.svg",
    journal: "21cEqzk92tflpW7P",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Confused.
  {
    id: "confused",
    name: "ARCHMAGE.EFFECT.StatusConfused",
    icon: "icons/svg/stoned.svg",
    journal: "21cEqzk92tflpW7N",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Dazed.
  {
    id: "dazed",
    name: "ARCHMAGE.EFFECT.StatusDazed",
    icon: "icons/svg/sun.svg",
    journal: "dk4ua6smvjafdrqm",
    changes: [
      {
        key: 'system.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Fear.
  {
    id: "fear",
    name: "ARCHMAGE.EFFECT.StatusFear",
    icon: "icons/svg/terror.svg",
    journal: "gy68o7eat5p6bpgq",
    changes: [
      {
        key: 'system.attributes.escalation.value',
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: '0'
      },
      {
        key: 'system.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // This was a 2e playtest condition that didn't make the cut
  // Frenzied.
  // {
    // id: "frenzied",
    // name: "ARCHMAGE.EFFECT.StatusFrenzied",
    // icon: "icons/svg/pill.svg",
    // journal: "gy68o7eat5p6bpgr",
    // changes: [
      // {
        // key: 'system.attributes.escalation.value',
        // mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        // value: '0'
      // },
      // {
        // key: 'system.attributes.attackMod.value',
        // mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        // value: '-4'
      // }
    // ],
    // flags: {
      // archmage: {
        // duration: "Unknown",
      // }
    // }
  // },
  // Grabbed.
  {
    id: "grabbed",
    name: "ARCHMAGE.EFFECT.StatusGrabbed",
    icon: "icons/svg/item-bag.svg",
    journal: "aDEmM5lU3pfG3t7S",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Hampered / Hindered.
  {
    id: "hampered",
    name: "ARCHMAGE.EFFECT.StatusHampered",
    icon: "icons/svg/paralysis.svg",
    journal: "mk69wxlsqwnydwip",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  {
    id: "hindered",
    name: "ARCHMAGE.EFFECT.StatusHindered",
    icon: "icons/svg/paralysis.svg",
    journal: "FHDyJEb29LWnO2Dg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Helpless.
  {
    id: "helpless",
    name: "ARCHMAGE.EFFECT.StatusHelpless",
    icon: "icons/svg/falling.svg",
    journal: "g20s05odo7v5mw2q",
    changes: [
      {
        key: 'system.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Shocked.
  {
    id: "shocked",
    name: "ARCHMAGE.EFFECT.StatusShocked",
    icon: "icons/svg/lightning.svg",
    journal: "m78aw2gepbc5ccgm",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Stuck.
  {
    id: "stuck",
    name: "ARCHMAGE.EFFECT.StatusStuck",
    icon: "icons/svg/net.svg",
    journal: "ti7104njam2n18a5",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Stunned.
  {
    id: "stunned",
    name: "ARCHMAGE.EFFECT.StatusStunned",
    icon: "icons/svg/daze.svg",
    journal: "2rxwthymp5rl1dqe",
    changes: [
      {
        key: 'system.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Vulnerable.
  {
    id: "vulnerable",
    name: "ARCHMAGE.EFFECT.StatusVulnerable",
    icon: "icons/svg/target.svg",
    journal: "bi9ye2usgfsdpubs",
    changes: [
      {
        key: 'system.attributes.critMod.def.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '2'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Weakened.
  {
    id: "weakened",
    name: "ARCHMAGE.EFFECT.StatusWeakened",
    icon: "icons/svg/downgrade.svg",
    journal: "3r2jt3c6skn7gw7d",
    changes: [
      {
        key: 'system.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'system.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ],
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
];
// Extended (optional) status effects
ARCHMAGE.extendedStatusEffects = [
  // Empowered.
  {
    id: "empowered",
    name: "ARCHMAGE.EFFECT.StatusEmpowered",
    icon: "icons/svg/upgrade.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Ongoing Damage.
  {
    id: "ongoingDamage",
    name: "ARCHMAGE.EFFECT.StatusOngoingDamage",
    icon: "icons/svg/degen.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Regen.
  {
    id: "regen",
    name: "ARCHMAGE.EFFECT.StatusRegen",
    icon: "icons/svg/regen.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Bonus defenses.
  {
    id: "bonusDefenses",
    name: "ARCHMAGE.EFFECT.StatusBonusDefenses",
    icon: "icons/svg/shield.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Reduced defenses.
  {
    id: "reducedDefenses",
    name: "ARCHMAGE.EFFECT.StatusReducedDefenses",
    icon: "icons/svg/acid.svg", //ruins
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Blessed.
  {
    id: "blessed",
    name: "ARCHMAGE.EFFECT.StatusBlessed",
    icon: "icons/svg/angel.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Cursed.
  {
    id: "cursed",
    name: "ARCHMAGE.EFFECT.StatusCursed",
    icon: "icons/svg/dice-target.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Flying.
  {
    id: "flying",
    name: "ARCHMAGE.EFFECT.StatusFlying",
    icon: "icons/svg/wing.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Hidden.
  {
    id: "invisible", //hidden - renamed to play nice with v11 statuses
    name: "ARCHMAGE.EFFECT.StatusHidden",
    icon: "icons/svg/mystery-man.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Last Gasps.
  {
    id: "lastgasps",
    name: "ARCHMAGE.EFFECT.StatusLastGasps",
    icon: "icons/svg/clockwork.svg",
    flags: {
      archmage: {
        duration: "Unknown",
      }
    }
  },
  // Asleep.
  {
    id: "sleep", //asleep - renamed to play nice with v11 statuses
    name: "ARCHMAGE.EFFECT.StatusAsleep",
    icon: "icons/svg/sleep.svg",
  },
  // Blind.
  {
    id: "blind",
    name: "ARCHMAGE.EFFECT.StatusBlind",
    icon: "icons/svg/blind.svg",
  },
  // Silenced.
  {
    id: "silenced",
    name: "ARCHMAGE.EFFECT.StatusSilenced",
    icon: "icons/svg/silenced.svg",
  },
  // Holy Shield.
  {
    id: "holyshield",
    name: "ARCHMAGE.EFFECT.StatusHolyShield",
    icon: "icons/svg/holy-shield.svg"
  },
  // Fire Shield.
  {
    id: "fireshield",
    name: "ARCHMAGE.EFFECT.StatusFireShield",
    icon: "icons/svg/fire-shield.svg"
  },
  // Ice Shield.
  {
    id: "iceshield",
    name: "ARCHMAGE.EFFECT.StatusIceShield",
    icon: "icons/svg/ice-shield.svg"
  },
  // Mage Shield.
  {
    id: "mageshield",
    name: "ARCHMAGE.EFFECT.StatusMageShield",
    icon: "icons/svg/mage-shield.svg"
  },
  // Buffed.
  // {
    // id: "buffed",
    // name: "ARCHMAGE.EFFECT.StatusBuffed",
    // icon: "icons/svg/up.svg"
  // },
  // Debuffed.
  // {
    // id: "debuffed",
    // name: "ARCHMAGE.EFFECT.StatusDebuffed",
    // icon: "icons/svg/direction.svg"
  // },
];

ARCHMAGE.featTiers = {
  'adventurer': 'ARCHMAGE.adventurer',
  'champion': 'ARCHMAGE.champion',
  'epic': 'ARCHMAGE.epic',
  'iconic': 'ARCHMAGE.iconic'
}

ARCHMAGE.numDicePerLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// ARCHMAGE.numDicePerLevel2e = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];
// TODO: keep this handy for now until we know where the rules settle
ARCHMAGE.numDicePerLevel2e = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Goes to 15th to support monsters
ARCHMAGE.tierMultPerLevel = [0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4];
ARCHMAGE.tierMultPerLevel2e = [0, 1, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8, 8, 8, 8, 8];

// Animal companion data
ARCHMAGE.animalCompanion = {
  attack: [5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20],
  damage: ["2d8", "3d8", "4d6", " 4d8", "4d10", "6d10", "40", "50", "66", "80", "100", "130", "160"]
};

// Power Settings
ARCHMAGE.powerSources = {
  'class': 'ARCHMAGE.class',
  'race': 'ARCHMAGE.race',
  'item': 'ARCHMAGE.item',
  'other': 'ARCHMAGE.other'
};

ARCHMAGE.powerTypes = {
  'power': 'ARCHMAGE.power',
  'feature': 'ARCHMAGE.feature',
  'talent': 'ARCHMAGE.talent',
  'flexible': 'ARCHMAGE.flexible',
  'spell': 'ARCHMAGE.spell',
  'other': 'ARCHMAGE.other'
};

ARCHMAGE.powerUsages = {
  'at-will': 'ARCHMAGE.at-will',
  'once-per-battle': 'ARCHMAGE.once-per-battle',
  'recharge': 'ARCHMAGE.recharge',
  'daily': 'ARCHMAGE.daily',
  'cyclic': 'ARCHMAGE.cyclic',
  'recharge-desperate': 'ARCHMAGE.recharge-desperate',
  'daily-desperate': 'ARCHMAGE.daily-desperate',
  'other': 'ARCHMAGE.other'
};

ARCHMAGE.equipUsages = {
  'once-per-battle': 'ARCHMAGE.once-per-battle',
  'recharge': 'ARCHMAGE.recharge',
  'daily': 'ARCHMAGE.daily',
  'recharge-desperate': 'ARCHMAGE.recharge-desperate',
  'daily-desperate': 'ARCHMAGE.daily-desperate',
  'other': 'ARCHMAGE.other'
};

ARCHMAGE.featUsages = {
  'daily': 'ARCHMAGE.daily',
  'once-per-battle': 'ARCHMAGE.once-per-battle',
  'other': 'ARCHMAGE.other'
};

ARCHMAGE.actionTypes = {
  'standard': 'ARCHMAGE.standard-short',
  'move': 'ARCHMAGE.move-short',
  'quick': 'ARCHMAGE.quick-short',
  'free': 'ARCHMAGE.free-short',
  'interrupt': 'ARCHMAGE.interrupt-short'
};

ARCHMAGE.actionTypesShort = {
  'standard': 'ARCHMAGE.STD',
  'move': 'ARCHMAGE.MOV',
  'quick': 'ARCHMAGE.QCK',
  'free': 'ARCHMAGE.FREE',
  'interrupt': 'ARCHMAGE.INT'
};

ARCHMAGE.effectDurationTypes = {
  'Unknown': 'ARCHMAGE.DURATION.Unknown',
  'Infinite': 'ARCHMAGE.DURATION.Infinite',
  'StartOfNextTurn': "ARCHMAGE.DURATION.StartOfNextTurn",
  'EndOfNextTurn': "ARCHMAGE.DURATION.EndOfNextTurn",
  'StartOfNextSourceTurn': 'ARCHMAGE.DURATION.StartOfNextSourceTurn',
  'EndOfNextSourceTurn': 'ARCHMAGE.DURATION.EndOfNextSourceTurn',
  'EasySaveEnds': 'ARCHMAGE.DURATION.EasySaveEnds',
  'NormalSaveEnds': 'ARCHMAGE.DURATION.NormalSaveEnds',
  'HardSaveEnds': 'ARCHMAGE.DURATION.HardSaveEnds',
  'EndOfCombat': 'ARCHMAGE.DURATION.EndOfCombat',
  'EndOfArc': 'ARCHMAGE.DURATION.EndOfArc',
  'EndOfRound': "ARCHMAGE.DURATION.EndOfRound",
  'StartOfEachTurn': 'ARCHMAGE.DURATION.StartOfEachTurn'
};

ARCHMAGE.creatureTypes = {
  'aberration': 'ARCHMAGE.CREATURETYPES.aberration',
  'beast': 'ARCHMAGE.CREATURETYPES.beast',
  'celestial': 'ARCHMAGE.CREATURETYPES.celestial',
  'construct': 'ARCHMAGE.CREATURETYPES.construct',
  'demon': 'ARCHMAGE.CREATURETYPES.demon',
  'devil': 'ARCHMAGE.CREATURETYPES.devil',
  'dragon': 'ARCHMAGE.CREATURETYPES.dragon',
  'elemental': 'ARCHMAGE.CREATURETYPES.elemental',
  'fey': 'ARCHMAGE.CREATURETYPES.fey',
  'giant': 'ARCHMAGE.CREATURETYPES.giant',
  'humanoid': 'ARCHMAGE.CREATURETYPES.humanoid',
  'monstrosity': 'ARCHMAGE.CREATURETYPES.monstrosity',
  'ooze': 'ARCHMAGE.CREATURETYPES.ooze',
  'plant': 'ARCHMAGE.CREATURETYPES.plant',
  'spirit': 'ARCHMAGE.CREATURETYPES.spirit',
  'undead': 'ARCHMAGE.CREATURETYPES.undead'
};

ARCHMAGE.creatureSizes = {
  'normal': 'ARCHMAGE.CREATURESIZES.normal',
  'large': 'ARCHMAGE.CREATURESIZES.large',
  'huge': 'ARCHMAGE.CREATURESIZES.huge',
  'gargantuan': 'ARCHMAGE.CREATURESIZES.gargantuan',
  'small': 'ARCHMAGE.CREATURESIZES.small',
  'tiny': 'ARCHMAGE.CREATURESIZES.tiny',
};

ARCHMAGE.creatureStrengths = {
  'normal': 'ARCHMAGE.CREATURESTRENGTHS.normal',
  'double': 'ARCHMAGE.CREATURESTRENGTHS.double-strength',
  'triple': 'ARCHMAGE.CREATURESTRENGTHS.triple-strength',
  'weakling': 'ARCHMAGE.CREATURESTRENGTHS.weakling',
  'elite': 'ARCHMAGE.CREATURESTRENGTHS.elite',
};

ARCHMAGE.creatureRoles = {
  'archer': 'ARCHMAGE.CREATUREROLES.archer',
  'blocker': 'ARCHMAGE.CREATUREROLES.blocker',
  'caster': 'ARCHMAGE.CREATUREROLES.caster',
  'leader': 'ARCHMAGE.CREATUREROLES.leader',
  'mook': 'ARCHMAGE.CREATUREROLES.mook',
  'spoiler': 'ARCHMAGE.CREATUREROLES.spoiler',
  'troop': 'ARCHMAGE.CREATUREROLES.troop',
  'wrecker': 'ARCHMAGE.CREATUREROLES.wrecker'
};

ARCHMAGE.chakraSlots = {
  'armor': 'ARCHMAGE.CHAKRA.armor',
  'arrow': 'ARCHMAGE.CHAKRA.arrow',
  'belt': 'ARCHMAGE.CHAKRA.belt',
  'book': 'ARCHMAGE.CHAKRA.book',
  'boots': 'ARCHMAGE.CHAKRA.boots',
  'cloak': 'ARCHMAGE.CHAKRA.cloak',
  'glove': 'ARCHMAGE.CHAKRA.glove',
  'helmet': 'ARCHMAGE.CHAKRA.helmet',
  'necklace': 'ARCHMAGE.CHAKRA.necklace',
  'ring': 'ARCHMAGE.CHAKRA.ring',
  'shield': 'ARCHMAGE.CHAKRA.shield',
  'staff': 'ARCHMAGE.CHAKRA.staff',
  'symbol': 'ARCHMAGE.CHAKRA.symbol',
  'wand': 'ARCHMAGE.CHAKRA.wand',
  'melee': 'ARCHMAGE.CHAKRA.melee',
  'ranged': 'ARCHMAGE.CHAKRA.ranged',
  'wondrous': 'ARCHMAGE.CHAKRA.wondrous',
};

ARCHMAGE.defaultTokens = {
  'character': 'icons/svg/mystery-man.svg',
  'npc': 'icons/svg/eye.svg',
  'item': 'systems/archmage/assets/icons/items/backpack.jpg',
  'power': 'systems/archmage/assets/icons/skills/weapon_27.jpg',
  'trait': 'icons/svg/regen.svg',
  'action': 'icons/svg/target.svg',
  'nastierSpecial': 'icons/svg/poison.svg',
  'tool': 'icons/svg/anchor.svg',
  'loot': 'icons/svg/daze.svg',
  'equipment': 'systems/archmage/assets/icons/items/inventory/backpack.jpg'
};

ARCHMAGE.defaultMonsterTokens = {
  'default': 'icons/svg/mystery-man.svg',
  'default-toolkit': 'systems/archmage/assets/icons/tokens/monsters/token-neutral.webp',
  'aberration': 'systems/archmage/assets/icons/tokens/monsters/aberration.webp',
  'beast': 'systems/archmage/assets/icons/tokens/monsters/beast.webp',
  'construct': 'systems/archmage/assets/icons/tokens/monsters/construct.webp',
  'demon': 'systems/archmage/assets/icons/tokens/monsters/demon.webp',
  'devil': 'systems/archmage/assets/icons/tokens/monsters/devil.webp',
  'dragon': 'systems/archmage/assets/icons/tokens/monsters/dragon.webp',
  'dragon-black': 'systems/archmage/assets/icons/tokens/monsters/dragon-black.webp',
  'dragon-blue': 'systems/archmage/assets/icons/tokens/monsters/dragon-blue.webp',
  'dragon-brass': 'systems/archmage/assets/icons/tokens/monsters/dragon-brass.webp',
  'dragon-bronze': 'systems/archmage/assets/icons/tokens/monsters/dragon-bronze.webp',
  'dragon-copper': 'systems/archmage/assets/icons/tokens/monsters/dragon-copper.webp',
  'dragon-gold': 'systems/archmage/assets/icons/tokens/monsters/dragon-gold.webp',
  'dragon-green': 'systems/archmage/assets/icons/tokens/monsters/dragon-green.webp',
  'dragon-red': 'systems/archmage/assets/icons/tokens/monsters/dragon-red.webp',
  'dragon-silver': 'systems/archmage/assets/icons/tokens/monsters/dragon-silver.webp',
  'dragon-white': 'systems/archmage/assets/icons/tokens/monsters/dragon-white.webp',
  'elemental': 'systems/archmage/assets/icons/tokens/monsters/elemental.webp',
  'elemental-air': 'systems/archmage/assets/icons/tokens/monsters/elemental-air.webp',
  'elemental-earth': 'systems/archmage/assets/icons/tokens/monsters/elemental-earth.webp',
  'elemental-fire': 'systems/archmage/assets/icons/tokens/monsters/elemental-fire.webp',
  'elemental-water': 'systems/archmage/assets/icons/tokens/monsters/elemental-water.webp',
  'giant': 'systems/archmage/assets/icons/tokens/monsters/giant.webp',
  'humanoid': 'systems/archmage/assets/icons/tokens/monsters/humanoid.webp',
  'ooze': 'systems/archmage/assets/icons/tokens/monsters/ooze.webp',
  'plant': 'systems/archmage/assets/icons/tokens/monsters/plant.webp',
  'spirit': 'systems/archmage/assets/icons/tokens/monsters/spirit.webp',
  'undead': 'systems/archmage/assets/icons/tokens/monsters/undead.webp',
};

ARCHMAGE.raceList = {
  'aasimar': "ARCHMAGE.RACES.aasimar",
  'darkelf': "ARCHMAGE.RACES.darkelf",
  'demontouched': "ARCHMAGE.RACES.demontouched",
  'dragonic': "ARCHMAGE.RACES.dragonic",
  'dragonspawn': "ARCHMAGE.RACES.dragonspawn",
  'drow': "ARCHMAGE.RACES.drow",
  'dwarf': "ARCHMAGE.RACES.dwarf",
  'dwarfforged': "ARCHMAGE.RACES.dwarfforged",
  'forgeborn': "ARCHMAGE.RACES.forgeborn",
  'gnome': "ARCHMAGE.RACES.gnome",
  'halfelf': "ARCHMAGE.RACES.halfelf",
  'halfling': "ARCHMAGE.RACES.halfling",
  'halforc': "ARCHMAGE.RACES.halforc",
  'highelf': "ARCHMAGE.RACES.highelf",
  'holyone': "ARCHMAGE.RACES.holyone",
  'human': "ARCHMAGE.RACES.human",
  'tiefling': "ARCHMAGE.RACES.tiefling",
  'trollkin': "ARCHMAGE.RACES.trollkin",
  'silverelf': "ARCHMAGE.RACES.silverelf",
  'woodelf': "ARCHMAGE.RACES.woodelf"
};

ARCHMAGE.classPacks = [
  'classes',
  'classes-kin-2e'
];

ARCHMAGE.classList = {
  'barbarian': 'ARCHMAGE.CLASSES.barbarian',
  'bard': 'ARCHMAGE.CLASSES.bard',
  'cleric': 'ARCHMAGE.CLASSES.cleric',
  'fighter': 'ARCHMAGE.CLASSES.fighter',
  'paladin': 'ARCHMAGE.CLASSES.paladin',
  'ranger': 'ARCHMAGE.CLASSES.ranger',
  'rogue': 'ARCHMAGE.CLASSES.rogue',
  'sorcerer': 'ARCHMAGE.CLASSES.sorcerer',
  'wizard': 'ARCHMAGE.CLASSES.wizard',
  'chaosmage': 'ARCHMAGE.CLASSES.chaosmage',
  'commander': 'ARCHMAGE.CLASSES.commander',
  'druid': 'ARCHMAGE.CLASSES.druid',
  'monk': 'ARCHMAGE.CLASSES.monk',
  'necromancer': 'ARCHMAGE.CLASSES.necromancer',
  'occultist': 'ARCHMAGE.CLASSES.occultist'
};

ARCHMAGE.classes = {
  barbarian: {
    hp: 7,
    ac_lgt: 12,
    ac_hvy: 13,
    ac_hvy_pen: -2,
    shld_pen: 0,
    pd: 11,
    md: 10,
    rec_die: 10,
    wpn_1h: 8,
    wpn_2h: 10,
    wpn_2h_pen: 0,
    wpn_rngd: 8,
    skilled_warrior: true
  },
  bard: {
    hp: 7,
    ac_lgt: 12,
    ac_hvy: 13,
    ac_hvy_pen: -2,
    shld_pen: -1,
    pd: 10,
    md: 11,
    rec_die: 8,
    wpn_1h: 8,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: true
  },
  chaosmage: {
    hp: 6,
    ac_lgt: 10,
    ac_hvy: 11,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 10,
    md: 11,
    rec_die: 6,
    wpn_1h: 4,
    wpn_2h: 6,
    wpn_2h_pen: 0,
    wpn_rngd: 4,
    skilled_warrior: false
  },
  cleric: {
    hp: 7,
    ac_lgt: 12,
    ac_hvy: 14,
    ac_hvy_pen: 0,
    shld_pen: 0,
    pd: 11,
    md: 11,
    rec_die: 8,
    wpn_1h: 6,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: false
  },
  commander: {
    hp: 7,
    ac_lgt: 12,
    ac_hvy: 14,
    ac_hvy_pen: -2,
    shld_pen: 0,
    pd: 10,
    md: 12,
    rec_die: 8,
    wpn_1h: 6,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: true
  },
  druid: {
    hp: 6,
    ac_lgt: 10,
    ac_hvy: 14,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 11,
    md: 11,
    rec_die: 6,
    wpn_1h: 6,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: false
  },
  fighter: {
    hp: 8,
    ac_lgt: 13,
    ac_hvy: 15,
    ac_hvy_pen: 0,
    shld_pen: 0,
    pd: 10,
    md: 10,
    rec_die: 10,
    wpn_1h: 8,
    wpn_2h: 10,
    wpn_2h_pen: 0,
    wpn_rngd: 8,
    skilled_warrior: true
  },
  monk: {
    hp: 7,
    ac_lgt: 11,
    ac_hvy: 12,
    ac_hvy_pen: -4,
    shld_pen: -2,
    pd: 11,
    md: 11,
    rec_die: 8,
    wpn_1h: 8,
    wpn_2h: 10,
    wpn_2h_pen: -2,
    wpn_rngd: 6,
    skilled_warrior: false
  },
  necromancer: {
    hp: 6,
    ac_lgt: 10,
    ac_hvy: 11,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 10,
    md: 11,
    rec_die: 6,
    wpn_1h: 4,
    wpn_2h: 6,
    wpn_2h_pen: 0,
    wpn_rngd: 4,
    skilled_warrior: false
  },
  occultist: {
    ac_lgt: 11,
    hp: 6,
    ac_hvy: 13,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 10,
    md: 11,
    rec_die: 6,
    wpn_1h: 4,
    wpn_2h: 6,
    wpn_2h_pen: 0,
    wpn_rngd: 4,
    skilled_warrior: false
  },
  paladin: {
    hp: 8,
    ac_lgt: 12,
    ac_hvy: 16,
    ac_hvy_pen: 0,
    shld_pen: 0,
    pd: 10,
    md: 12,
    rec_die: 10,
    wpn_1h: 8,
    wpn_2h: 10,
    wpn_2h_pen: 0,
    wpn_rngd: 8,
    skilled_warrior: true
  },
  ranger: {
    hp: 7,
    ac_lgt: 14,
    ac_hvy: 15,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 11,
    md: 10,
    rec_die: 8,
    wpn_1h: 8,
    wpn_2h: 10,
    wpn_2h_pen: 0,
    wpn_rngd: 8,
    skilled_warrior: true
  },
  rogue: {
    hp: 6,
    ac_lgt: 12,
    ac_hvy: 13,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 12,
    md: 10,
    rec_die: 8,
    wpn_1h: 8,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: true
  },
  sorcerer: {
    hp: 6,
    ac_lgt: 10,
    ac_hvy: 11,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 11,
    md: 10,
    rec_die: 6,
    wpn_1h: 6,
    wpn_2h: 8,
    wpn_2h_pen: 0,
    wpn_rngd: 6,
    skilled_warrior: false
  },
  wizard: {
    hp: 6,
    ac_lgt: 10,
    ac_hvy: 11,
    ac_hvy_pen: -2,
    shld_pen: -2,
    pd: 10,
    md: 12,
    rec_die: 6,
    wpn_1h: 4,
    wpn_2h: 6,
    wpn_2h_pen: 0,
    wpn_rngd: 4,
    skilled_warrior: false
  }
};

ARCHMAGE.classes2e = {
  barbarian: {
    rec_die: 12,
  },
  bard: {
    rec_die: 6,
  },
  chaosmage: {},
  cleric: {
    ac_hvy_pen: -2,
    ac_lgt: 11,
  },
  commander: {},
  druid: {},
  fighter: {},
  monk: {},
  necromancer: {},
  occultist: {},
  paladin: {},
  ranger: {
    ac_lgt: 13,
    rec_die: 6,
  },
  rogue: {},
  sorcerer: {
    wpn_2h: 8,
  },
  wizard: {}
}

ARCHMAGE.classResources = {
  // List custom resources to configure for classes that use them
  // Stored as an array of two-element arrays with label and reset
  'chaosmage': [["CM Daily Spells", "full", 2, 2], ["CM Per-Battle Spells", "quick", 1, 1]],
  'druid' : [["TC Daily Spells", "full", 1, 1]]
}

ARCHMAGE.classResources2e = {
  // List custom resources to configure for classes that use them - added if 2e enabled
  // Stored as an array of two-element arrays with label and reset
  // 'barbarian': [["Frenzy", "quickreset"]], // optional, manually setup via instructions
  // These were part of the 2e playtest but didn't make the cut
  // 'bard' : [["Combat Riffs", "quick", 2, 2], ["Healing Magics", "quick", 2, 2], ["Miss Me Effects", "quick", 2, 2]]
}

ARCHMAGE.keyModifiers = {
  // Symmetrical dense matrix, store only lower triangle
  // Assumption: classes are stored in actors sorted in alphabetical order
  'barbarian': {
    'bard': ['str', 'cha'],
    'chaosmage': ['str', 'cha'],
    'cleric': ['str', 'wis'],
    'commander': ['str', 'cha'],
    'druid': ['str', 'wis'],
    'fighter': ['str', 'con'],
    'monk': ['str', 'dex'],
    'necromancer': ['str', 'int'],
    'occultist': ['str', 'int'],
    'paladin': ['str', 'cha'],
    'ranger': ['str', 'dex'],
    'rogue': ['str', 'dex'],
    'sorcerer': ['str', 'cha'],
    'wizard': ['str', 'int'],
  },
  'bard': {
    'chaosmage': ['dex', 'cha'],
    'cleric': ['wis', 'cha'],
    'commander': ['str', 'cha'],
    'druid': ['wis', 'cha'],
    'fighter': ['str', 'cha'],
    'monk': ['dex', 'cha'],
    'necromancer': ['int', 'cha'],
    'occultist': ['int', 'cha'],
    'paladin': ['str', 'cha'],
    'ranger': ['dex', 'cha'],
    'rogue': ['dex', 'cha'],
    'sorcerer': ['dex', 'cha'],
    'wizard': ['int', 'cha'],
  },
  'chaosmage': {
    'cleric': ['wis', 'cha'],
    'commander': ['str', 'cha'],
    'druid': ['wis', 'cha'],
    'fighter': ['str', 'cha'],
    'monk': ['dex', 'cha'],
    'necromancer': ['int', 'cha'],
    'occultist': ['int', 'cha'],
    'paladin': ['str', 'cha'],
    'ranger': ['dex', 'cha'],
    'rogue': ['dex', 'cha'],
    'sorcerer': ['con', 'cha'],
    'wizard': ['int', 'cha'],
  },
  'cleric': {
    'commander': ['wis', 'cha'],
    'druid': ['str', 'wis'],
    'fighter': ['str', 'wis'],
    'monk': ['dex', 'wis'],
    'necromancer': ['int', 'wis'],
    'occultist': ['int', 'wis'],
    'paladin': ['str', 'wis'],
    'ranger': ['str', 'wis'],
    'rogue': ['dex', 'wis'],
    'sorcerer': ['wis', 'cha'],
    'wizard': ['int', 'wis'],
  },
  'commander': {
    'druid': ['wis', 'cha'],
    'fighter': ['str', 'cha'],
    'monk': ['str', 'dex'],
    'necromancer': ['int', 'cha'],
    'occultist': ['int', 'cha'],
    'paladin': ['str', 'cha'],
    'ranger': ['str', 'cha'],
    'rogue': ['dex', 'cha'],
    'sorcerer': ['str', 'cha'],
    'wizard': ['int', 'cha'],
  },
  'druid': {
    'fighter': ['str', 'wis'],
    'monk': ['dex', 'wis'],
    'necromancer': ['int', 'wis'],
    'occultist': ['int', 'wis'],
    'paladin': ['str', 'wis'],
    'ranger': ['dex', 'wis'],
    'rogue': ['dex', 'wis'],
    'sorcerer': ['wis', 'cha'],
    'wizard': ['int', 'wis'],
  },
  'fighter': {
    'monk': ['str', 'dex'],
    'necromancer': ['str', 'int'],
    'occultist': ['str', 'int'],
    'paladin': ['str', 'cha'],
    'ranger': ['str', 'dex'],
    'rogue': ['str', 'dex'],
    'sorcerer': ['str', 'cha'],
    'wizard': ['str', 'int'],
  },
  'monk': {
    'necromancer': ['dex', 'int'],
    'occultist': ['dex', 'int'],
    'paladin': ['str', 'dex'],
    'ranger': ['str', 'dex'],
    'rogue': ['str', 'dex'],
    'sorcerer': ['dex', 'cha'],
    'wizard': ['dex', 'int'],
  },
  'necromancer': {
    'occultist': ['int', 'cha'],
    'paladin': ['str', 'int'],
    'ranger': ['dex', 'int'],
    'rogue': ['dex', 'int'],
    'sorcerer': ['int', 'cha'],
    'wizard': ['int', 'cha'],
  },
  'occultist': {
    'paladin': ['str', 'int'],
    'ranger': ['dex', 'int'],
    'rogue': ['dex', 'int'],
    'sorcerer': ['int', 'cha'],
    'wizard': ['int', 'wis'],
  },
  'paladin': {
    'ranger': ['str', 'dex'],
    'rogue': ['str', 'dex'],
    'sorcerer': ['str', 'cha'],
    'wizard': ['str', 'int'],
  },
  'ranger': {
    'rogue': ['str', 'dex'],
    'sorcerer': ['dex', 'cha'],
    'wizard': ['dex', 'int'],
  },
  'rogue': {
    'sorcerer': ['dex', 'cha'],
    'wizard': ['dex', 'int'],
  },
  'sorcerer': {
    'wizard': ['int', 'cha'],
  },
  // 'wizard': ,
};

// Explicit multipliers from 13TW
ARCHMAGE.npcLevelupMultipliers = {
  '1': 1.25,
  '2': 1.6,
  '3': 2.0,
  '4': 2.5,
  '5': 3.2,
  '6': 4.0,
  '-1': 1/1.25,
  '-2': 1/1.6,
  '-3': 1/2.0,
  '-4': 1/2.5,
  '-5': 1/3.2,
  '-6': 1/4.0,
};

// Colors used to display HP in token health bars
ARCHMAGE.tokenHPColors = {
  damage: 0xFF0000,
  healing: 0x00FF00,
  temp: 0x66CCFF,
  tempmax: 0x440066,
  negmax: 0x550000
};

ARCHMAGE.REGEXP = {
  ONGOING_DAMAGE: /(<a (?:(?!<a ).)*?><i class="fas fa-dice-d20"><\/i>)*(-?\d+)(<\/a>)* ongoing ([a-zA-Z]*) ?damage(?:\s*\((\w*) ?save ends(?:, \d*\+)?\))?/ig,
  CONDITIONS: new Map(),
}

FLAGS.characterFlags = {
  "overridePowerLevel": {
    name: "ARCHMAGE.CHARACTERFLAGS.overridePowerLevelName",
    hint: "ARCHMAGE.CHARACTERFLAGS.overridePowerLevelHint",
    section: "Feats",
    type: Boolean
  },
  "strongRecovery": {
    name: "ARCHMAGE.CHARACTERFLAGS.strongRecoveryName",
    hint: "ARCHMAGE.CHARACTERFLAGS.strongRecoveryHint",
    section: "Feats",
    type: Boolean
  },
  "initiativeAdv": {
    name: "ARCHMAGE.CHARACTERFLAGS.initiativeAdvName",
    hint: "ARCHMAGE.CHARACTERFLAGS.initiativeAdvHint",
    section: "Feats",
    type: Boolean
  },
  "grimDetermination": {
    name: "ARCHMAGE.CHARACTERFLAGS.grimDeterminationName",
    hint: "ARCHMAGE.CHARACTERFLAGS.grimDeterminationHint",
    section: "Feats",
    type: Boolean
  },
  "implacable": {
    name: "ARCHMAGE.CHARACTERFLAGS.implacableName",
    hint: "ARCHMAGE.CHARACTERFLAGS.implacableHint",
    section: "Feats",
    type: Boolean
  },
  "dexToCha": {
    name: "ARCHMAGE.CHARACTERFLAGS.dexToChaName",
    hint: "ARCHMAGE.CHARACTERFLAGS.dexToChaHint",
    section: "Feats",
    type: Boolean
  },
  "dexToInt": {
    name: "ARCHMAGE.CHARACTERFLAGS.dexToIntName",
    hint: "ARCHMAGE.CHARACTERFLAGS.dexToIntHint",
    section: "Feats",
    type: Boolean
  },
  "averageRecoveries": {
    name: "ARCHMAGE.CHARACTERFLAGS.averageRecoveriesName",
    hint: "ARCHMAGE.CHARACTERFLAGS.averageRecoveriesHint",
    section: "Dice",
    type: Boolean
  },
  "portraitRound": {
    name: "ARCHMAGE.CHARACTERFLAGS.portraitRoundName",
    hint: "ARCHMAGE.CHARACTERFLAGS.portraitRoundHint",
    section: "Sheet",
    type: Boolean
  },
  "portraitFrame": {
    name: "ARCHMAGE.CHARACTERFLAGS.portraitFrameName",
    hint: "ARCHMAGE.CHARACTERFLAGS.portraitFrameHint",
    section: "Sheet",
    type: Boolean
  },
  "hideCurrency": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideCurrencyName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideCurrencyHint",
    section: "Sheet",
    type: Boolean
  },
  "hideEmptyPowerGroups": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideEmptyPowerGroupsName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideEmptyPowerGroupsHint",
    section: "Sheet",
    type: Boolean
  },
  "showTriggersTab": {
    name: "ARCHMAGE.CHARACTERFLAGS.showTriggersTabName",
    hint: "ARCHMAGE.CHARACTERFLAGS.showTriggersTabHint",
    section: "Sheet",
    type: Boolean
  },
  "hideImportPowers": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideImportPowersName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideImportPowersHint",
    section: "Sheet",
    type: Boolean
  },
  "hideIncrementals": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideIncrementalsName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideIncrementalsHint",
    section: "Sheet",
    type: Boolean
  },
  "hideOneUniqueThing": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideOneUniqueThingName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideOneUniqueThingHint",
    section: "Sheet",
    type: Boolean
  },
  "hideSettingsTab": {
    name: "ARCHMAGE.CHARACTERFLAGS.hideSettingsTabName",
    hint: "ARCHMAGE.CHARACTERFLAGS.hideSettingsTabHint",
    section: "Sheet",
    type: Boolean
  },
  "diceFormulaMode": {
    name: "ARCHMAGE.CHARACTERFLAGS.diceFormulaModeName",
    hint: "ARCHMAGE.CHARACTERFLAGS.diceFormulaModeHint",
    section: "Sheet",
    type: String,
    options: {
      'short': 'ARCHMAGE.CHARACTERFLAGS.diceFormulaModeOptshort',
      'long': 'ARCHMAGE.CHARACTERFLAGS.diceFormulaModeOptlong',
      'numeric': 'ARCHMAGE.CHARACTERFLAGS.diceFormulaModeOptnumeric'
    }
  }
};

FLAGS.npcFlags = {
  "portraitRound": {
    name: "ARCHMAGE.CHARACTERFLAGS.portraitRoundName",
    hint: "ARCHMAGE.CHARACTERFLAGS.portraitRoundHint",
    section: "Sheet",
    type: Boolean
  },
  "portraitFrame": {
    name: "ARCHMAGE.CHARACTERFLAGS.portraitFrameName",
    hint: "ARCHMAGE.CHARACTERFLAGS.portraitFrameHint",
    section: "Sheet",
    type: Boolean
  }
};
