'use strict';
/**
 * Load a JS script manually (used for Vue fallback).
 * @param {string} src | URL to the file.
 */
function archmageLoadJs(src) {
  return new Promise(function(resolve, reject) {
    let s;
    s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  })
}