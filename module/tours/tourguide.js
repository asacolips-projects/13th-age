import { OneDotSevenTour } from './1_7_tour.js';
import { OneDotEightTour } from './1_8_tour.js';
import { OneDotNineTour } from './1_9_tour.js';
import { OneDotTenTour } from './1_10_tour.js';

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
    }
}