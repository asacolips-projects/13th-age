# Description

Create characters in this FoundryVTT character sheet that is compatible with the _13th Age Roleplaying Game_. It has full support for players to easily create characters and GMs to easily create monsters, including both compendiums and easy to use rolls in power cards and monster actions. Compendium entries are based on the Open Game License (OGL) content for the _13th Age Roleplaying Game_, and conversion of them to FoundryVTT compendiums is still in progress for some classes. Rules unrelated to classes or monsters are not provided in this system, which means that the _13th Age Roleplaying Game_ is required to play it.

# Install

1. Go to the setup page and choose Game Systems.
2. Click the Install System button, and either search for Toolkit13 or paste in this manifest link:
```
https://gitlab.com/asacolips-projects/foundry-mods/archmage/raw/master/system.json
```
3. Create a game world using the new sytem.

# Inline Rolls

All powers and monster actions require usage of inline dice rolls, such as `[[d20+@str+@lvl+@ed+2]]` to function with automation and dice rolls in chat messages. Many of the compendium entries for powers come preformatted using this syntax, but some are still in progress. For a full reference of how to use inline rolls, go to the settings tab of the right sidebar and click the "Archmage Inline Rolls" button.

# Contributing

Contributions are accepted and encouraged! To contribute to the project, fork this repository and then submit your changes as a pull request against the `master` branch.

## Building locally

This project uses **gulp** for the majority of its build tasks, but it also uses **vite** to compile its Vue components for usage in character sheets. Source files are located in the `src/` directory and are compiled to the `dist/` directory. To use the locally built system in Foundry, symlink your `dist/` directory to `systems/archmage` in your Foundry data directory.

To run a build, you'll need node 16 installed. Once you have node and npm, install the project
dependencies:

```
npm install
```
The following commands can be used for various versions of build tasks:

```bash
# One time build
npm run build
# Watch for changes and build automatically
npm run watch
# Compile CSS only
npm run css
# Compile manifests and language files only
npm run yaml
# Compile compendium databases only
npm run compilePacks
# Extract compendium databases to yaml files
npm run extractPacks
# Compile vue components only
npm run vite:build
# Watch for changes in vue only
npm run vite:watch
```

## Working with Vue

This system uses Vue for character sheets and will eventually use it for other sheet types as well. For more information on how to work with the Vue components, see the README.md in `src/vue/README.md`.

---

# Licenses

This system makes usage of several different licenses, both for the code and for the compendium content.

## Compatible with the 13th Age Roleplaying Game

Compatible with the 13th Age Roleplaying Game requires the 13th Age Roleplaying Game from Fire Opal Media Inc. and Pelgrane Press Ltd. See <http://13thage.com> for more information on the 13th Age Roleplaying Game. Fire Opal Media Inc. does not guarantee compatibility, and does not endorse this product.

## Copyright

The Toolkit13 name is copyright © 2020 by Matt Smith. Some rights reserved.

13th Age is a registered trademark of Fire Opal Media Inc., and the 13th Age Roleplaying Game and the 13th Age Roleplaying Game Compatibility Logo are trademarks of Fire Opal Media Inc. under exclusive license to Pelgrane Press Ltd., and are used under the 13th Age Roleplaying Game Compatibility License. See <http://13thage.com> for more information on the compatibility license.

## HTML, CSS, and Javscript

All HTML, CSS, Javascript, and Vue files are licensed under the [MIT license](https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/raw/master/licenses/MIT.txt) and are freely available. YAML files (excluding those in the src/packs/) directory are also licensed under the MIT license.

## Images and file assets

Images and files in the `assets/icons` directory are provided via licenses secured by Foundry VTT at <https://foundryvtt.com/article/partnerships/> and may only be used within Foundry VTT. At the time of writing, that includes the following assets:

* Thanks to J. W. Bjerk (eleazzar) for “Painterly Spell Icons” series: <https://opengameart.org>
* Potion Artwork** Thanks to Melle, <https://opengameart.org/content/fantasy-potion-set>
* Thanks to various contributors, <https://game-icons.net>
* Dice by Mike Valstar from the Noun Project
* Dice by Dank By Design from the Noun Project
* Dice by Heberti Almeida from the Noun Project
* Licensed icon artwork by Rexard <https://assetstore.unity.com/publishers/13229>

Image assets in this repository may not be used outside of Foundry VTT and cannot be redistributed.

## 13th Age Roleplaying Game Community Use Policy

This system for Foundry VTT uses trademarks and/or copyrights owned by Fire Opal Media Inc., which are used under the Fire Opal Media Inc., 13th Age Community Use Policy. We are expressly prohibited from charging you to use or access this content. This system for Foundry VTT is not published, endorsed, or specifically approved by Fire Opal Media.

## SRD and OGL Content

