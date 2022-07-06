<template>
  <section :class="'section section--attributes flexrow' + (headerCollapsed ? ' collapsed' : '')">
    <div class="unit unit--attributes grid grid-4col border-both">
      <!-- Defenses -->
      <div class="unit unit--defenses">
        <h2 class="unit-title">{{localize('ARCHMAGE.defenses')}}</h2>
        <div class="defenses grid grid-3col">
          <div class="defense defense--ac flexcol">
            <!-- Custom <Input> component that can lock the field if an AE is applied. -->
            <Input type="number" name="system.attributes.ac.value" class="defense-value" :actor="actor"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.ac.label'), ' (', localize('ARCHMAGE.ac.stats'), ')')">{{localize('ARCHMAGE.ac.key')}}</h3>
          </div>
          <div class="defense defense--pd flexcol">
            <Input type="number" name="system.attributes.pd.value" class="defense-value" :actor="actor"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.pd.label'), ' (', localize('ARCHMAGE.pd.stats'), ')')">{{localize('ARCHMAGE.pd.key')}}</h3>
          </div>
          <div class="defense defense--md flexcol">
            <Input type="number" name="system.attributes.md.value" class="defense-value" :actor="actor"/>
            <h3 class="unit-subtitle" :title="concat(localize('ARCHMAGE.md.label'), ' (', localize('ARCHMAGE.md.stats'), ')')">{{localize('ARCHMAGE.md.key')}}</h3>
          </div>
        </div>
      </div>
      <!-- HP -->
      <div class="unit unit--has-max unit--hp">
        <h2 class="unit-title">{{localize('ARCHMAGE.hitPoints')}}</h2>
        <Progress name="hp" :current="actor.system.attributes.hp.value" :temp="actor.system.attributes.hp.temp" :max="actor.system.attributes.hp.max"/>
        <div class="resource flexrow">
          <Input type="number" name="system.attributes.hp.value" class="resource-current" :actor="actor" reactive="true"/>
          <span class="resource-separator">/</span>
          <Input type="number" name="system.attributes.hp.max" class="resource-max" :actor="actor"/>
        </div>
        <div class="labeled-input flexrow">
          <label for="data.attributes.hp.temp" class="unit-subtitle">{{localize('ARCHMAGE.tempHp')}}</label>
          <Input type="number" name="system.attributes.hp.temp" class="temp-hp" :actor="actor"/>
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
      <!-- Disengage -->
      <section class="unit unit--disengage">
        <h2 class="unit-title">{{localize('ARCHMAGE.SAVE.disengage')}}</h2>
        <div class="resource flexcol">
          <a class="rollable rollable--disengage disengage-value" data-roll-type="save" data-roll-opt="disengage">{{disengage.value}}+</a>
          <div class="disengage-bonus flexrow">
            <span class="disengage-label">{{localize('ARCHMAGE.bonus')}}</span>
            <Input type="number" name="system.attributes.disengageBonus" class="disengage-bonus" :actor="actor"/>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script>
import { concat, localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
import Input from '@/components/parts/Input.vue';
export default {
  name: 'NpcAttributes',
  props: ['actor'],
  setup() {
    return {
      concat,
      localize
    }
  },
  data() {
    return {
      disengage: {
        value: 11,
        bonus: 0
      }
    }
  },
  components: {
    Progress,
    Input
  },
  computed: {
    headerCollapsed() {
      return this.actor.flags?.archmage?.sheetDisplay?.header?.collapsed ?? false;
    }
  },
  methods: {},
  async mounted() {}
}
</script>

<style lang="scss">
.archmage-v2.npc-sheet {
  .section--attributes {
    padding-bottom: 0;

    .unit--attributes {
      margin-bottom: 0;
    }

    &.collapsed {
      padding-top: 0;

      .unit--attributes {
        padding: 6px 0;
        margin-top: 0;

        &::before {
          top: -4px;
          height: 3px;
          background-size: cover;
          background-position: 0;
        }

        &::after {
          bottom: -3px;
          height: 4px;
          background-size: cover;
          background-position: 0;
        }

        .unit-title {
          height: auto;
          margin-bottom: 0;
        }

        .grid {
          margin: auto;
        }

        .flexrow {
          margin: auto;
        }

        .progress-bar {
          margin: 2px 0;
        }

        .rollable {
          line-height: 1.4;
        }
      }
    }
  }
}
</style>
