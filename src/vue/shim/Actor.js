import { Collection } from '@/shim/common/utils/collection.mjs';

export class Actor {
  constructor(data) {
    this.types = data.Actor.types;
    this.templates = data.Actor.templates;
    this.source = data.Actor;
    this.actors = {};

    console.log('foobar');

    this.constructActorTypes();
  }

  constructActorTypes() {
    let item = {
      name: 'Item',
      _id: 'foobar',
      data: {},
      type: 'action'
    };

    for (let type of this.types) {
      if (!this.source[type]) {
        continue;
      }

      // Retrieve base actor and templates.
      let actor = this.source[type];
      const templates = actor.templates;
      delete actor.templates;

      for (let template of templates) {
        actor = mergeObject(actor, this.templates[template]);
      }

      this.actors[type] = {
        name: type,
        _id: 'foobar',
        data: actor,
        flags: {},
        lockedFields: [],
        setFlag: () => {},
        items: new Collection([[item._id, item]])
      }
    }
  }
}