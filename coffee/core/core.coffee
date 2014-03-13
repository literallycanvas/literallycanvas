window.LC = window.LC ? {}


class LC.LiterallyCanvas

  constructor: (@canvas, @opts) ->
    LC.bindEvents(this, @canvas, @opts.keyboardShortcuts)

    @colors =
      primary: @opts.primaryColor or '#000'
      secondary: @opts.secondaryColor or '#fff'
      background: @opts.backgroundColor or 'transparent'
    @canvas.style.backgroundColor = @colors.background

    @watermarkImage = @opts.watermarkImage
    if @watermarkImage and not @watermarkImage.complete
      @watermarkImage.onload = => @repaint(true, false)

    @buffer = document.createElement('canvas')
    @ctx = @canvas.getContext('2d')
    @bufferCtx = @buffer.getContext('2d')

    @backgroundShapes = []
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
      @backgroundShapes.push(new LC.ImageShape(0, 0, backgroundImage))

    @backgroundShapes = @backgroundShapes.concat(@opts.backgroundShapes or [])

    if @opts.sizeToContainer
      LC.util.sizeToContainer(@canvas, => @repaint())

    @repaint()

  updateSize: =>
    @canvas.setAttribute('width', @canvas.clientWidth)
    @canvas.setAttribute('height', @canvas.clientHeight)
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
    @trigger("drawStart", {tool: @tool})

  continue: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    if @isDragging
      @tool.continue newPos.x, newPos.y, this
      @trigger("drawContinue", {tool: @tool})

  end: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    if @isDragging
      @tool.end newPos.x, newPos.y, this
      @isDragging = false
      @trigger("drawEnd", {tool: @tool})

  setColor: (name, color) ->
    @colors[name] = color
    @canvas.style.backgroundColor = @colors.background
    @trigger "#{name}ColorChange", @colors[name]
    @repaint()

  getColor: (name) -> @colors[name]

  saveShape: (shape) ->
    @execute(new LC.AddShapeAction(this, shape))
    @trigger('shapeSave', {shape: shape})
    @trigger('drawingChange', {shape: shape})

  numShapes: -> @shapes.length

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
    retryCallback = => @repaint(true)
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
      @draw(@backgroundShapes, @bufferCtx, retryCallback)
      @draw(@shapes, @bufferCtx, retryCallback)
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
    @repaint(false)
    @transformed =>
      shape.update(@ctx)
    , @ctx

  # Draws the given shapes translated and scaled to the given context.
  # The context is restored to its original state before returning.
  draw: (shapes, ctx, retryCallback) ->
    return unless shapes.length
    drawShapes = =>
      for shape in shapes
        shape.draw(ctx, retryCallback)
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
    newShapes = []
    @execute(new LC.ClearAction(this, oldShapes, newShapes))
    @repaint()
    @trigger('clear', null)
    @trigger('drawingChange', {})

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
    @trigger('drawingChange', {})

  redo: ->
    return unless @redoStack.length
    action = @redoStack.pop()
    @undoStack.push(action)
    action.do()
    @trigger('redo', {action})
    @trigger('drawingChange', {})

  canUndo: -> !!@undoStack.length
  canRedo: -> !!@redoStack.length

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

  canvasWithBackground: (backgroundImageOrCanvas) ->
    @repaint(true, true)
    LC.util.combineCanvases(backgroundImageOrCanvas, @canvasForExport())

  getSnapshot: -> {shapes: (shape.toJSON() for shape in @shapes), @colors}
  getSnapshotJSON: -> JSON.stringify(@getSnapshot())

  loadSnapshot: (snapshot) ->
    return unless snapshot

    for k in ['primary', 'secondary', 'background']
      @setColor(k, snapshot.colors[k])

    @shapes = []
    for shapeRepr in snapshot.shapes
      if shapeRepr.className of LC
        shape = LC[shapeRepr.className].fromJSON(this, shapeRepr.data)
        if shape
          @execute(new LC.AddShapeAction(this, shape))
    @repaint(true)

  loadSnapshotJSON: (str) ->
    @loadSnapshot(JSON.parse(str))
    @repaint(true)


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
