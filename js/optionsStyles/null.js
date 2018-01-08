var DOM, createReactClass, defineOptionsStyle;

DOM = require('../reactGUI/ReactDOMFactories-shim');

createReactClass = require('../reactGUI/createReactClass-shim');

defineOptionsStyle = require('./optionsStyles').defineOptionsStyle;

defineOptionsStyle('null', createReactClass({
  displayName: 'NoOptions',
  render: function() {
    return DOM.div();
  }
}));

module.exports = {};
