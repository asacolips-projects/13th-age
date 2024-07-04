import ITrigger from "./ITrigger.mjs";

export default class CritTrigger extends ITrigger{
    isActive(triggerText, rollResult, hitEvaluationResults) {
        let active = undefined;

        if (rollResult == undefined) return active;

        // TODO: Handle expanded crit range
        return rollResult == 20;
    }

    triggersOn() {
        return [ game.i18n.localize("ARCHMAGE.CHAT.crit").toLowerCase() ];
    }

    doesntTriggerOn() {
        return [ ];
    }
}
