/**
 * Flexible attacks: an attack power flagged `system.flexibleAttack.value` lists, on its chat card, the
 * flexible attack powers (`powerType: flexible`) of the same actor that its roll can trigger.
 *
 * Each maneuver is added as a card row labelled with its trigger ("Natural even hit: Me Smash!"), so the
 * existing trigger evaluation (Triggers, run by preCreateChatMessageHandler when the card is posted and
 * again by DamageApplicator.rerollDice) marks it active, unknown or inactive, with no evaluation code
 * here. Inactive rows are hidden by CSS unless "show all" is clicked. Clicking a row rolls that power from the actor.
 */
export default class FlexibleAttacks {

  /**
   * The attack slots that identify the kind of an attack, as used in its attack formula
   * (`@atk.m.bonus`), and the word that a flexible power's range uses for that kind ("Flexible melee
   * attack"). A class that ties flexible attacks to a spell could add `a: { kind: 'arcane', ... }`
   * and `d: { kind: 'divine', ... }` here.
   */
  static SLOTS = {
    m: { kind: "melee", word: /melee/i },
    r: { kind: "ranged", word: /ranged/i }
  };

  /**
   * Which kind of attack is this formula? The kind of the one known slot it uses, or null when it uses
   * none or several of them.
   * @param {string} attackFormula The power's `system.attack.value`.
   * @returns {string|null}
   */
  static kindOf(attackFormula) {
    const slots = new Set();
    for (const match of String(attackFormula ?? "").matchAll(/@atk\.([a-z])\b/g)) {
      if (FlexibleAttacks.SLOTS[match[1]]) slots.add(match[1]);
    }
    return slots.size === 1 ? FlexibleAttacks.SLOTS[[...slots][0]].kind : null;
  }

  /**
   * Can a flexible power be used with this kind of attack? Its range reads "Flexible melee attack",
   * "Flexible ranged attack" or "Flexible melee or ranged attack"; one that names no known kind
   * is allowed with any.
   * @param {string} rangeText The flexible power's `system.range.value`.
   * @param {string} kind As returned by kindOf.
   * @returns {boolean}
   */
  static allowsKind(rangeText, kind) {
    const text = String(rangeText ?? "");
    const named = Object.values(FlexibleAttacks.SLOTS).filter((slot) => slot.word.test(text));
    return named.length === 0 || named.some((slot) => slot.kind === kind);
  }

  /**
   * The actor's flexible powers that can go with this attack.
   * @param {Actor} actor
   * @param {string} kind As returned by kindOf.
   * @returns {Item[]}
   */
  static maneuversFor(actor, kind) {
    return actor.items
      .filter((item) => item.system?.powerType?.value === "flexible"
        && FlexibleAttacks.allowsKind(item.system?.range?.value, kind))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Add the maneuver rows to a chat card that is about to be evaluated.
   * Must run before preCreateChatMessageHandler.handle. The rows are appended to the card row that holds
   * the attack row, after it, since the trigger rows are evaluated against the attack's result.
   * @param {string} content The rendered card.
   * @param {Item} attack The attack power being rolled.
   * @returns {string} The card, with the rows when there are any to show.
   */
  static addRows(content, attack) {
    const actor = attack.itemActor;
    if (!actor || !attack.system.flexibleAttack?.value) return content;
    const kind = FlexibleAttacks.kindOf(attack.system.attack?.value);
    if (!kind) return content;
    const maneuvers = FlexibleAttacks.maneuversFor(actor, kind);
    if (!maneuvers.length) return content;

    // The rows go inside the attack's own card row: DamageApplicator.rerollDice re-evaluates the trigger
    // rows of that row only, so rows placed anywhere else would keep the first roll's result.
    const attackLabel = `${game.i18n.localize("ARCHMAGE.CHAT.attack")}:`;
    const $content = $(`<div class="wrapper">${content}</div>`);
    const $attackRow = $content.find(".card-prop").filter((i, row) => $(row).text()
.trim()
.startsWith(attackLabel))
.first();
    const $target = $attackRow.closest(".card-row");
    if (!$target.length) return content;

    const esc = foundry.utils.escapeHTML;
    const rows = maneuvers.map((item) => {
      const trigger = String(item.system.trigger?.value ?? "").replace(/<[^>]*>/g, "")
.replace(/[.:\s]+$/, "")
.trim();
      const label = trigger ? `<strong>${esc(trigger)}:</strong> ` : "";
      const pools = item.usagePools();
      const spent = pools.length > 0 && pools.every((pool) => pool.usage !== "at-will" && pool.uses <= 0);
      const note = spent ? ` <em>(${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackNoUses"))})</em>` : "";
      return `<div class="card-prop flexible-attack-row">${label}`
        + `<a class="flexible-attack-use" data-item-id="${esc(item.id)}"><img src="${esc(item.img)}" width="18" height="18"/> ${esc(item.name)}</a>${note}</div>`;
    });
    const heading = `<strong>${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackHeading"))}</strong> `
      + `(<a class="flexible-attack-toggle">${esc(game.i18n.localize("ARCHMAGE.CHAT.flexibleAttackShowAll"))}</a>)`;
    $target.append(`<div class="flexible-attacks">${heading}${rows.join("")}</div>`);
    return $content.html();
  }

  /**
   * Click handling for the rows of one rendered chat card.
   * @param {ChatMessage} message
   * @param {jQuery} $html The rendered message.
   */
  static activateListeners(message, $html) {
    // "show all" lists the maneuvers the roll did not trigger as well, in the inactive style; they stay
    // clickable (a GM ruling, or a class feature that lets a roll trigger more than its text says).
    $html.find(".flexible-attack-toggle").on("click", (event) => {
      event.preventDefault();
      const toggle = event.currentTarget;
      const showAll = toggle.closest(".flexible-attacks").classList.toggle("flexible-attacks--all");
      toggle.textContent = game.i18n.localize(showAll ? "ARCHMAGE.CHAT.flexibleAttackShowApplicable" : "ARCHMAGE.CHAT.flexibleAttackShowAll");
    });

    $html.find(".flexible-attack-use").on("click", async (event) => {
      event.preventDefault();
      const link = event.currentTarget;
      const card = link.closest("[data-actor-uuid]");
      const group = link.closest(".flexible-attacks");
      if (!card || !group || group.classList.contains("flexible-attacks--used")) return;
      const actor = await fromUuid(card.dataset.actorUuid);
      const item = actor?.items.get(link.dataset.itemId);
      if (!item) return;
      if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.format("ARCHMAGE.CHAT.flexibleAttackNotOwner", { actor: actor.name }));
        return;
      }
      // One maneuver per attack.
      const row = link.closest(".flexible-attack-row");
      group.classList.add("flexible-attacks--used");
      row.classList.add("flexible-attack-row--used");
      try {
        await item.roll();
      }
 catch(err) {
        console.error(`Archmage | Flexible attack '${item.name}' failed`, err);
        group.classList.remove("flexible-attacks--used");
        row.classList.remove("flexible-attack-row--used");
        return;
      }
      // Remember the choice. Only the message's author or a GM may update it.
      if (message.canUserModify(game.user, "update")) {
        await message.update({ content: card.outerHTML });
      }
    });
  }
}
