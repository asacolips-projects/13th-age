# Install

1. Go to the setup page and choose **Game Systems**.
2. Click the **Install System** button, and paste in this manifest link: [https://gitlab.com/asacolips-projects/foundry-mods/archmage/raw/master/system.json](https://gitlab.com/asacolips-projects/foundry-mods/archmage/raw/master/system.json)
3. Create a Game World using the 13th Age system.
4. (Optional) to enable inline dice rolls in powers using `[[d20]]` syntax, install the [Dice Calculator](https://gitlab.com/asacolips-projects/foundry-mods/foundry-vtt-dice-calculator) module. The manifest URL that can be used on the module installer page is [https://gitlab.com/asacolips-projects/foundry-mods/foundry-vtt-dice-calculator/raw/master/module.json](https://gitlab.com/asacolips-projects/foundry-mods/foundry-vtt-dice-calculator/raw/master/module.json), and once you've installed the module, you'll need to enable it and enable the optional setting for inline dice rolls.

Compatible with FoundryVTT 0.3.x

# Description

Build campaigns in the 13th Age RPG using the Foundry VTT environment.

### Player Character Sheets

![Screenshot of player character sheets](https://i.imgur.com/ktco54a.jpg)

### Monster Character Sheets

![Screenshot of monster character sheets](https://i.imgur.com/FIaoixU.jpg)

# Inline Rolls

If you're using the **Inline Rolls** setting of the [Dice Calculator](https://gitlab.com/asacolips-projects/foundry-mods/foundry-vtt-dice-calculator) module, you can use any of the following attributes in your roll formulas:

## Ability Modifiers
| Formula | Value |
| :-- | :-- |
| @abil.str.mod | Strength modifier |
| @abil.dex.mod | Dexterity modifier |
| @abil.con.mod | Constitution modifier |
| @abil.int.mod | Intelligence modifier |
| @abil.wis.mod | Wisdom modifier |
| @abil.cha.mod | Charisma modifier |

## Ability Modifiers (x2 Champion, x3 Epic)
| Formula | Value |
| :-- | :-- |
| @abil.str.dmg | Strength modifier |
| @abil.dex.dmg | Dexterity modifier |
| @abil.con.dmg | Constitution modifier |
| @abil.int.dmg | Intelligence modifier |
| @abil.wis.dmg | Wisdom modifier |
| @abil.cha.dmg | Charisma modifier |

## Attributes
| Formula | Value |
| :-- | :-- |
| @attr.init.mod | Initiative modifier |
| @attr.level.value | Current level |
| @attr.escalation.value | Current value of the Escalation Die |
| @attr.weapon.melee.value | Melee weapon damage dice |
| @attr.weapon.ranged.value | Ranged weapon damage dice |