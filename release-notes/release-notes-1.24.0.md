# Release Notes 1.24.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.24.0/system.json

## 13th Age 2e Support

Added a new setting to enable support for 13th Age 2e. With it active, the following changes will be applied:

- Update death save automation
- Update dmg progression to 1/2/4x
- Update dice level progression to 1/2/3/4/5/6/8/10/12/16(/20)
- Update conditions (names, mechanics & journals)
- Update toughness
- Update strong recovery
- Add new ability multiplier, recovery and skills & initiative incrementals
- Hide and disable deprecated incrementals
- Adjust base stats calculation
- Add Mental Phenomenon flag to use Int instead of Dex for AC, PD and Initiative calculation
- Add `@lvldice` shorthand for custom formulae needing to access the number of weapon/recovery dice per level
- Localize race/kin in sheet and importer

## Features & Fixes (for both editions)

- Support multidice recovery dice (e.g. 2d6)
- Add even level fields to powers
- Remove Improved Initiative flag (with migration to move the bonus to the sheet initative adjustment field)
- Fix condition dragging to tokens
- Improved font handling for ability scores and defenses when large numbers are accidentally entered in them
- Add system rolltables for Greeting Fist and Improved Sneak Attack
- Add game's main consumable loot to new SRD Magic Items - Consumables compendium
- Fix annoying 'user lacks permission to updated actor' error messages on combat creation and deletion
- Fix Unconscious condition links wrongly referencing Confused instead 
- Fix npc autoLevel being wrongly triggered by hitting enter while editing the npc vue sheet

## Bonus Feature! Add support for token art provided by modules (both editions)

We've added support for modules to include a `archmage-art` flag to enable on-the-fly portrait and token art replacements for compendium actors. For this initial release, we've coordinated with Cora to add one of these mappings to the official [Pathfinder Token Pack: Bestiaries](https://foundryvtt.com/packages/pf2e-tokens-bestiaries) premium module. If you have that module purchased and enabled, the 395 monsters included in our `SRD Monsters` compendium will use the fantastic art in the screenshot below!

![Screenshot of Toolkit13 tokens using Pathfinder 2e's official token art](https://mattsmithin-files.s3.amazonaws.com/screenshots/13a-pf2e-token-art.webp)

## Adding custom image mappings

If you would like add your own art mapping in a custom module, you can use this JSON file as an example mapping: https://mattsmithin-files.s3.amazonaws.com/map-archmage.json

Once you have a mapping, you can include that in your custom module by adding the following flags section to your module's manifest:

```json
"flags": {
    "my_module_name": {
        "archmage-art": "modules/my_module_name/map-archmage.json"
    }
}
```