import HitEvaluation from "../rolls/HitEvaluation.mjs";
import Targeting from "../rolls/Targeting.mjs";
import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import Triggers from "../Triggers/Triggers.mjs";

export default class preCreateChatMessageHandler {

    static handle(data, options, userId) {
        let $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rolls = $content.find('.inline-result');
        let updated_content = null;
        let hitEvaluationResults = undefined;
        let targets = [...game.user.targets.values()]; // needed to checkRowText of npcs
        let numTargets = options.targets ? options.targets : 1;
        let type = options.type ? options.type : 'power';
        // TODO: We have the data of what kind of damage (arcane, divine, etc) and range (melee, ranged), but it's hard to get here
        let damageType = 'basic';
        let range = "melee";

        // TODO (#74): All card evaluation needs to load from Localization
        let rowsToSkip = ["Level:", "Recharge:", "Cost:", "Uses Remaining:", "Special:", "Effect:", "Cast for Broad Effect:", "Cast for Power:", "Opening and Sustained Effect:", "Final Verse:", "Chain Spell", "Breath Weapon:"];

        let tokens = canvas.tokens.controlled;
        let actor = tokens ? tokens[0] : null;
        // if (data?.speaker?.actor) {
            // actor = game.actors.get(data.speaker.actor);
        // }
        if (options.actor) actor = options.actor;

        // Next, let's see if any of the crits were on attack lines.
        $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rows = $content.find('.card-prop');

        if ($rows.length > 0) {

            // Iterate through each of the card properties/rows.
            $rows.each(function (index) {
                // Determine if this line is for an attack and if it's a crit/fail.
                let $row_self = $(this);
                let row_text = $row_self.html();

                if (rowsToSkip.filter(x => row_text.includes(x)).length > 0) {
                    return;
                }

                if ((type == "power" && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.target")+':')) ||
                  (type == "action" && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack")+':'))) {

                    targets = Targeting.getTargetsFromRowText(row_text, $row_self, numTargets);

                    if (targets.length > 0) {
                      var text = document.createTextNode(" (" + targets.map(x => x.name).join(", ") + ")");
                      $row_self[0].appendChild(text);
                    }
                }

                if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack")+':')) {
                    hitEvaluationResults = HitEvaluation.processRowText(row_text, targets, $row_self, actor);
                }

                if (hitEvaluationResults) {
                    // Append hit targets to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.hit")+':') && hitEvaluationResults.targetsHit.length > 0) {
                        $row_self.find('strong').after("<span> (" + HitEvaluation.getNames(
                          hitEvaluationResults.targetsHit,
                          hitEvaluationResults.targetsCrit) + ") </span>")
                    }
                    // Append missed targets to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.miss")+':') && hitEvaluationResults.targetsMissed.length > 0) {
                        $row_self.find('strong').after("<span> (" + HitEvaluation.getNames(
                          hitEvaluationResults.targetsMissed,
                          hitEvaluationResults.targetsFumbled) + ") </span>")
                    }
                    // Append target defenses to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack")+':') && hitEvaluationResults.defenses.length > 0
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
            });

            if (hitEvaluationResults && game.modules.get("sequencer")?.active && options?.sequencerFile) {

                let sequencerFile = options.sequencerFile;
                if (sequencerFile === "") {
                    // TODO: Using the damage type and range, default to various Setting configurable files
                    sequencerFile = "modules/JB2A_DnD5e/Library/Generic/Impact/Impact_07_Regular_Orange_400x400.webm";
                }

                // Display Sequencer Effects
                function addAttack(sequence, towards, missed) {
                    return sequence
                        .effect()
                        .atLocation(towards)
                        .file(sequencerFile)
                        .missed(missed)
                }

                let sequence = new Sequence();
                hitEvaluationResults.targetsHit.forEach(t => sequence = addAttack(sequence, t, false));
                hitEvaluationResults.targetsMissed.forEach(t => sequence = addAttack(sequence, t, true));
                sequence.play();
            }

            // Update the content
            $content.find('.card-prop').replaceWith($rows);
            updated_content = $content.html();
            if (updated_content != null) {
                data.content = updated_content;
            }
        }
    }
}