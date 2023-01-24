import ITrigger from "./ITrigger.mjs";

export default class MissTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        if (hitEvaluationResults == undefined) return undefined;

        if (hitEvaluationResults.hasMissed) {
            return true;
        }
        else {
            return false;
        }
    }

    triggersOn() {
        return [ "miss" ];
    }

    doesntTriggerOn() {
        return [ "even", "odd" ];
    }
}
