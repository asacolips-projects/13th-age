export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

// @todo, uncomment this to wrapp all stories with extra markup.
export const decorators = [(story) => ({
  components: { story },
  template: '<div class="archmage-v2 sheet sheet-journal"><story /></div>'
})];