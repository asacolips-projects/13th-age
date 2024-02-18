# Release Notes 1.27.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.27.0/system.json

## Compatible Foundry versions

![Foundry v11.315](https://img.shields.io/badge/foundry-v11.315-green) ![Foundry v12](https://img.shields.io/badge/foundry-v12-yellow)

**Note**: Foundry v12 is currently in the prototype development phase. Full compatibility with it is not guaranteed.

## Features

- Updated manifest to allow installation on Foundry v12.
- Updated the **Backgrounds** fields on the character sheet to allow them to auto-grow in height if a background is long enough to wrap multiple lines. No longer will your backgrounds mysteriously disapper into nothingness!
- Added the new monsters from v4.0 of the official SRD! This means that we now have all of the SRD versions of the Bestiary 2 monsters. These monsters don't yet have a mapping for the token art from the Pathfinder 2 token pack, but that will also be added sometime in the near future. Huge thanks go out to @benstraub for transcribing all of this content!

### New Monsters from Bestiary 2

- Battle Shades
- The Bonded
- Bone Imp
- Briar Elf
- Coin Zombie
- Derro
- The Ebon Gauntlet
- Eidolon
- Elemental Beast
- Faun
- Fey
- Fire Giants
- Flux Elemental
- The Fomori
- Fallen Icon - Nature
- Frogfolk
- Ghost
- Gibbering Mouther
- Fallen Icon – Underground
- Fallen Icon – Undead
- Hallowed Gargoyle
- Hellcat (Bezekira)
- Demonic Icon Cult
- Hellstone Gargoyle
- Hellwarped Beast
- Horned Azinth
- Hubris Devil
- Hydra
- Kobold
- Kohwa
- Koruku
- Kroma Dragonic
- Laughing Demon
- Purple Dragon
- Minotaur
- Minotaurs—Citizens of Claster
- Naiad
- Nymph
- Owlbear
- Phoenix
- Rakshasa
- Reaver
- Salamander
- Shadow Mongoose
- Undead Cult
- Spell Golem
- Star-Masks
- Sunder Wraith
- Thunder Lizard
- Troglodytes
- The Waking Stones
- Xorn

## Bug Fixes

- Fixed a few v11 and v10 deprecations warnings.
- Fixed dead not applying dead status.
- Fixed staggered not being applied as overlay / being applied repeatedly.
- Fixed Wind's Comrade talent requirement to refer to Leaf on Wind rather than Heaven's Arrow.

## Developer Changes

- Removed node-libpng dependency from package.json. This was unused and prevented builds from working on M1 macs.
- Refactored build process for compendiums to use `@foundryvtt/foundryvtt-cli`. This allows us to compile directly to Foundry v11+ compatible LevelDB compendiums, and it allows extracting content from LevelDB compendiums. It's also much less hacky than our custom compendium compiler was!
- Created new `<TextareaGrow>` Vue component that can be used for auto-growing textarea elements.

## Credits

Thanks go out to @LegoFed3, @benstraub, and @asacolips for their contributions in this release!
