export class OneDotSevenTour {
    constructor() {
        let tour = introJs()

        tour.onexit(function() {
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
                intro: "Welcome to Toolkit13 (13th Age Compatible) version 1.7.0! Here's a quick tour of new features"
              },
              { 
                element: document.querySelector('.fa-cogs'),
                intro: "We have started the (long) process of writing documentation for the system. If you have documentation you want to contribute, please reach out or issue a Pull Request!",
                position: 'bottom'
              },
              { 
                element: document.querySelector('[data-action="userguide]"'),
                intro: "We now have Card Support for Icon Relationship 5's and 6's - Please see the documentation for more info on how to enable and set this up",
                position: 'bottom'
              },
              { 
                element: document.querySelector('.fa-users'),
                intro: "Character sheets have been reworked. Open one up to check it out!",
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-suitcase'),
                intro: "You can now show an Item to all players with a new 'Show to Players' button",
                position: 'bottom'
              },
              {
                element: document.querySelector('.fa-comments'),
                intro: "Rolling Icon Relationships now has a nicer Chat display, along with Disengage and Save checks",
                position: 'bottom'
              },
              {
                element: document.querySelector('[data-pack="archmage.srd-monsters"]'),
                intro: "There is now a system-provided Monsters Compendium",
                position: 'bottom'
              },
              {
                element: document.querySelector('[data-pack="archmage.generalfeats"]'),
                intro: "Along with General Feats, courtesy of the Community!",
                position: 'bottom'
              },
              { 
                intro: "There's a variety of bug fixes and minor tweaks as well, such as to Trigger automation. Come join us in the Foundry Discord #13th-age channel for questions and feedback!"
              },
            ]
          });

        this.tour = tour;
    }

    start() {
        this.tour.start();
    }
}