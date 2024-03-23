import ITrigger from "./ITrigger.mjs";

export default class NaturalExactTrigger extends ITrigger {
    /**
     * @param triggerText
     * @param rollResult
     * @param hitEvaluationResults
     * @returns {boolean}
     */
    isActive(triggerText, rollResult, hitEvaluationResults) {
        let active = undefined;

        // This regex just finds any numbers in the string, and we use the first one
        var regex = new RegExp("\\d+");
        var scoreToMatchArray = regex.exec(triggerText);
        if (scoreToMatchArray && scoreToMatchArray.length == 1) {
            var scoreToMatch = parseInt(scoreToMatchArray[0]);
            if (rollResult == scoreToMatch) {
                active = true;
            }
            else {
                active = false;
            }
        }

        return active;
    }

    triggersOn() {
        return [game.i18n.localize("ARCHMAGE.CHAT.natural").toLowerCase()];
    }

    doesntTriggerOn() {
        return [game.i18n.localize("ARCHMAGE.CHAT.hit").toLowerCase(), game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase(), "+"];
    }
}
