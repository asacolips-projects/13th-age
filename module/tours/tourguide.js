import { OneDotSevenTour } from './1_7_tour.js';

export class TourGuide {

    startNewFeatureTours() {
        let lastTourVersion = game.settings.get("archmage", "lastTourVersion");
        let systemVersion = game.system.data.version;
        
        if (isNewerVersion("1.7.0", lastTourVersion)) {
            new OneDotSevenTour().start();
        }
    }
}