<template>
  <!-- Rendered inside the stats header as a flexrow of compact resource units;
       nothing renders when every resource is disabled. -->
  <div v-if="hasUnits" class="stats-resources">
    <section v-if="perCombat.commandPoints?.enabled" class="unit unit--command-points">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints') }}</h2>
      <div class="resource-row">
        <template v-if="!editing">
          <span class="resource-value">{{ perCombat.commandPoints.current }}</span>
          <div class="command-rolls">
            <!-- TODO: Add support for epic feat to bump to d6. -->
            <RollableV3 data-roll-type="command" data-roll-opt="d4">d4</RollableV3>
            <RollableV3 data-roll-type="command" data-roll-opt="d3">d3</RollableV3>
          </div>
        </template>
        <input v-else type="number" name="system.resources.perCombat.commandPoints.current"
          v-model="perCombat.commandPoints.current">
      </div>
    </section>

    <section v-if="perCombat.focus?.enabled" class="unit unit--focus">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.focus') }}</h2>
      <div class="resource-row">
        <!-- Binary state stays toggleable in view mode, like the death saves. -->
        <a v-if="!editing" class="resource-value resource-toggle"
          :class="{ 'resource-value--on': perCombat.focus.current }" @click="toggleResource('focus')">
          {{ perCombat.focus.current ? '✓' : '–' }}
        </a>
        <input v-else type="checkbox" name="system.resources.perCombat.focus.current" v-model="perCombat.focus.current">
      </div>
    </section>

    <section v-if="perCombat.momentum?.enabled" class="unit unit--momentum">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.momentum') }}</h2>
      <div class="resource-row">
        <!-- Binary state stays toggleable in view mode, like the death saves. -->
        <a v-if="!editing" class="resource-value resource-toggle"
          :class="{ 'resource-value--on': perCombat.momentum.current }" @click="toggleResource('momentum')">
          {{ perCombat.momentum.current ? '✓' : '–' }}
        </a>
        <input v-else type="checkbox" name="system.resources.perCombat.momentum.current"
          v-model="perCombat.momentum.current">
      </div>
    </section>

    <section v-if="perCombat.rhythm?.enabled && secondEdition" class="unit unit--rhythm">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rhythm') }}</h2>
      <div class="resource-row">
        <span v-if="!editing" class="resource-value">{{ rhythmLabel(perCombat.rhythm.current) }}</span>
        <select v-else name="system.resources.perCombat.rhythm.current" v-model="perCombat.rhythm.current">
          <option value="none">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.none') }}</option>
          <option value="offense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense') }}</option>
          <option value="defense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense') }}</option>
        </select>
      </div>
    </section>

    <section v-if="perCombat.bravado?.enabled && secondEdition" class="unit unit--bravado">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.bravado') }}</h2>
      <div class="resource-row">
        <span v-if="!editing" class="resource-value">{{ perCombat.bravado.current }}</span>
        <input v-else type="number" name="system.resources.perCombat.bravado.current" v-model="perCombat.bravado.current">
      </div>
    </section>

    <!-- Rerolls: derived from equipped items, so both values are display-only
         and spending happens through the rollable labels. Each group is one
         line to keep the bar short. -->
    <section v-if="rerolls?.enabled" class="unit unit--rerolls">
      <div class="reroll-group">
        <RollableV3 name="reroll" @click="rollReroll('AC')" class="reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollAc') }}</RollableV3>
        <Progress name="rerollAc" :current="rerolls.AC.current" :max="rerolls.AC.max" />
        <span class="resource-value">{{ rerolls.AC.current }}</span>
        <span class="resource-separator">/</span>
        <span class="resource-value">{{ rerolls.AC.max }}</span>
      </div>
      <div class="reroll-group">
        <RollableV3 name="reroll" @click="rollReroll('save')" class="reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollSave') }}</RollableV3>
        <Progress name="rerollSave" :current="rerolls.save.current" :max="rerolls.save.max" />
        <span class="resource-value">{{ rerolls.save.current }}</span>
        <span class="resource-separator">/</span>
        <span class="resource-value">{{ rerolls.save.max }}</span>
      </div>
    </section>

    <!-- Custom resources: enabled per-actor in the settings tab, tracked here. -->
    <section v-for="resource in customResources" :key="resource.key" class="unit unit--custom">
      <h2 v-if="!editing" class="unit-title">{{ resource.label }}</h2>
      <input v-else type="text" :name="`system.resources.spendable.${resource.key}.label`" class="resource-label"
        v-model="resource.raw.label" :placeholder="localize(`ARCHMAGE.CHARACTER.RESOURCES.${resource.key}`)">
      <Progress :name="resource.key" :current="resource.raw.current" :max="resource.raw.max" />
      <div class="resource-row">
        <template v-if="!editing">
          <span class="resource-value">{{ resource.raw.current }}</span>
          <span class="resource-separator">/</span>
          <span class="resource-value">{{ resource.raw.max }}</span>
        </template>
        <template v-else>
          <input type="number" :name="`system.resources.spendable.${resource.key}.current`"
            v-model="resource.raw.current">
          <span class="resource-separator">/</span>
          <input type="number" :name="`system.resources.spendable.${resource.key}.max`" v-model="resource.raw.max">
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { localize } from '@/methods/Helpers';
import Progress from '@/components/parts/Progress.vue';
import RollableV3 from './RollableV3.vue';

