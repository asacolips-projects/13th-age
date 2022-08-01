import {FeatureTour} from "./feature-tour.mjs";

export class OneDotTenTour extends FeatureTour {
    constructor() {

        super({
          title: "1.10.0",
          description: "Overview of 1.10.0 features",
          canBeResumed: true,
          display: true,
          version: "1.10.0",
          steps: [
            {
              content: "ARCHMAGE.TOURS.1100.welcome"
            },
            {
              content: "ARCHMAGE.TOURS.1100.v2Sheet"
            },
            {
              // selector: '.fa-users',
              content: "ARCHMAGE.TOURS.1100.nightMode",
              position: 'bottom'
            },
            {
              // selector: '.fa-atlas',
              content: "ARCHMAGE.TOURS.1100.rolls",
              position: 'bottom'
            },
            {
              // selector: '.fa-atlas',
              content: "ARCHMAGE.TOURS.1100.iconRolls",
              position: 'bottom'
            },
            {
              // selector: '.fa-cogs',
              content: "ARCHMAGE.TOURS.1100.rests",
              position: 'bottom'
            },
            {
              // selector: '#archmage-reference-btn',
              content: "ARCHMAGE.TOURS.1100.powerImporter",
              position: 'bottom'
            },
            {
              content: "ARCHMAGE.TOURS.1100.end"
            },
          ]
        });
    }
}
