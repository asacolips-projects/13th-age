<template>
  <section class="section section--attributes flexrow">
    <!-- Actor image -->
    <div class="unit unit--img profile-img">
      <img :src="actor.img" ref="avatar" :alt="localize('ARCHMAGE.avatarAlt')" :width="avatarWidth" :height="avatarHeight" :class="avatarClass" data-edit="img"/>
    </div>
    <div class="unit unit--attributes grid grid-5col border-both">
      <!-- HP -->
      <div class="unit unit--has-max unit--hp">
        <h2 class="unit-title">{{localize('ARCHMAGE.hitPoints')}}</h2>
        <Progress name="hp" :current="actor.data.attributes.hp.value" :temp="actor.data.attributes.hp.temp" :max="actor.data.attributes.hp.max"/>
        <div class="resource flexrow">
          <input type="number" name="data.attributes.hp.value" class="resource-current" v-model="actor.data.attributes.hp.value">
          <span class="resource-separator">/</span>
          <div v-if="actor.data.attributes.hp.automatic" class="resource-max">{{actor.data.attributes.hp.max}}</div>
          <input v-else type="number" name="data.attributes.hp.max" class="resource-max" v-model="actor.data.attributes.hp.max">
        </div>
        <div class="labeled-input flexrow">
          <label for="data.attributes.hp.temp" class="unit-subtitle">{{localize('ARCHMAGE.tempHp')}}</label>
          <input type="number" name="data.attributes.hp.temp" class="temp-hp" v-model="actor.data.attributes.hp.temp">
        </div>
      </div>
      <!-- Defenses -->
      <div class="unit unit--defenses">
        <h2 class="unit-title">{{localize('ARCHMAGE.defenses')}}</h2>
        <div class="defenses grid grid-3col">
          <div class="defense defense--ac flexcol">
            <span class="defense-value">{{actor.data.attributes.ac.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.ac.label'), ' (', localize('ARCHMAGE.ac.stats'), ')')">{{localize('ARCHMAGE.ac.key')}}</h3>
          </div>
          <div class="defense defense--pd flexcol">
            <span class="defense-value">{{actor.data.attributes.pd.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.pd.label'), ' (', localize('ARCHMAGE.pd.stats'), ')')">{{localize('ARCHMAGE.pd.key')}}</h3>
          </div>
          <div class="defense defense--md flexcol">
            <span class="defense-value">{{actor.data.attributes.md.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.md.label'), ' (', localize('ARCHMAGE.md.stats'), ')')">{{localize('ARCHMAGE.md.key')}}</h3>
          </div>
        </div>
      </div>
      <!-- Recoveries -->
      <div class="unit unit--has-max unit--recoveries">
        <h2 class="unit-title">{{localize('ARCHMAGE.recoveries')}}</h2>
        <Progress name="recoveries" :current="actor.data.attributes.recoveries.value" :max="actor.data.attributes.recoveries.max"/>
        <div class="resource flexrow">
          <input type="number" name="data.attributes.recoveries.value" class="resource-current" v-model="actor.data.attributes.recoveries.value">
          <span class="resource-separator">/</span>
          <div v-if="actor.data.attributes.recoveries.automatic" class="resource-max">{{actor.data.attributes.recoveries.max}}</div>
          <input v-else type="number" name="data.attributes.recoveries.max" class="resource-max" v-model="actor.data.attributes.recoveries.max">
        </div>
        <div class="roll">
          <a class="rollable rollable--recover" data-roll-type="recovery">{{actor.data.attributes.level.value}}{{actor.data.attributes.recoveries.dice}}+{{actor.data.abilities.con.dmg}} ({{actor.data.attributes.recoveries.avg}})</a>
        </div>
      </div>
      <!-- Saving Throws -->
      <div class="unit unit--saves flexcol">
        <h2 class="unit-title">{{localize('ARCHMAGE.saves')}}</h2>
        <div class="saves flexcol">
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="easy">6+ ({{localize('ARCHMAGE.SAVE.easyShort')}})</a>
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="normal">11+ ({{localize('ARCHMAGE.SAVE.normalShort')}})</a>
          <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="hard">16+ ({{localize('ARCHMAGE.SAVE.hardShort')}})</a>
        </div>
      </div>
      <!-- Init / Death Saves -->
      <div class="unit unit--death">
        <div class="dividers flexcol">
          <div class="death-saves">
            <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="death">{{localize('ARCHMAGE.SAVE.death')}}</a>
            <div class="death-save-attempts flexrow">
              <input type="checkbox" v-model="actor.data.attributes.saves.deathFails.steps[0]" data-opt="1">
              <input type="checkbox" v-model="actor.data.attributes.saves.deathFails.steps[1]" data-opt="2">
              <input type="checkbox" v-model="actor.data.attributes.saves.deathFails.steps[2]" data-opt="3">
              <input type="checkbox" v-model="actor.data.attributes.saves.deathFails.steps[3]" data-opt="4">
            </div>
          </div>
          <div class="last-gasp-saves">
            <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="lastGasp">{{localize('ARCHMAGE.SAVE.lastGasp')}}</a>
            <div class="lastgasp-save-attempts flexrow">
              <input type="checkbox" v-model="actor.data.attributes.saves.lastGaspFails.steps[0]" data-opt="1">
              <input type="checkbox" v-model="actor.data.attributes.saves.lastGaspFails.steps[1]" data-opt="2">
              <input type="checkbox" v-model="actor.data.attributes.saves.lastGaspFails.steps[2]" data-opt="3">
              <input type="checkbox" v-model="actor.data.attributes.saves.lastGaspFails.steps[3]" data-opt="4">
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
export default {
  name: 'CharAttributes',
  props: ['actor'],
  setup() {
    return {
      concat,
      localize
    }
  },
  data() {
    return {
      avatarClass: 'avatar',
      avatarWidth: 105,
      avatarHeight: 105
    }
  },
  components: {
    Progress
  },
  computed: {},
  methods: {
    getAvatarDimensions() {
      let img = this.$refs['avatar'];
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      let ratio = width / height;
      let ratioClass = 'square';
      let squareSize = width;

      if (ratio < 0.9) {
        ratioClass = 'portrait';
        squareSize = width;
      }
      else if (ratio > 1.1) {
        // TODO: Figure out a good layout for landscape.
        // ratioClass = 'landscape';
        ratioClass = 'square';
        squareSize = height;
      }

      this.avatarWidth = ratioClass != 'square' ? width : squareSize;
      this.avatarHeight = ratioClass != 'square' ? height : squareSize;
      let classes = ['avatar', `avatar--${ratioClass}`];
      let flags = this.actor.flags && this.actor.flags.archmage ? this.actor.flags.archmage : {};
      if (flags.portraitRound) classes.push('avatar--round');
      if (flags.portraitFrame) classes.push('avatar--frame');
      this.avatarClass = classes.join(' ');
    },
    checkLoaded() {
      if (this.$refs.avatar.complete) {
        this.getAvatarDimensions();
      }
      else {
        this.$refs.avatar.addEventListener('load', () => {
          this.getAvatarDimensions();
        });
      }
    }
  },
  watch: {
    'actor.img': {
      deep: false,
      handler() {
        this.$nextTick(() => {
          this.checkLoaded();
        });
      }
    },
    'actor.flags.archmage': {
      deep: true,
      handler() {
        this.getAvatarDimensions();
      }
    }
  },
  async mounted() {
    this.$nextTick(() => {
      this.checkLoaded();
    });
  }
}
</script>
