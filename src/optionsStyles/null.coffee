React = require '../reactGUI/React-shim'
{defineOptionsStyle} = require './optionsStyles'


defineOptionsStyle 'null', React.createClass
  displayName: 'NoOptions'
  render: -> React.DOM.div()


module.exports = {}