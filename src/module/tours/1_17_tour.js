import {FeatureTour} from "./feature-tour.mjs";

export class OneDotSeventeenTour extends FeatureTour {
    constructor() {
        super({
          title: "1.17.0",
          description: "Overview of 1.17.0 features",
          canBeResumed: true,
          display: true,
          version: "1.17.0",
          steps: [
            {
              selector: ".great-gold-wyrm",
              content: "ARCHMAGE.TOURS.1170.welcome"
            },
            {
              selector: '#sidebar-tabs [data-tab="chat"]',
              content: "ARCHMAGE.TOURS.1170.crits",
              position: 'bottom'
            },
            {
              selector: '#sidebar-tabs [data-tab="compendium"]',
              content: "ARCHMAGE.TOURS.1170.compendia",
              position: 'bottom'
            },
            {
              content: "ARCHMAGE.TOURS.1170.end"
            },
          ]
        });
    }
}
