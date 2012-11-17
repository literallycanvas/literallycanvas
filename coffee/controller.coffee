window.LC = window.LC ? {}


class LC.LiterallyCanvas

  constructor: (@canvas) ->
    @$canvas = $(@canvas)
    @ctx = @canvas.getContext('2d')
    $(@canvas).css('background-color', '#eee')
    @shapes = []
    @undoStack = []
    @redoStack = []
    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    @tool = new LC.Pencil
    @primaryColor = '#000'
    @secondaryColor = '#fff'
    @repaint()

  trigger: (name, data) ->
    @canvas.dispatchEvent new CustomEvent(name, {
      detail: data
    })

  on: (name, fn) ->
    @canvas.addEventListener name, (e) ->
      fn e.detail

  clientCoordsToDrawingCoords: (x, y) ->
    {
      x: (x - @position.x) / @scale,
      y: (y - @position.y) / @scale,
    }

  drawingCoordsToClientCoords: (x, y) ->
    {
      x: x * @scale + @position.x,
      y: y * @scale + @position.y
    }

  begin: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.begin newPos.x, newPos.y, this
    @isDragging = true

  continue: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.continue newPos.x, newPos.y, this if @isDragging

  end: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.end newPos.x, newPos.y, this if @isDragging
    @isDragging = false

  saveShape: (shape) ->
    @execute(new LC.AddShapeAction(this, shape))

  pan: (x, y) ->
    # Subtract because we are moving the viewport
    @position.x = @position.x - x
    @position.y = @position.y - y

  zoom: (factor) ->
    oldScale = @scale
    @scale = @scale + factor
    @scale = Math.max(@scale, 0.2)
    @scale = Math.min(@scale, 4.0)
    @scale = Math.round(@scale*100)/100

    @position.x = LC.scalePositionScalar(
      @position.x, @canvas.width, oldScale, @scale)
    @position.y = LC.scalePositionScalar(
      @position.y, @canvas.height, oldScale, @scale)

    @repaint()

  repaint: (currentShape = null) ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @ctx.save()
    @ctx.translate @position.x, @position.y
    @ctx.scale @scale, @scale
    _.each @shapes, (s) =>
      s.draw(@ctx)
    currentShape.draw(@ctx) if currentShape
    @ctx.restore()

  clear: ->
    @execute(new LC.ClearAction(this))
    @shapes = []
    @repaint()

  execute: (action) ->
    @undoStack.push(action)
    action.do()
    @redoStack = []

  undo: ->
    return unless @undoStack.length
    action = @undoStack.pop()
    action.undo()
    @redoStack.push(action)

  redo: ->
    return unless @redoStack.length
    action = @redoStack.pop()
    @undoStack.push(action)
    action.do()

  getPixel: (x, y) ->
    p = @drawingCoordsToClientCoords x, y
    pixel = @ctx.getImageData(p.x, p.y, 1, 1).data
    return "rgb(" + pixel[0] + "," + pixel[1] + ","  + pixel[2] + ")"


# maybe add checks to these in the future to make sure you never double-undo or
# double-redo
class LC.ClearAction

  constructor: (@lc) ->
    @oldShapes = @lc.shapes

  do: ->
    @lc.shapes = []
    @lc.repaint()

  undo: ->
    @lc.shapes = @oldShapes
    @lc.repaint()


class LC.AddShapeAction

  constructor: (@lc, @shape) ->

  do: ->
    @ix = @lc.shapes.length
    @lc.shapes.push(@shape)
    @lc.repaint()

  undo: ->
    @lc.shapes.pop(@ix)
    @lc.repaint()
