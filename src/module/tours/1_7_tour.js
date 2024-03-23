import { FeatureTour } from "./feature-tour.mjs";

export class OneDotSevenTour extends FeatureTour {

	constructor() {
		super({
			title: "1.7.0",
			description: "Overview of 1.7.0 features",
			canBeResumed: false,
			display: true,
			version: "1.7.0",
			steps: [
				{
					id: "welcome",
					selector: "",
					content: "ARCHMAGE.TOURS.170.welcome"
				},
				{
					selector: ".fa-cogs",
					content: "ARCHMAGE.TOURS.170.documentation"
				},
				{
					selector: '[data-action="archmage-help"]',
					content: "ARCHMAGE.TOURS.170.cards"
				},
				{
					selector: ".fa-users",
					content: "ARCHMAGE.TOURS.170.sheets"
				},
				{
					selector: ".fa-suitcase",
					content: "ARCHMAGE.TOURS.170.showItem"
				},
				{
					selector: ".fa-comments",
					content: "ARCHMAGE.TOURS.170.iconRelationships"
				},
				{
					selector: '[data-pack="archmage.srd-monsters"]',
					content: "ARCHMAGE.TOURS.170.monstersCompendium"
				},
				{
					selector: '[data-pack="archmage.generalfeats"]',
					content: "ARCHMAGE.TOURS.170.generalFeats"
				},
				{
					content: "ARCHMAGE.TOURS.170.end"
				}
			]
		});
	}

	async _preStep() {
		if (this.currentStep.id === "srd-monsters") {
			$(".item>.fa-atlas").click();
		}
		else if (this.currentStep.selector.includes(".fa")) {
			$(this.currentStep.selector).click();
		}
	}
}
