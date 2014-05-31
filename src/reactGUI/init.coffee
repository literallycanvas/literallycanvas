React = require './React-shim'

createToolButton = require './createToolButton'
Options = require './Options'
Picker = require './Picker'


init = (root, lc, tools, imageURLPrefix) ->
  canvasElement = null
  for child in root.children
    if child.tagName.toLocaleLowerCase() == 'canvas'
      canvasElement = child

  unless canvasElement
    canvasElement = document.createElement('canvas')
    root.appendChild(canvasElement)

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'
  root.insertBefore(pickerElement, canvasElement)

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'
  root.appendChild(optionsElement)

  toolButtonComponents = tools.map (ToolClass) ->
    toolInstance = new ToolClass()
    createToolButton
      displayName: toolInstance.name
      imageName: toolInstance.iconName
      getTool: -> toolInstance

  React.renderComponent(Picker(
    {lc, toolButtonComponents, imageURLPrefix}), pickerElement)
  React.renderComponent(Options({lc}), optionsElement)


module.exports = init