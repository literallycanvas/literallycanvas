actions = require './actions'
bindEvents = require './bindEvents'
math = require './math'
{createShape, shapeToJSON, JSONToShape} = require './shapes'
Pencil = require '../tools/Pencil'
util = require './util'

module.exports = class LiterallyCanvas

  constructor: (@containerEl, opts) ->
    bindEvents(this, @containerEl, opts.keyboardShortcuts)

    @colors =
      primary: opts.primaryColor or '#000'
      secondary: opts.secondaryColor or '#fff'
      background: opts.backgroundColor or 'transparent'

    if opts.watermarkImage
      watermarkEl = document.createElement('div')

      watermarkEl.style['background-image'] = "url(#{opts.watermarkImage.src})"
      watermarkEl.style['background-repeat'] = 'no-repeat';
      watermarkEl.style['background-position'] = 'center center';
      @containerEl.appendChild(watermarkEl)
      util.matchElementSize(@containerEl, [watermarkEl])

    @backgroundCanvas = document.createElement('canvas')
    @backgroundCtx = @backgroundCanvas.getContext('2d')
    @containerEl.appendChild(@backgroundCanvas)
    @backgroundShapes = opts.backgroundShapes || []

    @canvas = document.createElement('canvas')
    @containerEl.appendChild(@canvas)

    @buffer = document.createElement('canvas')
    @ctx = @canvas.getContext('2d')
    @bufferCtx = @buffer.getContext('2d')

    @shapes = []
    @undoStack = []
    @redoStack = []

    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    # GUI immediately replaces this value, but it's initialized so you can have
    # something really simple
    @tool = new Pencil()

    util.matchElementSize(
      @containerEl, [@backgroundCanvas], => @repaintLayer('background'))

    util.matchElementSize(
      @containerEl, [@canvas], => @repaintLayer('main'))

    @repaintLayer('background')
    @repaintLayer('main')

  trigger: (name, data) ->
    @canvas.dispatchEvent(new CustomEvent(name, detail: data))

  on: (name, fn) ->
    wrapper = (e) -> fn e.detail
    @canvas.addEventListener(name, wrapper)
    wrapper

  removeEventListener: (name, wrapper) ->
    @canvas.removeEventListener(name, wrapper)

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
    @trigger "#{name}ColorChange", @colors[name]
    switch name
      when 'background'
        @containerEl.style.backgroundColor = @colors.background
      when 'primary'
        @repaintLayer('main')
      when 'secondary'
        @repaintLayer('main')
    @trigger "drawingChange" if name == 'background'

  getColor: (name) -> @colors[name]

  saveShape: (shape) ->
    @execute(new actions.AddShapeAction(this, shape))
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

    @position.x = math.scalePositionScalar(
      @position.x, @canvas.width, oldScale, @scale)
    @position.y = math.scalePositionScalar(
      @position.y, @canvas.height, oldScale, @scale)

    @repaintAllLayers()
    @trigger('zoom', {oldScale: oldScale, newScale: @scale})

  repaintAllLayers: ->
    for key in ['background', 'main']
      @repaintLayer(key)
    null

  # Repaints the canvas.
  # If dirty is true then all saved shapes are completely redrawn,
  # otherwise the back buffer is simply copied to the screen as is.
  repaintLayer: (repaintLayerKey, dirty=(repaintLayerKey == 'main')) ->
    switch repaintLayerKey
      when 'background'
        @backgroundCtx.clearRect(
          0, 0, @backgroundCanvas.width, @backgroundCanvas.height)
        retryCallback = => @repaintLayer('background')
        @draw(@backgroundShapes, @backgroundCtx, retryCallback)
      when 'main'
        retryCallback = => @repaintLayer('main', true)
        if dirty
          @buffer.width = @canvas.width
          @buffer.height = @canvas.height
          @bufferCtx.clearRect(0, 0, @buffer.width, @buffer.height)
          @draw(@shapes, @bufferCtx, retryCallback)
        @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
        if @canvas.width > 0 and @canvas.height > 0
          @ctx.drawImage @buffer, 0, 0
    @trigger('repaint', {layerKey: repaintLayerKey})

  # Redraws the back buffer to the screen in its current state
  # then draws the given shape translated and scaled on top of that.
  # This is used for updating a shape while it is being drawn
  # without doing a full repaint.
  # The context is restored to its original state before returning.
  update: (shape) ->
    @repaintLayer('main', false)
    @transformed (=> shape.update(@ctx, @bufferCtx)), @ctx, @bufferCtx

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
  transformed: (fn, contexts...) ->
    for ctx in contexts
      ctx.save()
      ctx.translate @position.x, @position.y
      ctx.scale @scale, @scale

    fn()

    for ctx in contexts
      ctx.restore()

  clear: ->
    oldShapes = @shapes
    newShapes = []
    @execute(new actions.ClearAction(this, oldShapes, newShapes))
    @repaintLayer('main')
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

  getContentBounds: ->
    util.getBoundingRect @shapes.map((s) -> s.getBoundingRect())

  getImage: (opts={}) ->
    # Image or canvas
    opts.backgroundImage ?= null
    # {x, y, width, height}
    opts.rect ?= @getContentBounds()
    opts.scale ?= 1
    opts.includeWatermark ?= false
    @repaintLayer('main', true)

    rectArgs =
      x: opts.rect.x
      y: opts.rect.y
      width: opts.rect.width
      height: opts.rect.height
      fillColor: @colors.background
      strokeColor: 'transparent'
      strokeWidth: 0

    util.combineCanvases(
      util.renderShapes(
        [createShape('Rectangle', rectArgs)].concat(@backgroundShapes),
        opts.rect, opts.scale),
      util.renderShapes(@shapes, opts.rect, opts.scale))

  canvasForExport: ->
    @repaintAllLayers()
    util.combineCanvases(@backgroundCanvas, @canvas)

  canvasWithBackground: (backgroundImageOrCanvas) ->
    util.combineCanvases(backgroundImageOrCanvas, @canvasForExport())

  getSnapshot: -> {shapes: (shapeToJSON(shape) for shape in @shapes), @colors}
  getSnapshotJSON: -> JSON.stringify(@getSnapshot())

  loadSnapshot: (snapshot) ->
    return unless snapshot

    for k in ['primary', 'secondary', 'background']
      @setColor(k, snapshot.colors[k])

    @shapes = []
    for shapeRepr in snapshot.shapes
      shape = JSONToShape(shapeRepr)
      @execute(new actions.AddShapeAction(this, shape)) if shape
    @repaintAllLayers()
    @trigger('drawingChange', {})

  loadSnapshotJSON: (str) ->
    @loadSnapshot(JSON.parse(str))
