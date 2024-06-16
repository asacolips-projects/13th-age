import HitEvaluation from "../rolls/HitEvaluation.mjs";
import Targeting from "../rolls/Targeting.mjs";
import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import Triggers from "../Triggers/Triggers.mjs";

export default class preCreateChatMessageHandler {

    static replaceEffectAndConditionReferences(actorDocument, $rows) {
        let conditions = CONFIG.ARCHMAGE.statusEffects.filter(x => x.journal);
        const conditionNames = new Set(conditions.map(x => game.i18n.localize(x.name)));

        function generateConditionLink(name) {
            const condition = conditions.find(x => game.i18n.localize(x.name) === name);
            return `<a class="effect-link" draggable="true" data-type="condition" data-id="${condition.id}" title="">
                    <img class="effects-icon" src="${condition.icon}" />
                    ${name}</a>`;
        }

        for (const row of $rows) {
            for (const name of conditionNames) {
                const link = generateConditionLink(name);
                const regex = new RegExp(`\\*${name}\\*`, "ig");
                row.innerHTML = row.innerHTML.replace(regex, link);
            }
        }
    }

    static replaceOngoingEffectReferences(uuid, $rows, options) {
        // HTML looks like this
        // <div className="card-prop trigger-unknown"><strong>Hit:</strong> <a
        //     className="inline-result inline-roll--archmage 6c311c92-0734-4bdc-9bcd-14ebe68408a6" data-tooltip="18"
        //     data-roll="%7B%22class%22%3A%22Roll%22%2C%22options%22%3A%7B%7D%2C%22dice%22%3A%5B%5D%2C%22formula%22%3A%2218%22%2C%22terms%22%3A%5B%7B%22class%22%3A%22NumericTerm%22%2C%22options%22%3A%7B%7D%2C%22evaluated%22%3Atrue%2C%22number%22%3A18%7D%5D%2C%22total%22%3A18%2C%22evaluated%22%3Atrue%7D"><i
        //     className="fas fa-dice-d20"></i>18</a> damage, and <a
        //     className="inline-result inline-roll--archmage 3e050af7-a790-425a-8a2b-8a1367121fff" data-tooltip="5"
        //     data-roll="%7B%22class%22%3A%22Roll%22%2C%22options%22%3A%7B%7D%2C%22dice%22%3A%5B%5D%2C%22formula%22%3A%225%22%2C%22terms%22%3A%5B%7B%22class%22%3A%22NumericTerm%22%2C%22options%22%3A%7B%7D%2C%22evaluated%22%3Atrue%2C%22number%22%3A5%7D%5D%2C%22total%22%3A5%2C%22evaluated%22%3Atrue%7D"><i
        //     className="fas fa-dice-d20"></i>5</a> ongoing acid damage</div>

        // If there are ongoing effects, we need to find the ongoing effect and replace it with a link to the ongoing effect, pulling the value form the roll

        for (const row of $rows) {
            const regex = /(<a (?:(?!<a ).)*?><i class="fas fa-dice-d20"><\/i>)*(\d+)(<\/a>)* ongoing ([a-zA-Z]*) ?damage( \((\w*) save ends, \d*\+\))?/g;
            const ongoingEffects = Array.from(row.innerHTML.matchAll(regex));
            if (ongoingEffects.length > 0) {
                ongoingEffects.forEach((ongoingEffect) => {
                    let damageValue = ongoingEffect[2];
                    let damageType = ongoingEffect[4];
                    if ( damageType ) damageType += " ";
                    let savesEndsText = ongoingEffect[5];
                    let saveEndsValue = ongoingEffect[6];
                    let saveEndsConfigValue = "NormalSaveEnds";
                    if ( saveEndsValue === "easy" ) saveEndsConfigValue = "EasySaveEnds";
                    else if ( saveEndsValue === "hard" ) saveEndsConfigValue = "HardSaveEnds";
                    let source = uuid;
                    let message = `${damageValue} ongoing ${damageType}damage`;
                    let name = options.item.name;
                    // Replace any R: at the start of the name
                    name = name.replace(/^R: /, "");
                    let tooltip = message;
                    if ( savesEndsText ) tooltip += " " + savesEndsText;
                    let ongoingEffectLink = `<a class="effect-link" draggable="true" data-type="ongoing-damage" data-id="ongoing" title=""
                        data-value="${damageValue}" data-damage-type="${damageType}" data-ends="${saveEndsConfigValue}"
                        data-tooltip="${tooltip}" data-source="${source}" data-name="${name}"><i class="fas fa-flask-round-poison"></i> ${message}</a>`;
                    row.innerHTML = row.innerHTML.replace(ongoingEffect[0], ongoingEffectLink);
                });
            }
        }
    }

