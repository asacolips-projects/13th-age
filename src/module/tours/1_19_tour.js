export class OneDotNineteenTour {
  constructor() {
      let tour = introJs();
      this.actor = game.actors.find(a => a.type == 'npc');

      tour.onexit(function() {
        game.settings.set("archmage", "lastTourVersion", "1.19.0");
      });
      tour.oncomplete(function() {
        game.settings.set("archmage", "lastTourVersion", "1.19.0");
      });

      tour.onafterchange(targetElement => {
        const step = Number(tour._currentStep) + 1;
        if (step == 2) {
          if (this.actor?.sheet) this.actor.sheet.render(true);
        }

        if (tour._introItems[tour._currentStep].postChange) {
          tour._introItems[tour._currentStep].postChange();
        }
      });

      tour.onbeforeexit(() => {
        document.querySelector('.npc-sheet .archmage-vue .toggle-header').click();
        if (this.actor?.sheet) this.actor.sheet.close();
      });

      tour.setOption('tooltipPosition', 'auto');
      tour.setOption('positionPrecedence', ['right', 'left', 'top', 'bottom']);
      tour.setOption('showProgress', true);

      tour.setOptions({
          steps: [
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.welcome")
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.welcome"),
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.init"),
              position: 'top',
              postChange: () => this.onChange('.npc-sheet .archmage-vue .rollable--init')
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.header"),
              postChange: () => this.onChange('.npc-sheet .archmage-vue .npc-header')
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.attributes"),
              postChange: () => this.onChange('.npc-sheet .archmage-vue .section--attributes')
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.compact"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .toggle-header').click();
                this.onChange('.npc-sheet .archmage-vue .toggle-header');
              }
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.details"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .tab-link--details').click();
                this.onChange('.npc-sheet .archmage-vue .tab-link--details');
              }
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.actions"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .tab-link--actions').click();
                this.onChange('.npc-sheet .archmage-vue .tab-link--actions');
              }
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.effects"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .tab-link--effects').click();
                this.onChange('.npc-sheet .archmage-vue .tab-link--effects');
              }
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.modifyLevel"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .tab-link--modifyLevel').click();
                this.onChange('.npc-sheet .archmage-vue .tab-link--modifyLevel');
              }
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.npc.settings"),
              postChange: () => {
                document.querySelector('.npc-sheet .archmage-vue .tab-link--settings').click();
                this.onChange('.npc-sheet .archmage-vue .tab-link--settings');
              }
            },
            {
              element: document.querySelector('.item .fa-atlas'),
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.compendiums"),
            },
            {
              intro: game.i18n.localize("ARCHMAGE.TOURS.1190.end")
            },
          ]
        });

      this.tour = tour;
  }

  // @todo figure out why we have to use this hack.
  onChange(selector) {
    const $el = $(selector);

    if ($el.length < 1) return;

    $('.introjs-tooltipReferenceLayer').css({
      left: $el.offset().left,
      top: $el.offset().top + $el.outerHeight(),
      opacity: 0,
    });

    setTimeout(() => {
      $('.introjs-tooltipReferenceLayer').css({opacity: 1});
      $('.introjs-helperNumberLayer').css({
        left: 0,
        top: 0,
        marginLeft: 0,
        marginTop: 0,
      });
      $('.introjs-tooltipReferenceLayer .introjs-tooltip').css({
        left: 0,
        top: 0,
        marginLeft: '15px',
        marginTop: '15px',
      });
    }, 750);
  }

  start() {
      this.tour.start();
  }
}