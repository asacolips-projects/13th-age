export class OneDotSevenTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.17.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.7.0");
        });

        tour.onbeforechange(function(targetElement) {

          if ($(targetElement).data("pack") == "archmage.srd-monsters") {
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
                element: document.querySelector('.fa-cogs'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.documentation"),
                position: 'bottom'
              },
              {
                element: document.querySelector('[data-action="userguide]"'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.cards"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-users'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.sheets"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-suitcase'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.showItem"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-comments'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.iconRelationships"),
                position: 'bottom'
              },
              {
                element: document.querySelector('[data-pack="archmage.srd-monsters"]'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.monstersCompendium"),
                position: 'bottom'
              },
              {
                element: document.querySelector('[data-pack="archmage.generalfeats"]'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.170.generalFeats"),
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