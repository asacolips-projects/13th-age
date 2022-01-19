# Release Notes 1.16.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.16.0/system.json

## Features

- Automatically apply the Key Modifier multiclassing rule
    - Add key modifier to PC sheet options
    - Auto-configure it based on detected classes
    - Automatically make mod and dmg (and lvl) properties of ability scores depend on the lower of the two ability scores indicated by the key modifier
    - Add new nonKey sub-object with unaltered mod and dmg (and lvlmod) properties for those rare cases that eschew the key modifier (mostly useful internally, for e.g. skill checks, initiative and recoveries)
    - Update inline rolls documentation
    - If an ability score is a key modifier and is reduced due to the other key mod, it will show up using a red color on the character sheet.

## Bug Fixes

- Updated scrolling text feature to be visible to all clients.
- Allow death saves with >0 hp (at least one official monster requires them).
- Apply helpless after first failed last gasps save.
- Fixed resetting death/last gasp saves.
- Allow to gate save bonuses from items below hp treshold.
- Fixed staggered/dead application order, and staggered being applied to low max hp npcs incorrectly.
- Handle negative custom resource costs to automate gaining a resource.
- Fixed an issue with disengage rolls.