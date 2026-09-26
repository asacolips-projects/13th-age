<template>
  <div class="archmage-appv2-vue flexcol">
    <!-- Tab links -->
    <Tabs :tabs="tabs.primary" no-span="true"/>

    <!-- Core: base stats, adjustments, modifiers -->
    <Tab group="primary" :tab="tabs.primary.core">
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.defenses') }}</legend>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.baseAC') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.ac.base" v-model="actor.system.attributes.ac.base"
              :disabled="isOverridden('system.attributes.ac.base')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.basePD') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.pd.base" v-model="actor.system.attributes.pd.base"
              :disabled="isOverridden('system.attributes.pd.base')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.baseMD') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.md.base" v-model="actor.system.attributes.md.base"
              :disabled="isOverridden('system.attributes.md.base')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.baseHP') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.hp.base" step=".1" v-model="actor.system.attributes.hp.base"
              :disabled="isOverridden('system.attributes.hp.base')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.baseRecoveries') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.recoveries.base" v-model="actor.system.attributes.recoveries.base"
              :disabled="isOverridden('system.attributes.recoveries.base')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.recoveryDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.recoveries.dice" v-model="actor.system.attributes.recoveries.dice"
              :disabled="isOverridden('system.attributes.recoveries.dice')" placeholder="d8" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.calculateHP') }}</label>
          <div class="field">
            <input type="checkbox" name="system.attributes.hp.automatic" v-model="actor.system.attributes.hp.automatic" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.calculateRecoveries') }}</label>
          <div class="field">
            <input type="checkbox" name="system.attributes.recoveries.automatic" v-model="actor.system.attributes.recoveries.automatic" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.adjustments') }}</legend>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.hpAdjustment') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.hp.extra" v-model="actor.system.attributes.hp.extra"
              :disabled="isOverridden('system.attributes.hp.extra')" placeholder="0" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.initAdjustment') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.init.value" v-model="actor.system.attributes.init.value"
              :disabled="isOverridden('system.attributes.init.value')" placeholder="0" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.disengageAdjustment') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.disengageBonus" v-model="actor.system.attributes.disengageBonus"
              :disabled="isOverridden('system.attributes.disengageBonus')" placeholder="0" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.modifiers') }}</legend>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.attackMod') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.attackMod.value" v-model="actor.system.attributes.attackMod.value"
              :disabled="isOverridden('system.attributes.attackMod.value')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.critModAtk') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.critMod.atk.value" v-model="actor.system.attributes.critMod.atk.value"
              :disabled="isOverridden('system.attributes.critMod.atk.value')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.critModDef') }}</label>
          <div class="field">
            <input type="number" name="system.attributes.critMod.def.value" v-model="actor.system.attributes.critMod.def.value"
              :disabled="isOverridden('system.attributes.critMod.def.value')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.keyMod') }}</label>
          <div class="field flexrow">
            <select name="system.attributes.keyModifier.mod1" v-model="actor.system.attributes.keyModifier.mod1">
              <option v-for="option in abilities" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            /
            <select name="system.attributes.keyModifier.mod2" v-model="actor.system.attributes.keyModifier.mod2">
              <option v-for="option in abilities" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.maxSkulls') }}</label>
          <div class="field">
            <select name="system.attributes.saves.deathFails.maxOverride" v-model="actor.system.attributes.saves.deathFails.maxOverride">
              <option :value="0">{{ localize('Default') }}</option>
              <option v-for="skulls in [4, 5, 6, 7]" :key="skulls" :value="skulls">{{ skulls }}</option>
            </select>
          </div>
        </div>
      </fieldset>
    </Tab>

    <!-- Weapons: dice and stances -->
    <Tab group="primary" :tab="tabs.primary.weapons">
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.weaponDice') }}</legend>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.meleeWeaponDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.weapon.melee.dice" v-model="actor.system.attributes.weapon.melee.dice"
              :disabled="isOverridden('system.attributes.weapon.melee.dice')" placeholder="d8" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.rangedWeaponDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.weapon.ranged.dice" v-model="actor.system.attributes.weapon.ranged.dice"
              :disabled="isOverridden('system.attributes.weapon.ranged.dice')" placeholder="d8" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.jabWeaponDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.weapon.jab.dice" v-model="actor.system.attributes.weapon.jab.dice"
              :disabled="isOverridden('system.attributes.weapon.jab.dice')" placeholder="d6" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.punchWeaponDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.weapon.punch.dice" v-model="actor.system.attributes.weapon.punch.dice"
              :disabled="isOverridden('system.attributes.weapon.punch.dice')" placeholder="d8" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.kickWeaponDice') }}</label>
          <div class="field">
            <input type="text" name="system.attributes.weapon.kick.dice" v-model="actor.system.attributes.weapon.kick.dice"
              :disabled="isOverridden('system.attributes.weapon.kick.dice')" placeholder="d10" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.stances') }}</legend>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.CHARACTERSETTINGS.shield') }}</label>
          <div class="field">
            <input type="checkbox" name="system.attributes.weapon.melee.shield" v-model="actor.system.attributes.weapon.melee.shield" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.CHARACTERSETTINGS.dualwield') }}</label>
          <div class="field">
            <input type="checkbox" name="system.attributes.weapon.melee.dualwield" v-model="actor.system.attributes.weapon.melee.dualwield" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ localize('ARCHMAGE.CHARACTERSETTINGS.twohanded') }}</label>
          <div class="field">
            <input type="checkbox" name="system.attributes.weapon.melee.twohanded" v-model="actor.system.attributes.weapon.melee.twohanded" />
          </div>
        </div>
      </fieldset>
    </Tab>

    <!-- Flags: one group box per flag section -->
    <Tab group="primary" :tab="tabs.primary.flags">
      <fieldset v-for="(groupFlags, section) in flagGroups" :key="section">
        <legend>{{ section }}</legend>
        <div v-for="flag in groupFlags" :key="flag.key" class="form-group" :data-key="flag.key">
          <label>{{ localize(flag.name) }}</label>
          <div class="field">
            <input v-if="!flag.options" type="checkbox" :name="concat('flags.archmage.', flag.key)" v-model="flag.value" />
            <select v-else :name="concat('flags.archmage.', flag.key)" v-model="flag.value">
              <option v-for="(option, o) in flag.options" :key="o" :value="o">{{ localize(option) }}</option>
            </select>
          </div>
          <p class="hint">{{ localize(flag.hint) }}</p>
        </div>
      </fieldset>
    </Tab>

    <!-- Backgrounds and icons -->
    <Tab group="primary" :tab="tabs.primary.toggles">
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.backgrounds') }}</legend>
        <div v-for="(background, b) in actor.system.backgrounds" :key="b" class="form-group" :data-key="b">
          <label>{{ localize(concat('ARCHMAGE.CHARACTERSETTINGS.', b)) }}</label>
          <div class="field">
            <input type="checkbox" :name="concat('system.backgrounds.', b, '.isActive.value')" v-model="background.isActive.value" />
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.icons') }}</legend>
        <div v-for="(icon, i) in actor.system.icons" :key="i" class="form-group" :data-key="i">
          <label>{{ localize(concat('ARCHMAGE.CHARACTERSETTINGS.', i)) }}</label>
          <div class="field">
            <input type="checkbox" :name="concat('system.icons.', i, '.isActive.value')" v-model="icon.isActive.value" />
          </div>
        </div>
      </fieldset>
    </Tab>

    <!-- Resources -->
    <Tab group="primary" :tab="tabs.primary.resources">
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.resourcesCustom') }}</legend>
        <div v-for="(resource, r) in resourcesCustom" :key="r" class="form-group" :data-key="r">
          <label>{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</label>
          <div class="field">
            <input type="checkbox" :name="concat('system.resources.spendable.', r, '.enabled')" v-model="resource.enabled" />
          </div>
          <p class="hint flexrow">
            {{ localize('ARCHMAGE.RESTS.header') }}:&nbsp;
            <select :name="concat('system.resources.spendable.', r, '.rest')" v-model="resource.rest">
              <option v-for="restType in restTypes" :key="restType" :value="restType">
                {{ localize(concat('ARCHMAGE.RESTS.', restType)) }}
              </option>
            </select>
          </p>
        </div>
      </fieldset>
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.resourcesPerCombat') }}</legend>
        <div v-for="(resource, r) in resourcesPerCombat" :key="r" class="form-group" :data-key="r">
          <label>{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</label>
          <div class="field">
            <input type="checkbox" :name="concat('system.resources.perCombat.', r, '.enabled')" v-model="resource.enabled" />
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>{{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.resourcesSpendable') }}</legend>
        <div v-for="(resource, r) in resourcesSpendable" :key="r" class="form-group" :data-key="r">
          <label>{{ localize(concat('ARCHMAGE.CHARACTER.RESOURCES.', r)) }}</label>
          <div class="field">
            <input type="checkbox" :name="concat('system.resources.spendable.', r, '.enabled')" v-model="resource.enabled" />
          </div>
        </div>
      </fieldset>
    </Tab>

    <!-- Lifecycle hooks -->
    <Tab group="primary" :tab="tabs.primary.hooks">
      <fieldset>
        <legend>
          {{ localize('ARCHMAGE.CHARACTERSETTINGS.groups.hooks') }}
          <InfoBubble :tooltip="localize('ARCHMAGE.SETTINGS.lifecycleHooks.hint')" />
        </legend>
        <div class="form-group stacked">
          <label>{{ localize('ARCHMAGE.SETTINGS.lifecycleHooks.startOfTurn') }}</label>
          <CodemirrorWrapper class="attribute-value"
            name="system.lifecycleHooks.startOfTurn"
            :value="actor.system.lifecycleHooks?.startOfTurn"
            :disable-paste-parsing="true" />
        </div>
        <div class="form-group stacked">
          <label>{{ localize('ARCHMAGE.SETTINGS.lifecycleHooks.endOfTurn') }}</label>
          <CodemirrorWrapper class="attribute-value"
            name="system.lifecycleHooks.endOfTurn"
            :value="actor.system.lifecycleHooks?.endOfTurn"
            :disable-paste-parsing="true" />
        </div>
      </fieldset>
    </Tab>
  </div>
</template>

<script setup>
  import { toRaw, reactive, computed } from 'vue';
  import { localize, concat } from '@/methods/Helpers';
  import { Tabs, Tab, CodemirrorWrapper, InfoBubble } from '@/components';

  const props = defineProps(['context']);

  // Convert the tabs into a new reactive variable so that they
  // don't change every time the actor is updated.
  const rawTabs = toRaw(props.context.tabs);
  const tabs = reactive({...rawTabs});

  const actor = computed(() => props.context.actor);

  // Character flag definitions from CONFIG, merged with the actor's current
  // values into a local reactive copy. Form submission persists them via the
  // name attributes; the copy just avoids mutating CONFIG like the old
  // CharSettings component did.
  const flagState = reactive(
    Object.fromEntries(
      Object.entries(CONFIG.Actor.characterFlags).map(([key, flag]) => {
        const value = props.context.actor.flags?.archmage?.[key] ?? null;
        return [key, { ...flag, value }];
      })
    )
  );

  const flagGroups = computed(() => {
    const groups = {};
    for (const flag of Object.values(flagState)) {
      const section = flag.section ?? '';
      (groups[section] ??= []).push(flag);
    }
    return groups;
  });

  const abilities = ['str', 'con', 'dex', 'int', 'wis', 'cha'].map(ability => ({
    value: ability,
    label: localize(`ARCHMAGE.${ability}.key`)
  }));

  const restTypes = ['none', 'quickreset', 'fullreset', 'quick', 'full'];

  // The second-edition filter from the old CharSettings component: resources
  // marked 2e only show up while second edition rules are enabled.
  function filterResources(resources, predicate) {
    const filtered = {};
    const secondEdition = game.settings.get('archmage', 'secondEdition');
    for (const [key, resource] of Object.entries(resources)) {
      if (resource.secondEdition && !secondEdition) continue;
      if (predicate(key)) filtered[key] = resource;
    }
    return filtered;
  }

  const resourcesCustom = computed(() => filterResources(actor.value.system.resources.spendable, key => key.includes('custom')));
  const resourcesPerCombat = computed(() => filterResources(actor.value.system.resources.perCombat, () => true));
  const resourcesSpendable = computed(() => filterResources(actor.value.system.resources.spendable, key => !key.includes('custom')));

  function isOverridden(path) {
    return Object.keys(props.context.actor.overrides ?? {}).includes(path);
  }
</script>

<style scoped>
/* Column-size adjustment, overrides standard foundry styles */
.standard-form .form-group > * {
  flex: 1;
}
</style>
