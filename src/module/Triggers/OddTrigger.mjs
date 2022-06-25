import ITrigger from "./ITrigger.mjs";

export default class OddTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        let active = undefined;

        if (rollResult == undefined) return active;
        
        if (rollResult % 2 == 1) {
            active = true;
            if (hitEvaluationResults?.hasHit != undefined) {
                if (triggerText.includes("hit") && !hitEvaluationResults.hasHit) {
                    active = false;
                }
            }
            if (hitEvaluationResults?.hasMissed != undefined) {
                if (triggerText.includes("miss") && !hitEvaluationResults.hasMissed) {
                    active = false;
                }
            }
        }
        else {
            active = false;
        }

        return active;
    }

    triggersOn() {
        return [ "odd" ];
    }

    doesntTriggerOn() {
        return [ ];
    }
}
