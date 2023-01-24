import ITrigger from "./ITrigger.mjs";

export default class CritTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        // console.log(rollResult);
        let active = undefined;

        if (rollResult == undefined) return active;

        // TODO: Handle expanded crit range
        return rollResult == 20;
    }

    triggersOn() {
        return [ "crit" ];
    }

    doesntTriggerOn() {
        return [ ];
    }
}
