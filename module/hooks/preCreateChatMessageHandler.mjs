import HitEvaluation from "../rolls/HitEvaluation.mjs";
import Targeting from "../rolls/Targeting.mjs";
import { ArchmageUtility } from "../setup/utility-classes.js";
import Triggers from "../Triggers/Triggers.mjs";

export default class preCreateChatMessageHandler {

    static handle(data, options, userId) {
        let $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rolls = $content.find('.inline-result');
        let updated_content = null;
        let hitEvaluationResults = undefined;
        let targets = [...game.user.targets.values()];
        let numTargets = 1;
        if (options.targets) numTargets = options.targets;
        let type = 'power';
        if (options.type) type = options.type;

        // TODO (#74): All card evaluation needs to load from Localization
        let rowsToSkip = ["Level:", "Recharge:", "Cost:", "Uses Remaining:", "Special:", "Effect:", "Cast for Broad Effect:", "Cast for Power:", "Opening and Sustained Effect:", "Final Verse:", "Chain Spell", "Breath Weapon:"];

        let tokens = canvas.tokens.controlled;
        let actor = tokens ? tokens[0] : null;

        if (data?.speaker?.actor) {
            actor = game.actors.get(data.speaker.actor);
        }

        // Iterate through inline rolls, add a class to crits/fails.
        for (let i = 0; i < $rolls.length; i++) {
            let $roll = $($rolls[i]);

            let roll_data = Roll.fromJSON(unescape($roll.data('roll')));
            let result = ArchmageUtility.inlineRollCritTest(roll_data, actor);

            if (result.includes('crit')) {
                $roll.addClass('dc-crit');
            }
            else if (result.includes('fail')) {
                $roll.addClass('dc-fail');
            }
            else if (result.includes('reroll')) {
                $roll.addClass('dc-reroll');
            }

            let rollResult = 0;
            roll_data.terms.forEach(p => {
                if (p.faces === 20) {
                    rollResult = p.total;
                }
            });

            // Update the array of roll HTML elements.
            $rolls[i] = $roll[0];
            $rolls[i].d20result = rollResult;
        }

        // Now that we know which rolls were crits, update the content string.
        $content.find('.inline-result').replaceWith($rolls);
        updated_content = $content.html();
        if (updated_content != null) {
            data.content = updated_content;
        }

        // Next, let's see if any of the crits were on attack lines.
        $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rows = $content.find('.card-prop');

        if ($rows.length > 0) {
            // Assume no crit or fail.
            let has_crit = false;
            let has_fail = false;

            // Iterate through each of the card properties/rows.
            $rows.each(function (index) {
                // Determine if this line is for an attack and if it's a crit/fail.
                let $row_self = $(this);
                let row_text = $row_self.html();

                if (rowsToSkip.filter(x => row_text.includes(x)).length > 0) {
                    return;
                }

                if ((type == "power" && row_text.includes('Target:')) ||
                  (type == "action" && row_text.includes('Attack:'))) {

                    targets = Targeting.getTargetsFromRowText(row_text, $row_self, numTargets);

                    if (targets.length > 0) {
                      var text = document.createTextNode(" (" + targets.map(x => x.name).join(", ") + ")");
                      $row_self[0].appendChild(text);
                    }
                }

                if (row_text.includes('Attack:')) {
                    if (row_text.includes('dc-crit') && numTargets == 1) {
                        has_crit = true;
                    }
                    if (row_text.includes('dc-fail') && numTargets == 1) {
                        has_fail = true;
                    }

                    hitEvaluationResults = HitEvaluation.checkRowText(row_text, targets, $row_self);
                }

                if (hitEvaluationResults) {
                    // Append hit targets to text
                    if (row_text.includes('Hit:') && hitEvaluationResults.targetsHit.length > 0) {
                        $row_self.find('strong').after("<span> (" + hitEvaluationResults.targetsHit.join(", ") + ") </span>")
                    }

                    // Append missed targets to text
                    if (row_text.includes('Miss:') && hitEvaluationResults.targetsMissed.length > 0) {
                        $row_self.find('strong').after("<span> (" + hitEvaluationResults.targetsMissed.join(", ") + ") </span>")
                    }

                    // Append target defenses to text
                    if (row_text.includes('Attack:') && hitEvaluationResults.defenses.length > 0
                      && game.settings.get("archmage", "showDefensesInChat")) {
                        $row_self.append("<span> (" + hitEvaluationResults.defenses.join(", ") + ") </span>")
                    }
                }


                // Determine if this line is a "Trigger" - something like "Natural 16+:" or "Even Miss:"
                var triggerText = row_text.toLowerCase();
                //console.log(triggerText);
                if (triggerText.includes("natural") || triggerText.includes("miss:") || triggerText.includes("hit:") || triggerText.includes("crit:")) {

                    let triggers = new Triggers();
                    let active = triggers.evaluateRow(row_text, $rolls, hitEvaluationResults);

                    if (active == undefined) {
                        $row_self.addClass("trigger-unknown");
                    }
                    else if (active) {
                        $row_self.addClass("trigger-active");
                    }
                    else {
                        $row_self.addClass("trigger-inactive");
                        if (game.settings.get("archmage", "hideInsteadOfOpaque")) {
                            $row_self.addClass("hide");
                        }
                    }
                }

                // If so, determine if the current row (next iteration, usually) is a hit.
                if (has_crit || has_fail) {
                    if (row_text.includes('Hit:')) {
                        // If the hit row includes inline results, we need to reroll them.
                        let $roll = $row_self.find('.inline-result');
                        if ($roll.length > 0) {
                            // Iterate through the inline rolls on the hit row.
                            $roll.each(function (roll_index) {
                                let $roll_self = $(this);
                                // Retrieve the roll formula.
                                let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));

                                let new_formula = roll_data.formula;
                                // If there's a crit, double the formula and reroll. If there's a
                                // fail with no crit, 0 it out.
                                if (has_crit) {
                                    if (game.settings.get('archmage', 'originalCritDamage')) {
                                        new_formula = `(${roll_data.formula}) * 2`;
                                    } else {
                                        new_formula = `${roll_data.formula}+${roll_data.formula}`;
                                    }
                                    $roll_self.addClass('dc-crit');
                                }
                                else {
                                    new_formula = `0`;
                                    $roll_self.addClass('dc-fail');
                                }
                                // Reroll and recalculate.
                                let new_roll = new Roll(new_formula).roll({async: false});
                                // Update inline roll's markup.
                                $roll_self.attr('data-roll', escape(JSON.stringify(new_roll)));
                                $roll_self.attr('title', new_roll.formula);
                                $roll_self.html(`<i class="fas fa-dice-d20"></i> ${new_roll.total}`);

                            });
                        }
                        // Update the row with the new roll(s) markup.
                        $row_self.find('.inline-result').replaceWith($roll);
                    }
                    if (row_text.includes('Miss:')) {
                        let $roll = $row_self.find('.inline-result');
                        if ($roll.length > 0) {
                            // Iterate through the inline rolls on the hit row.
                            $roll.each(function (roll_index) {
                                let $roll_self = $(this);
                                // Retrieve the roll formula.
                                let roll_data = Roll.fromJSON(unescape($roll_self.data('roll')));

                                let new_formula = roll_data.formula;
                                // If there's a crit, double the formula and reroll. If there's a
                                // fail with no crit, 0 it out.
                                if (has_fail) {
                                    new_formula = `0`;
                                    $roll_self.addClass('dc-fail');
                                }
                                // Reroll and recalculate.
                                let new_roll = new Roll(new_formula).roll();
                                // Update inline roll's markup.
                                $roll_self.attr('data-roll', escape(JSON.stringify(new_roll)));
                                $roll_self.attr('title', new_roll.formula);
                                $roll_self.html(`<i class="fas fa-dice-d20"></i> ${new_roll.total}`);
                            });
                        }
                    }
                }
            });

            // Update the content
            $content.find('.card-prop').replaceWith($rows);
            updated_content = $content.html();
            if (updated_content != null) {
                data.content = updated_content;
            }
        }
    }
}