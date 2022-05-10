# Release Notes 1.17.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.17.0/system.json

## Features

- Add offensive and defensive crit modifiers to actors and the PC sheet options
    - Add logic to highlight crit based on the thusly modified crit range
    - Add Active Effect to the Vulnerable condition to automate its effect
    - Bold critted/fumbled target names in hit/miss line
    - **Remove auto-doubling/zeroing of damage** (and related settings), use the damage applicator menu instead
- Add several new compendia with pre-entered magic items from the official SRD
- Add confirmation dialog to item and effect deletion in V2 sheet
- Expand custom resources up to 9

## Bug Fixes

- Display improvements
    - Dynamically shift inline roll context menu left to avoid horizontal overflow
    - Highlight high level spell lines matching the current power level
    - Remove customizations to TinyMCE that hid useful controls
    - Update the item sheet's form input labels to be 170px wide for a more consistent presentation
    - Remove `maneuver` power type, display legacy maneuver powers as `flexible` instead
    - Merge `tool` and `loot` groups in PC sheet
- Items improvements
    - Fix sending tool and loot items to chat
    - Fix full heal ups resetting uses of items with `other` usage
    - Fix Ki resource update
    - Create separate powers for Ki powers
    - Separate cleric invocations from domain powers, clean up the latter
    - Clarify `Thief's Strike`, prevent non-integer damage rolls
    - Split `Slick Feint` into separate powers
    - Fix `Procession of the Sun and Moon`'s epic feat
    - Fix `Assassin's Gambit` power
    - Fix `Swordwork` recharge value
    - Fix `Three Dooms` spell
    - Fix wizard's `Ranged Basic Attack`
    - Clean up `Wizard's Familiar` and `Cantrips`
    - Mark cantrips and utility spells more clearly
    - Move `Sleep`'s target line to special to avoid unwanted interaction with the multi-target automation
    - Add missing `Overworld Advantage` wizard feature
