<template>
  <!-- Rendered inside the stats header as a flexrow of compact resource units;
       nothing renders when every resource is disabled. -->
  <div v-if="hasUnits" class="stats-resources">
    <section v-if="perCombat.commandPoints?.enabled" class="unit unit--command-points">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.commandPoints') }}</h2>
      <div class="resource-row">
        <!-- Current stays editable in play, like the hp row above; the named
             input persists via the sheet's submitOnChange. -->
        <input type="number" name="system.resources.perCombat.commandPoints.current"
          v-model="perCombat.commandPoints.current">
        <div v-if="!editing" class="command-rolls">
          <!-- TODO: Add support for epic feat to bump to d6. -->
          <RollableV3 data-roll-type="command" data-roll-opt="d4" @click="rollCommand('d4')">d4</RollableV3>
          <RollableV3 data-roll-type="command" data-roll-opt="d3" @click="rollCommand('d3')">d3</RollableV3>
        </div>
      </div>
    </section>

    <section v-if="perCombat.focus?.enabled" class="unit unit--focus">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.focus') }}</h2>
      <div class="resource-row">
        <!-- Binary state persists via the sheet's submitOnChange. -->
        <input type="checkbox" name="system.resources.perCombat.focus.current"
          v-model="perCombat.focus.current">
      </div>
    </section>

    <section v-if="perCombat.momentum?.enabled" class="unit unit--momentum">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.momentum') }}</h2>
      <div class="resource-row">
        <!-- Binary state persists via the sheet's submitOnChange. -->
        <input type="checkbox" name="system.resources.perCombat.momentum.current"
          v-model="perCombat.momentum.current">
      </div>
    </section>

    <section v-if="perCombat.rhythm?.enabled && secondEdition" class="unit unit--rhythm">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rhythm') }}</h2>
      <div class="resource-row">
        <!-- Rhythm stays switchable in play, like the hp row above; the named
             select persists via the sheet's submitOnChange. -->
        <select name="system.resources.perCombat.rhythm.current" v-model="perCombat.rhythm.current">
          <option value="none">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.none') }}</option>
          <option value="offense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.offense') }}</option>
          <option value="defense">{{ localize('ARCHMAGE.CHARACTER.RHYTHMCHOICES.defense') }}</option>
        </select>
      </div>
    </section>

    <section v-if="perCombat.bravado?.enabled && secondEdition" class="unit unit--bravado">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.bravado') }}</h2>
      <div class="resource-row">
        <input type="number" name="system.resources.perCombat.bravado.current" v-model="perCombat.bravado.current">
      </div>
    </section>

    <!-- Ki: monk's daily spendable, max only changes in edit mode. -->
    <section v-if="ki?.enabled" class="unit unit--ki">
      <h2 class="unit-title">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.ki') }}</h2>
      <Progress name="ki" :current="ki.current" :max="ki.max" />
      <div class="resource-row">
        <input type="number" name="system.resources.spendable.ki.current" v-model="ki.current">
        <span class="resource-separator">/</span>
        <input v-if="editing" type="number" name="system.resources.spendable.ki.max" v-model="ki.max">
        <span v-else class="resource-value">{{ ki.max }}</span>
      </div>
    </section>

    <!-- Custom resources: enabled per-actor in the settings tab, tracked here. -->
    <section v-for="resource in customResources" :key="resource.key" class="unit unit--custom">
      <h2 v-if="!editing" class="unit-title">{{ resource.label }}</h2>
      <input v-else type="text" :name="`system.resources.spendable.${resource.key}.label`" class="resource-label"
        v-model="resource.raw.label" :placeholder="localize(`ARCHMAGE.CHARACTER.RESOURCES.${resource.key}`)">
      <Progress :name="resource.key" :current="resource.raw.current" :max="resource.raw.max" />
      <div class="resource-row">
        <!-- Current stays editable in play; max only changes in edit mode. -->
        <input type="number" :name="`system.resources.spendable.${resource.key}.current`"
          v-model="resource.raw.current">
        <span class="resource-separator">/</span>
        <input v-if="editing" type="number" :name="`system.resources.spendable.${resource.key}.max`"
          v-model="resource.raw.max">
        <span v-else class="resource-value">{{ resource.raw.max }}</span>
      </div>
    </section>

    <!-- Rerolls: derived from equipped items, so max is display-only and the
         current count writes through to the granting item. Spending happens
         through the rollable labels. With both pools active each group is one
         line to keep the bar short; a lone pool uses the same stacked layout
         as the numeric resources above. -->
    <section v-if="rerolls?.enabled" class="unit unit--rerolls" :class="{ 'unit--rerolls--single': !bothRerolls }">
      <template v-if="bothRerolls">
        <div v-if="rerolls.AC.max > 0" class="reroll-group">
          <RollableV3 name="reroll" @click="rollReroll('AC')" class="reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollAc') }}</RollableV3>
          <Progress name="rerollAc" :current="rerolls.AC.current" :max="rerolls.AC.max" />
          <input type="number" :value="rerolls.AC.current" @change="setReroll('AC', $event)">
          <span class="resource-separator">/</span>
          <span class="resource-value">{{ rerolls.AC.max }}</span>
        </div>
        <div v-if="rerolls.save.max > 0" class="reroll-group">
          <RollableV3 name="reroll" @click="rollReroll('save')" class="reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollSave') }}</RollableV3>
          <Progress name="rerollSave" :current="rerolls.save.current" :max="rerolls.save.max" />
          <input type="number" :value="rerolls.save.current" @change="setReroll('save', $event)">
          <span class="resource-separator">/</span>
          <span class="resource-value">{{ rerolls.save.max }}</span>
        </div>
      </template>
      <template v-else>
        <template v-if="rerolls.AC.max > 0">
          <RollableV3 tag="h2" name="reroll" @click="rollReroll('AC')" class="unit-title reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollAc') }}</RollableV3>
          <Progress name="rerollAc" :current="rerolls.AC.current" :max="rerolls.AC.max" />
          <div class="resource-row">
            <input type="number" :value="rerolls.AC.current" @change="setReroll('AC', $event)">
            <span class="resource-separator">/</span>
            <span class="resource-value">{{ rerolls.AC.max }}</span>
          </div>
        </template>
        <template v-else-if="rerolls.save.max > 0">
          <RollableV3 tag="h2" name="reroll" @click="rollReroll('save')" class="unit-title reroll-label">{{ localize('ARCHMAGE.CHARACTER.RESOURCES.rerollSave') }}</RollableV3>
          <Progress name="rerollSave" :current="rerolls.save.current" :max="rerolls.save.max" />
          <div class="resource-row">
            <input type="number" :value="rerolls.save.current" @change="setReroll('save', $event)">
            <span class="resource-separator">/</span>
            <span class="resource-value">{{ rerolls.save.max }}</span>
          </div>
        </template>
      </template>
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

