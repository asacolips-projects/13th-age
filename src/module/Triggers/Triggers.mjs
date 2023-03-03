import CritTrigger from "./CritTrigger.mjs";
import EvenTrigger from "./EvenTrigger.mjs";
import HitTrigger from "./HitTrigger.mjs";
import MissTrigger from "./MissTrigger.mjs";
import NaturalMatchTrigger from "./NaturalMatchTrigger.mjs";
import OddTrigger from "./OddTrigger.mjs";
import NaturalExactTrigger from "./NaturalExactTrigger.mjs";

export default class Triggers {

  constructor() {
    this.registeredTriggers = [
      new EvenTrigger(),
      new OddTrigger(),
      new HitTrigger(),
      new MissTrigger(),
      new NaturalMatchTrigger(),
      new CritTrigger(),
      new NaturalExactTrigger()
    ];
  }

  evaluateRow(row_text, $rolls, hitEvaluationResults) {
    var triggerText = row_text.toLowerCase();

    // Only match against the part before ':'
    if (triggerText.includes(":")) {
      triggerText = triggerText.split(":", 2)[0];
    }

    // We've previously setup all d20's in the rolls to have a value. Rolls that aren't a d20 will have a value of 0, which gets filtered out.
    var rollResults = $rolls.toArray().map(x => x.d20result).filter(x => x > 0);
    for (let rollResult of rollResults) {
      for (let x = 0; x < this.registeredTriggers.length; x++) {
        let trigger = this.registeredTriggers[x];

        if (trigger.triggersOn().length > 0 && !trigger.triggersOn().filter(x => triggerText.includes(x)).length > 0) {
            continue;
        }
        if (trigger.doesntTriggerOn().length > 0 && trigger.doesntTriggerOn().filter(x => triggerText.includes(x)).length > 0) {
            continue;
        }

        if (trigger.isActive(triggerText, rollResult, hitEvaluationResults)) {
            return true;
        }
      }
    }
  }
}
