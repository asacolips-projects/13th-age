<template>
  <!-- HEADER -->
  <header :class="'header npc-header flexcol' + (headerCollapsed ? ' collapsed' : '')">
    <section class="section section--header-top">
      <!-- Name -->
      <div class="unit unit--hide-label unit--name">
        <label for="name">{{localize("ARCHMAGE.name")}}</label>
        <ToggleInput :closeInputs="closeInputs">
          <template v-slot:display><h1 class="actor-name">{{actor.name}}</h1></template>
          <template v-slot:edit><Input type="text" name="name" class="input-secondary" :actor="actor" reactive="false"/></template>
        </ToggleInput>
      </div>
    </section>
    <section class="section section--header-bottom flexrow">
      <section class="section section--details">
        <!-- Flavor text -->
        <div class="unit unit--hide-label unit--flavor">
          <label for="data.details.flavor.value">{{localize("ARCHMAGE.flavor")}}</label>
          <Editor :owner="actor.owner" target='data.details.flavor.value' button="true" editable="true" :content="actor.data.details.flavor.value"/>
        </div>
        <!-- Creature details -->
        <div class="unit unit--roles">
          <a class="rollable rollable--init" data-roll-type="init">{{numberFormat(actor.data.attributes.init.value, 0, true)}} {{localize('ARCHMAGE.initiative')}}</a>
          <ToggleInput :closeInputs="closeInputs">
            <!-- Display version of creature details. -->
            <template v-slot:display>
              <ul>
                <li v-if="sizeFormatted" class="details">{{sizeFormatted}}</li>
                <li class="level">{{levelFormatted}}</li>
                <li v-if="roleFormatted" class="role">{{roleFormatted}}</li>
                <li v-if="typeFormatted" class="type">[{{typeFormatted}}]</li>
              </ul>
            </template>
            <!-- Form inputs for creature details. -->
            <template v-slot:edit>
              <span class="unit unit--input">
                <label for="data.attributes.level.value">{{localize('ARCHMAGE.level')}}</label>
                <Input type="number" name="data.attributes.level.value" :actor="actor" reactive="false"/>
              </span>
              <!-- @todo write a migration to let this become a flat value -->
              <span class="unit unit--input">
                <label for="data.attributes.init.value">{{localize('ARCHMAGE.initiative')}}</label>
                <Input type="number" name="data.attributes.init.value" :actor="actor" reactive="false"/>
              </span>
              <Select name="data.details.size.value" :actor="actor" :options="getOptions('creatureSizes')"/>
              <Select name="data.details.role.value" :actor="actor" :options="getOptions('creatureRoles')"/>
              <Select name="data.details.type.value" :actor="actor" :options="getOptions('creatureTypes')"/>
            </template>
          </ToggleInput>
        </div>
        <!-- Resistance -->
        <div class="unit unit--resistance flexrow">
          <label for="data.details.resistance.value">{{localize('ARCHMAGE.resistance')}}: </label>
          <input type="text" name="data.details.resistance.value" v-model="actor.data.details.resistance.value"/>
        </div>
        <!-- Vulnerability -->
        <div class="unit unit--vulnerability flexrow">
          <label for="data.details.vulnerability.value">{{localize('ARCHMAGE.vulnerability')}}: </label>
          <input type="text" name="data.details.vulnerability.value" v-model="actor.data.details.vulnerability.value"/>
        </div>
      </section>
      <section class="section section--avatar">
        <!-- Actor image -->
        <div class="unit unit--img profile-img">
          <img :src="actor.img" ref="avatar" :alt="localize('ARCHMAGE.avatarAlt')" :width="avatarWidth" :height="avatarHeight" :class="avatarClass" data-edit="img"/>
        </div>
      </section>
    </section>
    <a class="toggle-header" @click="toggleHeader"><i class="fas fa-chevron-up"></i></a>
  </header>
</template>

