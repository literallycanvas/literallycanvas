window.LC = window.LC ? {}


class LC.LiterallyCanvas

  constructor: (@canvas, @opts) ->
    @$canvas = $(@canvas)

    LC.bindEvents(this, @canvas, @opts.keyboardShortcuts)

    @colors =
      primary: @opts.primaryColor or '#000'
      secondary: @opts.secondaryColor or '#fff'
      background: @opts.backgroundColor or 'transparent'
    $(@canvas).css('background-color', @colors.background)

    @watermarkImage = @opts.watermarkImage
    if @watermarkImgae and not @watermarkImage.complete
      @watermarkImage.onload = => @repaint(true, false)

    @buffer = $('<canvas>').get(0)
    @ctx = @canvas.getContext('2d')
    @bufferCtx = @buffer.getContext('2d')

    @shapes = []
    @undoStack = []
    @redoStack = []

    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    @tool = undefined

    if @opts.preserveCanvasContents
      backgroundImage = new Image()
      backgroundImage.src = @canvas.toDataURL()
      backgroundImage.onload = => @repaint()
      @saveShape(new LC.Image(0, 0, backgroundImage, true))

    @repaint()

  updateSize: =>
    @$canvas.attr('width', @$canvas.width())
    @$canvas.attr('height', @$canvas.height())
    @repaint()

  trigger: (name, data) ->
    @canvas.dispatchEvent(new CustomEvent(name, detail: data))

  on: (name, fn) ->
    @canvas.addEventListener name, (e) ->
      fn e.detail

  clientCoordsToDrawingCoords: (x, y) ->
    x: (x - @position.x) / @scale,
    y: (y - @position.y) / @scale,

  drawingCoordsToClientCoords: (x, y) ->
    x: x * @scale + @position.x,
    y: y * @scale + @position.y

  setTool: (tool) ->
    @tool = tool
    @trigger('toolChange', {tool})

  begin: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.begin newPos.x, newPos.y, this
    @isDragging = true
    @trigger("drawingStart", {tool: @tool})

  continue: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    if @isDragging
      @tool.continue newPos.x, newPos.y, this
      @trigger("drawingContinue", {tool: @tool})

  end: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    if @isDragging
      @tool.end newPos.x, newPos.y, this
      @isDragging = false
      @trigger("drawingEnd", {tool: @tool})

  setColor: (name, color) ->
    @colors[name] = color
    $(@canvas).css('background-color', @colors.background)
    @trigger "#{name}ColorChange", @colors[name]
    @repaint()

  getColor: (name) -> @colors[name]

  saveShape: (shape) ->
    @execute(new LC.AddShapeAction(this, shape))
    @trigger('saveShape', {shape: shape})

  pan: (x, y) ->
    # Subtract because we are moving the viewport
    @position.x = @position.x - x
    @position.y = @position.y - y
    @trigger('pan', {x: @position.x, y: @position.y})

  zoom: (factor) ->
    oldScale = @scale
    @scale = @scale + factor
    @scale = Math.max(@scale, 0.6)
    @scale = Math.min(@scale, 4.0)
    @scale = Math.round(@scale * 100) / 100

    @position.x = LC.scalePositionScalar(
      @position.x, @canvas.width, oldScale, @scale)
    @position.y = LC.scalePositionScalar(
      @position.y, @canvas.height, oldScale, @scale)

    @repaint()
    @trigger('zoom', {oldScale: oldScale, newScale: @scale})

  # Repaints the canvas.
  # If dirty is true then all saved shapes are completely redrawn,
  # otherwise the back buffer is simply copied to the screen as is.
  # If drawBackground is true, the background is rendered as a solid
  # color, otherwise it is left transparent.
  repaint: (dirty = true, drawBackground = false) ->
    if dirty
      @buffer.width = @canvas.width
      @buffer.height = @canvas.height
      @bufferCtx.clearRect(0, 0, @buffer.width, @buffer.height)
      if drawBackground
        @bufferCtx.fillStyle = @colors.background
        @bufferCtx.fillRect(0, 0, @buffer.width, @buffer.height)
      if @watermarkImage
        @bufferCtx.drawImage(
          @watermarkImage,
          @canvas.width / 2 - @watermarkImage.width / 2,
          @canvas.height / 2 - @watermarkImage.height / 2,
        )
      @draw @shapes, @bufferCtx
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    if @canvas.width > 0 and @canvas.height > 0
      @ctx.drawImage @buffer, 0, 0
    @trigger('repaint', null)

  # Redraws the back buffer to the screen in its current state
  # then draws the given shape translated and scaled on top of that.
  # This is used for updating a shape while it is being drawn
  # without doing a full repaint.
  # The context is restored to its original state before returning.
  update: (shape) ->
    @repaint false
    @transformed =>
      shape.update(@ctx)
    , @ctx

  # Draws the given shapes translated and scaled to the given context.
  # The context is restored to its original state before returning.
  draw: (shapes, ctx) ->
    drawShapes = ->
      for shape in shapes
        shape.draw(ctx)
    @transformed(drawShapes, ctx)

  # Executes the given function after translating and scaling the context.
  # The context is restored to its original state before returning.
  transformed: (fn, ctx) ->
    ctx.save()
    ctx.translate @position.x, @position.y
    ctx.scale @scale, @scale
    fn()
    ctx.restore()

  clear: ->
    oldShapes = @shapes
    newShapes = (s for s in @shapes when s.locked)
    @execute(new LC.ClearAction(this, oldShapes, newShapes))
    @repaint()
    @trigger('clear', null)

  execute: (action) ->
    @undoStack.push(action)
    action.do()
    @redoStack = []

  undo: ->
    return unless @undoStack.length
    action = @undoStack.pop()
    action.undo()
    @redoStack.push(action)
    @trigger('undo', {action})

  redo: ->
    return unless @redoStack.length
    action = @redoStack.pop()
    @undoStack.push(action)
    action.do()
    @trigger('redo', {action})

  getPixel: (x, y) ->
    p = @drawingCoordsToClientCoords x, y
    pixel = @ctx.getImageData(p.x, p.y, 1, 1).data
    if pixel[3]
      "rgb(#{pixel[0]}, #{pixel[1]}, #{pixel[2]})"
    else
      null

  canvasForExport: ->
    @repaint(true, true)
    @canvas


# maybe add checks to these in the future to make sure you never double-undo or
# double-redo
class LC.ClearAction

  constructor: (@lc, @oldShapes, @newShapes) ->

  do: ->
    @lc.shapes = @newShapes
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
