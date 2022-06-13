export class renderCompendium {
  static async handle(app, html, data) {
    let compendiumContent = null;
    let newOptions = duplicate(data);
    newOptions.index = {};

    console.log(data.collection.metadata)

    // TODO: Disable this after compendiums are working.
    return;

    // let compendium = data.collection;

    // if (compendium.metadata.entity == 'Item') {
    //   let classList = Object.keys(CONFIG.ARCHMAGE.classList);
    //   classList.push('races');
    //   let classRegex = new RegExp(classList.join('|'), 'g');
    //   if (compendium.metadata.name.match(classRegex)) {
    //     // Hide the original compendium.
    //     html.find('.compendium').addClass('overrides');
    //     compendiumContent = await compendium.getContent();
    //     compendiumContent.forEach(p => {
    //       let option = data.index.find(o => o.id == p.id);
    //       let data = p.data.data;
    //       option.search = {
    //         level: data.powerLevel ? data.powerLevel.value : null,
    //         usage: data.powerUsage?.value ? data.powerUsage.value : 'other',
    //         type: data.powerType ? data.powerType.value : 'other',
    //         action: data.actionType ? data.actionType.value : null,
    //       };
    //     }, {});
    //   }

    //   newOptions.index = duplicate(data).index.reduce((groups, option) => {
    //     if (option.id) {
    //       let group = option.search.type ? option.search.type : 'other';
    //       if (!groups[group]) {
    //         groups[group] = [];
    //       }
    //       groups[group].push(option);
    //     }
    //     return groups;
    //   }, {});
    // }
    // if (compendium.metadata.entity == 'Actor') {
    //   // Hide the original compendium.
    //   html.find('.compendium').addClass('overrides');
    //   // Build a search index.
    //   compendiumContent = await compendium.getContent();
    //   console.log(compendiumContent);
    //   compendiumContent.forEach(m => {
    //     let option = data.index.find(o => o.id == m.id);
    //     let data = m.data.data;
    //     option.search = {
    //       level: data.details.level ? data.details.level.value : null,
    //       class: data.details.class.value ? data.details.class.value : null,
    //       race: data.details.race.value ? data.details.race.value : null,
    //       size: data.details.size ? data.details.size.value : null,
    //       role: data.details.role ? data.details.role.value : null,
    //       type: data.details.type ? data.details.type.value : 'other',
    //     };
    //   });
    //   newOptions.index = duplicate(data).index.reduce((groups, option) => {
    //     if (option.id) {
    //       // console.log(option);
    //       let group = option.search.type ? option.search.type : 'other';
    //       if (!groups[group]) {
    //         groups[group] = [];
    //       }
    //       groups[group].push(option);
    //     }
    //     return groups;
    //   }, {});
    // }

    // if (compendiumContent) {
    //   // Sort the data.
    //   for (let [groupKey, group] of Object.entries(newOptions.index)) {
    //     group.sort((a, b) => a.search.level - b.search.level);
    //   }
    //   // Replace the markup.
    //   html.find('.directory-list').remove();
    //   let template = 'systems/archmage/templates/sidebar/apps/compendium.html';
    //   let content = await renderTemplate(template, newOptions);
    //   html.find('.directory-header').after(content);

    //   // Handle search filtering.
    //   html.find('input[name="search"]').off('keyup');
    //   html.find('input[name="search"]').on('keyup', event => {
    //     // Close all directories.
    //     html.find('.entry-group + .directory-list--archmage').addClass('hidden');
    //     let searchString = event.target.value

    //     const query = new RegExp(RegExp.escape(searchString), "i");
    //     html.find('li.directory-item').each((i, li) => {
    //       // Show the matches, and open their directory.
    //       let name = li.getElementsByClassName('entry-name')[0].textContent;
    //       if (searchString != '' && query.test(name)) {
    //         li.style.display = 'flex';
    //         $(li).parents('.directory-list--archmage').removeClass('hidden');
    //       }
    //       // Hide non-matches.
    //       else {
    //         li.style.display = 'none';
    //       }
    //     });
    //     data.searchString = searchString;
    //   });

    //   // Handle sheet opening.
    //   html.find('.entry-name').click(ev => {
    //     let li = ev.currentTarget.parentElement;
    //     compendium.getEntity(li.dataset.entryId).then(entity => {
    //       entity.sheet.render(true);
    //     });
    //   });

    //   // Handle lazy loading images.
    //   let lazyCallback = (entries, observer) => {
    //     for (let e of entries) {
    //       if (!e.isIntersecting) continue;
    //       const li = e.target;

    //       // Background Image
    //       if (li.dataset.backgroundImage) {
    //         li.style["background-image"] = `url("${li.dataset.backgroundImage}")`;
    //         delete li.dataset.backgroundImage;
    //       }

    //       // Avatar image
    //       const img = li.querySelector("img");
    //       if (img && img.dataset.src) {
    //         img.src = img.dataset.src;
    //         delete img.dataset.src;
    //       }

    //       // No longer observe the target
    //       observer.unobserve(e.target);
    //     }
    //   }

    //   const directory = html.find('.directory-list');
    //   const entries = directory.find('.directory-item');

    //   const observer = new IntersectionObserver(lazyCallback, { root: directory[0] });
    //   entries.each((i, li) => observer.observe(li));

    //   // Handle dragdrop.
    //   const dragDrop = new DragDrop(compendium.data.dragDrop[0]);
    //   dragDrop.bind(html[0]);

    //   // Handle folder toggles.
    //   html.find('.entry-group').on('click', event => {
    //     event.preventDefault();
    //     let key = $(event.currentTarget).data('key');
    //     $(event.currentTarget).toggleClass('hidden');
    //     html.find(`.directory-item[data-key="${key}"]`).css('display', $(event.currentTarget).hasClass('hidden') ? 'none' : 'flex');
    //     return false;
    //   })
    // }
  }
}