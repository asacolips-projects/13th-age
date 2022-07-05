import { OneDotSevenTour } from './1_7_tour.js';
import { OneDotEightTour } from './1_8_tour.js';
import { OneDotNineTour } from './1_9_tour.js';
import { OneDotTenTour } from './1_10_tour.js';
import { OneDotSeventeenTour } from './1_17_tour.js';
import { OneDotNineteenTour } from './1_19_tour.js';

export class TourGuide {

    startNewFeatureTours() {
        let lastTourVersion = game.settings.get("archmage", "lastTourVersion");

        if (isNewerVersion("1.7.0", lastTourVersion)) {
            new OneDotSevenTour().start();
        }
        else if (isNewerVersion("1.8.0", lastTourVersion)) {
            new OneDotEightTour().start();
        }
        else if (isNewerVersion("1.9.0", lastTourVersion)) {
            new OneDotNineTour().start();
        }
        else if (isNewerVersion("1.10.0", lastTourVersion)) {
            new OneDotTenTour().start();
        }
        else if (isNewerVersion("1.17.0", lastTourVersion)) {
            new OneDotSeventeenTour().start();
        }
        else if (isNewerVersion("1.19.0", lastTourVersion)) {
            // This release is NPC focused, so only show it to GMs.
            if (game.user.isGM()) {
                new OneDotNineteenTour().start();
            }
        }
    }
}