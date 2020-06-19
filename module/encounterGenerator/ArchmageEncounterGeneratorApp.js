import { MonsterValueCalculator } from './MonsterValueCalculator.js';

export class ArchmageEncounterGeneratorApp extends Application {
    static get defaultOptions() {
      const options = super.defaultOptions;
      options.title = "Encounter Generator";
      options.id = "archmage-encounter-generator";
      options.template = 'systems/archmage/templates/sidebar/apps/encounterGenerator.html';
      options.width = 820;
      return options;
    }

    constructor(app)
    {
        super(app);

        this.calculator = new MonsterValueCalculator();
        // var value = calculator.getMonsterValue("", 4, "normal", false, 4);
        // console.log(value);

        this.monsterFilters = {
            "level_min": 0,
            "level_max": 15,
            "sizes": [ ],
            "roles": [ ],
            "types": [ ]
        };

        this.sizes = {};
        Object.keys(CONFIG.ARCHMAGE.creatureSizes).forEach(key => {
            this.sizes[key] = { display: CONFIG.ARCHMAGE.creatureSizes[key] , value: false };
        });

        this.roles = {};
        Object.keys(CONFIG.ARCHMAGE.creatureRoles).forEach(key => {
            this.roles[key] = { display: CONFIG.ARCHMAGE.creatureRoles[key] , value: false };
        });

        this.types = {};
        Object.keys(CONFIG.ARCHMAGE.creatureTypes).forEach(key => {
            this.types[key] = { display: CONFIG.ARCHMAGE.creatureTypes[key] , value: false };
        });

        this.partyInfo = {
            "numMembers": 4,
            "averageLevel": 1
        };

        this.encounterSettings = {
            "halfStrength": { display: "Half Strength" , value: false },
            "doubleStrength": { display: "Double Strength" , value: false },
            "tripleStrength": { display: "Triple Strength" , value: false }
        };

    }
  
    async getData() {
      var data = super.getData();
      
      data.encounter = {
          maxPoints: 0,
          currentPoints: 0
      };

      data.sizes = this.sizes;
      data.roles = this.roles;
      data.types = this.types;

      data.monsterFilters = this.monsterFilters;
      data.partyInfo = this.partyInfo;
      data.encounterSettings = this.encounterSettings;
      data.monsters = game.actors.entities.filter(x => x.data.type == "npc");

      for (let c of game.packs) {
         if (c.metadata.entity && c.metadata.entity == 'Actor') {
             var actors = await c.getContent();
             // It's not deduping?
             data.monsters = data.monsters.concat(actors.filter(x => !data.monsters.map(x => x.data.name).includes(m => m.data.name)));
         }
      }
      
      this.filterMonsters(data, data.monsterFilters);
      
      console.log(data);
      return data;
    }

    filterMonsters(data, filters) {
        data.monsters = data.monsters.filter(monster => 
            monster.data.data.attributes.level.value >= filters["level_min"] &&
            monster.data.data.attributes.level.value <= filters["level_max"] &&
            filters["sizes"].length == 0 ? true : filters["sizes"].includes(monster.data.data.details.size.value) &&
            filters["roles"].length == 0 ? true : filters["roles"].includes(monster.data.data.details.role.value) &&
            filters["types"].length == 0 ? true : filters["sizes"].includes(monster.data.data.details.type.value)
            )
            .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
    }
  }