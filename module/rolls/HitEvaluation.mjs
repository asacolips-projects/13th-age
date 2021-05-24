export default class HitEvaluation {

    static checkRowText(row_text, targets, $row_self) {
        // If the user currently has Targets selected, try and figure out if we hit or missed said target
        //console.log(targets);

        let targetsHit = [];
        let targetsMissed = [];
        let hasHit = undefined;
        let hasMissed = undefined;

        if (targets.length == 0) return;

        let defense = HitEvaluation._getTargetDefense(row_text);

        let $roll = $row_self.find('.inline-result');
        let rollTotal = 0;
        // If there isn't exactly one roll, then we can't parse it
        if ($roll.length === 1) {
            // Iterate through the inline rolls on the hit row.
            $roll.each(function (roll_index) {
                let $roll_self = $(this);
                let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));
                rollTotal = roll_data.total;
            });
        }

        //console.log(rollTotal + " vs " + rollTarget);

        if (rollTotal != undefined) {
            targets.forEach(target => {
                //console.log(target);

                var targetDefense = HitEvaluation._getTargetDefenseValue(target, defense);

                var hit = rollTotal >= targetDefense;
                //console.log(rollTotal + " vs " + targetDefense + " ? " + hit);

                // Keep track of hasHit and hasMissed seperately in case we have a group of enemies we are targetting
                if (hit) {
                    targetsHit.push(target.data.name);
                    if (hasHit == undefined || !hasHit) {
                        hasHit = true;
                    }
                    if (hasMissed == undefined) {
                        hasMissed = false;
                    }
                }
                else {
                    targetsMissed.push(target.data.name);
                    if (hasMissed == undefined || !hasMissed) {
                        hasMissed = true;
                    }
                    if (hasHit == undefined) {
                        hasHit = false;
                    }
                }
            });
        }

        //console.log(targetsHit);
        //console.log(targetsMissed);

        return {
            targetsHit: targetsHit,
            targetsMissed: targetsMissed,
            hasHit: hasHit,
            hasMissed: hasMissed
        };
        
    }

    // Get either the Token overridden value or the base sheet value
    static _getTargetDefenseValue(target, defense) {
        //console.log(target);
        if (target.data?.actorData?.data?.attributes != undefined) {
            // Return token overridden value
            if (target.data.actorData.data.attributes[defense]) {
                return target.data.actorData.data.attributes[defense].value;
            }
        }
        return target.actor.data.data.attributes[defense].value;
    }

    static _getTargetDefense(row_text) {
        if (row_text.toLowerCase().includes(" ac")) {
            return "ac";
        }
        else if (row_text.toLowerCase().includes(" pd")) {
            return "pd";
        }
        else if (row_text.toLowerCase().includes(" md")) {
            return  "md";
        }
    }
}
