var twig = require('twig')

module.exports = function () {
  return twig.filters.escape.apply(null, arguments)
}
