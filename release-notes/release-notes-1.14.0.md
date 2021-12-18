# Release Notes 1.14.0

> **Note**: This will be the final release of the system for Foundry 0.8.9. Future releases will be compatible with v9 and higher.

## Features

- Active Effects improvements
    - Implement Active Effects stacking rules (fixes built-in status effect overriding each other based on order of application, among other things)
    - Add initial support for duration-limited AEs via the times-up module
    - Automate Monk forms AC bonuses (if times-up is installed)
- Conditions improvements
    - Add Staggered condition
    - Automate application of the Dead and Staggered conditions (complete with a setting to set the latter as an overlay or regular status icon, and another to disable the feature entirely - e.g. if using CUB to do this)
    - Add (optional) extended status effect list
- Multi-attack "NLP" improvements
    - Handle every keyword
    - Handle up to 9 multiattacks directly in natural language or digits
- Powers improvements
    - Add new @pwrlvl shorthand to reference a power's level in inline rolls
    - Update Occultist powers that reference their own level when used to make use of @pwrlvl
    - Fix Elven Grace text
    - Add Heritage of the Sword feat, importable by the three shards of the elves
    - Major improvement of druid compendium entries
    - Move Animal Companion talent, feats and spells to own compendium, auto-loaded by the importer for duids and rangers
    - Clean up all compendium entries text from random newlines
    - Fix Song of Heroes' sustain value
    - Fix Force Tentacle's targeted defence
    - Add Sustain On to V2 sheet power preview
- Miscellaneous fixes
    - Add new setting to disable damage rolls manipulation on crits/fumbles

## Bug Fixes

- Fix processing of potential joint update of current and max hps, and simplify setting hps of new NPCs
- Fix healing from negative hps
- Fix occasional double consumption of recoveries when quick resting
- Assume 16+ for 0 recharge thresholds (sheet buttons included)
- Remove hardcoded dependency on barbarian class name - use detected class names instead
- Remove requirememnt of an explicit sign from recovery bonus form
- Do not change token dimensions for large/huge monsters if custom dimensions already set
- Handle HTML tags in NPC sheet and action cards
- Factor in Strong Recovery when computing the average amount of hps healed by a recovery
- Always hide inactive feats in power chat cards
- Silently record detected classes in older PCs - fixes importer for them
- Fix actor attributes not working in certain fields (#86 (closed))
- Localize yet more strings
- Code refactoring