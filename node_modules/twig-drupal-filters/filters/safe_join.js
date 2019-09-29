var twig = require('twig')

module.exports = function () {
  return twig.filters.join.apply(null, arguments)
}
