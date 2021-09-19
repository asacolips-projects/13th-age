# Release Notes 1.13.0

## Features

* Adds support for active effects. This implementation adds a new **Effects** tab that allows active effects to be manually created, edited, or removed.
* Removed Foundry core conditions and replaced them with conditions that match the Archmage Engine SRD. The new conditions are pre-configured to include active effects for penalties and bonuses as needed by the rules.
* Refactor negative recovery penalties to use Active Effects (to bypass `@std`, this works for powers that use `+@lvl+@ed`).
* Add support for dynamically adding attackMod.value to all attack rolls.
* Add support for the Crescendo spell variable penalty to attacks.
* Make equipment rechargeable (with appropriate options and integration with rests) and add option to disable a magic item (it's bonuses won't be added to attacks, defences, etc.).
* Use init mod to resolve initiative ties rather than dexterity score. If this system setting is disabled, monsters will win ties instead (per the rules).
* Added `Spirit` creature type.
* Changes related to Dice So Nice:
    * Override Dice So Nice parsing all inline rolls in chat cards by default.
    * Disable the system's custom dice animations if DsN's are active (player choice), and disable DsN's by default.
    * Animate highest spell level rolls instead of lowest.
* Multiple improvements to the damage applicator class behavior (moved most logic to the actor's _preUpdate method, which captures other kinds of updates):
    * Temp hps shouldn't stack, only the maximum of current and new should be kept.
    * Healing should start from 0, even when not healing with a recovery.
    * Healing shouldn't exceed max HP.
    * Damage should draw from temp HP first.


## Bugfixes

* Changed PC-specific data and processing to actually be PC-specific.
* Removed obsolete shorthand setting (it's needed elsewhere in the system, no reason not to enable it).
* Fixed processing powers with numbered custom resource costs.
* Fixed processing powers with no targeted defense specified but non-zero selected targets.
* Some strings moved to localization file.
* Add missing recharge value to Supreme Tactical Strike.
* Fix wrong values in Cone of Corruption.
* General code cleanup.