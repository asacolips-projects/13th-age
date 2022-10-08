# Release Notes 1.22.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.22.0/system.json

## Features

- [BREAKING] Refactored the Sequencer module integration to use separate files
  for the ray, target, and self properties. This is a breaking change from the
  previous Sequencer integration, and any powers that used it previously will
  need to be manually updated.
- Added an option to quickly delete powers/items from character sheets by
  holding shift when clicking the delete icon for them.
- Added a new **Embedded Macro** field to powers that will allow you to create
  macros directly within powers that will execute when the power is used. If
  the _CodeMirror module is enabled, the macro field will use it for better
  syntax highlighting and display. Thanks to @inigos and @LegoFed3 for the
  implementation on this!
- Updated a few of the SRD powers to include embedded macros both as examples
  and to test out adding additional automation. These have been abstracted using
  a new `ArchmageMacros` class so that we can update SRD compendium macros for
  future Foundry VTT API updates without requiring users to manually update
  their powers. The powers we've included macros for are:
    - Aasimar: Halo
    - Commander: Outmaneuver
    - Fighter: Carve an Opening
    - Fighter: Defensive Fighting (works best with _Times Up_ installed and active).
    - Wizard: Light (Cantrip)
- Updated the **Import Powers** dialog to preselect any race or class features
  that are not already present on your character.
- Added a new **Dice Formula Mode** option to the Settings tab of the character
  sheet that affects how inline rolls are displayed on the character sheet when
  clicking to expand them. This has three modes:
    - short - The mode that's currently used. Shows a condensed version, such
      as `WPN+STR.MOD`
    - long - Display the original inline roll text, such as
      `[[@wpn.m.dice+@str.mod]]`
    - numeric - Display the roll with all numeric bonuses calculated,
      including magic item modifiers, escalation die, and active effects.
      For example: `4d8+5` for a STR of +3 and escalation +2.

## Bug Fixes

- Fixed prototype token update on portrait update (including an issue with Tokenizer).
- Fixed additional v10 warnings that were missed in the previous release.