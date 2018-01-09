// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const DOM = require('../reactGUI/ReactDOMFactories-shim');
const createReactClass = require('../reactGUI/createReactClass-shim');
const {defineOptionsStyle} = require('./optionsStyles');


defineOptionsStyle('null', createReactClass({
  displayName: 'NoOptions',
  render() { return DOM.div(); }
})
);


module.exports = {};