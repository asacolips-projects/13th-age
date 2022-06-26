<template>
  <div class="unit unit--modify-level flexrow">
    <!-- @todo localize this -->
    <label><strong>{{localize('New Level')}}: </strong></label>
    <input type="number" v-model="newLevel" />
  </div>
  <section class="section section--level-preview">
    <div>
      <strong>HP: </strong><span>{{preview.data.attributes.hp.max}}</span>
    </div>
    <div>
      <strong>AC: </strong><span>{{preview.data.attributes.ac.value}}</span>
    </div>
    <div>
      <strong>PD: </strong><span>{{preview.data.attributes.pd.value}}</span>
    </div>
    <div>
      <strong>MD: </strong><span>{{preview.data.attributes.md.value}}</span>
    </div>
  </section>
  <section class="section section--confirm">
    <button class="button button--confirm" @click="autoLevelConfirm">{{localize('Confirm (Create Duplicate)')}}</button>
  </section>
</template>

<script>
  import Input from '@/components/parts/Input.vue'
  import { ref } from 'vue';
  import { localize } from '@/methods/Helpers';
  export default {
    name: 'NpcModifyLevel',
    props: ['actor'],
    components: {
      Input
    },
    setup(props) {
      const newLevel = ref(props.actor.data.attributes.level.value);
      return {
        newLevel,
        localize
      }
    },
    computed: {
      preview() {
        // Set the level.
        let lvl = Number(this.actor.data.attributes.level.value || 0);
        let newLvl = this.newLevel;
        let delta = newLvl - lvl;

        // Generate the prefix.
        let suffix = ` (+${delta})`;
        if (delta < 0) suffix = ` (${delta})`;

        if (newLvl < 0 || newLvl > 15) {
          ui.notifications.warn(game.i18n.localize("ARCHMAGE.UI.levelLimits"));
          return;
        }

        // Set other overrides.
        let mul = Math.pow(1.25, delta); // use explicit coefficients from book?
        let overrideData = {
          'name': this.actor.name+suffix,
          'data.attributes.level.value': newLvl,
          'data.attributes.ac.value': Number(this.actor.data.attributes.ac.value || 0) + delta,
          'data.attributes.pd.value': Number(this.actor.data.attributes.pd.value || 0) + delta,
          'data.attributes.md.value': Number(this.actor.data.attributes.md.value || 0) + delta,
          // Initiative already depends directly on level
          'data.attributes.hp.value': Math.round(this.actor.data.attributes.hp.value * mul),
          'data.attributes.hp.max': Math.round(this.actor.data.attributes.hp.max * mul),
        };

        // Create a preview actor that we can use for display.
        let previewActor = {
          name: this.actor.name,
          data: duplicate(this.actor.data)
        };

        // Update the fields.
        for (let [key, value] of Object.entries(overrideData)) {
          setProperty(previewActor, key, value);
        }

        return previewActor;
      },
    },
    methods: {
      autoLevelConfirm(event) {
        let actor = game.actors.get(this.actor._id);
        let delta = this.newLevel - this.actor.data.attributes.level.value;
        if (delta !== 0) {
          actor.autoLevelActor(delta).then(newActor => {
            newActor.setFlag('archmage', 'sheetDisplay.tabs.primary.value', 'actions').then(() => {
              newActor.sheet.render(true);
            });
          });
        }
      }
    }
  }
</script>

<style lang="scss">
</style>