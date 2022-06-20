<template>
  <!-- HEADER -->
  <header class="header npc-header flexrow">
    <section class="section section--details">
      <!-- Name -->
      <div class="unit unit--hide-label unit--name">
        <label for="name">{{localize("ARCHMAGE.name")}}</label>
        <input type="text" name="name" class="input-secondary" v-model="actor.name">
      </div>
      <!-- Flavor text -->
      <div class="unit unit--hide-label unit--flavor">
        <label for="data.details.flavor.value">{{localize("ARCHMAGE.flavor")}}</label>
        <input type="text" name="data.details.flavor.value" class="input-secondary" v-model="actor.data.details.flavor.value">
      </div>
      <!-- Creature details -->
      <div class="unit unit--roles">
        {{actor.data.details.size.value}} {{levelFormatted}} {{actor.data.details.role.value}} [{{actor.data.details.type.value}}]
      </div>
      <!-- Initiative -->
      <div class="unit unit--initiative">
        <a class="rollable rollable--init" data-roll-type="init">{{numberFormat(actor.data.attributes.init.mod, 0, true)}} {{localize('ARCHMAGE.initiative')}}</a>
      </div>
      <!-- Resistance -->
      <div class="unit unit--hide-label unit--resistance flexrow">
        <label for="data.details.resistance.value">{{localize('ARCHMAGE.resistance')}}</label>
        <input type="text" name="data.details.resistance.value" v-model="actor.data.details.resistance.value"/>
      </div>
      <!-- Vulnerability -->
      <div class="unit unit--hide-label unit--vulnerability flexrow">
        <label for="data.details.vulnerability.value">{{localize('ARCHMAGE.vulnerability')}}</label>
        <input type="text" name="data.details.vulnerability.value" v-model="actor.data.details.vulnerability.value"/>
      </div>
    </section>
    <section class="section section--avatar">
      <!-- Actor image -->
      <div class="unit unit--img profile-img">
        <img :src="actor.img" ref="avatar" :alt="localize('ARCHMAGE.avatarAlt')" :width="avatarWidth" :height="avatarHeight" :class="avatarClass" data-edit="img"/>
      </div>
    </section>
  </header>
</template>

<script>
  import { localize, ordinalSuffix, numberFormat } from '@/methods/Helpers';
  export default {
    name: 'NpcHeader',
    props: ['actor'],
    setup() {
      return {
        localize,
        ordinalSuffix,
        numberFormat
      }
    },
    data() {
      return {
        avatarClass: 'avatar',
        avatarWidth: 105,
        avatarHeight: 105
      }
    },
    computed: {
      levelFormatted() {
        return `${ordinalSuffix(this.actor.data.attributes.level.value)} level`;
      }
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

<style lang="scss" scoped>
.section--details {
  input {
    text-align: left;
  }
}

.section--avatar {
  flex: 0 auto;
}

.unit {
  input,
  .rollable--init {
    font-family: $font-stack-base;
    font-size: $font-xs;
    font-weight: normal;
    border: none;
  }
}

.unit--hide-label {
  label {
    display: none;
  }
}

.unit--name {
  input {
    font-family: $font-stack-secondary;
    font-weight: normal;
    border: none;
  }
}

.avatar {
  overflow: hidden;
  object-fit: cover;
  max-width: 100%;
  width: auto;
  height: auto;
  max-width: 115px;
  max-height: 115px;
  border: 0;

  &.avatar--square {
    width: 115px;
    height: 115px;
  }

  &.avatar--frame {
    background: $c-white;
    box-shadow: 0 0 10px $ct-border;
    padding: 4px;
  }

  &.avatar--round {
    border-radius: 50%;
  }
}

.unit--img {
  flex: 0 auto;
  width: 185px;
  margin-right: $padding-lg;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>