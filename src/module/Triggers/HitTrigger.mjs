import ITrigger from "./ITrigger.mjs";

export default class HitTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        if (hitEvaluationResults == undefined) return undefined;
        
        if (hitEvaluationResults.hasHit) {
            return true;
        }
        else {
            return false;
        }
    }

    triggersOn() {
        return [ "hit" ];
    }

    doesntTriggerOn() {
        return [ "even", "odd" ];
    }
}
