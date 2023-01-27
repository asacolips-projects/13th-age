import ITrigger from "./ITrigger.mjs";

export default class EvenTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        let active = undefined;

        if (rollResult == undefined) return active;
        
        if (rollResult % 2 == 0) {
            active = true;
            if (hitEvaluationResults?.hasHit != undefined) {
                if (triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.hit").toLowerCase()) && !hitEvaluationResults.hasHit) {
                    active = false;
                }
            }
            if (hitEvaluationResults?.hasMissed != undefined) {
                if (triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase()) && !hitEvaluationResults.hasMissed) {
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
        return [ game.i18n.localize("ARCHMAGE.CHAT.even").toLowerCase() ];
    }

    doesntTriggerOn() {
        return [ ];
    }
}
