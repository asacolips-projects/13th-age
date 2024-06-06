<template>
  <Suspense>
    <section :class="classes">
      <!-- Actions, by group. -->
      <span v-for="(group, groupKey) in groups" :key="groupKey">
        <section class="action-group" v-if="groupKey !== 'misc' || actionGroups[groupKey]">
          <div class="action-group-header">
            <!-- Group title and add button. -->
            <div class="action-header-title flexrow">
              <h2 class="action-group-title unit-title">{{localize(group)}}</h2>
              <div class="item-controls" v-if="groupKey !== 'misc'">
                <a class="item-control item-create" :data-item-type="groupKey"><i class="fas fa-plus"></i> {{localize('ARCHMAGE.add')}}</a>
              </div>
            </div>
          </div>
          <ul class="action-group-content flexcol">
            <li v-for="(action, actionKey) in actionGroups[groupKey]" :key="actionKey" :class="concat('item action-item action-item--', action._id)" :data-item-id="action._id" :data-draggable="draggable" :draggable="draggable">
              <!-- Clickable action header. -->
              <div :class="'action-summary flexrow action' + (activeActions[action._id] ? ' active' : '')">
                <a :class="'rollable' + (action.type != 'action' ? ' rollable--message' : '') + (imageNotEmpty(action) ? ' has-image' : '')" data-roll-type="item" :data-roll-opt="action._id">
                  <img v-if="imageNotEmpty(action)" :src="action.img" class="action-image" />
                </a>
                <span :class="'hanging-indent action-name' + (canExpand(action) ? ' is-action' : '')" @click="toggleAction" :data-item-id="action._id">
                  <strong class="action-title unit-subtitle">{{action.name}}</strong>
                  <Enriched v-if="action.system?.attack?.value" tag="span" class="action-roll" :text="action.system.attack.value" :replacements="attackReplacer"/>
                  <Enriched v-if="action.system?.hit?.value" tag="span" class="action-damage" :text="' — ' + action.system.hit.value"/>
                  <Enriched v-if="action.type !== 'action' && action.system?.description?.value" tag="span" class="action-description" :text="action.system.description.value"/>
                </span>
                <div class="item-controls">
                  <a v-if="canExpand(action)" class="item-toggle" @click="toggleAction" :data-item-id="action._id"><i class="fas fa-chevron fa-chevron-down"></i></a>
                  <a class="item-control item-edit" :data-item-id="action._id"><i class="fas fa-edit"></i></a>
                  <a class="item-control item-delete" :data-item-id="action._id"><i class="fas fa-trash"></i></a>
                </div>
              </div>
              <!-- Expanded action content. -->
              <div :class="concat('action-content', (activeActions[action._id] ? ' active' : ''))">
                <Transition name="slide-fade">
                  <Action v-if="activeActions[action._id]" :action="action" :ref="concat('action--', action._id)"/>
                </Transition>
              </div>
            </li>
          </ul>
        </section>
      </span>
    </section>
  </Suspense>
</template>

