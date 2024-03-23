## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.19.0/system.json

## Features

- **v2 NPC sheet**! See the **V2 NPC Sheet** section below for more details! The original NPC sheet is still available and can be switched to by setting the sheet to the "Legacy NPC Sheet".
- **NPC initiative** no longer includes the NPC's level. Now, NPC initiative will use the exact value you enter, and we've included a migration to update all of your actors, tokens, and compendiums to account for it.
- **SRD Monster Compendiums** have been updated to include inline rolls for _most_ use cases. There have been a few outliers that slipped through the cracks, but virtually every monster in the SRD compendium was updated to have inline rolls added for their targeting lines and their damage. This only applies to monsters in the compendium.
- **Sorcerer's random energy** was updated to use a new table and macro to improve its automation. You'll need to re-add the random energy power to your character(s) from the compendium for them to take effect.
- **Conditions** have had several improvements:
    - Apply condition parsing to PC feats
    - Allow conditions to be dropped onto NPCs
    - Allow conditions to be dropped onto tokens
- **Inline roll display** on character sheets has been improved. The new NPC sheet introduces an improved renderer for inline rolls to make them more closely resemble the book content (such as `WPN` instead of `@wpn.m.dice`), and we've backported that to work on the character sheets as well!

## The V2 NPC Sheet

We've created a new NPC sheet using the same framework (Vue) as the character sheet! This sheet has been redesigned from the ground up to more closely resemble the layout of statblocks from official and 3rd party books while also aiming for significantly improved functionality.

### The Header

To start, the header of the new sheet now includes flavor text and a cleaner presentation for details like size, type, and role. To allow for the new presentation, some of the properties in the header will require you to click them to open up a pop-up editor with additional details, sort of like how the text editor works for long text fields.

### Attributes

Attributes are now in a row directly below the header and above the NPC sheet tabs. These include defenses and hit points as before, but now there are two new columns for Saves and Disengage checks that work the same as they do on the PC character sheet.

### Compact Mode

There's also a small arrow in the bottom right corner of the NPC sheet header (just below the NPC's avatar) that puts the sheet into a compact mode by reducing the size of the header and attributes and hiding some items less important for play such as flavor text. This is handled as a flag per actor, so it will persist between page reloads.

### Tabs

We now have 5 tabs on the NPC sheet:

- Details
- Actions
- Effects
- Modify Level
- Settings

### Details

The NPC's biography! This field always existed, but we never had a place for it before. We're likely going to expand this section to include other long text fields like battle tactics, story hooks, and icons.

### Actions

Actions, Traits, and Nastier Specials now work similar to how Powers work on character sheets. Some quick highlights:

- All three types support avatars! These will show up in place of their roll icon on the sheet if used, and they'll be visible on chat messages as well.
- Actions now show a reduced amount of info initially (attack and hit), and additional info can be toggled visible by clicking the action name or arrow.
- Inline rolls display in a new summarized format, such as `+8+LVL+ED`. This doesn't do the full actor data parse like chat does, but it does help show the relevant roll info in a condensed and familiar format.

### Effects

These work exactly like they do for character sheets! Conditions and custom effects will show up here and can be created, edited, or removed right from the sheet.

### Modify Level

The modify level tab includes a slider that lets you adjust the level of the monster within the constraints allowed by the core rules (+/- 6, min 0, max 15), shows you a preview of the defensive stat changes, and then allows you create a copy of the monster in a single click. The copy of the monster will be created as a new actor in your world's actor directory and the system will make a best effort calculation to change the NPC's stats, attacks, and damage.

This feature is experimental, and we're looking forward to improving it with feedback on what works and what doesn't!

### Settings (gear icon)

As with the character sheet, settings have been moved into their own tab. This currently only includes visual information such as the avatar settings and the ability to switch the NPC sheet to night mode, but we'll likely expand this in the future with additional settings!