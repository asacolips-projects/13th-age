export const ARCHMAGE = {};

ARCHMAGE.statusEffects = [
  // Dead.
  {
    id: "dead",
    label: "ARCHMAGE.EFFECT.StatusDead",
    icon: "icons/svg/skull.svg"
  },
  // Staggered
  {
    id: "staggered",
    label: "ARCHMAGE.EFFECT.StatusStaggered",
    icon: "icons/svg/blood.svg",
  },
  // Unconscious.
  {
    id: "unconscious",
    label: "ARCHMAGE.EFFECT.StatusUnconscious",
    icon: "icons/svg/unconscious.svg",
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
    icon: "icons/svg/stoned.svg"
  },
  // Dazed.
  {
    id: "dazed",
    label: "ARCHMAGE.EFFECT.StatusDazed",
    icon: "icons/svg/sun.svg",
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
    icon: "icons/svg/net.svg",
  },
  // Helpless.
  {
    id: "helpless",
    label: "ARCHMAGE.EFFECT.StatusHelpless",
    icon: "icons/svg/falling.svg",
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
    icon: "icons/svg/lightning.svg"
  },
  // Stuck.
  {
    id: "stuck",
    label: "ARCHMAGE.EFFECT.StatusStuck",
    icon: "icons/svg/paralysis.svg",
  },
  // Stunned.
  {
    id: "stunned",
    label: "ARCHMAGE.EFFECT.StatusStunned",
    icon: "icons/svg/daze.svg",
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
    icon: "icons/svg/target.svg"
  },
  // Weakened.
  {
    id: "weakened",
    label: "ARCHMAGE.EFFECT.StatusWeakened",
    icon: "icons/svg/downgrade.svg",
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
    icon: "icons/svg/clockwork.svg"
  },
  // Flying.
  {
    id: "flying",
    label: "ARCHMAGE.EFFECT.StatusFlying",
    icon: "icons/svg/wing.svg"
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
    icon: "icons/svg/ruins.svg"
  },
  // Debuffed.
  {
    id: "debuffed",
    label: "ARCHMAGE.EFFECT.StatusDebuffed",
    icon: "icons/svg/direction.svg" //degen
  },
  // Buffed.
  {
    id: "buffed",
    label: "ARCHMAGE.EFFECT.StatusBuffed",
    icon: "icons/svg/up.svg" //regen
  },
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
  'maneuver': 'Maneuver', //TODO: delete
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
  'necromancer': ' Necromancer',
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
