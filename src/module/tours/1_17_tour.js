export class OneDotSeventeenTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.17.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.17.0");
        });

        // tour.onbeforechange(function(targetElement) {

        //   if ($(targetElement).data("pack") == "archmage.srd-monsters") {
        //     $('.item>.fa-atlas').click();
        //   }
        //   else if ($(targetElement).hasClass("fas")) {
        //     $(targetElement).click();
        //   }
        // });

        tour.setOption('tooltipPosition', 'auto');
        tour.setOption('positionPrecedence', ['right', 'left', 'top', 'bottom']);
        tour.setOption('showProgress', true);

        tour.setOptions({
            steps: [
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.1170.welcome")
              },
              {
                element: document.querySelector('#sidebar-tabs [data-tab="chat"]'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1170.crits"),
                position: 'bottom'
              },
              {
                element: document.querySelector('#sidebar-tabs [data-tab="compendium"]'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1170.compendia"),
                position: 'bottom'
              },
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.1170.end")
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}