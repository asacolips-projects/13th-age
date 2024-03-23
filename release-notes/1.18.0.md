# Release Notes 1.18.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.18.0/system.json

## Features

- Added support for conditions as draggable active effects in chat messages. To have a condition output as an effect, surround it with `*` asterisks, such as `*stunned*` or `*weakened*`.
- All of the existing monsters and powers in the SRD compendiums have been updated to use the new condition effects.
- Upgraded the version of Vue used by the character sheet to Vue 3 and removed the system's dependency on both VuePort and dlopen. This also includes some minor improvements to the render loop for character sheets. The Vue 3 upgrade has also simplified our development process and allowed us to start working on the v2 NPC sheet for release very soon!

## Bug Fixes

- Content Fixes
    - Added trog stench trait (thanks to Superwash for catching this one!)
    - Cleaned up the Strong Recovery hint.
- Sequencer Fixes
    - Enable sequencer support for PC powers as well as NPC actions.
    - Delay sequencer animations until after dice animations.
    - Add option to stretch sequencer effects from caster to target.
    - Add option for source-only animations.

