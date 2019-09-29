var trans = require('./trans')

module.exports = {
  t: trans,
  trans: trans,
  placeholder: trans,
  without: trans,
  clean_class: require('./clean_class'), // eslint-disable-line camelcase
  clean_id: require('./clean_id'), // eslint-disable-line camelcase
  render: trans,
  format_date: trans, // eslint-disable-line camelcase
  drupal_escape: require('./drupal_escape'), // eslint-disable-line camelcase
  safe_join: require('./safe_join') // eslint-disable-line camelcase
}