const props = defineProps(['actor']);

// Updates from view mode (toggles) go through the real actor document;
// props.actor is the context's toObject() clone.
const actorDocument = inject('actorDocument');

// Edit mode is owned by the sheet root and broadcast via provide/inject.
const editing = inject('editMode', ref(false));

// Same gate the V2 resources strip uses; game settings aren't reactive, but
// resource sections re-render with the actor context.
const secondEdition = computed(() => game.settings.get('archmage', 'secondEdition') === true);

const perCombat = computed(() => props.actor?.system?.resources?.perCombat ?? {});

// Reroll uses are derived from equipped items in prepareDerivedData(), so they
// arrive with the context clone like the other computed attributes.
const rerolls = computed(() => props.actor?.system?.resources?.spendable?.rerolls);

const customResources = computed(() =>
  Object.entries(props.actor?.system?.resources?.spendable ?? {})
    .filter(([key, resource]) => key.includes('custom') && resource.enabled)
    .map(([key, resource]) => ({
      key,
      raw: resource,
      label: resource.label || localize(`ARCHMAGE.CHARACTER.RESOURCES.${key}`)
    }))
);

// The header drops the whole group when nothing is enabled, so it doesn't
// leave an empty flex unit behind.
const hasUnits = computed(() =>
  Object.values(perCombat.value).some(resource => resource?.enabled)
  || rerolls.value?.enabled === true
  || customResources.value.length > 0
);

function rhythmLabel(current) {
  return localize(`ARCHMAGE.CHARACTER.RHYTHMCHOICES.${current || 'none'}`);
}

// Flip a binary per-combat resource straight to the document so it persists
// from view mode, where there is no named input for the form to submit.
function toggleResource(key) {
  const current = perCombat.value[key]?.current === true;
  actorDocument?.update({ [`system.resources.perCombat.${key}.current`]: !current });
}

// Spend an AC or save reroll: decrement the equipped item that grants it and
// post the reroll card to chat. Mirrors the V2 sheet's _onRerollRoll.
async function rollReroll(kind) {
  if (!actorDocument) return;
  const res = actorDocument.system.resources.spendable.rerolls[kind];
  if (!res || res.current <= 0) return;

  // We have uses to spend, find source item.
  const prop = kind === 'AC' ? 'rerollAc' : 'rerollSave';
  actorDocument.items.forEach(item => {
    if (item.type === 'equipment' && item.system.isActive && item.system.attributes[prop].current > 0) {
      const itemUpdateData = { '_id': item.id };
      itemUpdateData[`system.attributes.${prop}.current`] = res.current - 1;
      actorDocument.updateEmbeddedDocuments('Item', [itemUpdateData]);
    }
  });

  const token = actorDocument.token;
  const chatData = {
    user: game.user.id,
    speaker: game.archmage.ArchmageUtility.getSpeaker(actorDocument),
    title: game.i18n.localize(`ARCHMAGE.CHARACTER.RESOURCES.${prop}`),
    desc: game.i18n.localize(`ARCHMAGE.CHARACTER.RESOURCES.${prop}Desc`)
  };
  const templateData = {
    actor: actorDocument,
    tokenId: token ? `${token.id}` : null,
    data: chatData
  };
  chatData.content = await foundry.applications.handlebars.renderTemplate('systems/archmage/templates/chat/reroll-card.html', templateData);
  await game.archmage.ArchmageUtility.createChatMessage(chatData);
}
</script>

<style scoped lang="scss">
/* Second row of the stats header: a flexrow of compact resource tiles, the
   rerolls tile last. The top border separates it from the vitals row and only
   exists when at least one resource is enabled. */
.stats-resources {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  align-items: stretch;
  border-top: 1px solid $ct-border;
}

.unit {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.375rem 0.75rem;
  border-right: 1px solid $ct-border;

  &:last-child {
    border-right: none;
  }
}

.unit-title {
  margin: 0 0 0.25rem;
  font-family: $font-stack-secondary;
  font-size: $font-tiny;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* The reroll tile stacks its two one-line groups. */
.unit--rerolls {
  flex: 2 1 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 0.25rem;
}

.reroll-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: $font-tiny;
  white-space: nowrap;

  .reroll-label {
    flex: 0 0 auto;
  }

  .progress-bar {
    flex: 1 1 auto;
    width: auto;
    margin: 0;
  }

  .resource-value {
    flex: 0 0 auto;
  }
}

.resource-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  input[type='number'] {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    padding: 0 0.25rem;
    text-align: center;
  }
}

.resource-value {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  font-variant-numeric: tabular-nums;

  &.resource-value--on {
    color: var(--c-hit, #023602);
  }
}

.resource-toggle {
  cursor: pointer;

  &:hover {
    text-shadow: 0 0 5px $c-black--25;
  }
}

.resource-separator {
  color: $c-gray;
}

.command-rolls {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-align: center;
}

.resource-label {
  width: 100%;
  margin-bottom: 0.25rem;
  padding: 0 0.25rem;
  font-family: $font-stack-secondary;
  font-size: $font-tiny;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
