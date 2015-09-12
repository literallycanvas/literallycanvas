React = require './React-shim'

createToolButton = require './createToolButton'
Options = React.createFactory require './Options'
Picker = React.createFactory require './Picker'


init = (pickerElement, optionsElement, lc, tools, imageURLPrefix) ->
  toolButtonComponents = tools.map (ToolClass) ->
    toolInstance = new ToolClass(lc)
    createToolButton
      displayName: toolInstance.name
      imageName: toolInstance.iconName
      getTool: -> toolInstance

  React.render(Picker(
    {lc, toolButtonComponents, imageURLPrefix}), pickerElement)
  React.render(Options({lc, imageURLPrefix}), optionsElement)


module.exports = init