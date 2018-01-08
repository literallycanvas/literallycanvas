var DOM, React;

try {
  DOM = require('react-dom-factories');
} catch (error) {
  DOM = window.ReactDOMFactories;
}

if (DOM == null) {
  try {
    React = require('react');
    DOM = React.DOM;
  } catch (error) {
    DOM = window.React.DOM;
  }
}

if (DOM == null) {
  throw "Can't find DOM";
}

module.exports = DOM;
