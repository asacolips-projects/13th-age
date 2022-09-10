import {FeatureTour} from "./feature-tour.mjs";

export class OneDotEightTour extends FeatureTour {
    constructor() {
        super({
          title: "1.8.0",
          description: "Overview of 1.8.0 features",
          canBeResumed: true,
          display: true,
          version: "1.8.0",
          steps: [
            {
              content: "ARCHMAGE.TOURS.180.welcome"
            },
            {
              selector: '.fa-atlas',
              content: "ARCHMAGE.TOURS.180.monkCompendium"
            },
            {
              selector: '.fa-fist-raised',
              content: "ARCHMAGE.TOURS.180.escalationDie"
            },
            {
              selector: '.fa-cogs',
              content: "ARCHMAGE.TOURS.180.tierShorthand"
            },
            {
              content: "ARCHMAGE.TOURS.180.end"
            },
          ]
        });
    }
}
