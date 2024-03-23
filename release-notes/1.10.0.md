# Release Notes 1.10.0

Version 1.10.0 of the system is one of our biggest releases yet! This update focuses on three areas: a new and improved character sheet, a power import dialog to help build characters, and lots of small quality of life and automation enhancements.

## The V2 Character Sheet

We've redesigned the character sheet! In the system, the new sheet is called the "V2 Character Sheet." The new sheet was built with Vue, a framework that allows us to make much more responsive sheets, but that does have a few caveats:

  1. It's recommended to install both the VuePort and Dlopen library modules as dependencies. If you do a fresh install of the system via a manifest link, these dependencies will be installed automatically. Once you open your world, you'll be prompted to enable the dependencies, at which point the new sheet will become the default (though the old one will still work!). However, the system includes lightweight versions of these dependencies as fallbacks if you don't have them installed (or if you need to disable them for any reason).

  2. Vue is very responsive and is able to react to changes in the character sheet immediately without re-rendering the whole thing the way that Foundry sheets normally work. What this means for you is that in general, the sheet should feel much nicer to work with, and in most cases, you can work on a sheet simultaneously with other players without causing each other to lose progress!

![Screenshot of the V2 Sheet](https://cdn.discordapp.com/attachments/794328517243699260/825735258309394442/unknown.png)

## V2 Character Sheet Features

- **Night mode!** You can now switch between both light and dark themes in the Settings (gear) tab of your sheet. We've also got a few other visual settings in there, like whether portraits should be rounded and have a light frame around them.

- **Progress bars!** Everything on the sheet with both max and current values has an associated progress bar, such as HP, recoveries, or Ki points. In addition, temp HP will be included in the HP progress bar with a lighter opacity.

- **Roll all the things!** Everything in the sheet that's interactive will have a blue hover effect (such as text inputs) and everything that's rollable will have a blue d20 to the left of it. We've also made many more things on the sheet rollable, such as background checks, initiative, death saves, and command points!

- **Death Saves!** There's a new section on the sheet for death saves! If you succeed at a death save, you'll automatically roll a recovery, and if you fail, you'll get one step closer to death. Alternatively, you can click any of the checkboxes under death saves or last gasp saves to toggle them on or off up to that point.

- **Initiative!** Players can now roll initiative from their character sheet! If you have started combat already as the GM, players can click the "Initiative" bonus on their sheet to roll it. If they're not in the combat, they'll be added to it. If they are in the combat, it will be rolled (only if they don't already have an initiative).

- **Backgrounds!** In addition to rolling background checks from the ability score section, you can also roll them from the background section! If you roll from the background section, the options available will be ability scores instead of other backgrounds, and it will default to the character's highest ability score (with an easy to change select field).

- **Icon Relationships!** Icons have been redesigned to have a plain text display along with an edit toggle to change their current settings. More importantly, icon results are now stored! When you roll an icon relationship, it will be stored and each result will be noted as either a 5, a 6, or a blank result. You can click the stored results to cycle through those three values.

- **One Unique Thing!** We've replaced the One Unique Thing text area with a proper TinyMCE WYSIWYG editor!

- **Command Points!** For you commanders out there, you can now roll for command points! Roll results will be added to your command point pool, and they'll also be reset per the SRD rules when combat is ended and when you roll initiative.

- **Recovery Options!** When you roll recoveries, you'll now receive a prompt for all sorts of options! Normal recoveries, free recoveries, and potion recoveries are all supported now! If you want to skip the prompt, you can shift+click the recovery button to skip it and roll a normal recovery.

- **Quick Rests and Full Heal-Ups!** We now have support for both quick rests and full heal-ups within the system! Any changes made as a result of those options (such as restoring once-per-battle powers or attempting to roll recharges) will be sent to chat as a message.

- **Power Sorting!** Vue has allowed us to make a much nicer powers list! There are now more grouping options, and they're placed directly above your powers list. In addition, you can now sort powers by custom ordering (default), name, or level. Finally, you can filter powers by name!

- **Power Summaries!** We've reorganized the powers list to include more useful information, including pips for which feats are active on each power! The feat pips are clickable to toggle their active state. Other items are clickable as well now, such as the recharge roll for each power.

- **Power Triggers!** If a power has a trigger, it will now be displayed as a tooltip when hovering over it! Fighters and occultists, rejoice!

- **Inventory Summaries!** As with powers, inventory also include sorting and filtering options now! However, the bigger improvement for them is that different kinds of equipment are now separated into Magic Items, Tools, and Loot! Magic item bonuses and chakra are displayed, and every item can also be toggled open, much like with powers.

- **Settings!** The settings tab has been redesign into a single settings tab in the main column of the sheet, rather both a cramped tab in the left sidebar with a separate prompt for flags and special traits. This is also where we'll place per-character quality of life settings, like the new Night Mode!

## Automation Enhancements

There are a number of automation enhancements in the new sheet as well! As mentioned earlier, recoveries, death saves, and command points are all handled intuitively by the system. In addition, the sheet will now consider both the current and maximum uses of each power and will warn you if you're using a power that's out of uses, and will automatically decrement remaining uses when using the power. On rest/recharge, they'll be set back to their maximum value (or 1, if no maximum is defined). Finally, if the power has a cost associated with it (such as "1 command point" or "Spend momentum"), it will deduct those resources. We've updated the powers included with the system, so if you're a class with resource tracking like the commander or rogue, make sure to add the updated powers!

## Power Importer

As with the previous alpha release, this release includes an updated power importer that is much closer to a full character builder. When importing powers from our SRD compendiums, you'll be able to see class descriptions along with powers for easy selection and importing.

![Screenshot of the Power Importer](https://cdn.discordapp.com/attachments/794328517243699260/825735828944191518/unknown.png)