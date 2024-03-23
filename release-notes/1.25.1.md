# Release Notes 1.25.1

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.25.1/system.json

**Update 1.25.1** for the official [Foundry 13th Age system](https://foundryvtt.com/packages/archmage)
was just released. This smaller update contains mostly a few bug fixes and UI improvements.
As always, backup your game before updating the system!

## Improvements and Bugfixes

- NPC sheet headers got a small facelift, making more efficient use of space. Toggling details is now less fiddly, the actor image got room to breathe and is bigger, and empty fields for **Resistances** and **Vulnerabilities** are only shown when expanded.
- Token names are now used in chat instead of actor names wherever possible for less spoilers and improved consistency, as was already the case for targeting automation.
- Escalation Die controls (**+**/**-**) are now hidden for non-GM players. They couldn't be used anyway!
- The Escalation Die and Terrain UI are now attached to the macro hotbar and move with it, properly adapting to various screen resolutions, configurations and aspect ratios.
- Added a new system compendium for Random Monster Abilities.
- Added system roll tables for dire animals, demons and dragons based on the above.
- Icon names are now used for the **Bard**, **Chaos Mage**, **Druid** and **Sorcerer** content, thanks to the system becoming official.
- Macro data is now unpacked in case a macro replaces variables instead of modifying them.
- Both *Hampered* and *Hindered* conditions are now kept around to make sure old **1e** references still work in **2e**.
- Fixed editing NPC sheets in Night Mode, changing the header will no longer have white-on-white popup text.
- Fixed rolling a few powers like *Charm Person* resulting in too many dice rolls.
- Fixed a few tooltips, hints and outdated references to older Foundry data structures.
- Fixed **PopOut!** module compatibility, power/item detail toggling and tab switching now work in popouts.
- Fixed the system Active Effect sheet so it no longer removes changes made via other means (like the core sheet) or generates empty changes.

## Localization

- The **vs.** (as in **+7 vs. AC**) in chat cards, powers etc. can now be properly localized.
- Equipment bonuses in the sheet inventory tab can now  localized.
- Even/odd trigger handling was improved for easier localization.
- Added various new translation strings that were hardcoded before.
