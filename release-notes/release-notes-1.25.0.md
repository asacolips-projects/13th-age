# Release Notes 1.25.0 (beta 1)

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.25.0.beta-1/system.json

## Changes

- [i18n] Added and improved _many_ localization strings throughout the system.
- [i18n] Added localization for attack trigger detection. More work is planned for this in the future so that a tagging system is used for more flexibility, but this does allow for localizing compendiums in the meantime.
- [i18n] Added localization support for the class parser.
- [Fix] Fixed error on combat creation
- [Fix] Remove unused translation strings
- [Fix] miss rage thrown attack
- [Fix] barbarian building frenzy
- [Feature] Hide the sections for Backgrounds and Icon Relationships if all entries are disabled in the sheet settings. Previously, only the section titles remained.
- [Feature] Add sheet options to hide the One Unique Thing and Incremental Advancements sections in the sheet sidebar. By default, both sections are visible as before.
- [Feature] Hide the title image icons from item chat cards if they have no icon assigned (i.e., it's just mystery man).
- [Feature] Added a 'Misc.' section to the actions tab of the NPC sheet that displays all other items that would previously be hidden.
    - This section is special in that in only shows if such items exist on the actor and in that is has no + New button to create new items, they can only be added via drag and drop.
    - This feature is useful for bookkeeping (i.e., to remember a certain dragon drops a certain piece of loot, or that an archmage uses a special staff that may then drop). Its also plain useful to see stuff you dropped onto the actor, instead of it disappearing but being invisibly there.
- [Fix] Fixed various typos and broken image links.
- [Fix] item sheet's Show Players button failing to work for players due to insufficient permissions
- [Fix] sequencer interaction with several targeting edge cases
- [Fix] codemirror integration for items without embedded macros
- [Fix] Halo embedded macro
- [Fix] embedded macros referencing the user's selected character instead of the item's owner
- [Fix] embedded macro field not being visible in action sheet
- [Feature] Add embedded macro field to equipment, trait and nastierSpecial sheets
- [Feature] Add MacroUtils sub-object to the global game.archmage object to access the setDuration helper method for AEs
- [Feature] Add Whirlwind embedded macro
- [Fix] Clamp actor levels to valid ranges: [1, 10] for PCs and [0, 15] for NPCs (fixes #161 (closed))
- [Feature] Set Barbarian Rage to Recharge 16+ by default
- [Fix] Improve README formatting, especially fixing some naked links, some of which were broken/invalid
- [Fix] two small typos in english localization
- [Fix] Add *.log to .gitignore (a log file is generated in the project directory on Vue build errors)
- [Fix] Remove New Item from Prismatic Ogre Mage SRD entry
- [Fix] Remove unused localization keys, most of which are from the old sheet
- [Fix] Removed various dnd5e references
- [Fix] Update Double Melee Attack, Double Ranged Attack, Flying Blade and Shifter Beast Form Attack to use @lvldice for compatibility with 2e scaling (if enabled)
- [Fix] Hide sequencer fields under details in power/action sheet 
- [Fix] even level spell levels not being highlighted in chat cards
- [Fix] death saves failure counter increasing even on successes if at positive hps
- [Fix] Removed obsolete sheets
- [Fix] Switched the Defenses and HP sections on NPC sheets so HP come first, like on PC sheets.
- [Fix] Fixed item sheet scrolling back to top on update (re-render)
- [Fix] Added top-padding to confirm/cancel buttons on sheet dialogs.
- [Feature] Improved support for Active Effects
    - Icon now no longer unsets itself
    - Adds support for Description in Config and Display
    - Add Crit Range mod and defense bonuses
    - When adding a negative value, render a minus instead (Attack - 2 rather than Attack + -2)
- [Feature] Added a Combat Rhythm resource when using the 2e system setting
- [Feature] Added an option to configure and display druid Terrains on scenes. When enabled, listed terrains will be displayed near the escalation die in the bottom left of the screen.
- [Feature] Renamed powers `cost` field to `resources`
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
- [Feature] Adds optional sheet settings (disabled by default) for the following:
    - Hiding power groups that are empty (i.e., the character has no powers for), besides the first/default group, which is always shown
    - Hiding the currency/coin section at the top of the inventory
    - Hiding the "Import Power" button for players
    - Hiding the "Settings" sheet tab for players
- [Fix] Fixed #163 by adding "is GM" check to the character post-create hook
- [Fix] Added null checks for nonexistant resources
- [Fix] Adjusted color gradient on powers to extend the darker range of it and improve contrast with the white icons/text on the right edge of power names.
- [Fix] Fixed `Background` and `Ability` popup labels being switched (background selection was labelled `Ability:`, and vice versa)
- [Fix] Fixed `Roll Mode` dropdown selection in roll dialog popups having no effect (present in Ability/Background rolls)
    - The selected roll mode now always overrides the current roll mode selected above the chat for this roll
    - The dropdown is initialized to whatever is currently selected above chat (like in 5E), so if you just click through, you still get whatever you have currently selected as default
    - The Roll Mode is now actually correctly passed (if the chat message type is "Roll", it needs to be set in the separate config, not only in Chat Data when creating a chat message)
- [Fix] Improved vertical alignment of the number text in roll formulas and totals in chat cards.
- [Fix] Adds a proper title to the delete confirm popup and moves the current title to the popup content. This makes the popup look more like other Foundry/Archmage popups, and also avoids issues with long localizations being cutoff in the title.
- [Fix] Improved padding between dice icon and number in inline rolls.
- [Fix] Fixed a subtle bug: Lines with `Chain Spell` were previously ignored during parsing, should have been `Chain Spell:`, otherwise target lines may be mistakenly ignored as well.
- [Fix] Fixed every inline roll context menu entry being highlighted (due to inheriting the highlight from the parent element)
- [Fix] When 3D dice rolls (i.e., Dice So Nice) are enabled, currently for some rolls, the result is spoiled before the 3D dice finish rolling, as the UI is already updated:
    - Death saves and last gasp saves get crossed out/removed immediately on roll start
    - Item recharge handles success/failure immediately
    - Icon rolls show earned 5s/6s immediately
    - Same for commander rolls
- [Feature] Added tooltips to the character sheet with rule summaries. These are disabled by default due to how invasive they can be for regular gameplay, but they're a handy aid for new players. 
- [Fix] Fixed trigger parsing errors for attacks like the **Gargoyle**'s "Furious claws and fangs" attack, which contains the trigger word "even" later in its description.
- [Feature] Added support for temp HP on token HP bars.
- [Fix] Fixed an issue where the **save bonus** on active effects wouldn't work or display correctly.
- [Feature] Add "Apply as Half Healing" to the damage/healing context menu.
- [Feature] [Breaking] Moved the "night mode" setting out of the character sheet and into the system settings so that it applies across all characters. This setting is not automatically set and players who used night mode previously will need to enable it.
- [Fix] Add a UI notification when rolling initiative via PC sheet button if no encounter exists in the combat tracker, instead of just silently doing nothing.
- [Fix] Updated dropdown styling on night mode to have a dark background.
- [Fix] Updated the condition that's applied at 0 HP to be unconscious on PC actors rather than dead.

## Credits

Thanks to @manoelmozzer, @mhilbrunner, @legofed3, and @cswendrowski for their contributions in this release!