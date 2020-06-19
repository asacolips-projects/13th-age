export class MonsterValueCalculator
{
    BattleTypesEnum = Object.freeze([
        "Adventurer",
        "Champion",
        "Epic"
    ]);

    NonMookMultipliers = [
  // Weakling, Normal, Elite, Large, Huge
        [0.25, 0.50, 0.75, 1.00, 1.50],
        [0.35, 0.70, 1.00, 1.50, 2.00],

        [0.50, 1.00, 1.50, 2.00, 3.00],

        [0.75, 1.50, 2.25, 3.00, 4.00],
        [1.00, 2.00, 3.00, 4.00, 6.00],
        [1.50, 3.00, 4.50, 6.00, 8.00],
        [2.00, 4.00, 6.00, 8.00, undefined]
    ]

    MookMultipliers = [
  // Weakling, Normal, Elite (none), Large, Huge
        [0.05, 0.10, undefined, 0.20, 0.30],
        [.075, 0.15, undefined, 0.30, 0.45],

        [0.10, 0.20, undefined, 0.40, 0.60],

        [0.15, 0.30, undefined, 0.60, 0.90],
        [0.20, 0.40, undefined, 0.80, 1.20],
        [0.30, 0.60, undefined, 1.20, 1.80],
        [0.40, 0.80, undefined, 1.60, 2.40]
    ]

    getMonsterValue(monsterName, monsterLevel, monsterSize, isMook, partyLevel) {

        console.log(`Calculating cost for ${monsterName} of level ${monsterLevel}, size ${monsterSize}, and isMook ${isMook}`);

        var battleType = this.partyLevelToBattleType(partyLevel);
        var tierAdjustment = this.tierAdjustment(battleType);

        var relativeLevel = monsterLevel - partyLevel + tierAdjustment;
        //console.log(`Relative level for a Level ${partyLevel}: ${relativeLevel}`);


        var levelArrayIndex = this.relativeLevelArrayIndex(relativeLevel);

        if (levelArrayIndex == null) {
            console.log("Level difference is too great!");
            return null;
        }

        var sizeArrayIndex = this.sizeArrayIndex(monsterSize.toLowerCase());

        if (sizeArrayIndex == null) {
            console.log("Could not get the Size index");
            return null;
        }

        if (isMook) {
            return this.MookMultipliers[levelArrayIndex][sizeArrayIndex];
        }
        else {
            return this.NonMookMultipliers[levelArrayIndex][sizeArrayIndex];
        }
    }

    partyLevelToBattleType(partyLevel) {
        return [
            null, // adventurer level 0
            this.BattleTypesEnum[0],
            this.BattleTypesEnum[0],
            this.BattleTypesEnum[0],
            this.BattleTypesEnum[0],
            this.BattleTypesEnum[1],
            this.BattleTypesEnum[1],
            this.BattleTypesEnum[1],
            this.BattleTypesEnum[2],
            this.BattleTypesEnum[2],
            this.BattleTypesEnum[2]
        ][partyLevel];
    }

    tierAdjustment(battleType) {
        switch (battleType) {
            case this.BattleTypesEnum[0]: return 0;
            case this.BattleTypesEnum[1]: return 1;
            case this.BattleTypesEnum[2]: return 2;
            default: return 0;
        }
    }

    relativeLevelArrayIndex(relativeLevel) {
        switch (relativeLevel) {
            case -2: return 0;
            case -1: return 1;
            case 0: return 2;
            case 1: return 3;
            case 2: return 4;
            case 3: return 5;
            case 4: return 6;
            default: return null;
        }
    }

    sizeArrayIndex(size) {
        switch (size) {
            case "weakling": return 0;
            case "normal": return 1;
            case "elite": return 2;
            case "large": return 3;
            case "2x": return 3;
            case "huge": return 4;
            case "3x": return 4;
            default: return null;
        }
    }
}
