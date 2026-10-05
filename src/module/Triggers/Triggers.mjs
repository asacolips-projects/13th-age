import CritTrigger from "./CritTrigger.mjs";
import ITrigger from "./ITrigger.mjs";
import EvenTrigger from "./EvenTrigger.mjs";
import HitTrigger from "./HitTrigger.mjs";
import MissTrigger from "./MissTrigger.mjs";
import NaturalExactTrigger from "./NaturalExactTrigger.mjs";
import NaturalMatchTrigger from "./NaturalMatchTrigger.mjs";
import NaturalRangeTrigger from "./NaturalRangeTrigger.mjs";
import OddTrigger from "./OddTrigger.mjs";

export default class Triggers {

  constructor() {
    this.registeredTriggers = [
      new EvenTrigger(),
      new OddTrigger(),
      new HitTrigger(),
      new MissTrigger(),
      new CritTrigger(),
      new NaturalMatchTrigger(),
      new NaturalRangeTrigger(),
      new NaturalExactTrigger()
    ];
  }

  /**
   * The label of a card row: the text of its leading <strong>, without the trailing ':',
   * lowercased. This is the only part of a row that states conditions.
   *
   * Rows that carry no such label are free-form prose (a power's description, say). Returning null
   * for those keeps their text from being read as conditions - we must never fade out a row of
   * plain rules text because it happened to contain the word "hit".
   *
   * Note this reads text, never HTML: markup attributes contribute stray digits and plus signs
   * that a threshold like "16+" would otherwise pick up.
   *
   * @param {jQuery} $row A .card-prop element.
   * @returns {string|null}
   */
  static labelOf($row) {
    const $label = $row.children("strong").first();
    if ($label.length === 0) return null;
    const text = $label.text().trim();
    if (!text.endsWith(":")) return null;
    return text.slice(0, -1).toLowerCase();
  }

  /**
   * Does this label state any condition we know how to evaluate?
   * @param {string|null} label As returned by labelOf.
   * @returns {boolean}
   */
  isTriggerRow(label) {
    if (!label) return false;
    return this.registeredTriggers.some((trigger) => trigger.appliesTo(label));
  }

  /**
   * Split a label into its alternative clauses: an "or" that starts a new natural roll condition
   * separates two of them ("natural odd hit or miss OR natural even hit"), while any other "or"
   * stays inside its clause ("hit or miss", "natural 5, 10, 15, or 20").
   * @param {string} label As returned by labelOf.
   * @returns {string[]}
   */
  static clausesOf(label) {
    const or = ITrigger._escape(ITrigger.word("or"));
    const natural = ITrigger._escape(ITrigger.word("natural"));
    const separator = new RegExp(
      `,?\\s+${or}\\s+(?=${natural}${ITrigger.NOT_ALPHANUM_AFTER})`, "u");
    return label.split(separator);
  }

  /**
   * Evaluate a trigger row against the rolls that were made.
   *
   * A label is a disjunction of clauses (see clausesOf), each of which is a conjunction of
   * conditions ("natural even hit" is even AND hit) - except for conditions of the same group,
   * which are alternatives ("hit or miss"). Every condition of a clause has to hold for the
   * *same* roll, otherwise a row could go active on one target's parity and another target's hit.
   *
   * A power may roll several attacks, and they are alternatives too: the row applies if *any* roll
   * satisfies it. So one roll cannot rule the row out on its own - it is only inapplicable when
   * every roll contradicts it. A roll that contradicts nothing but cannot be confirmed either
   * (an even natural with no target to settle the hit) leaves the row undecided rather than
   * inactive, which is what a bare "hit" row on the same attack already reports.
   *
   * @param {string|null} label As returned by labelOf.
   * @param {object[]} rollOutcomes HitEvaluation's per-roll outcomes.
   * @returns {boolean|undefined} true when the row applies, false when it definitely does not,
   *   undefined when there is not enough information to tell - either the row states no condition
   *   we recognize, or the outcomes cannot decide one (hit/miss with no target selected, parity
   *   with no roll). Callers should present undefined as a possible match, never as a match.
   */
  evaluateRow(label, rollOutcomes) {
    if (!label) return undefined;
    // Each clause, as its conditions grouped by group.
    const clauses = Triggers.clausesOf(label)
      .map((clause) => {
        const groups = new Map();
        for (const trigger of this.registeredTriggers.filter((t) => t.appliesTo(clause))) {
          groups.set(trigger.group, [...(groups.get(trigger.group) ?? []), trigger]);
        }
        return { clause, groups: [...groups.values()] };
      })
      .filter(({ groups }) => groups.length > 0);
    if (clauses.length === 0) return undefined;

    const outcomes = rollOutcomes ?? [];
    if (outcomes.length === 0) return undefined;
    return Triggers._any(outcomes, (outcome) =>
      Triggers._any(clauses, ({ clause, groups }) =>
        Triggers._all(groups, (group) =>
          Triggers._any(group, (condition) => condition.test(outcome, clause)))));
  }

  /**
   * Three-valued OR: true if any verdict is true, false if all are false, undefined otherwise.
   * @param {Array} items
   * @param {function(*): boolean|undefined} verdictOf
   * @returns {boolean|undefined}
   */
  static _any(items, verdictOf) {
    let undecided = false;
    for (const item of items) {
      const verdict = verdictOf(item);
      if (verdict === true) return true;
      if (verdict === undefined) undecided = true;
    }
    return undecided ? undefined : false;
  }

  /**
   * Three-valued AND: false if any verdict is false, true if all are true, undefined otherwise.
   * @param {Array} items
   * @param {function(*): boolean|undefined} verdictOf
   * @returns {boolean|undefined}
   */
  static _all(items, verdictOf) {
    let undecided = false;
    for (const item of items) {
      const verdict = verdictOf(item);
      if (verdict === false) return false;
      if (verdict === undefined) undecided = true;
    }
    return undecided ? undefined : true;
  }
}
