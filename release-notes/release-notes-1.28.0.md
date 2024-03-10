# Release Notes 1.28.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.28.0/system.json

## Compatible Foundry versions

![Foundry v11.315](https://img.shields.io/badge/Foundry-v11.315-green) ![Foundry v12](https://img.shields.io/badge/Foundry-v12-yellow)

**Note**: Foundry v12 is currently in the prototype development phase. Full compatibility with it is not guaranteed.

## Changes

- Implemented a new `cyclic` power usage mode and applied it to the **Color Spray** and **Rebuke** spells from the wizard spell compendium. If a power is set to `cyclic`, it will render on the character sheet as an at-will power when the escalation die is even, or a once-per-battle power when it's odd. In either case, there will be a small border on the right off the opposite color to indicate that it's a cyclic power and changes on some rounds.
- Implemented a new **Compendiumb Browser**! This is inspired by the module of the same name (and the PF2e compendium browser!), but it's a browser that we built from scratch to be as fast and useful as we could make it for 13th Age. See the Compendium Browser section below for more details.

## Fixes

- Fixed typos and roll format errors in the following monsters:
    - Summoned Barrow Wight
    - Barbarous Bugbear
    - Bonded Veil
    - Feral Warbanner
    - Gelatinous Octahedron
    - Kobold Skyclaw
    - Lesser Xorn
    - Tarrasque
- Improved character sheet rendering performance for characters with a large number of powers. The toggle animations on powers, equipment, effects, and NPC actions were implemented in a way that was very expensive to calculate, and it could also cause other aspects of the UI (such as updating the combat tracker) to feel slow due to the processing time for it. The new toggle animation looks a bit different, but rendering time on a character with a large number of detailed powers (such as the Level 5 Wizard pregen) was reduced from around 1,200ms to 190ms. There's still room to improve here, but it already feels much better in play!

## The Compendium Browser

![Compendium Browser - Creatures](https://mattsmithin-files.s3.amazonaws.com/screenshots/compendium-browser-light.png)

<details><summary><strong>Additional Screenshots</strong> (click to expand)</summary>
<img src="https://mattsmithin-files.s3.amazonaws.com/screenshots/compendium-browser-dark.png" alt="Compendium Browser - Nightmode"/>
<img src="https://mattsmithin-files.s3.amazonaws.com/screenshots/compendium-browser-powers.png" alt="Compendium Browser - Powers"/>
<img src="https://mattsmithin-files.s3.amazonaws.com/screenshots/compendium-browser-items.png" alt="Compendium Browser - Magic Items"/>
</details>

### How to Find it

You can access the compendium browser by clicking the _Browse Creatures_ button on the **Actors** sidebar directory or the _Browse Powers_ / _Browse Items_ buttons on the **Items** sidebar directory tab. It's the same compendium browser regardless of which way you access it; the button just changes which tab is the default. If you'd like to access it via a macro, make a script macro with the following code:

```js
// Alternatively, swap out the default tab for 'powers' or 'items'.
// Also, keep an eye out for future updates when we add more default options!
new game.archmage.ArchmageCompendiumBrowserApplication({defaultTab: 'creatures'}).render(true);
```

### Usage

#### Tabs

There are three tabs: `Creatures`, `Powers & Spells`, and `Magic Items`.

#### Filters

Each tab has its own set of sort options and filters. Some filters allow multiple selections, such as selecting either "Normal" _or_ "Large" as the creature size to filter. If you select options for different filters they will be restrictive however, such as creatures with the "Wrecker" role _and_ "Large" size.

> **Eyes Up, Fighters!**
> The new _Trigger_ filter is especially useful for characters with flexible attacks or other powers with triggers (looking at you, Commanders and The Occultist!). For instance, if you use `even` as your trigger filter and `fighter` as your source name, you'll be able to see every flexible attack for fighters that trigger on an even roll!

#### Compendium Entries

Each entry displayed by a given compendium browser tab is unique to that tab. After all, monsters need to display different info than class powers! We don't have column headings since some of the rows have stacked content, but if you hover over a property in the displayed entries it will show a tooltip describing what it is. For character powers, hovering over empty space will instead show the power usage as a tooltip since that information is otherwise conveyed by color coding only.

#### Interacting with Compendium Entries

Compendium entries displayed by the compendium browser should act just like they do in Foundry's built-in compendiums. Clicking an entry will pull up the locked version of its sheet, while dragging and dropping will work as follows:

- **Creatures**: Can be dragged and dropped onto the canvas or onto the actor sidebar directory.
- **Powers & Spells**: Can be dragged and dropped onto the character sheet or onto the items sidebar directory.
- **Magic Items**: Can be dragged and dropped onto the character sheet or onto the items sidebar directory.

## And more?

We're also hard at work on another exciting new feature, but development for it is still _ongoing_. Keep an eye out for new releases in the coming weeks!

## Credits

Thanks go out to @benstraub, @LegoFed3, and @Asacolips for their contributions in this release!