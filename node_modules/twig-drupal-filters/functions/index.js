var activeTheme = require('./active_theme')
const link = require('./link')

module.exports = {
  attach_library: require('./attach_library'), // eslint-disable-line camelcase
  render_var: activeTheme, // eslint-disable-line camelcase
  url: activeTheme,
  file_url: activeTheme, // eslint-disable-line camelcase
  active_theme_path: activeTheme, // eslint-disable-line camelcase
  active_theme: activeTheme, // eslint-disable-line camelcase
  path: activeTheme,
  link: link
}
