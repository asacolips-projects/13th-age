var assert = require('assert')
var twigFilters = require('..')
var twigPackage = require('twig')

var twig = twigPackage.twig

describe('twig-drupal', function () {
  // Add the Twig Filters to Twig.
  twigFilters(twigPackage)

  it('should use the clean_class filter', function (done) {
    var template = twig({
      data: '{{ value|clean_class }}'
    })
    var output = template.render({value: 'Hello World!'})
    assert.equal(output, 'hello-world')
    done()
  })

  it('should create a link', function (done) {
    var template = twig({
      data: 'Visit my {{ link(title, url, attributes) }}!'
    })
    var output = template.render({
      title: 'Website',
      url: 'http://example.com',
      attributes: {
        class: ['foo', 'bar', 'baz']
      }
    })
    assert.equal(output, 'Visit my <a href="http://example.com" class="foo bar baz">Website</a>!')

    output = template.render({
      title: 'Site',
      url: 'http://example.com',
      attributes: {
        class: 'awesome'
      }
    })
    assert.equal(output, 'Visit my <a href="http://example.com" class="awesome">Site</a>!')
    done()
  })
})
