import { OneDotSevenTour } from './1_7_tour.js';
import { OneDotEightTour } from './1_8_tour.js';
import { OneDotNineTour } from './1_9_tour.js';
import { OneDotTenTour } from './1_10_tour.js';
import { OneDotSeventeenTour } from './1_17_tour.js';
import { OneDotNineteenTour } from './1_19_tour.js';

export class TourGuide {

    async registerTours() {
        game.tours.register("archmage", "1.7.0", new OneDotSevenTour());
        game.tours.register("archmage", "1.8.0", new OneDotEightTour());
        game.tours.register("archmage", "1.9.0", new OneDotNineTour());
        game.tours.register("archmage", "1.10.0", new OneDotTenTour());
        game.tours.register("archmage", "1.17.0", new OneDotSeventeenTour());
        //game.tours.register("archmage", "1.19.0", new OneDotNineteenTour());
        // game.tours.register("archmage", "actorSheet", new Tour({
        //     title: "Active Effects Tour",
        //     description: "Learn how to use the Active Effects feature",
        //     steps: []
        // }))
    }

    startNewFeatureTours() {
        let lastTourVersion = game.settings.get("archmage", "lastTourVersion");

        if (foundry.utils.isNewerVersion("1.7.0", lastTourVersion)) {
            game.tours.get("archmage.1.7.0").start();
        }
        else if (foundry.utils.isNewerVersion("1.8.0", lastTourVersion)) {
            game.tours.get("archmage.1.8.0").start();
        }
        else if (foundry.utils.isNewerVersion("1.9.0", lastTourVersion)) {
            game.tours.get("archmage.1.9.0").start();
        }
        else if (foundry.utils.isNewerVersion("1.10.0", lastTourVersion)) {
            game.tours.get("archmage.1.10.0").start();
        }
        else if (foundry.utils.isNewerVersion("1.17.0", lastTourVersion)) {
            game.tours.get("archmage.1.17.0").start();
        }
        else if (foundry.utils.isNewerVersion("1.19.0", lastTourVersion)) {
            // This release is NPC focused, so only show it to GMs.
            if (game.user.isGM) {
                game.tours.get("archmage.1.19.0").start();
            }
        }
    }
}
