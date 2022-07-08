export const ARCHMAGE = {};
export const FLAGS = {};

ARCHMAGE.statusEffects = [
  // Dead.
  {
    id: "dead",
    label: "ARCHMAGE.EFFECT.StatusDead",
    icon: "icons/svg/skull.svg",
    journal: "ig1kzvpojsk20dbt"
  },
  // Staggered
  {
    id: "staggered",
    label: "ARCHMAGE.EFFECT.StatusStaggered",
    icon: "icons/svg/blood.svg",
    journal: "oqkyq1xn6xi2ajmi"
  },
  // Unconscious.
  {
    id: "unconscious",
    label: "ARCHMAGE.EFFECT.StatusUnconscious",
    icon: "icons/svg/unconscious.svg",
    journal: "21cEqzk92tflpW7N",
    changes: [
      {
        key: 'data.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
  // Confused.
  {
    id: "confused",
    label: "ARCHMAGE.EFFECT.StatusConfused",
    icon: "icons/svg/stoned.svg",
    journal: "21cEqzk92tflpW7N"
  },
  // Dazed.
  {
    id: "dazed",
    label: "ARCHMAGE.EFFECT.StatusDazed",
    icon: "icons/svg/sun.svg",
    journal: "dk4ua6smvjafdrqm",
    changes: [
      {
        key: 'data.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
  // Fear.
  {
    id: "fear",
    label: "ARCHMAGE.EFFECT.StatusFear",
    icon: "icons/svg/terror.svg",
    journal: "gy68o7eat5p6bpgq",
    changes: [
      {
        key: 'data.attributes.escalation.value',
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: '0'
      },
      {
        key: 'data.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
  // Hampered.
  {
    id: "hampered",
    label: "ARCHMAGE.EFFECT.StatusHampered",
    icon: "icons/svg/paralysis.svg",
    journal: "mk69wxlsqwnydwip"
  },
  // Helpless.
  {
    id: "helpless",
    label: "ARCHMAGE.EFFECT.StatusHelpless",
    icon: "icons/svg/falling.svg",
    journal: "g20s05odo7v5mw2q",
    changes: [
      {
        key: 'data.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
  // Shocked.
  {
    id: "shocked",
    label: "ARCHMAGE.EFFECT.StatusShocked",
    icon: "icons/svg/lightning.svg",
    journal: "m78aw2gepbc5ccgm"
  },
  // Stuck.
  {
    id: "stuck",
    label: "ARCHMAGE.EFFECT.StatusStuck",
    icon: "icons/svg/net.svg",
    journal: "ti7104njam2n18a5"
  },
  // Stunned.
  {
    id: "stunned",
    label: "ARCHMAGE.EFFECT.StatusStunned",
    icon: "icons/svg/daze.svg",
    journal: "2rxwthymp5rl1dqe",
    changes: [
      {
        key: 'data.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
  // Vulnerable.
  {
    id: "vulnerable",
    label: "ARCHMAGE.EFFECT.StatusVulnerable",
    icon: "icons/svg/target.svg",
    journal: "bi9ye2usgfsdpubs",
    changes: [
      {
        key: 'data.attributes.critMod.def.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '2'
      }
    ]
  },
  // Weakened.
  {
    id: "weakened",
    label: "ARCHMAGE.EFFECT.StatusWeakened",
    icon: "icons/svg/downgrade.svg",
    journal: "3r2jt3c6skn7gw7d",
    changes: [
      {
        key: 'data.attributes.attackMod.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.ac.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.pd.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      },
      {
        key: 'data.attributes.md.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: '-4'
      }
    ]
  },
];
// Extended (optional) status effects
ARCHMAGE.extendedStatusEffects = [
  // Empowered.
  {
    id: "empowered",
    label: "ARCHMAGE.EFFECT.StatusEmpowered",
    icon: "icons/svg/upgrade.svg"
  },
  // Ongoing Damage.
  {
    id: "ongoingDamage",
    label: "ARCHMAGE.EFFECT.StatusOngoingDamage",
    icon: "icons/svg/degen.svg"
  },
  // Regen.
  {
    id: "regen",
    label: "ARCHMAGE.EFFECT.StatusRegen",
    icon: "icons/svg/regen.svg"
  },
  // Bonus defenses.
  {
    id: "bonusDefenses",
    label: "ARCHMAGE.EFFECT.StatusBonusDefenses",
    icon: "icons/svg/shield.svg"
  },
  // Reduced defenses.
  {
    id: "reducedDefenses",
    label: "ARCHMAGE.EFFECT.StatusReducedDefenses",
    icon: "icons/svg/acid.svg" //ruins
  },
  // Blessed.
  {
    id: "blessed",
    label: "ARCHMAGE.EFFECT.StatusBlessed",
    icon: "icons/svg/angel.svg"
  },
  // Cursed.
  {
    id: "cursed",
    label: "ARCHMAGE.EFFECT.StatusCursed",
    icon: "icons/svg/dice-target.svg"
  },
  // Shining.
  // {
    // id: "shining",
    // label: "ARCHMAGE.EFFECT.StatusShining",
    // icon: "icons/svg/aura.svg"
  // },
  // Hidden.
  {
    id: "hidden",
    label: "ARCHMAGE.EFFECT.StatusHidden",
    icon: "icons/svg/mystery-man.svg"
  },
  // Flying.
  {
    id: "flying",
    label: "ARCHMAGE.EFFECT.StatusFlying",
    icon: "icons/svg/wing.svg"
  },
  // Grabbed.
  {
    id: "grabbed",
    label: "ARCHMAGE.EFFECT.StatusGrabbed",
    icon: "icons/svg/item-bag.svg"
  },
  // Asleep.
  // {
    // id: "asleep",
    // label: "ARCHMAGE.EFFECT.StatusAsleep",
    // icon: "icons/svg/sleep.svg"
  // },
  // Last Gasps.
  {
    id: "lastgasps",
    label: "ARCHMAGE.EFFECT.StatusLastGasps",
    icon: "icons/svg/clockwork.svg"
  },
  // Debuffed.
  // {
    // id: "debuffed",
    // label: "ARCHMAGE.EFFECT.StatusDebuffed",
    // icon: "icons/svg/direction.svg"
  // },
  // Buffed.
  // {
    // id: "buffed",
    // label: "ARCHMAGE.EFFECT.StatusBuffed",
    // icon: "icons/svg/up.svg"
  // },
  // Holy Shield.
  // {
    // id: "holyshield",
    // label: "ARCHMAGE.EFFECT.StatusHolyShield",
    // icon: "icons/svg/holy-shield.svg"
  // },
  // Fire Shield.
  // {
    // id: "fireshield",
    // label: "ARCHMAGE.EFFECT.StatusFireShield",
    // icon: "icons/svg/fire-shield.svg"
  // },
  // Ice Shield.
  // {
    // id: "iceshield",
    // label: "ARCHMAGE.EFFECT.StatusIceShield",
    // icon: "icons/svg/ice-shield.svg"
  // },
  // Mage Shield.
  // {
    // id: "mageshield",
    // label: "ARCHMAGE.EFFECT.StatusMageShield",
    // icon: "icons/svg/mage-shield.svg"
  // },
];

// Power Settings
ARCHMAGE.powerSources = {
  'class': 'Class',
  'race': 'Race',
  'item': 'Item',
  'other': 'Other'
};

ARCHMAGE.powerTypes = {
  'power': 'Power',
  'feature': 'Feature',
  'talent': 'Talent',
  'flexible': 'Flexible Attack',
  'spell': 'Spell',
  'other': 'Other'
};

ARCHMAGE.powerUsages = {
  'at-will': 'At Will',
  'once-per-battle': 'Per Battle',
  'recharge': 'Recharge',
  'daily': 'Daily',
  'other': 'Other'
};

ARCHMAGE.equipUsages = {
  'daily': 'Daily',
  'recharge': 'Recharge',
  'once-per-battle': 'Per Battle',
  'other': 'Other'
};

ARCHMAGE.actionTypes = {
  'standard': 'Standard',
  'move': 'Move',
  'quick': 'Quick',
  'free': 'Free',
  'interrupt': 'Interrupt'
};

ARCHMAGE.effectDurations = {
  StartOfNextTurn: 0,
  EndOfNextTurn: 1,
  StartOfNextSourceTurn: 2,
  EndOfNextSourceTurn: 3,
  SaveEnds: 4
}

ARCHMAGE.creatureTypes = {
  'aberration': 'Aberration',
  'beast': 'Beast',
  'celestial': 'Celestial',
  'construct': 'Construct',
  'demon': 'Demon',
  'devil': 'Devil',
  'dragon': 'Dragon',
  'elemental': 'Elemental',
  'fey': 'Fey',
  'giant': 'Giant',
  'humanoid': 'Humanoid',
  'monstrosity': 'Monstrosity',
  'ooze': 'Ooze',
  'plant': 'Plant',
  'spirit': 'Spirit',
  'undead': 'Undead'
};

ARCHMAGE.creatureSizes = {
  'normal': 'Normal',
  'large': 'Large',
  'huge': 'Huge',
  'double': 'Double-strength',
  'triple': 'Triple-strength',
  'weakling': 'Weakling',
  'elite': 'Elite'
};

ARCHMAGE.creatureRoles = {
  'archer': 'Archer',
  'blocker': 'Blocker',
  'caster': 'Caster',
  'leader': 'Leader',
  'mook': 'Mook',
  'spoiler': 'Spoiler',
  'troop': 'Troop',
  'wrecker': 'Wrecker'
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
  'aberration': 'systems/archmage/assets/icons/tokens/monsters/aberration.webp',
  'beast': 'systems/archmage/assets/icons/tokens/monsters/beast.webp',
  'construct': 'systems/archmage/assets/icons/tokens/monsters/construct.webp',
  'demon': 'systems/archmage/assets/icons/tokens/monsters/demon.webp',
  'devil': 'systems/archmage/assets/icons/tokens/monsters/devil.webp',
  'dragon': 'systems/archmage/assets/icons/tokens/monsters/dragon.webp',
  'dragon-black': 'systems/archmage/assets/icons/tokens/monsters/dragon-black.webp',
  'dragon-blue': 'systems/archmage/assets/icons/tokens/monsters/dragon-blue.webp',
  'dragon-green': 'systems/archmage/assets/icons/tokens/monsters/dragon-green.webp',
  'dragon-red': 'systems/archmage/assets/icons/tokens/monsters/dragon-red.webp',
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

ARCHMAGE.classList = {
  'barbarian': 'Barbarian',
  'bard': 'Bard',
  'cleric': 'Cleric',
  'fighter': 'Fighter',
  'paladin': 'Paladin',
  'ranger': 'Ranger',
  'rogue': 'Rogue',
  'sorcerer': 'Sorcerer',
  'wizard': 'Wizard',
  'chaosmage': 'Chaos Mage',
  'commander': 'Commander',
  'druid': 'Druid',
  'monk': 'Monk',
  'necromancer': 'Necromancer',
  'occultist': 'Occultist'
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

FLAGS.characterFlags = {
  "initiativeAdv": {
    name: "Quick to Fight",
    hint: "Human racial feat to roll 2d20 for initiative and keep the higher roll.",
    section: "Feats",
    type: Boolean
  },
  "improvedIniative": {
    name: "Improved Initiative",
    hint: "General feat to increase initiative by +4.",
    section: "Feats",
    type: Boolean
  },
  "strongRecovery": {
    name: "Strong Recovery",
    hint: "General feat to reroll some of your recovery die, keeping highest.",
    section: "Feats",
    type: Boolean
  },
  "toughness": {
    name: "Toughness",
    hint: "General feat to increase your max HP based on your base HP",
    section: "Feats",
    type: Boolean
  },
  "averageRecoveries": {
    name: "Average Recovery Rolls",
    hint: "Average results for recovery rolls instead of rolling them.",
    section: "Dice",
    type: Boolean
  },
  "portraitRound": {
    name: "Round Portrait",
    hint: "Whether or not the character portrait is rounded on the V2 sheet.",
    section: "Sheet",
    type: Boolean
  },
  "portraitFrame": {
    name: "Portrait Frame",
    hint: "Whether or not the character portrait has a white frame and shadow on the V2 sheet.",
    section: "Sheet",
    type: Boolean
  },
  "nightmode": {
    name: "Night Mode",
    hint: "Reverse the sheet color scheme into a darkened night mode.",
    section: "Sheet",
    type: Boolean
  }
};

FLAGS.npcFlags = {
  "portraitRound": {
    name: "Round Portrait",
    hint: "Whether or not the character portrait is rounded on the V2 sheet.",
    section: "Sheet",
    type: Boolean
  },
  "portraitFrame": {
    name: "Portrait Frame",
    hint: "Whether or not the character portrait has a white frame and shadow on the V2 sheet.",
    section: "Sheet",
    type: Boolean
  },
  "nightmode": {
    name: "Night Mode",
    hint: "Reverse the sheet color scheme into a darkened night mode.",
    section: "Sheet",
    type: Boolean
  }
};