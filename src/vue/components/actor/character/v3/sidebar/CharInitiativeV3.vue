<template>
  <section class="unit unit--initiative">
    <RollableV3 name="init" @click="rollInitiative">
      {{ localize('ARCHMAGE.initiative') }}
      {{ numberFormat(actor?.system?.attributes?.init?.mod, 0, true) }}
    </RollableV3>
  </section>
</template>

<script setup>
import { inject } from 'vue';
import { localize, numberFormat } from '@/methods/Helpers';
import RollableV3 from '../RollableV3.vue';

defineProps(['actor']);

// DiceArchmage and the roll methods live on the real document; props.actor is
// the context's prepared clone. The sheet provides the document for injection.
const actorDocument = inject('actorDocument');

// Duplicated from ActorArchmageSheetV2._onInitRoll: the V3 sheet has no
// delegated .rollable listener, so the sheet method is unreachable from here.
async function rollInitiative() {
  const actor = actorDocument;
  if (!actor) return;

  let combat = game.combat;
  // Check to see if this actor is already in the combat.
  if (!combat) {
    ui.notifications.error(game.i18n.localize("ARCHMAGE.UI.errNoInitiativeOutsideCombat"));
    return;
  }
  const combatant = combat.combatants.find(c => c?.actor?._id == actor.id);
  if (combatant && combatant?.initiative !== null) {
    return;
  }

  // Prompt the user for an optional bonus
  let bonus = 0;
  try {
    bonus = await foundry.applications.api.DialogV2.prompt({
      window: { title: "ARCHMAGE.initAdjustment" },
      content: `
        <label for="bonus">${game.i18n.localize("ARCHMAGE.initBonus")}</label>
        <input name="bonus" type="number" step="1" default="0" placeholder="0" autofocus>`,
      ok: {
        label: "COMBAT.InitiativeRoll",
        callback: (event, button, dialog) => button.form.elements.bonus.valueAsNumber
      }
    });
  } catch(error) {
    // dialog canceled
    console.error(error);
    return;
  }

  let formula = actor.getInitiativeFormula();
  if (bonus) formula += ` + ${bonus ?? 0}`;

  // Create the combatant if needed.
  if (!combatant) {
    await actor.rollInitiative({createCombatants: true, initiativeOptions: { formula }});
  }
  // Otherwise, determine if the existing combatant should roll init.
  else if (!combatant.initiative && combatant.initiative !== 0) {
    await combat.rollInitiative([combatant.id], { formula });
  }
}
</script>

<style scoped lang="scss">
.unit--initiative {
  font-size: var(--font-size-14);
  font-family: var(--v3-font-display);
  text-align: center;
  padding: 0 !important;
}
</style>
