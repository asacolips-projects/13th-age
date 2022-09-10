import {FeatureTour} from "./feature-tour.mjs";

export class OneDotNineteenTour extends FeatureTour {
  constructor() {
    super({
      title: "1.19.0",
      description: "Overview of 1.19.0 features",
      canBeResumed: false,
      display: true,
      restricted: true,
      steps: [
        {
          id: "welcome",
          selector: "",
          content: "ARCHMAGE.TOURS.170.welcome"
        }
      ]
    });

    this.actor = game.actors.find(a => a.type == 'npc');



      // tour.onafterchange(targetElement => {
      //   const step = Number(tour._currentStep) + 1;
      //   if (step == 2) {
      //     if (this.actor?.sheet) this.actor.sheet.render(true);
      //   }
      //
      //   if (tour._introItems[tour._currentStep].postChange) {
      //     tour._introItems[tour._currentStep].postChange();
      //   }
      // });
      //
      // tour.onbeforeexit(() => {
      //   let el = '.npc-sheet .archmage-vue .toggle-header';
      //   if (el) el.click();
      //   if (this.actor?.sheet) this.actor.sheet.close();
      // });

      // super({
      //     steps: [
      //       {
      //         content: "ARCHMAGE.TOURS.1190.welcome"
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.welcome",
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.init",
      //         postChange: () => this.onChange('.npc-sheet .archmage-vue .rollable--init')
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.header",
      //         postChange: () => this.onChange('.npc-sheet .archmage-vue .npc-header')
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.attributes",
      //         postChange: () => this.onChange('.npc-sheet .archmage-vue .section--attributes')
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.compact",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .toggle-header').click(;
      //           this.onChange('.npc-sheet .archmage-vue .toggle-header');
      //         }
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.details",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .tab-link--details').click(;
      //           this.onChange('.npc-sheet .archmage-vue .tab-link--details');
      //         }
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.actions",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .tab-link--actions').click(;
      //           this.onChange('.npc-sheet .archmage-vue .tab-link--actions');
      //         }
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.effects",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .tab-link--effects').click(;
      //           this.onChange('.npc-sheet .archmage-vue .tab-link--effects');
      //         }
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.modifyLevel",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .tab-link--modifyLevel').click(;
      //           this.onChange('.npc-sheet .archmage-vue .tab-link--modifyLevel');
      //         }
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.npc.settings",
      //         postChange: () => {
      //           '.npc-sheet .archmage-vue .tab-link--settings').click(;
      //           this.onChange('.npc-sheet .archmage-vue .tab-link--settings');
      //         }
      //       },
      //       {
      //         selector: '.item .fa-atlas',
      //         content: "ARCHMAGE.TOURS.1190.compendiums",
      //       },
      //       {
      //         content: "ARCHMAGE.TOURS.1190.end"
      //       },
      //     ]
      //   });
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
}
