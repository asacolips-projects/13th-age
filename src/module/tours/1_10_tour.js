export class OneDotTenTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.17.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.10.0");
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
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.welcome")
              },
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.v2Sheet")
              },
              {
                // element: document.querySelector('.fa-users'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.nightMode"),
                position: 'bottom'
              },
              {
                // element: document.querySelector('.fa-atlas'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.rolls"),
                position: 'bottom'
              },
              {
                // element: document.querySelector('.fa-atlas'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.iconRolls"),
                position: 'bottom'
              },
              {
                // element: document.querySelector('.fa-cogs'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.rests"),
                position: 'bottom'
              },
              {
                // element: document.querySelector('#archmage-reference-btn'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.powerImporter"),
                position: 'bottom'
              },
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.1100.end")
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}