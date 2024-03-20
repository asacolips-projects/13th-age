## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.29.0/system.json

## Compatible Foundry versions

![Foundry v11.315](https://img.shields.io/badge/Foundry-v11.315-green) ![Foundry v12](https://img.shields.io/badge/Foundry-v12-yellow)

**Note**: Foundry v12 is currently in the development phase. Full compatibility with it is not guaranteed.

## Changes

- Added support for ongoing effects and damage! This is one of our most powerful automation features yet. This is still an experimental feature, so we've added a system setting to enable or disable it. It's enabled by default, so make sure to try it out and let us know what works well and what could use improvement! See the **Ongoing Effects** section below for more details.
- Updated the integration with the [Pathfinder Token Pack: Bestiaries](https://foundryvtt.com/packages/pf2e-tokens-bestiaries) module to include support for the recently added Bestiary 2 monsters.
- Updated chat card display as part of the ongoing effects changes. The two most significant changes are:
    - Hits and misses now have a background color and a slight underline to more clearly distinguish them. Misses also use a red background rather than being the same green as hits.
    - Updated the display of effects/conditions on chat cards to make them flow better with other text and make it more clear that they're draggable by changing the cursor style on hover. The new display removes the background and border and opts to go with a purple underline instead.
- Redesigned the 13th Age system's settings to be organized into collapsible sections. The new sections are:
    - 2e Playtest
    - Automation
    - Appearance
    - Accessibility
    - General
- Updated the color blind mode setting to show a preview of what the power band colors look like on each mode. Now you can more easily tell which mode will work best for you!
- Overhauled our color variables to use CSS variables. This is mostly an under the hood change, but the most significant effect of this is that some of our color blind mode changes apply more accurately to more places now.

## Fixes

- Removed Never Say Die from the Barbarian pregen, bringing it back in line with the Pelgrane version.
- Fixed a subtle bug related to the Pathfinder token pack artwork not loading correctly if the compendium browser had been opened at least once.
- Added a loading message to the compendium browser when first opening a tab in it.
- Fixed a bug where hitting the enter key inside a compendium browser field would cause the page to refresh.

## Ongoing Effects

- Added the following durations to the active effect document sheet:
    - Infinite
    - Unknown
    - Start of Next Turn
    - End of Next Turn
    - Start of Next Source Turn (requires actor ID in effect source field)
    - End of Next Source Turn (requires actor ID in effect source field)
    - Easy Save Ends
    - Normal Save Ends
    - Hard Save Ends
    - End of Battle
    - Start of Each Turn
- Added logic to parse chat messages for ongoing damage and render them as effects that can be dropped onto tokens or character sheets.
- Added new auto-generated chat messages for start of turn effects/sustain and end of turn effects which will render automatically based on when combatant turns end in the combat tracker. Effects that show up on these cards:
    - Can be dragged and dropped onto any actor or token to duplicate the effect.
    - Can apply their damage (if ongoing damage) to the actor via button click.
    - Can be saved against (if a save duration) via button click.
    - Can be removed from the actor via button click.
- Added auto-generated start of turn reminders to roll to reuse used breath spells or sustain songs.
- Auto-remove effects with durations on combat end, and added end-of-combat chat messages that report on what was removed and any lingering effect.
- Removed `times-up` dependency for effect durations.
    - Updated the `MacroUtils.setDuration()` helper method to work with the new in-system logic instead.
    - Enabled the monk's auto-generated AC bonuses for all users, not just those using `times-up`.
    - Updated all system macros to use the new durations for expiring any generated effect.
    - Implemented a new macro for the `Hammer of Faith` spell.

## Credits

Thanks go out to @cswendrowski, @benstraub, @LegoFed3, and @Asacolips for their contributions in this release!