This system makes usage of the [Open Game License Version 1.0a](http://www.d20srd.org/ogl.htm), the text of which is reproduced below (including additional required copyright notices).

### Open Game License

The following text is the property of Wizards of the Coast, Inc. and is Copyright 2000 Wizards of the Coast, Inc. (“Wizards”). All Rights Reserved.

1. Definitions: (a)”Contributors” means the copyright and/or trademark owners who have contributed Open Game Content; (b)”Derivative Material” means copyrighted material including derivative works and translations (including into other computer languages), potation, modification, correction, addition, extension, upgrade, improvement, compilation, abridgment or other form in which an existing work may be recast, transformed or adapted; (c) “Distribute” means to reproduce, license, rent, lease, sell, broadcast, publicly display, transmit or otherwise distribute; (d)”Open Game Content” means the game mechanic and includes the methods, procedures, processes and routines to the extent such content does not embody the Product Identity and is an enhancement over the prior art and any additional content clearly identified as Open Game Content by the Contributor, and means any work covered by this License, including translations and derivative works under copyright law, but specifically excludes Product Identity. (e) “Product Identity” means product and product line names, logos and identifying marks including trade dress; artifacts; creatures characters; stories, storylines, plots, thematic elements, dialogue, incidents, language, artwork, symbols, designs, depictions, likenesses, formats, poses, concepts, themes and graphic, photographic and other visual or audio representations; names and descriptions of characters, spells, enchantments, personalities, teams, personas, likenesses and special abilities; places, locations, environments, creatures, equipment, magical or supernatural abilities or effects, logos, symbols, or graphic designs; and any other trademark or registered trademark clearly identified as Product identity by the owner of the Product Identity, and which specifically excludes the Open Game Content; (f) “Trademark” means the logos, names, mark, sign, motto, designs that are used by a Contributor to identify itself or its products or the associated products contributed to the Open Game License by the Contributor (g) “Use”, “Used” or “Using” means to use, Distribute, copy, edit, format, modify, translate and otherwise create Derivative Material of Open Game Content. (h) “You” or “Your” means the licensee in terms of this agreement.

2. The License: This License applies to any Open Game Content that contains a notice indicating that the Open Game Content may only be Used under and in terms of this License. You must affix such a notice to any Open Game Content that you Use. No terms may be added to or subtracted from this License except as described by the License itself. No other terms or conditions may be applied to any Open Game Content distributed using this License.

3. Offer and Acceptance: By Using the Open Game Content You indicate Your acceptance of the terms of this License.

4. Grant and Consideration: In consideration for agreeing to use this License, the Contributors grant You a perpetual, worldwide, royalty-free, non-exclusive license with the exact terms of this License to Use, the Open Game Content.

5. Representation of Authority to Contribute: If You are contributing original material as Open Game Content, You represent that Your Contributions are Your original creation and/or You have sufficient rights to grant the rights conveyed by this License.

6. Notice of License Copyright: You must update the COPYRIGHT NOTICE portion of this License to include the exact text of the COPYRIGHT NOTICE of any Open Game Content You are copying, modifying or distributing, and You must add the title, the copyright date, and the copyright holder’s name to the COPYRIGHT NOTICE of any original Open Game Content you Distribute.

7. Use of Product Identity: You agree not to Use any Product Identity, including as an indication as to compatibility, except as expressly licensed in another, independent Agreement with the owner of each element of that Product Identity. You agree not to indicate compatibility or co-adaptability with any Trademark or Registered Trademark in conjunction with a work containing Open Game Content except as expressly licensed in another, independent Agreement with the owner of such Trademark or Registered Trademark. The use of any Product Identity in Open Game Content does not constitute a challenge to the ownership of that Product Identity. The owner of any Product Identity used in Open Game Content shall retain all rights, title and interest in and to that Product Identity.

8. Identification: If you distribute Open Game Content You must clearly indicate which portions of the work that you are distributing are Open Game Content.

9. Updating the License: Wizards or its designated Agents may publish updated versions of this License. You may use any authorized version of this License to copy, modify and distribute any Open Game Content originally distributed under any version of this License.

10. Copy of this License: You MUST include a copy of this License with every copy of the Open Game Content You Distribute.

11. Use of Contributor Credits: You may not market or advertise the Open Game Content using the name of any Contributor unless You have written permission from the Contributor to do so.

12. Inability to Comply: If it is impossible for You to comply with any of the terms of this License with respect to some or all of the Open Game Content due to statute, judicial order, or governmental regulation then You may not Use any Open Game Material so affected.

13. Termination: This License will terminate automatically if You fail to comply with all terms herein and fail to cure such breach within 30 days of becoming aware of the breach. All sublicenses shall survive the termination of this License.

14. Reformation: If any provision of this License is held to be unenforceable, such provision shall be reformed only to the extent necessary to make it enforceable.

15. COPYRIGHT NOTICE

**Open Game License** v 1.0a. Copyright 2000, Wizards of the Coast, Inc.

**System Reference Document**. Copyright 2000, Wizards of the Coast, Inc.; Authors: Jonathan Tweet, Monte Cook, Skip Williams, based on material by E. Gary Gygax and Dave Arneson.

**13th Age**. Copyright 2013, Fire Opal Media; Authors: Rob Heinsoo, Jonathan Tweet, based on material by Jonathan Tweet, Monte Cook, and Skip Williams.

**13th Age Bestiary**. Copyright 2014, Fire Opal Media and Pelgrane Press Ltd; Authors: Ryven Cedyrlle, Rob Heinsoo, Kenneth Hite, Kevin Kulp, ASH LAW, Cal Moore, Steve Townshend, Rob Watkins, Rob Wieland.

**13 True Ways**. Copyright 2014, Fire Opal Media, Inc.; Authors: Rob Heinsoo, Jonathan Tweet, Robin D. Laws.

**Pathfinder RPG Core Rulebook**. Copyright 2009, Paizo Publishing, LLC; Author: Jason Bulmahn, based on material by Jonathan Tweet, Monte Cook, and Skip Williams.

**Castles & Crusades**, Copyright 2004, Troll Lord Games; Authors: Davis Chenault, Mac Golden.

**13th Age Archmage Engine**. Copyright 2013-2016, Fire Opal Media. Author: Chad Dylan Long, based on material by Jonathan Tweet, Rob Heinsoo, Ryven Cedyrlle, Kenneth Hite, Kevin Kulp, ASH LAW, Cal Moore, Steve Townshend, Rob Watkins, and Rob Wieland.