export default class Targeting {

    static getTargetsFromRowText(row_text, $row_self, numTargets, cachedTargets = []) {
        let targets = cachedTargets.length < 1
            ? [...game.user.targets.values()] 
            : cachedTargets.map(uuid => fromUuidSync(uuid));

        if (targets.length == 0) return [];

        if (row_text.toLowerCase().includes(game.i18n.localize("ARCHMAGE.TARGETING.random"))) {
            targets = Targeting._shuffle(targets);
        }

        // If there are 3 targets selected but the attack only can hit 2 (ex: result of 1d3 nearby targets), then we slice to that amount, in order of selection (unless randomized)

        // This regex just finds any numbers in the string, and we use the first one
        let numberOfTargets = 0;
        if (!game.settings.get("archmage", "multiTargetAttackRolls")) {
          let regex = new RegExp("\\d+");
          numberOfTargets = regex.exec($row_self[0].innerText);
        }
        else numberOfTargets = [numTargets];

        if (numberOfTargets && numberOfTargets.length == 1) {
            let maxTargets = parseInt(numberOfTargets[0]);
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