    static handle(data, options, userId) {
        let $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rolls = $content.find('.inline-result');
        let updated_content = null;
        let hitEvaluationResults = undefined;
        let targets = [...game.user.targets.values()]; // needed to checkRowText of npcs
        let numTargets = options.targets ? options.targets : 1;
        let type = options.type ? options.type : 'power';
        let actorDocument = data.speaker?.actor ? game.actors.get(data.speaker.actor) : null;
        let tokenDocument = data.speaker?.token ? canvas.tokens.get(data.speaker.token) : null;

        let uuid = tokenDocument?.actor?.uuid ?? actorDocument?.uuid;

        // TODO: We have the data of what kind of damage (arcane, divine, etc) and range (melee, ranged), but it's hard to get here
        let damageType = 'basic';
        let range = "melee";

        // Lines containing any of the following need to be skipped:
        // "Level:", "Recharge:", "Resources:", "Uses Remaining:"
        // "Special:", "Effect:", "Cast for Broad Effect:", "Cast for Power:"
        // "Opening and Sustained Effect:", "Final Verse:"
        // "Chain Spell", "Breath Weapon:"
        let rowsToSkip = [
            game.i18n.localize("ARCHMAGE.level") + ':',
            game.i18n.localize("ARCHMAGE.recharge") + ':',
            game.i18n.localize("ARCHMAGE.CHAT.resources") + ':',
            game.i18n.localize("ARCHMAGE.ITEM.usesRemaining") + ':',
            game.i18n.localize("ARCHMAGE.CHAT.special") + ':',
            // game.i18n.localize("ARCHMAGE.CHAT.effect"),  // Handled separately to avoid overlap with Opening/Sustained Effect
            game.i18n.localize("ARCHMAGE.CHAT.castBroadEffect") + ':',
            game.i18n.localize("ARCHMAGE.CHAT.castPower") + ':',
            game.i18n.localize("ARCHMAGE.CHAT.spellChain") + ':',
            game.i18n.localize("ARCHMAGE.CHAT.breathWeapon") + ':'
        ];

        let tokens = canvas.tokens.controlled;
        let actor = tokens ? tokens[0] : null;
        let token = tokens ? tokens[0] : null;

        if (options.actor) actor = options.actor;
        if (options.token) token = options.token;

        // In 2e sorcerer breath spells add the E.D. to their crit range
        let addEdToCritRange = false;
        if (game.settings.get("archmage", "secondEdition")) {
          addEdToCritRange = options.item.system.breathWeapon?.value?.length > 0;
        }

        $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rows = $content.find('.card-prop');  // Updated later

        preCreateChatMessageHandler.replaceOngoingEffectReferences(uuid, $rows, options);
        preCreateChatMessageHandler.replaceEffectAndConditionReferences(actorDocument, $rows);

        // Handle conditions in feats as well as traits & nastier specials
        let $otherRows = $content.find('.tag--feat .description, .card-row-description');
        preCreateChatMessageHandler.replaceOngoingEffectReferences(uuid, $otherRows, options);
        preCreateChatMessageHandler.replaceEffectAndConditionReferences(actorDocument, $otherRows);
        $content.find('.tag--feat .description, .card-row-description').replaceWith($otherRows);

        let sequence = undefined;
        let sequencerFileTarget = options.sequencer?.target;
        let sequencerFileRay = options.sequencer?.ray;
        let sequencerFileSelf = options.sequencer?.self;
        let sequencerReversed = options.sequencer?.reversed;

        if ($rows.length > 0) {

            // Iterate through each of the card properties/rows.
            $rows.each(function (index) {
                // Determine if this line is for an attack and if it's a crit/fail.
                let $row_self = $(this);
                let row_text = $row_self.html();

                if (rowsToSkip.filter(x => row_text.includes(x)).length > 0) {
                    return;
                }
                if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.effect"))
                  && !row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.sustainedEffect"))) {
                    return;
                }

                if ((type == "power" && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.target") + ':')) ||
                    (type == "action" && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack") + ':'))) {

                    targets = Targeting.getTargetsFromRowText(row_text, $row_self, numTargets);

                    if (targets.length > 0) {
                        var text = document.createTextNode(" (" + targets.map(x => x.name).join(", ") + ")");
                        $row_self[0].appendChild(text);
                    }
                }

                if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack") + ':')) {
                    hitEvaluationResults = HitEvaluation.processRowText(row_text, targets, $row_self, actor, addEdToCritRange);
                }

                if (hitEvaluationResults) {
                    $rolls = hitEvaluationResults.$rolls;

                    // Append hit targets to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.hit") + ':') && hitEvaluationResults.targetsHit.length > 0) {
                        $row_self.find('strong').after("<span> (" + HitEvaluation.getNames(
                            hitEvaluationResults.targetsHit,
                            hitEvaluationResults.targetsCrit) + ") </span>")
                    }
                    // Append missed targets to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.miss") + ':') && hitEvaluationResults.targetsMissed.length > 0) {
                        $row_self.find('strong').after("<span> (" + HitEvaluation.getNames(
                            hitEvaluationResults.targetsMissed,
                            hitEvaluationResults.targetsFumbled) + ") </span>")
                    }
                    // Append target defenses to text
                    if (row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.attack") + ':') && hitEvaluationResults.defenses.length > 0
                        && game.settings.get("archmage", "showDefensesInChat")) {
                        $row_self.append("<span> (" + hitEvaluationResults.defenses.join(", ") + ") </span>")
                    }
                }

                // Determine if this line is a "Trigger" - something like "Natural 16+:" or "Even Miss:"
                var triggerText = row_text.toLowerCase();
                //console.log(triggerText);
                if (triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.natural").toLowerCase()) ||
                    triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase() + ':') ||
                    triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.hit").toLowerCase() + ':') ||
                    triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.crit").toLowerCase() + ':') ||
                    triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.hitEven").toLowerCase() + ':') ||
                    triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.hitOdd").toLowerCase() + ':')) {
                    let triggers = new Triggers();
                    let active = triggers.evaluateRow(row_text, $rolls, hitEvaluationResults);

                    if (active == undefined) {
                        $row_self.addClass("trigger-unknown");
                    } else if (active) {
                        $row_self.addClass("trigger-active");
                        if (triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase() + ':')) {
                            $row_self.addClass("trigger-miss");
                        }
                    } else {
                        $row_self.addClass("trigger-inactive");
                        if (game.settings.get("archmage", "hideInsteadOfOpaque")) {
                            $row_self.addClass("hide");
                        }
                    }
                }

