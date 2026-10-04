/**
 * Shared helpers for document sheets (actor and item) that are not specific
 * to either kind.
 */

/**
 * Open a FilePicker to change one of the sheet document's image fields and
 * write the chosen path back to the document.
 *
 * Shared by the AppV2 sheets' onEditImage action and the AppV1 actor sheet's
 * img[data-edit] click listener.
 *
 * @param {object} app   The sheet application, read for isEditable, the
 *   document, and the window position.
 * @param {Event} event   The originating click event.
 * @param {HTMLElement} [target]   The image element carrying data-edit.
 *   Defaults to the event's currentTarget, which is what the AppV1
 *   listener hands off.
 * @param {object} [options]
 * @param {boolean} [options.respectSubmitOnChange]  Skip the document update
 *   when the app's submitOnChange option is off (the AppV1 actor sheet
 *   submits its form itself).
 * @returns {Promise} The FilePicker browse promise, or false when not editable.
 */
export async function pickImage(app, event, target = event.currentTarget, {respectSubmitOnChange = false} = {}) {
  if (!app.isEditable) return false;
  const attr = target.dataset.edit;
  const current = foundry.utils.getProperty(app.document, attr);
  const { img } = app.document.constructor.getDefaultArtwork?.(app.document.toObject()) ?? {};
  const fp = new foundry.applications.apps.FilePicker.implementation({
    current,
    type: "image",
    redirectToRoot: img ? [img] : [],
    callback: path => {
      target.src = path;
      if (respectSubmitOnChange && !app.options.submitOnChange) return;
      return app.document.update({[attr]: path});
    },
    top: app.position.top + 40,
    left: app.position.left + 10
  });
  return fp.browse();
}

/**
 * Build DragDrop controllers for an AppV2 sheet's dragDrop option, wiring the
 * sheet's permission and callback hooks.
 *
 * Shared by the base item sheet v2 and the V3 actor sheet.
 *
 * @param {object} app   The sheet application with a dragDrop option and the
 *   _canDragStart/_canDragDrop/_onDragStart/_onDragOver/_onDrop hooks.
 * @returns {DragDrop[]} An array of DragDrop handlers.
 */
export function createDragDropHandlers(app) {
  return app.options.dragDrop.map(d => {
    d.permissions = {
      dragstart: app._canDragStart.bind(app),
      drop: app._canDragDrop.bind(app)
    };
    d.callbacks = {
      dragstart: app._onDragStart.bind(app),
      dragover: app._onDragOver.bind(app),
      drop: app._onDrop.bind(app)
    };
    return new foundry.applications.ux.DragDrop.implementation(d);
  });
}
