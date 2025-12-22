export async function baselineMonsterDialog () {
  const content = await foundry.applications.handlebars.renderTemplate(
    'systems/archmage/templates/dialog/baseline-monster-dialog.html'
  )

  new foundry.applications.api.DialogV2({
    window: { title: 'Choose an option' },
    content,
    buttons: [
      {
        action: 'create',
        label: 'Create Monster',
        default: true,
        callback: (event, button, dialog) => ({
          level: parseInt(button.form.elements.level.value),
          strength: button.form.elements.strength.value
        })
      }
    ],
    submit: async ({ level, strength }) => {
      console.log('Creating monster with options:', { level, strength })
      level = Math.clamped(level, 0, 14)
      const { baselineMonsterStats } = CONFIG.ARCHMAGE
      const stats = baselineMonsterStats.byStrength[strength]
      if (!stats) {
        ui.notifications.error(`Invalid strength option: ${strength}`)
        return
      }

      const systemData = {
        attributes: {
          ac: { value: baselineMonsterStats.ac[level] },
          pd: { value: baselineMonsterStats.pd[level] },
          md: { value: baselineMonsterStats.md[level] },
          init: { value: baselineMonsterStats.init[level] },
          level: { value: level },
          hp: {
            value: stats.hp[level],
            max: stats.hp[level]
          }
        },
        details: {
          flavor: {
            value: `<p>Monster from baseline stats: ${strength} level ${level}.</p>`
          },
          role: { value: strength === 'mook' ? 'mook' : 'troop' },
          strength: { value: strength === 'mook' ? 'normal' : strength },
          level: { value: level }
        }
      }

      const actor = await game.archmage.ActorArchmage.create({
        name: `Baseline level ${level} monster (${strength})`,
        type: 'npc',
        system: systemData
      })
      await actor.createEmbeddedDocuments('Item', [
        {
          name: 'Basic Attack',
          type: 'action',
          system: {
            attack: {
              value: `[[d20+${baselineMonsterStats.attackBonuses[level]}]] vs. AC`
            },
            hit: { value: `[[${stats.damage[level]}]] damage` }
          }
        }
      ])
      if (stats.damageSecondary) {
        await actor.createEmbeddedDocuments('Item', [
          {
            name: 'Secondary Attack',
            type: 'action',
            system: {
              attack: {
                value: `[[d20+${baselineMonsterStats.attackBonuses[level]}]] vs. AC`
              },
              hit: { value: `[[${stats.damageSecondary[level]}]] damage` }
            }
          }
        ])
      }
      actor.sheet.render(true)
    }
  }).render({ force: true })
}