<script>
  import { localize, ordinalSuffix, numberFormat, getActor } from '@/methods/Helpers';
  import ToggleInput from '@/components/parts/ToggleInput.vue';
  import Input from '@/components/parts/Input.vue';
  import Select from '@/components/parts/Select.vue';
  import Editor from '@/components/parts/Editor.vue';
  export default {
    name: 'NpcHeader',
    props: ['actor', 'flags', 'closeInputs'],
    components: { ToggleInput, Input, Select, Editor },
    setup() {
      return {
        localize,
        ordinalSuffix,
        numberFormat,
        CONFIG,
        game
      }
    },
    data() {
      return {
        avatarClass: 'avatar',
        avatarWidth: 105,
        avatarHeight: 105,
        headerCollapsed: this.flags?.sheetDisplay?.header?.collapsed ?? false
      }
    },
    computed: {
      levelFormatted() {
        return `${ordinalSuffix(this.actor.data.attributes.level.value ?? 0)} level`;
      },
      sizeFormatted() {
        return CONFIG.ARCHMAGE.creatureSizes[this.actor.data.details?.size?.value] ?? this.actor.data.details?.size?.value;
      },
      roleFormatted() {
        return CONFIG.ARCHMAGE.creatureRoles[this.actor.data.details?.role?.value] ?? this.actor.data.details?.role?.value;
      },
      typeFormatted() {
        let type = CONFIG.ARCHMAGE.creatureTypes[this.actor.data.details?.type?.value] ?? this.actor.data.details?.type?.value;
        return typeof type == 'string' ? type.toUpperCase() : '';
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
      toggleHeader(event) {
        // Update the state.
        this.headerCollapsed = !this.headerCollapsed;
        // Set a flag.
        const actor = !this.actor.pack ? getActor(this.actor) : false;
        if (actor) actor.setFlag('archmage', `sheetDisplay.header.collapsed`, this.headerCollapsed);
      },
      getOptions(key) {
        return CONFIG.ARCHMAGE[key] ?? [];
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

<style lang="scss">
.archmage-v2.npc-sheet {
  .npc-header {
    position: relative;
  }

  .section--details,
  .section--header-top {
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
      border-color: transparent;
    }

    input:hover,
    input:focus,
    .edit-wrapper input {
      border-bottom: 2px solid;
    }
  }

  .unit--hide-label {
    label {
      display: none;
    }
  }

  .unit--name {
    margin: $padding-sm 0;

    h1 {
      font-family: $font-stack-secondary;
      font-weight: normal;
      font-size: 38px;
      border: none;
      line-height: 0.8;
    }
  }

  .avatar {
    overflow: hidden;
    object-fit: cover;
    max-width: 100%;
    width: auto;
    height: auto;
    max-width: 105px;
    max-height: 105px;
    border: 0;

    &.avatar--square {
      width: auto;
      height: 105px;
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
    width: 105px;
    margin-right: $padding-lg;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unit--roles {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;

    .rollable--init {
      flex: 0 auto;
      margin: 0;
    }

    .edit-wrapper {
      display: inline-block;
      flex: 1;

      ul {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 0;
        margin: 0;
      }

      li {
        flex: 0 auto;
        list-style-type: none;
        margin-left: 14px;
        position: relative;

        &::before {
          display: block;
          content: '';
          position: absolute;
          top: -4px;
          bottom: 0;
          left: -9px;
          margin: auto;
          width: 5px;
          height: 5px;
          background: $c-black;
          border-radius: 100%;
        }
      }
    }
  }

  .unit--resistance,
  .unit--vulnerability {
    label {
      font-weight: bold;
      flex: 0 auto;
    }
  }

  .unit--input {
    display: flex;
    flex-direction: row;
  }

  .section--details {
    .editor-wrapper {
      min-height: 0;
    }
    :deep(.editor-content) {
      padding: 0;
      background: transparent;
    }

    .unit--flavor {
      font-style: italic;
      margin: $padding-sm 0;
    }

  }

  .toggle-header {
    transition: all ease-in-out 0.25s;
    display: block;
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 12px;
  }

  .collapsed {
    .unit--flavor {
      display: none;
    }
    .section--header-top {
      padding-right: 85px;
    }
    .unit--img {
      width: 65px;

      .avatar {
        width: auto;
        height: 65px;
        margin-top: -25px;
        margin-right: -35px;
      }
    }
    .unit--name h1 {
      font-size: 24px;
      font-weight: bold;
    }
    .toggle-header {
      transform: rotate(180deg);
    }
  }

  & .nightmode {
    .unit--roles {
      .edit-wrapper {
        li {
          &::before {
            background-color: $c-white;
          }
        }
      }
    }
  }
}
</style>