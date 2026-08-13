import CritTrigger from "./CritTrigger.mjs";
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
    const $label = $row.children('strong').first();
    if ($label.length === 0) return null;
    const text = $label.text().trim();
    if (!text.endsWith(':')) return null;
    return text.slice(0, -1).toLowerCase();
  }

  /**
   * Does this label state any condition we know how to evaluate?
   * @param {string|null} label As returned by labelOf.
   * @returns {boolean}
   */
  isTriggerRow(label) {
    if (!label) return false;
    return this.registeredTriggers.some(trigger => trigger.appliesTo(label));
  }

  /**
   * Evaluate a trigger row against the rolls that were made.
   *
   * A label states a conjunction of conditions ("natural even hit" is even AND hit), so every
   * condition it mentions has to hold - and hold for the *same* roll, otherwise a row could go
   * active on one target's parity and another target's hit.
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
    const conditions = this.registeredTriggers.filter(trigger => trigger.appliesTo(label));
    if (conditions.length === 0) return undefined;

    let anyRuledOut = false;
    for (const outcome of rollOutcomes ?? []) {
      const verdicts = conditions.map(condition => condition.test(outcome, label));
      if (verdicts.every(verdict => verdict === true)) return true;
      if (verdicts.some(verdict => verdict === false)) anyRuledOut = true;
    }
    return anyRuledOut ? false : undefined;
  }
}
