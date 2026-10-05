import { FeatureTour } from "./feature-tour.mjs";

export class OneDotNineTour extends FeatureTour {
    constructor() {
        super({
          title: "1.9.0",
          description: "Overview of 1.9.0 features",
          canBeResumed: false,
          display: true,
          version: "1.9.0",
          steps: [
            {
              content: "ARCHMAGE.TOURS.190.welcome"
            },
            {
              content: "ARCHMAGE.TOURS.190.aip"
            },
            {
              selector: ".fa-users",
              content: "ARCHMAGE.TOURS.190.baseStats",
              position: "bottom"
            },
            {
              selector: ".fa-atlas",
              content: "ARCHMAGE.TOURS.190.necromancer",
              position: "bottom"
            },
            {
              selector: ".fa-atlas",
              content: "ARCHMAGE.TOURS.190.inlineRoll",
              position: "bottom"
            },
            {
              selector: ".fa-cogs",
              content: "ARCHMAGE.TOURS.190.colorblind",
              position: "bottom"
            },
            {
              selector: "#archmage-reference-btn",
              content: "ARCHMAGE.TOURS.190.inlineRollDocs",
              position: "bottom"
            },
            {
              selector: "#archmage-help-btn",
              content: "ARCHMAGE.TOURS.190.systemDocs",
              position: "bottom"
            },
            {
              selector: ".fa-comments",
              content: "ARCHMAGE.TOURS.190.chatCards",
              position: "bottom"
            },
            {
              content: "ARCHMAGE.TOURS.190.end"
            }
          ]
        });
    }

    async _preStep() {
      await super._preStep();
      if (this.currentStep?.selector?.includes(".fa")) {
        $(this.currentStep.selector).click();
      }
    }
}
