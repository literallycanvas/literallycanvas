React = require './React-shim'

Options = require './Options'
Picker = require './Picker'


init = (root, lc, toolNames, imageURLPrefix) ->
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

  React.renderComponent(Picker({lc, toolNames, imageURLPrefix}), pickerElement)
  React.renderComponent(Options({lc}), optionsElement)


module.exports = init