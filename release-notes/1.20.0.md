# Release Notes 1.20.0

## Downloads

Manifest URL: https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/1.20.0/system.json

## Features

- Added a new `powerOriginName` field to character powers and updated the SRD
  compendiums to include data for it. This field is intended as reference to the
  original power name when the power's name is customized for any reason (such
  as the wizard's polysyllabic verbalizations talent).
- New characters are now set as linked tokens when created.
- Added a new plain gray token as a default image for new characters.
- Added a set of colorized token borders. These can be found in
  `systems/archmage/assets/icons/tokens/borders` in the User Data tab of the
  file picker.
- Added default tokens for monsters by type to all SRD monsters. While we
  couldn't get unique art for every monster, we colorized a tokens/coins asset
  pack by Rexard so that each monster type (aberration, beast, construct, etc.)
  has a token associated with it. In addition, dragons and elementals have
  unique tokens for each of their subtypes.
- Added a feature to automatically update token artwork/name changes when the
  actor's artwork or name changes and they haven't been customized for the
  token separately.
- Added a new feature to update a monsters token artwork when the monster type
  is changed. This feature only applies to monsters that do not have a custom
  image set for their actor/token.

## Bugfixes

- Added support for the Tokenizer module! This was broken after we created the
  v2 character and NPC sheets, but it's now working again.