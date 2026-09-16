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
      // Anchor the menu outside of any faded ancestor. Rows we evaluated as inapplicable are
      // dimmed rather than hidden precisely because the evaluation can be wrong, so the menu has
      // to stay fully usable - and opacity on an ancestor would composite the menu along with it.
      const anchor = this._getAnchor(target[0]);
      if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';

      const targetRect = target[0].getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      // Append to the anchor and get the context bounds. Width matches what the menu used to get
      // from the target it was nested in.
      html.css({visibility: "hidden", width: Math.min(360, Math.max(200, targetRect.width))});
      anchor.appendChild(html[0]);
      const contextRect = html[0].getBoundingClientRect();

      // Determine whether to expand down or expand up.
      const bottomHalf = targetRect.bottom > (window.innerHeight / 2);
      this._expandUp = bottomHalf && ((window.innerHeight - targetRect.bottom) < contextRect.height);

      // Position relative to the anchor, shifting left if needed to avoid overflowing it.
      let left = targetRect.left - anchorRect.left;
      const horizontalOverflow = anchorRect.width - (left + contextRect.width);
      if (horizontalOverflow < 0) left = Math.max(0, left + horizontalOverflow);
      const top = this._expandUp
        ? targetRect.top - anchorRect.top - contextRect.height - 2
        : targetRect.bottom - anchorRect.top + 2;

      // Display the menu.
      html.addClass(this._expandUp ? "expand-up" : "expand-down");
      html.css({left: Math.floor(left), top: Math.floor(top), bottom: "auto", visibility: ""});
      this._target = target;
      target.addClass("context");
    }

    /* -------------------------------------------- */

    /**
     * Find the closest ancestor that isn't inside a faded (opacity < 1) element, so the menu can
     * be positioned against it without inheriting that fading. Never walks past the chat message
     * or application window the target belongs to, which keeps the menu glued to the target while
     * its container scrolls.
     * @param {HTMLElement} target
     * @returns {HTMLElement}
     * @private
     */
    _getAnchor(target) {
      const boundary = target.closest('.chat-message, .application, .window-app') ?? document.body;
      let anchor = target;
      let node = target;
      while (node) {
        if (Number(getComputedStyle(node).opacity) < 1 && node.parentElement) anchor = node.parentElement;
        if (node === boundary) break;
        node = node.parentElement;
      }
      return anchor;
    }
  
    /* -------------------------------------------- */
  
    static eventListeners() {
      document.addEventListener("click", ev => {
        if ( ui.context ) ui.context.close();
      });
    };
  }
