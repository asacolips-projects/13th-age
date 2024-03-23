import ITrigger from "./ITrigger.mjs";

export default class MissTrigger extends ITrigger {
    isActive(triggerText, rollResult, hitEvaluationResults) {
        if (hitEvaluationResults == undefined) return undefined;

        if (hitEvaluationResults.hasMissed) {
            return true;
        }

            return false;

    }

    triggersOn() {
        return [game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase()];
    }

    doesntTriggerOn() {
        return [game.i18n.localize("ARCHMAGE.CHAT.even").toLowerCase(), game.i18n.localize("ARCHMAGE.CHAT.odd").toLowerCase()];
    }
}
