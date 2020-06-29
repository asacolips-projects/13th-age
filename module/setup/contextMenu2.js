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
        let parent = $(event.currentTarget),
            menu = this.menu;
  
        if (this.selector == ".message") return;
  
        // Remove existing context UI
        $('.context').removeClass("context");
  
        // Close the current context
        if ( $.contains(parent[0], menu[0]) ) this.close();
  
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
      let html = $("#context-menu2").length ? $("#context-menu2") : $('<nav id="context-menu2"></nav>');
      let ol = $('<ol class="context-items"></ol>');
      html.html(ol);
  
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
        let li = $(`<li class="context-item">${item.icon}${name}</li>`);
        li.children("i").addClass("fa-fw");
        li.click(e => {
          e.preventDefault();
          e.stopPropagation();
          item.callback(target);
          this.close();
        });
        ol.append(li);
      }
  
      // Bail out if there are no children
      if ( ol.children().length === 0 ) return;
  
      // Append to target
      this._setPosition(html, target);
  
      // Animate open the menu
      return this._animateOpen(html);
    }
  
    /* -------------------------------------------- */
  
    /**
     * Set the position of the context menu, taking into consideration whether the menu should expand upward or downward
     * @private
     */
    _setPosition(html, target) {
      const targetRect = target[0].getBoundingClientRect();
      const parentRect = target[0].parentElement.getBoundingClientRect();
  
      // Append to target and get the context bounds
      target.css('position', 'relative');
      html.css("visibility", "hidden");
      target.append(html);
      const contextRect = html[0].getBoundingClientRect();
  
      // Determine whether to expand down or expand up
      const bottomHalf = targetRect.bottom > (window.innerHeight / 2);
      this._expandUp = bottomHalf && ((parentRect.bottom - targetRect.bottom) < contextRect.height);
  
      // Display the menu
      html.addClass(this._expandUp ? "expand-up" : "expand-down");
      html.css("visibility", "");
      target.addClass("context");
    }
  
    /* -------------------------------------------- */
  
    static eventListeners() {
      document.addEventListener("click", ev => {
        if ( ui.context ) ui.context.close();
      });
    };
  }