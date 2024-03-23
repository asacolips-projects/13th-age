## Downloads

Manifest URL: https://asacolips-artifacts.s3.amazonaws.com/archmage/1.29.1/system.json

## Compatible Foundry versions

![Foundry v11.315](https://img.shields.io/badge/Foundry-v11.315-green) ![Foundry v12](https://img.shields.io/badge/Foundry-v12-yellow)

**Note**: Foundry v12 is currently in the development phase. Full compatibility with it is not guaranteed.

## Changes

- We moved to GitHub! This shouldn't directly affect your game, but there are a few small things to keep in mind related to it.
  - Our manifest has moved. It's now stored at https://asacolips-artifacts.s3.amazonaws.com/archmage/latest/system.json and specific versions are at https://asacolips-artifacts.s3.amazonaws.com/archmage/1.29.1/system.json
  - Existing issues have been migrated and can be found here: https://github.com/asacolips-projects/13th-age/issues
  - Pull requests can be created here: https://github.com/asacolips-projects/13th-age/pulls

## Fixes

- Fixed a bug where players would see empty groups when viewing the settings page for the system. Players have fewer settings than GMs, so they should currently only be able to see the Automation, Appearance, and Accessibility groups.
- Fixed a bug where ongoing damage wouldn't properly parse on chat cards if it was using a raw number like `5 ongoing damage` instead of `[[5]] ongoing damage`. Now both will work!