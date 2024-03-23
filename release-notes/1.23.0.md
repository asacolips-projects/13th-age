# Release Notes 1.23.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.23.0/system.json

## Custom Class Support

We've tweaked the power importer to support modules and worlds adding new class and race content to the system. As an example of what a module using this would look like, Legofed3 has created a module for the Theurge class: https://github.com/LegoFed3/13a-theurge

- Moved power importer hardcoded constants to CONFIG for ease of modification by dependent submodules.
- Load descriptions and powers from multiple packs.
- Removed requirement of setting a class before opening the importer. Now it works with just a race or even nothing thanks to the general feats tab.

## Changes

- Move weapon value computation to rollData to support AE overrides
- Add new RollTable field to powers, to draw from the specified (by name) world or system rollTable and output the result as part of the power card.
- Update Chaos Mage, Rogue and Sorcerer content to automatically draw from system tables.
- Update Chaos Mage tables to automatically roll which Iconic power was selected
- Update Chaos Mage powers with Attack, Defense and Iconic: X custom groups
- Update Chaos Mage powers costs with shared daily and per battle spell counters, and automatically set custom resources up on class detection
- Update Druid Terrain Caster powers costs with shared daily counter
- Automatically set custom resources up on class detection, and allow 3pp modules to specify resources to configure for custom classes
- Add new `rsc` rollData sub-object with shorthands for official and labeled custom resources (and update the inline roll documentation to reflect it)

## Bug Fixes

- Fix mismatched modifier highlighting when key modifier is set and one component is zero
- Resolved an issue where inline rolls like `[[/r 2d4]]` caused a fatal error on the sheet when using the numeric roll replacement mode.
