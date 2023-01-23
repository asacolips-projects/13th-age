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
        return [ game.i18n.localize("ARCHMAGE.CHAT.hit").toLowerCase() ];
    }

    doesntTriggerOn() {
        return [ game.i18n.localize("ARCHMAGE.CHAT.even").toLowerCase(), game.i18n.localize("ARCHMAGE.CHAT.odd").toLowerCase() ];
    }
}
