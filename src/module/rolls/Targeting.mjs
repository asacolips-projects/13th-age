export default class Targeting {

    static getTargetsFromRowText(row_text, $row_self, numTargets) {
        let targets = [...game.user.targets.values()];

        if (targets.length == 0) return [];

        if (row_text.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.random"))) {
            targets = Targeting._shuffle(targets);
        }

        // If there are 3 targets selected but the attack only can hit 2 (ex: result of 1d3 nearby targets), then we slice to that amount, in order of selection (unless randomized)

        // This regex just finds any numbers in the string, and we use the first one
        if (!game.settings.get("archmage", "multiTargetAttackRolls")) {
          var regex = new RegExp("\\d+");
          var numberOfTargets = regex.exec($row_self[0].innerText);
        }
        else var numberOfTargets = [numTargets];

        if (numberOfTargets && numberOfTargets.length == 1) {
            var maxTargets = parseInt(numberOfTargets[0]);
            //console.log("MaxTargets " + maxTargets);

            targets = targets.slice(0, maxTargets);
        }

        return targets;
    }

    static _shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
