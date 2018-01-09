/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let DOM;
try {
  DOM = require('react-dom-factories');
} catch (error) {
  DOM = window.ReactDOMFactories;
}

// can fall back to normal React until 16.0
if (DOM == null) {
  let React;
  try {
    React = require('react');
    ({ DOM } = React);
  } catch (error1) {
    ({ DOM } = window.React);
  }
}

if (DOM == null) {
  throw "Can't find DOM";
}

module.exports = DOM;
