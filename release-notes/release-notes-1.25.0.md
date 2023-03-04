# Release Notes 1.25.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.25.0/system.json

## Localization Improvements

- Added and improved _many_ localization strings throughout the system.
- Added localization for attack trigger detection. More work is planned for this in the future so that a tagging system is used for more flexibility, but this does allow for localizing compendiums in the meantime.
- Added localization support for the class parser.

## Features
- [**Breaking**] Moved the "night mode" setting out of the character sheet and into the system settings so that it applies across all characters. This setting is not automatically set and players who used night mode previously will need to enable it.
- Hide the sections for Backgrounds and Icon Relationships if all entries are disabled in the sheet settings. Previously, only the section titles remained.
- Add sheet options to hide the One Unique Thing and Incremental Advancements sections in the sheet sidebar. By default, both sections are visible as before.
- Adds optional sheet settings (disabled by default) for the following:
    - Hiding power groups that are empty (i.e., the character has no powers for), besides the first/default group, which is always shown
    - Hiding the currency/coin section at the top of the inventory
    - Hiding the "Import Power" button for players
    - Hiding the "Settings" sheet tab for players
- Added tooltips to the character sheet with rule summaries. These are disabled by default due to how invasive they can be for regular gameplay, but they're a handy aid for new players. 
- Added support for temp HP on token HP bars.
- Add "Apply as Half Healing" to the damage/healing context menu.
- Hide the title image icons from item chat cards if they have no icon assigned (i.e., it's just mystery man).
- Added a 'Misc.' section to the actions tab of the NPC sheet that displays all other items that would previously be hidden.
    - This section is special in that in only shows if such items exist on the actor and in that is has no + New button to create new items, they can only be added via drag and drop.
    - This feature is useful for bookkeeping (i.e., to remember a certain dragon drops a certain piece of loot, or that an archmage uses a special staff that may then drop). Its also plain useful to see stuff you dropped onto the actor, instead of it disappearing but being invisibly there.
- Add embedded macro field to equipment, trait and nastierSpecial sheets
- Add MacroUtils sub-object to the global game.archmage object to access the setDuration helper method for AEs
- Add Whirlwind embedded macro
- Set Barbarian Rage to Recharge 16+ by default
- Improved support for Active Effects
    - Icon now no longer unsets itself
    - Adds support for Description in Config and Display
    - Add Crit Range mod and defense bonuses
    - When adding a negative value, render a minus instead (Attack - 2 rather than Attack + -2)
- Added a Combat Rhythm resource when using the 2e system setting
- Added an option to configure and display druid Terrains on scenes. When enabled, listed terrains will be displayed near the escalation die in the bottom left of the screen.
- Renamed powers `cost` field to `resources`
    - Implement a new syntax for the automatic manipulation of resources via powers:
        - For *numeric* resources (command points, ki, custom resources):
            - `+N resourcename` to increase the resource value
            - `-N resourcename` to decrease the resource value (asks confirmation if `<=0`)
            - `N resourcename` to override the resource value
        - For *binary/flag* resources (momentum, focus, custom resources):
            - `+resourcename` to set the resource value
            - `-resourcename` to unset the resource value (asks confirmation if already unset)
            - `resourcename` to test the resource value (asks confirmation if unset)
        - Note: Custom resources always display as numeric but can be treated as flags (0=false, 1=true, useful for math in inline rolls)
    - Support handling multiple (comma-separated) resources in resources field
    - Support resource name localization
    - Support inline rolls in resources field
    - Support recoveries as a resource in resources field
    - Support compendium links in `rollTable` field 
    - Support altering most outcomes of item usage in embedded macros
    - Add support for the new `Combat Rhythm` resource (!291)
    - Add automatic command points updates to the `Fight from the Front` and `Weigh the Odds` powers
    - Add migration to move legacy powers cost field to new field and syntax
    - Add new syntax to in-game documentation
    - Update system powers to use new field and syntax

## Bug Fixes

- Fixed error on combat creation
- Remove unused translation strings
- Fixed miss rage thrown attack
- Fixed barbarian building frenzy
- Fixed various typos and broken image links.
- Fixed item sheet's Show Players button failing to work for players due to insufficient permissions
- Fixed sequencer interaction with several targeting edge cases
- Fixed codemirror integration for items without embedded macros
- Fixed Halo embedded macro
- Fixed embedded macros referencing the user's selected character instead of the item's owner
- Fixed embedded macro field not being visible in action sheet
- Clamp actor levels to valid ranges: [1, 10] for PCs and [0, 15] for NPCs (fixes #161 (closed))
- Improve README formatting, especially fixing some naked links, some of which were broken/invalid
- Corrected two small typos in english localization
- Add *.log to .gitignore (a log file is generated in the project directory on Vue build errors)
- Remove New Item from Prismatic Ogre Mage SRD entry
- Remove unused localization keys, most of which are from the old sheet
- Removed various dnd5e references
- Update Double Melee Attack, Double Ranged Attack, Flying Blade and Shifter Beast Form Attack to use @lvldice for compatibility with 2e scaling (if enabled)
- Hide sequencer fields under details in power/action sheet 
- Fixed even level spell levels not being highlighted in chat cards
- Fixed death saves failure counter increasing even on successes if at positive hps
- Removed obsolete sheets
- Switched the Defenses and HP sections on NPC sheets so HP come first, like on PC sheets.
- Fixed item sheet scrolling back to top on update (re-render)
- Added top-padding to confirm/cancel buttons on sheet dialogs.
- Fixed #163 by adding "is GM" check to the character post-create hook
- Added null checks for nonexistant resources
- Adjusted color gradient on powers to extend the darker range of it and improve contrast with the white icons/text on the right edge of power names.
- Fixed `Background` and `Ability` popup labels being switched (background selection was labelled `Ability:`, and vice versa)
- Fixed `Roll Mode` dropdown selection in roll dialog popups having no effect (present in Ability/Background rolls)
    - The selected roll mode now always overrides the current roll mode selected above the chat for this roll
    - The dropdown is initialized to whatever is currently selected above chat (like in 5E), so if you just click through, you still get whatever you have currently selected as default
    - The Roll Mode is now actually correctly passed (if the chat message type is "Roll", it needs to be set in the separate config, not only in Chat Data when creating a chat message)
- Improved vertical alignment of the number text in roll formulas and totals in chat cards.
- Adds a proper title to the delete confirm popup and moves the current title to the popup content. This makes the popup look more like other Foundry/Archmage popups, and also avoids issues with long localizations being cutoff in the title.
- Improved padding between dice icon and number in inline rolls.
- Fixed a subtle bug: Lines with `Chain Spell` were previously ignored during parsing, should have been `Chain Spell:`, otherwise target lines may be mistakenly ignored as well.
- Fixed every inline roll context menu entry being highlighted (due to inheriting the highlight from the parent element)
- When 3D dice rolls (i.e., Dice So Nice) are enabled, currently for some rolls, the result is spoiled before the 3D dice finish rolling, as the UI is already updated:
    - Death saves and last gasp saves get crossed out/removed immediately on roll start
    - Item recharge handles success/failure immediately
    - Icon rolls show earned 5s/6s immediately
    - Same for commander rolls
- Fixed trigger parsing errors for attacks like the **Gargoyle**'s "Furious claws and fangs" attack, which contains the trigger word "even" later in its description.
- Fixed an issue where the **save bonus** on active effects wouldn't work or display correctly.
- Added a UI notification when rolling initiative via PC sheet button if no encounter exists in the combat tracker, instead of just silently doing nothing.
- Updated dropdown styling on night mode to have a dark background.
- Updated the condition that's applied at 0 HP to be unconscious on PC actors rather than dead.

## Credits

Thanks to @manoelmozzer, @mhilbrunner, @legofed3, and @cswendrowski for their contributions in this release!