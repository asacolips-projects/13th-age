export class OneDotEightTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.8.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.8.0");
        });

        tour.onbeforechange(function(targetElement) {

          if ($(targetElement).data("pack") == "archmage.monk") {
            $('.item>.fa-atlas').click();
          }
          else if ($(targetElement).hasClass("fas")) {
            $(targetElement).click();
          }
        });

        tour.setOption('tooltipPosition', 'auto');
        tour.setOption('positionPrecedence', ['right', 'left', 'top', 'bottom']);
        tour.setOption('showProgress', true);

        tour.setOptions({
            steps: [
              { 
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.welcome")
              },
              {
                element: document.querySelector('[data-pack="archmage.monk"]'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.monkCompendium"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-fist'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.escalationDie"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('.fa-cogs'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.tierShorthand"),
                position: 'bottom'
              },
              { 
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.end")
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}