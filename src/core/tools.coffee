{createShape} = require './shapes'

tools = {}

tools.Tool = class Tool

  # called when the user starts dragging
  begin: (x, y, lc) ->

  # called when the user moves while dragging
  continue: (x, y, lc) ->

  # called when the user finishes dragging
  end: (x, y, lc) ->

  # kind of options GUI to display
  optionsStyle: null


tools.StrokeTool = class StrokeTool extends Tool

  constructor: -> @strokeWidth = 5
  optionsStyle: 'stroke-width'


tools.Rectangle = class Rectangle extends StrokeTool

  begin: (x, y, lc) ->
    @currentShape = createShape('Rectangle', {
      x, y, @strokeWidth,
      strokeColor: lc.getColor('primary'),
      fillColor: lc.getColor('secondary')})

  continue: (x, y, lc) ->
    @currentShape.width = x - @currentShape.x
    @currentShape.height = y - @currentShape.y
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)


tools.Line = class Line extends StrokeTool

  begin: (x, y, lc) ->
    @currentShape = createShape('Line', {
      x1: x, y1: y, x2: x, y2: y, @strokeWidth,
      color: lc.getColor('primary')})

  continue: (x, y, lc) ->
    @currentShape.x2 = x
    @currentShape.y2 = y
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
   

tools.Pencil = class Pencil extends StrokeTool

  begin: (x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = @makeShape()
    @currentShape.addPoint(@makePoint(x, y, lc))

  continue: (x, y, lc) ->
    @currentShape.addPoint(@makePoint(x, y, lc))
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) -> createShape('Point', {x, y, @strokeWidth, @color})
  makeShape: -> createShape('LinePath')


tools.Eraser = class Eraser extends Pencil

  constructor: () ->
    @strokeWidth = 10

  makePoint: (x, y, lc) ->
    createShape('Point', {x, y, @strokeWidth, color: '#000'})
  makeShape: -> createShape('ErasedLinePath')


tools.Pan = class Pan extends Tool

  begin: (x, y, lc) -> @start = {x, y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()

  end: (x, y, lc) ->
    lc.repaint()


tools.EyeDropper = class EyeDropper extends Tool
    
  readColor: (x, y, lc) ->
    newColor = lc.getPixel(x, y)
    lc.setColor('primary', newColor or lc.getColor('background'))

  begin: (x, y, lc) ->
    @readColor(x, y, lc)

  continue: (x, y, lc) ->
    @readColor(x, y, lc)


tools.Text = class Text extends Tool

  constructor: (@text = '', @font = 'bold 18px sans-serif') ->

  setText:(text) ->
    @text = text

  begin:(x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = createShape('Text', {x, y, @text, @color, @font})

  continue:(x, y, lc) ->
    @currentShape.x = x
    @currentShape.y = y
    lc.update(@currentShape)

  end:(x, y, lc) ->
    lc.saveShape(@currentShape)

  optionsStyle: 'font'


module.exports = tools