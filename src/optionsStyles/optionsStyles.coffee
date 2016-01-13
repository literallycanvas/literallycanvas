React = require '../reactGUI/React-shim'

optionsStyles = {}

defineOptionsStyle = (name, style) ->
  optionsStyles[name] = React.createFactory(style)

module.exports = {optionsStyles, defineOptionsStyle}