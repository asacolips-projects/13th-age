# Release Notes 1.26.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.26.0/system.json

## Compatible Foundry versions

v10 - v11. Latest confirmed build supported is v11.304

## Features

> IMPORTANT! This release includes a data migration for actors and items, so back up your world before installing it!

- Refactor feat storage:
    - Support multiple feats of the same tier and skipping tiers
    - Add 2e Omega feat tier
    - Add buttons to create, delete and reorder feats to the power sheet
    - Add (optional) usage tracking and refill patterns (per-battle, daily, etc.) to feats
    - Add button to roll a single feat (instead of a whole power) to chat (reducing its uses if applicable) to the PC sheet
    - Add migration to update existing powers to new structure in user worlds
    - Update system power compendiums to use the new structure and include usage tracking information where appropriate
    - Update system power macros that reference feats
- Add "Apply as" context menu support to vanilla Foundry roll messages
- Add support for the Foundry "pop out" chat message feature
- Animated Dice improvements:
    - Support ghost dice (which still rolls visible 3d dice for hidden GM rolls, but all dice faces show ?s, so players know something was rolled, but not the result)
    - Add optional GM system setting to show 3d dice rolls for item/attacks rolls to players if the chat roll mode is set to Private GM roll. The chat card remains hidden, but this may be useful information to players for cases like the Fighter's Counter-Attack.
- Add support for daily/desperate recharge for equipment and power items
    - Automate daily/desperate recharge (once each per full heal up) on failing death saves or using last recovery
- Additional localization support:
    - Add separate even and odd triggers
    - Fix a recharge localization reference
    - Fix Icon chat card localization
    - Fix feat tier localization in power chat cards
    - Use a regex to parse known races (to support gender-dimorphic race names in some languages)
- Add an optional setting to make NPC actors 'take 10' on initiative rolls (leaving all the variability on the players side)

## Bug Fixes

- Multiple small fixes and improvements to compendium powers feats
- Fix animated dice not displaying on all clients
- Fix an issue preventing the correct reset of recharge attempts on full heal ups (affects both daily/desperate and the Recharge once per day only system setting)
- Remove errant '>' from power sheet
- Fix typo in the cleric's basic melee attack
- Fix initial recharge value of `Cure Wounds`
- Fix formatting of `High Arcana` and `Wizard's Familiar`
- Add missing `Utility` to `Hold Portal`
- Add `Cyclic` reminder to `Color Spray` and `Rebuke`
- Add missing ')' to `Invisibility`
- Add condition parsing syntax to `Ray of Frost`
- Add missing trigger to `Shield`
- Fix special text in `Teleport Shield`
- Add missing parentheses to `Haste`
- Remove errant text in the wizard's melee attack
- Remove inline roll from higher level `Overcome Resistance` (update the `Target:` line instead to make use of automatic multi-attacks)
- Ask usage confirmation with zero uses left for `equipment`, `loot` (and `tool`) type items in addition to `power` ones
- Silence some console warnings in Foundry v11

## Credits

Thanks to @manoelmozzer, @mhilbrunner and @legofed3 for their contributions in this release!