                // Highlight lines for higher level effects
                for (let x of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
                    if (x == options.powerLevel &&
                        row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.spellLevel" + x) + ':')) {
                        $row_self.addClass("trigger-active");
                    }
                }

                // Highlight sustain / final verse for songs
                if ((["sustainedEffect", "openingEffect"].includes(options.usageMode)
                    && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.sustainedEffect") + ':'))
                    || (options.usageMode == "finalverse"
                    && row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.finalVerse") + ':'))) {
                    $row_self.addClass("trigger-active");
                }
            });

            if (game.modules.get("sequencer")?.active && token) {
                sequence = new Sequence();

                // Display Sequencer Effects
                function addAttack(sequence, source, towards, stretch, missed, file) {
                    if (stretch) {
                        if (!source) return sequence;
                        return sequence
                            .effect()
                            .atLocation(source)
                            .stretchTo(towards)
                            .file(file)
                            .missed(missed)
                            .wait(300)
                    } else {
                        return sequence
                            .effect()
                            .atLocation(towards)
                            .file(file)
                            .missed(missed)
                            .wait(300)
                    }
                }

                // Self
                if (sequencerFileSelf && !sequencerReversed) {
                    sequence.effect().atLocation(token).file(sequencerFileSelf).wait(300);
                }
                // Ray
                if (sequencerFileRay && !sequencerReversed) {
                    if (hitEvaluationResults) {
                        hitEvaluationResults.targetsHit.forEach(t => sequence = addAttack(sequence, token, t, true, false, sequencerFileRay));
                        hitEvaluationResults.targetsMissed.forEach(t => sequence = addAttack(sequence, token, t, true, true, sequencerFileRay));
                    } else {
                        // Not an attack
                        targets.forEach(t => sequence = addAttack(sequence, token, t, true, false, sequencerFileRay));
                    }
                }
                // Target
                if (sequencerFileTarget) {
                    if (hitEvaluationResults) {
                        hitEvaluationResults.targetsHit.forEach(t => sequence = addAttack(sequence, token, t, false, false, sequencerFileTarget));
                        hitEvaluationResults.targetsMissed.forEach(t => sequence = addAttack(sequence, token, t, false, true, sequencerFileTarget));
                    } else {
                        // Not an attack
                        targets.forEach(t => sequence = addAttack(sequence, token, t, false, false, sequencerFileTarget));
                    }
                }
                // Ray - reversed
                if (sequencerFileRay && sequencerReversed) {
                    if (hitEvaluationResults) {
                        hitEvaluationResults.targetsHit.forEach(t => sequence = addAttack(sequence, t, token, true, false, sequencerFileRay));
                        hitEvaluationResults.targetsMissed.forEach(t => sequence = addAttack(sequence, t, token, true, true, sequencerFileRay));
                    } else {
                        // Not an attack
                        targets.forEach(t => sequence = addAttack(sequence, t, token, true, false, sequencerFileRay));
                    }
                }
                // Self - reversed
                if (sequencerFileSelf && sequencerReversed) {
                    sequence.effect().atLocation(token).file(sequencerFileSelf);
                }
            }

            // Update the content
            $content.find('.card-prop').replaceWith($rows);
        }

        updated_content = $content.html();
        if (updated_content != null) {
            data.content = updated_content;
        }
        return [sequence, hitEvaluationResults];
    }
}
