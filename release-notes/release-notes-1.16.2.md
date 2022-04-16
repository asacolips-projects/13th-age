# Release Notes 1.16.2

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.16.2/system.json

## Bug Fixes

- Correctly apply resources to recognized classes
- Fix death plague orc stats (thanks Superwash!)
- Fixed hell imp attack bonus (thanks again, Superwash!)
- Add missing requirement to Just Stay Calm (thanks Nanoka!)
- Move official resource activation based on detected class to base stat calculation; add options to manually enable/disable them
- Correct modifyTokenAttribute override to be compatible with our setup and rules
- Override modifyTokenAttribute to avoid clamping of hp updates - handled manually to manage temp and negative hps
- Add setting to prevent autolimiting multi-attacks to selected targets
- Fix mispelling in fighter ranged attack
- Remove hp hack, just tie max hp update to hp update
- Rename 'feature' incremental to 'talent' (no class gets extra features at higher levels, but some do get extra talents)
- Remove optimistic automation of Outmaneuver
- Fix max hp edge case
- Fix npc max hp hack - default to 1 hp
- Fix wrong type being passed along with self rolls
- Make Dice So Nice animations respect roll mode when using powers
- Fix missing used recoveries in quick rest chat cards
- Move focus-gaining functionality to existing feature
- Add Gather Focus occultist feature power; remove random line breaks from Call of Doom
- Add gain logic to momentum and focus (CPs and Ki already support it), automate Outmaneuver
