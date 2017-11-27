DOM = require '../reactGUI/ReactDOMFactories-shim'
createReactClass = require '../reactGUI/createReactClass-shim'
{defineOptionsStyle} = require './optionsStyles'


defineOptionsStyle 'null', createReactClass
  displayName: 'NoOptions'
  render: -> DOM.div()


module.exports = {}