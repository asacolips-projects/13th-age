import HitEvaluation from "../rolls/HitEvaluation.mjs";
import Targeting from "../rolls/Targeting.mjs";
import ArchmageRolls from "../rolls/ArchmageRolls.mjs";
import Triggers from "../Triggers/Triggers.mjs";

export default class preCreateChatMessageHandler {

    static replaceEffectAndConditionReferences(actorDocument, $rows) {
        let conditions = CONFIG.ARCHMAGE.statusEffects.filter(x => x.journal);
        const conditionNames = new Set(conditions.map(x => game.i18n.localize(x.label)));

        function generateConditionLink(name) {
            const condition = conditions.find(x => game.i18n.localize(x.label) === name);
            return `<a class="effect-link" draggable="true" data-type="condition" data-id="${condition.id}" title="">
                    <img class="effects-icon" src="${condition.icon}" />
                    ${name}</a>`;
        }

        for ( const row of $rows ) {
            for ( const name of conditionNames ) {
                const link = generateConditionLink(name);
                const regex = new RegExp(`\\*${name}\\*`, "ig");
                row.innerHTML = row.innerHTML.replace(regex, link);
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
        // TODO: We have the data of what kind of damage (arcane, divine, etc) and range (melee, ranged), but it's hard to get here
        let damageType = 'basic';
        let range = "melee";

        // Lines containing any of the following need to be skipped:
        // "Level:", "Recharge:", "Cost:", "Uses Remaining:"
        // "Special:", "Effect:", "Cast for Broad Effect:", "Cast for Power:"
        // "Opening and Sustained Effect:", "Final Verse:"
        // "Chain Spell", "Breath Weapon:"
        let rowsToSkip = [
          game.i18n.localize("ARCHMAGE.level") + ':',
          game.i18n.localize("ARCHMAGE.recharge")+':',
          game.i18n.localize("ARCHMAGE.cost")+':',
            "Uses Remaining:",
            "Special:",
            "Effect:",
            "Cast for Broad Effect:",
            "Cast for Power:",
            "Opening and Sustained Effect:",
            "Final Verse:",
            "Chain Spell",
            "Breath Weapon:"
        ];

        let tokens = canvas.tokens.controlled;
        let actor = tokens ? tokens[0] : null;
        let token = tokens ? tokens[0] : null;

        if (options.actor) actor = options.actor;
        if (options.token) token = options.token;

        $content = $(`<div class="wrapper">${data.content}</div>`);
        let $rows = $content.find('.card-prop');  // Updated later

        preCreateChatMessageHandler.replaceEffectAndConditionReferences(actorDocument, $rows);

        // Handle conditions in feats as well as traits & nastier specials
        let $otherRows = $content.find('.tag--feat .description, .card-row-description');
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
                    $rolls = hitEvaluationResults.$rolls;

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
                if (triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.natural").toLowerCase()) || triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.miss").toLowerCase()+':') || triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.hit").toLowerCase()+':') || triggerText.includes(game.i18n.localize("ARCHMAGE.CHAT.crit").toLowerCase()+':')) {
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

                // Highlight lines for higher level effects
                for (let x of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
                  if (x == options.powerLevel &&
                  row_text.includes(game.i18n.localize("ARCHMAGE.CHAT.spellLevel"+x)+':')) {
                    $row_self.addClass("trigger-active");
                  }
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
                }
                else {
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
      return [ sequence, hitEvaluationResults ];
    }
}