class LC.Tool

  # called when the user starts dragging
  begin: (x, y, lc) ->

  # called when the user moves while dragging
  continue: (x, y, lc) ->

  # called when the user finishes dragging
  end: (x, y, lc) ->


class LC.StrokeTool extends LC.Tool

  constructor: -> @strokeWidth = 5


class LC.RectangleTool extends LC.StrokeTool

  begin: (x, y, lc) ->
    @currentShape = new LC.Rectangle(
      x, y, @strokeWidth, lc.getColor('primary'), lc.getColor('secondary'))

  continue: (x, y, lc) ->
    @currentShape.width = x - @currentShape.x
    @currentShape.height = y - @currentShape.y
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)


class LC.LineTool extends LC.StrokeTool

  begin: (x, y, lc) ->
    @currentShape = new LC.Line(
      x, y, x, y, @strokeWidth, lc.getColor('primary'))

  continue: (x, y, lc) ->
    @currentShape.x2 = x
    @currentShape.y2 = y
    lc.update(@currentShape)

  end: (x, y, lc) ->
    lc.saveShape(@currentShape)
   

class LC.Pencil extends LC.StrokeTool

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

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  constructor: () ->
    @strokeWidth = 10

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, '#000')
  makeShape: -> new LC.EraseLinePathShape(this)


class LC.Pan extends LC.Tool

  begin: (x, y, lc) -> @start = {x, y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()

  end: (x, y, lc) ->
    lc.repaint()


class LC.EyeDropper extends LC.Tool
    
  readColor: (x, y, lc) ->
    newColor = lc.getPixel(x, y)
    lc.setColor('primary', newColor or lc.getColor('background'))

  begin: (x, y, lc) ->
    @readColor(x, y, lc)

  continue: (x, y, lc) ->
    @readColor(x, y, lc)

class LC.TextTool extends LC.Tool

  constructor: (@text = '', @font = 'bold 18px sans-serif') ->

  setText:(text) ->
    @text = text

  begin:(x, y, lc) ->
    @color = lc.getColor('primary')
    @currentShape = new LC.TextShape(x, y, @text, @color, @font)

  continue:(x, y, lc) ->
    @currentShape.x = x
    @currentShape.y = y
    lc.update(@currentShape)

  end:(x, y, lc) ->
    lc.saveShape(@currentShape)

