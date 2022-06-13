export class OneDotEightTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.17.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.8.0");
        });

        tour.setOption('tooltipPosition', 'auto');
        tour.setOption('positionPrecedence', ['right', 'left', 'top', 'bottom']);
        tour.setOption('showProgress', true);

        tour.setOptions({
            steps: [
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.180.welcome")
              },
              {
                element: document.querySelector('.fa-atlas'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.180.monkCompendium"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-fist-raised'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.180.escalationDie"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-cogs'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.180.tierShorthand"),
                position: 'bottom'
              },
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.180.end")
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}