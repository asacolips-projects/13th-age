// All arrays indexed by level, 0-14
const attackBonuses = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
const ac = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
const pd = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
const md = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
const init = [3, 3, 6, 6, 6, 9, 9, 9, 12, 12, 12, 15, 15, 15, 18]

const statsByStrength = {
  normal: {
    damage: [6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 160],
    hp: [25, 30, 40, 50, 60, 80, 100, 120, 160, 200, 240, 320, 400, 480, 640]
  },
  mook: {
    damage: [3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 60, 80],
    hp: [6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 160]
  },
  weakling: {
    damage: [3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 60, 80],
    hp: [13, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 160, 200, 240, 320]
  },
  elite: {
    damage: [9, 12, 15, 18, 22, 30, 38, 45, 60, 75, 90, 120, 150, 180, 240],
    hp: [38, 45, 60, 75, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720, 960]
  },
  double: {
    damage: [9, 12, 15, 18, 22, 30, 35, 45, 60, 75, 90, 120, 150, 180, 240],
    damageSecondary: [3, 4, 5, 6, 8, 10, 15, 15, 20, 25, 30, 40, 50, 60, 80],
    hp: [50, 60, 80, 100, 120, 160, 200, 240, 320, 400, 480, 640, 800, 960, 1280]
  },
  triple: {
    damage: [9, 12, 15, 18, 22, 30, 35, 45, 60, 75, 90, 120, 150, 180, 240],
    damageSecondary: [9, 12, 15, 18, 22, 30, 35, 45, 60, 75, 90, 120, 150, 180, 240],
    hp: [75, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720, 960, 1200, 1440, 1920]
  }
}
export function baselineMonsterDialog () {
  new foundry.applications.api.DialogV2({
    window: { title: 'Choose an option' },
    content: `
			<label>
				Monster Level:
				<select name="level">
					${[...Array(15).keys()]
            .map(i => `<option value="${i}">Level ${i}</option>`)
            .join('')}
				</select>
			</label>

			<label>
				Monster Strength:
				<select name="strength">
					<option value="normal" selected>Standard</option>
					<option value="mook">Mook</option>
					<option value="weakling">Weakling</option>
					<option value="elite">Elite</option>
					<option value="double">Double Strength</option>
					<option value="triple">Triple Strength</option>
				</select>
			</label>
		`,
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
      const stats = statsByStrength[strength]
      const systemData = {
        attributes: {
          ac: { value: ac[level] },
          pd: { value: pd[level] },
          md: { value: md[level] },
          init: { value: init[level] },
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
            attack: { value: `[[d20+${attackBonuses[level]}]] vs. AC` },
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
              attack: { value: `[[d20+${attackBonuses[level]}]] vs. AC` },
              hit: { value: `[[${stats.damageSecondary[level]}]] damage` }
            }
          }
        ])
      }
      actor.sheet.render(true)
    }
  }).render({ force: true })
}