// Both pools active: the rerolls tile keeps its two one-line groups. With a
// single pool it falls back to the stacked numeric-resource layout.
const bothRerolls = computed(() =>
  rerolls.value?.AC?.max > 0 && rerolls.value?.save?.max > 0
);

// Ki is the monk's daily pool; gated by the settings tab like the other resources.
const ki = computed(() => props.actor?.system?.resources?.spendable?.ki);

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
  || ki.value?.enabled === true
  || rerolls.value?.enabled === true
  || customResources.value.length > 0
);

// Set a reroll pool's count from view mode: write through to the equipped
// item(s) that grant it, matching how rollReroll spends them. The actor-level
// value is derived in prepareDerivedData(), so there is nothing to update
// there.
function setReroll(kind, event) {
  if (!actorDocument) return;
  const value = Number(event.target.value) || 0;
  const prop = kind === 'AC' ? 'rerollAc' : 'rerollSave';
  const updates = [];
  actorDocument.items.forEach(item => {
    if (item.type === 'equipment' && item.system.isActive && item.system.attributes[prop]?.bonus > 0) {
      updates.push({ '_id': item.id, [`system.attributes.${prop}.current`]: value });
    }
  });
  if (updates.length) actorDocument.updateEmbeddedDocuments('Item', updates);
}

// Roll command points and apply them to the pool, like the V2 sheet's
// command rollables do through its _onCommandRoll.
function rollCommand(die) {
  if (!actorDocument) return;
  actorDocument.rollCommand(die);
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
  justify-content: space-evenly;
  border-top: 1px solid var(--color-border);
}

.unit {
  flex: 1 1 0;
  min-width: 0;
  max-width: 33%;
  padding: 0.375rem 0.75rem;
  border-right: 1px solid var(--color-border);

  &:last-child {
    border-right: none;
  }
}

.unit-title {
  margin: 0 0 0.25rem;
  font-family: var(--v3-font-display);
  font-size: var(--font-size-12);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* The reroll tile stacks its two one-line groups; a lone pool widens back to a
   normal tile and uses the stacked numeric layout instead. */
.unit--rerolls {
  flex: 2 1 0;

  &.unit--rerolls--single {
    flex: 1 1 0;
  }
}

.reroll-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--font-size-12);
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
  justify-content: center;
  gap: 0.25rem;
}

/* Compact numeric boxes: room for three digits at the row's own font (the
   global input style would otherwise force 20px), with a trimmed height and
   line-height so the tiles stay short. */
.resource-row input[type='number'],
.reroll-group input[type='number'] {
  flex: 0 1 auto;
  min-width: 0;
  width: calc(3ch + 0.5rem);
  height: 1.25rem;
  padding: 0 0.25rem;
  line-height: 1.25rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.resource-value {
  flex: 0;
  margin: 0 0.25em;
  min-width: 0;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.resource-separator {
  color: var(--color-text-secondary);
  margin: 0 0.25em;
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
  font-family: var(--v3-font-display);
  font-size: var(--font-size-12);
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
