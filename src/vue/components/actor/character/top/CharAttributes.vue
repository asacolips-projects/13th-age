<template>
  <section class="section section--attributes flexrow">
    <!-- Actor image -->
    <div class="unit unit--img profile-img" :data-tooltip="tooltip('portrait')">
      <img :src="actor.img" ref="avatar" :alt="localize('ARCHMAGE.avatarAlt')" :width="avatarWidth" :height="avatarHeight" :class="avatarClass" data-edit="img"/>
    </div>
    <div class="unit unit--attributes grid grid-5col border-both">
      <!-- HP -->
      <div class="unit unit--has-max unit--hp" :data-tooltip="tooltip('pcHitpoints')">
        <h2 class="unit-title">{{localize('ARCHMAGE.hitPoints')}}</h2>
        <Progress name="hp" :current="actor.system.attributes.hp.value" :temp="actor.system.attributes.hp.temp" :max="actor.system.attributes.hp.max"/>
        <div class="resource flexrow">
          <input type="number" name="system.attributes.hp.value" class="resource-current" v-model="actor.system.attributes.hp.value">
          <span class="resource-separator">/</span>
          <div v-if="actor.system.attributes.hp.automatic" class="resource-max">{{actor.system.attributes.hp.max}}</div>
          <input v-else type="number" name="system.attributes.hp.max" class="resource-max" v-model="actor.system.attributes.hp.max">
        </div>
        <div class="labeled-input flexrow">
          <label for="system.attributes.hp.temp" class="unit-subtitle">{{localize('ARCHMAGE.tempHp')}}</label>
          <input type="number" name="system.attributes.hp.temp" class="temp-hp" v-model="actor.system.attributes.hp.temp">
        </div>
      </div>
      <!-- Defenses -->
      <div class="unit unit--defenses" :data-tooltip="tooltip('pcDefenses')">
        <h2 class="unit-title">{{localize('ARCHMAGE.defenses')}}</h2>
        <div class="defenses grid grid-3col">
          <div class="defense defense--ac flexcol">
            <span class="defense-value">{{actor.system.attributes.ac.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.ac.label'), ' (', localize('ARCHMAGE.ac.stats'), ')')">{{localize('ARCHMAGE.ac.key')}}</h3>
          </div>
          <div class="defense defense--pd flexcol">
            <span class="defense-value">{{actor.system.attributes.pd.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.pd.label'), ' (', localize('ARCHMAGE.pd.stats'), ')')">{{localize('ARCHMAGE.pd.key')}}</h3>
          </div>
          <div class="defense defense--md flexcol">
            <span class="defense-value">{{actor.system.attributes.md.value}}</span>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.md.label'), ' (', localize('ARCHMAGE.md.stats'), ')')">{{localize('ARCHMAGE.md.key')}}</h3>
          </div>
        </div>
        <!-- Disengage -->
        <div class="resource flexcol">
          <a class="rollable rollable--disengage disengage-value" data-roll-type="disengage" data-roll-opt="disengage">{{disengage.value}}+&nbsp;{{localize('ARCHMAGE.SAVE.disengage')}}</a>
        </div>
      </div>
      <!-- Recoveries -->
      <div class="unit unit--has-max unit--recoveries" :data-tooltip="tooltip('pcRecoveries')">
        <h2 class="unit-title">{{localize('ARCHMAGE.recoveries')}}</h2>
        <Progress name="recoveries" :current="actor.system.attributes.recoveries.value" :max="actor.system.attributes.recoveries.max"/>
        <div class="resource flexrow">
          <input type="number" name="system.attributes.recoveries.value" class="resource-current" v-model="actor.system.attributes.recoveries.value">
          <span class="resource-separator">/</span>
          <div v-if="actor.system.attributes.recoveries.automatic" class="resource-max">{{actor.system.attributes.recoveries.max}}</div>
          <input v-else type="number" name="system.attributes.recoveries.max" class="resource-max" v-model="actor.system.attributes.recoveries.max">
        </div>
        <div class="roll">
          <a class="rollable rollable--recover" data-roll-type="recovery">{{actor.system.attributes.recoveries.formula}} ({{actor.system.attributes.recoveries.avg}})</a>
        </div>
      </div>
      <!-- Saving Throws -->
      <div class="unit unit--saves flexcol" :data-tooltip="tooltip('pcSaves')">
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
          <div class="death-saves" :data-tooltip="tooltip('pcDeathSaves')">
            <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="death">{{localize('ARCHMAGE.SAVE.death')}}</a>
            <div class="death-save-attempts attempts flexrow">
              <input type="checkbox" v-for="(step, i) in deathSaves" :key="i" v-model="actor.system.attributes.saves.deathFails.steps[i]" :data-opt="i+1"/>
            </div>
          </div>
          <div class="last-gasp-saves" :data-tooltip="tooltip('pcLastGaspSaves')">
            <a class="rollable rollable--save" data-roll-type="save" data-roll-opt="lastGasp">{{localize('ARCHMAGE.SAVE.lastGasp')}}</a>
            <div class="lastgasp-save-attempts attempts flexrow">
              <input type="checkbox" v-model="actor.system.attributes.saves.lastGaspFails.steps[0]" data-opt="1"/>
              <input type="checkbox" v-model="actor.system.attributes.saves.lastGaspFails.steps[1]" data-opt="2"/>
              <input type="checkbox" v-model="actor.system.attributes.saves.lastGaspFails.steps[2]" data-opt="3"/>
              <input type="checkbox" v-model="actor.system.attributes.saves.lastGaspFails.steps[3]" data-opt="4"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { concat, localize, tooltip } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
export default {
  name: 'CharAttributes',
  props: ['actor'],
  setup() {
    return {
      concat,
      localize,
      tooltip
    }
  },
  data() {
    return {
      avatarClass: 'avatar',
      avatarWidth: 105,
      avatarHeight: 105,
      disengage: {
        value: 11,
        bonus: 0
      },
    }
  },
  components: {
    Progress
  },
  computed: {
    secondEdition() {
      return game.settings.get('archmage', 'secondEdition') === true;
    },
    deathSaves() {
      const deathFails = this.actor.system.attributes.saves.deathFails;
      const max = parseInt(deathFails.max) || 4;
      const ret = Array.from(Array(max)).fill(false);
      for (let i = 0; i < Math.min(deathFails.steps.length, max); i++) {
        if (deathFails.steps[i]) {
          ret[i] = true;
        }
      }
      return ret;
    },
  },
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
    },
    updateResourceProps() {
      this.disengage = {
        value: this.actor.system.attributes.disengage,
        bonus: this.actor.system.attributes.disengageBonus
      };
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
    },
    'actor.system.attributes': {
      deep: true,
      handler() {
        this.updateResourceProps();
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
