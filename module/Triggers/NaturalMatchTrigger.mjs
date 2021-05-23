import ITrigger from "./ITrigger.mjs";

export default class NaturalMatchTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        let active = undefined;

        // This regex just finds any numbers in the string, and we use the first one
        var regex = new RegExp("\\d+");
        var scoreToBeatArray = regex.exec(triggerText);
        if (scoreToBeatArray && scoreToBeatArray.length == 1) {
            var scoreToBeat = parseInt(scoreToBeatArray[0]);
            if (rollResult >= scoreToBeat) {
                active = true;
            }
            else {
                active = false;
            }
        }

        return active;
    }

    triggersOn() {
        return [ "+" ];
    }

    doesntTriggerOn() {
        return [ "hit", "miss" ];
    }
}