<script>
import { concat, localize, numberFormat } from '@/methods/Helpers';
import Action from '@/components/parts/Action.vue';
import Enriched from '@/components/parts/Enriched.vue';
export default {
  name: 'NpcActions',
  props: ['actor', 'tab', 'flags'],
  data() {
    return {
      actions: [],
      sortOptions: [
        { value: 'custom', label: 'Custom' },
        { value: 'name', label: 'Name' },
        // { value: 'chakra', label: 'Chakra' } // TODO: Add this after fixing the typo in the template.
      ],
      groupBy: 'actions',
      sortBy: 'custom',
      searchValue: null,
      activeActions: {},
    }
  },
  setup() {
    const attackReplacer = [
      ['1d20', ''],
      ['d20', ''],
      ['2kh', '2d20kh'],
      ['2kl', '2d20kl'],
    ];
    return {
      concat,
      localize,
      numberFormat,
      attackReplacer
    }
  },
  components: {
    Action,
    Enriched
  },
  computed: {
    draggable() {
      return this.sortBy == 'custom' ? true : false;
    },
    classes() {
      return `section section--actions flexcol`;
    },
    groups() {
      let groups = {
        'action': 'ARCHMAGE.actions',
        'trait': 'ARCHMAGE.traits',
        'nastierSpecial':  'ARCHMAGE.nastierSpecials',
        'misc': 'ARCHMAGE.misc'
      };

      return groups;
    },
    actionGroups() {
      let actionsByGroup = this.actions.reduce((actionsGroup, action) => {
        let group = action.type ? action.type : 'action';

        if (group !== 'action' && group !== 'trait' && group !== 'nastierSpecial') {
          group = 'misc';
        }

        // Create the group if it doesn't exist.
        if (!actionsGroup[group]) {
          actionsGroup[group] = [];
        }
        // Add the actions and return for the next iteration.
        actionsGroup[group].push(action);
        return actionsGroup;
      }, {});

      return actionsByGroup;
    },
  },
  methods: {
    /**
     * Clean a actions name for usage in group keys.
     */
    cleanClassName(string) {
      return string ? string.toLowerCase().replace(/[^a-zA-z\d]/g, '') : '';
    },
    canExpand(action) {
      let result = false;
      if (action.type == 'action') {
        const fields = ['hit1', 'hit2', 'hit3', 'miss', 'description'];
        for (let field of fields) {
          if (action.system[field]?.value) {
            result = true;
          }
        }
      }
      return result;
    },
    /**
     * Update the `actions` prop to be equal to a filtered version of the current
     * actions items on the actor. Filters by type and search keys.
     */
    getActions() {
      let actions = this.actor.items;
      if (this.searchValue) {
        actions = actions.filter(i => {
          let needle = this.cleanClassName(this.searchValue);
          let haystack = `${i.name}`;

          // if (i.type == 'actions') {
          //   let bonuses = this.getBonuses(i);
          //   for (let [k,v] of Object.entries(bonuses)) {
          //     haystack = `${haystack}${k}${v}`;
          //   }
          // }

          haystack = this.cleanClassName(haystack);

          return haystack.includes(needle);
        });
      }
      if (this.sortBy == 'name') {
        actions = actions.sort((a,b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      }
      actions.forEach(i => {
        if (this.activeActions[i._id] == undefined) {
          // this.$set(this.activeActions, i._id, {value: false});
          this.activeActions[i._id] = false;
        }
      });
      this.actions = actions;
    },
    getBonuses(actions) {
      let bonuses = {};
      for (let [prop, value] of Object.entries(actions.system.attributes)) {
        if (value.bonus) {
          bonuses[prop] = value.bonus
        }
        else if (prop == 'attack') {
          for (let [atkProp, atkValue] of Object.entries(value)) {
            if (atkValue.bonus) {
              bonuses[atkProp] = atkValue.bonus;
            }
          }
        }
      }
      return bonuses;
    },
    /**
     * Toggle actions display (click event).
     */
    toggleAction(event) {
      let target = event.currentTarget;
      let dataset = target.dataset;
      let id = dataset.itemId;
      if (id) {
        // Toggle the state if the actions is currently being tracked.
        if (this.activeActions[id] !== undefined) {
          this.activeActions[id] = !this.activeActions[id];
        }
        // Otherwise, assume it should be open since this was click event.
        else {
          this.activeActions[id] = true;
        }
      }
    },
    imageNotEmpty(action) {
      return action?.img && action.img !== 'icons/svg/mystery-man.svg' && action.img !== CONFIG.ARCHMAGE.defaultTokens[action.type];
    }
  },
  watch: {
    'actor.items': {
      deep: true,
      handler() {
        this.getActions();
      }
    },
    'searchValue': {
      deep: false,
      handler() {
        this.getActions();
      }
    }
  },
  async mounted() {
    this.getActions();
    this.sortBy = this.flags?.sheetDisplay?.actions?.sortBy?.value ?? 'custom';
  }
}
</script>

<style lang="scss">
.archmage-v2.npc-sheet {
  .action-group-content {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  .action-name {
    &.is-action {
      &:hover,
      &:focus {
        color: $c-blue;
        cursor: pointer;
      }
    }
  }

  .action-group {
    padding-bottom: $padding-md;
    border-bottom: 2px solid #0000002e;

    + .action-group {
      padding-top: $padding-md;
    }
  }

  .action-group-header {
    .item-controls {
      flex: 0 auto;
    }
  }

  .action-summary {
    .rollable,
    .item-controls {
      flex: 0 auto;
      color: #666;

      a {
        padding: 0 4px;
      }
    }

    .rollable {
      width: 25px;
      height: 25px;
      margin-right: 4px;
      margin-left: -25px;
      position: relative;
      transition: all ease-in-out 0.25s;

      &::before {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        width: 100%;
        height: 100%;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &.has-image {
        &::before {
          color: $c-white !important;
          text-shadow: 0 0 10px $c-white;
          box-shadow: inset 0 0 0 10px $c-black--75;
          opacity: 0;
          transition: all ease-in-out 0.25s;
        }

        &:hover,
        &:focus {
          &::before {
            opacity: 1;
          }
        }
      }
    }

    .fa-chevron {
      transition: all ease-in-out 0.25s;
    }

    &.active {
      .fa-chevron {
        transform: rotate(180deg);
      }
    }
  }

  .action-header-title {
    .action-group-title {
      text-align: left;
    }

    .item-controls {
      text-align: right;
    }
  }

  .action-content {
    overflow: hidden;
    transition: all ease-in-out 0.25s;
  }
}
</style>