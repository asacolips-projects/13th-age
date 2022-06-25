import { createApp } from 'vue';
import { Actor } from '@/foundry-shim/Actor.js';
export * from '@/foundry-shim/common/module.mjs';
import { Localization } from '@/foundry-shim/i18n.mjs';
import { Collection } from '@/foundry-shim/common/utils/collection.mjs';
import { ARCHMAGE, FLAGS } from '@src/module/setup/config.js';
import ArchmageNpcSheet from '@src/vue/ArchmageNpcSheet.vue';

const context = {
  owner: true,
  limited: false,
  options: {},
  editable: true,
  cssClass: 'editable',
  isCharacter: true,
  isNPC: false,
  config: {},
  rollData: {}
}

fetch('./template.json')
  .then(response => response.json())
  .then(async (data) => {

    const actor = new Actor(data);

    context.actor = actor.actors.npc;
    context.data = {};

    const hp = foundry.utils.getProperty(context.actor, 'data.attributes.hp.value');
    console.log(hp);

    // Get the translation object.
    const i18n = new Localization('en');
    await i18n.initialize();

    // Build the game object.
    globalThis.game = {
      i18n: i18n,
      actors: new Collection([[context.actor._id, context.actor]])
    };

    // Build the config object.
    globalThis.CONFIG = {
      ARCHMAGE: ARCHMAGE,
      Actor: {
        npcFlags: FLAGS.npcFlags
      }
    };

    globalThis.TextEditor = {
      enrichHTML(content, options={}) {
        return content;
      }
    }

    console.log(context.actor);

    createApp(ArchmageNpcSheet, {
      context: context,
      actor: context.actor
    }).mount('#charsheet');
  });
