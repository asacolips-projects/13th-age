# Release Notes 1.9.0

## Features
- Added colorblind options (protanopia/deutanopia, tritanopia) for power card colors.
- Added inline rolls to all classes in the compendium that did not have them previously!
- Added the necromancer to the compendium.
- Fixed several powers and missing powers in the Occultist and Chaosmage compendiums.
- Added option to compute class/multiclass base stats (HP, AC, damage die, etc.) based on class when the character's class name changes.
- Added weakling and elite creature sizes.
- Added support for negative recoveries causing reduced healing and a negative attack penalty (if using the `@std` attribute in inline rolls).
- Updated inline roll docs in the Attributes and Inline Rolls Reference dialog.
- Updated help documentation System Wiki docs.
- Added support for Strong Recovery feat.
- Added basic support for the [Autcomplete Inline Properties](https://foundryvtt.com/packages/autocomplete-inline-properties/) module, if enabled.
- Created new chat message template for ability/background checks. Ability check rolls will now include the character name, the character avatar, the ability name and bonus (including level) and the background name and bonus.
- Updated the icon roll chat message template to include the character avatar. Also updated it to automatically show the d6 rolls without having them initially collapsed, and to highlight 5s with a blue background and 6s with a green background.

## Bugfixes
- Updated recoveries to use tier multiplier on ability bonuses.
- Fixed a bug related to odd level recoveries.
- In addition to inline roll additions in the compendiums, fixed several small errors in existing compendium entries, and updated them to use `@std` rather than `@lvl+@ed` so that attack penalties can be included.