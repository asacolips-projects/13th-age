export class OneDotNineTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
          game.settings.set("archmage", "lastTourVersion", "1.9.0");
        });
        tour.oncomplete(function() {
          game.settings.set("archmage", "lastTourVersion", "1.9.0");
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
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.welcome")
              },
              {
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.aip")
              },
              {
                element: document.querySelector('.fa-users'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.baseStats"),
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-atlas'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.necromancer"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('.fa-atlas'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.inlineRoll"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('.fa-cogs'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.colorblind"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('#archmage-reference-btn'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.inlineRollDocs"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('#archmage-help-btn'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.systemDocs"),
                position: 'bottom'
              },
              { 
                element: document.querySelector('.fa-comments'),
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.chatCards"),
                position: 'bottom'
              },
              { 
                intro: game.i18n.localize("ARCHMAGE.TOURS.190.end")
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}