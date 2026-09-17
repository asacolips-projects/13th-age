export class ContextMenu2 {
    constructor(element, selector, menuItems, {eventName="contextmenu"}={}) {
  
      /**
       * The target HTMLElement being selected
       * @type {HTMLElement}
       */
      this.element = element;
  
      /**
       * The target CSS selector which activates the menu
       * @type {String}
       */
      this.selector = selector || element.attr("id");
  
      /**
       * An interaction event name which activates the menu
       * @type {String}
       */
      this.eventName = eventName;
  
      /**
       * The array of menu items being rendered
       * @type {Array}
       */
      this.menuItems = menuItems;
  
      /**
       * Track which direction the menu is expanded in
       * @type {Boolean}
       */
      this._expandUp = false;
  
      // Bind to the current element
      this.bind();
    }
  
    /* -------------------------------------------- */
  
    /**
     * A convenience accessor to the context menu HTML object
     * @return {*|jQuery.fn.init|jQuery|HTMLElement}
     */
    get menu() {
      return $("#context-menu2");
    }
  
    /* -------------------------------------------- */
  
    /**
     * Attach a ContextMenu instance to an HTML selector
     */
    bind() {
      this.element.on(this.eventName, this.selector, event => {
        event.preventDefault();
        event.stopPropagation();
        let parent = $(event.currentTarget),
            menu = this.menu;
  
        if (this.selector == ".message") return;
  
        // Remove existing context UI
        $('.context').removeClass("context");
  
        // Close the current context if it belongs to this same target. The menu is no longer
        // rendered inside the target (see _setPosition), so containment can't be used here.
        if ( menu.length && this._target && this._target[0] === parent[0] ) this.close();
  
        // If the new target element is different
        else {
          this.render(parent);
          ui.context = this;
        }
      })
    }
  
    /* -------------------------------------------- */
  
    /**
     * Animate closing the menu by sliding up and removing from the DOM
     */
    async close() {
      let menu = this.menu;
      await this._animateClose(menu);
      menu.remove();
      $('.context').removeClass("context");
      this._target = null;
      delete ui.context;
    }
  
    /* -------------------------------------------- */
  
    async _animateOpen(menu) {
      menu.hide();
      return new Promise(resolve => menu.slideDown(200, resolve));
    }
  
    /* -------------------------------------------- */
  
    async _animateClose(menu) {
      return new Promise(resolve => menu.slideUp(200, resolve));
    }
  
    /* -------------------------------------------- */
  
    /**
     * Render the Context Menu by iterating over the menuItems it contains
     * Check the visibility of each menu item, and only render ones which are allowed by the item's logical condition
     * Attach a click handler to each item which is rendered
     * @param target
     */
    render(target) {
      let html = $("#context-menu2").length ? $("#context-menu2") : $('<nav id="context-menu2" data-mod="1"></nav>');
      html.empty().removeClass("expand-up").removeClass("expand-down");
      let ol = $('<ol class="context-items"></ol>');
      html.append($(`<h2>${game.i18n.localize('ARCHMAGE.UI.applyChanges')}</h2>`));
      html.append(ol);

      // Determine if user-selected targets are allowed.
      const allowTargeting = game.settings.get('archmage', 'allowTargetDamageApplication');
      let targetType = game.settings.get('archmage', 'userTargetDamageApplicationType');
      if (!allowTargeting && targetType !== 'selected') {
        game.settings.set('archmage', 'userTargetDamageApplicationType', 'selected');
        targetType = 'selected';
      }

      // Add default target type.
      html[0].dataset.target = targetType;
  
      // Build menu items
      for (let item of this.menuItems) {
        
        // Determine menu item visibility (display unless false)
        let display = true;
        if ( item.condition !== undefined ) {
          display = ( item.condition instanceof Function ) ? item.condition(target) : item.condition;
        }
        if ( !display ) continue;
  
        // Construct and add the menu item
        let name = game.i18n.localize(item.name);
        let li = $(`<li class="context-item ${item?.id ?? ''}">${item.icon}${name}</li>`);
        // If this is the target buttons option, set one of them to active.
        if (name.includes('data-target="targeted"')) {
          const button = li.find(`[data-target="${targetType}"]`);
          button.addClass('active');
        }
        li.children("i").addClass("fa-fw");
        li.click(e => {
          e.preventDefault();
          e.stopPropagation();
          item.callback(target, e);
          // If this was a target button, prevent closing the context menu.
          if (!item?.preventClose) {
            this.close();
          }
        });
        ol.append(li);
      }
  
      // Bail out if there are no children
      if ( ol.children().length === 0 ) return;
  
      // Append to target
      this._setPosition(html, target);

      // Deactivate global tooltip
      game.tooltip.deactivate();
  
      // Animate open the menu
      return this._animateOpen(html);
    }
  
    /* -------------------------------------------- */
  
    /**
     * Set the position of the context menu, taking into consideration whether the menu should expand upward or downward
     * @private
     */
    _setPosition(html, target) {
      // The menu lives on the body rather than inside the target: rows we evaluated as inapplicable
      // are dimmed rather than hidden (the evaluation can be wrong), and opacity on an ancestor
      // would composite the menu along with it. It also keeps the menu from being clipped by the
      // scrolling chat log, so it can overlay the canvas when the chat column is too narrow for it.
      const targetRect = target[0].getBoundingClientRect();
      html.css({
        visibility: "hidden",
        position: "fixed",
        width: Math.min(360, Math.max(200, targetRect.width)),
        zIndex: 9999
      });
      document.body.appendChild(html[0]);
      const contextRect = html[0].getBoundingClientRect();

      // The menu has to stay wholly on screen.
      const margin = 4;
      const maxLeft = Math.max(window.innerWidth - contextRect.width - margin, margin);
      const maxTop = Math.max(window.innerHeight - contextRect.height - margin, margin);

      // Expand upward when the menu doesn't fit below the target but has more room above it.
      const spaceBelow = window.innerHeight - margin - targetRect.bottom - 2;
      const spaceAbove = targetRect.top - margin - 2;
      this._expandUp = (spaceBelow < contextRect.height) && (spaceAbove > spaceBelow);

      // Always extend leftward from the target: the menu is wider than most of what it is opened
      // on, and everything it's opened on sits in the right-hand chat column.
      let left = Math.min(Math.max(targetRect.right - contextRect.width, margin), maxLeft);

      let top = this._expandUp ? targetRect.top - contextRect.height - 2 : targetRect.bottom + 2;
      top = Math.min(Math.max(top, margin), maxTop);

      // Display the menu.
      html.addClass(this._expandUp ? "expand-up" : "expand-down");
      html.css({left: Math.floor(left), top: Math.floor(top), bottom: "auto", visibility: ""});
      this._target = target;
      target.addClass("context");
    }

    /* -------------------------------------------- */

    static eventListeners() {
      document.addEventListener("click", ev => {
        if ( ui.context ) ui.context.close();
      });
      // The menu is positioned against the viewport, so it can't follow a target that scrolls away.
      document.addEventListener("scroll", ev => {
        if ( ui.context ) ui.context.close();
      }, true);
    };
  }
