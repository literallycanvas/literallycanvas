createToolButton = require './createToolButton'
tools = require '../core/tools'


module.exports =
  Pencil: createToolButton
    displayName: 'Pencil'
    imageName: 'pencil'
    getTool: -> new tools.Pencil()

  Eraser: createToolButton
    displayName: 'Eraser'
    imageName: 'eraser'
    getTool: -> new tools.Eraser()

  Line: createToolButton
    displayName: 'Line'
    imageName: 'line'
    getTool: -> new tools.Line()

  Rectangle: createToolButton
    displayName: 'Rectangle'
    imageName: 'rectangle'
    getTool: -> new tools.Rectangle()

  Text: createToolButton
    displayName: 'Text'
    imageName: 'text'
    getTool: -> new tools.Text()

  Pan: createToolButton
    displayName: 'Pan'
    imageName: 'pan'
    getTool: -> new tools.Pan()

  Eyedropper: createToolButton
    displayName: 'Eyedropper'
    imageName: 'eyedropper'
    getTool: -> new tools.EyeDropper()
