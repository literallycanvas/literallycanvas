actions = require './actions'
bindEvents = require './bindEvents'
math = require './math'
{createShape, shapeToJSON, JSONToShape} = require './shapes'
Pencil = require '../tools/Pencil'
util = require './util'

INFINITE = 'infinite'

module.exports = class LiterallyCanvas

  constructor: (@containerEl, opts) ->
    bindEvents(this, @containerEl, opts.keyboardShortcuts)

    @colors =
      primary: opts.primaryColor or '#000'
      secondary: opts.secondaryColor or '#fff'
      background: opts.backgroundColor or 'transparent'

    @watermarkImage = opts.watermarkImage
    @watermarkScale = opts.watermarkScale or 1

    @backgroundCanvas = document.createElement('canvas')
    @backgroundCtx = @backgroundCanvas.getContext('2d')
    @containerEl.appendChild(@backgroundCanvas)
    @backgroundShapes = opts.backgroundShapes || []

    @canvas = document.createElement('canvas')
    @canvas.style['background-color'] = 'transparent'
    @containerEl.appendChild(@canvas)

    @buffer = document.createElement('canvas')
    @buffer.style['background-color'] = 'transparent'
    @ctx = @canvas.getContext('2d')
    @bufferCtx = @buffer.getContext('2d')

    @backingScale = util.getBackingScale(@ctx)

    @shapes = []
    @undoStack = []
    @redoStack = []

    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    # GUI immediately replaces this value, but it's initialized so you can have
    # something really simple
    @tool = new Pencil()

    @width = opts.imageSize.width or INFINITE
    @height = opts.imageSize.height or INFINITE

    # This will ensure that we are zoomed to @scale, panned to @position, and
    # that all layers are repainted.
    @setZoom(@scale)

    util.matchElementSize(
      @containerEl, [@backgroundCanvas, @canvas], @backingScale, =>
        @keepPanInImageBounds()
        @repaintAllLayers()
    )

    if @watermarkImage
      @watermarkImage.onload = => @repaintLayer('background')

  trigger: (name, data) ->
    @canvas.dispatchEvent(new CustomEvent(name, detail: data))

  on: (name, fn) ->
    wrapper = (e) -> fn e.detail
    @canvas.addEventListener(name, wrapper)
    =>
      @canvas.removeEventListener(name, wrapper)

  # actual ratio of drawing-space pixels to perceived pixels, accounting for
  # both zoom and displayPixelWidth. use this when converting between
  # drawing-space and screen-space.
  getRenderScale: -> @scale * @backingScale

  clientCoordsToDrawingCoords: (x, y) ->
    x: (x * @backingScale - @position.x) / @getRenderScale(),
    y: (y * @backingScale - @position.y) / @getRenderScale(),

  drawingCoordsToClientCoords: (x, y) ->
    x: x * @getRenderScale() + @position.x,
    y: y * @getRenderScale() + @position.y

  setImageSize: (width, height) =>
    @width = width or INFINITE
    @height = height or INFINITE
    @keepPanInImageBounds()
    @repaintAllLayers()
    @trigger('imageSizeChange', {@width, @height})

  setTool: (tool) ->
    @tool = tool
    @trigger('toolChange', {tool})

  begin: (x, y) ->
    util.requestAnimationFrame () =>
      newPos = @clientCoordsToDrawingCoords(x, y)
      @tool.begin newPos.x, newPos.y, this
      @isDragging = true
      @trigger("drawStart", {tool: @tool})

  continue: (x, y) ->
    util.requestAnimationFrame () =>
      newPos = @clientCoordsToDrawingCoords(x, y)
      if @isDragging
        @tool.continue newPos.x, newPos.y, this
        @trigger("drawContinue", {tool: @tool})

  end: (x, y) ->
    util.requestAnimationFrame () =>
      newPos = @clientCoordsToDrawingCoords(x, y)
      if @isDragging
        @tool.end newPos.x, newPos.y, this
        @isDragging = false
        @trigger("drawEnd", {tool: @tool})

  setColor: (name, color) ->
    @colors[name] = color
    switch name
      when 'background'
        @containerEl.style.backgroundColor = @colors.background
        @repaintLayer('background')
      when 'primary'
        @repaintLayer('main')
      when 'secondary'
        @repaintLayer('main')
    @trigger "#{name}ColorChange", @colors[name]
    @trigger "drawingChange" if name == 'background'

  getColor: (name) -> @colors[name]

  saveShape: (shape, triggerShapeSaveEvent=true, previousShapeId=null) ->
    unless previousShapeId
      previousShapeId = if @shapes.length \
        then @shapes[@shapes.length-1].id \
        else null
    @execute(new actions.AddShapeAction(this, shape, previousShapeId))
    if triggerShapeSaveEvent
      @trigger('shapeSave', {shape, previousShapeId})
    @trigger('drawingChange')

  pan: (x, y) ->
    # Subtract because we are moving the viewport
    @setPan(@position.x - x, @position.y - y)

  keepPanInImageBounds: ->
    renderScale = @getRenderScale()
    {x, y} = @position

    if @width != INFINITE
      if @canvas.width > @width * renderScale
        x = (@canvas.width - @width * renderScale) / 2
      else
        x = Math.max(Math.min(0, x), @canvas.width - @width * renderScale)

    if @height != INFINITE
      if @canvas.height > @height * renderScale
        y = (@canvas.height - @height * renderScale) / 2
      else
        y = Math.max(Math.min(0, y), @canvas.height - @height * renderScale)

    @position = {x, y}

  setPan: (x, y) ->
    @position = {x, y}
    @keepPanInImageBounds()
    @repaintAllLayers()
    @trigger('pan', {x: @position.x, y: @position.y})

  zoom: (factor) ->
    newScale = @scale + factor
    newScale = Math.max(newScale, 0.6)
    newScale = Math.min(newScale, 4.0)
    newScale = Math.round(newScale * 100) / 100
    @setZoom(newScale)

  setZoom: (scale) ->
    oldScale = @scale
    @scale = scale

    @position.x = math.scalePositionScalar(
      @position.x, @canvas.width, oldScale, @scale)
    @position.y = math.scalePositionScalar(
      @position.y, @canvas.height, oldScale, @scale)
    @keepPanInImageBounds()

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
        @_renderWatermark(@backgroundCtx) if @watermarkImage
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
          @ctx.fillStyle = '#ccc'
          @ctx.fillRect(0, 0, @canvas.width, @canvas.height)
          @clipped (=>
            @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
            @ctx.drawImage @buffer, 0, 0
          ), @ctx

    @trigger('repaint', {layerKey: repaintLayerKey})

  _renderWatermark: (ctx, worryAboutRetina=true) ->
    ctx.save()
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
    ctx.scale(@watermarkScale, @watermarkScale)
    ctx.scale(@backingScale, @backingScale) if worryAboutRetina
    ctx.drawImage(
      @watermarkImage, -@watermarkImage.width / 2, -@watermarkImage.height / 2)
    ctx.restore()

  # Redraws the back buffer to the screen in its current state
  # then draws the given shape translated and scaled on top of that.
  # This is used for updating a shape while it is being drawn
  # without doing a full repaint.
  # The context is restored to its original state before returning.
  drawShapeInProgress: (shape) ->
    @repaintLayer('main', false)
    @clipped (=>
      @transformed (=>
        shape.drawLatest(@ctx, @bufferCtx)
      ), @ctx, @bufferCtx
    ), @ctx, @bufferCtx

  # Draws the given shapes translated and scaled to the given context.
  # The context is restored to its original state before returning.
  draw: (shapes, ctx, retryCallback) ->
    return unless shapes.length
    drawShapes = =>
      for shape in shapes
        shape.draw(ctx, retryCallback)
    @clipped (=> @transformed(drawShapes, ctx)), ctx

  # Executes the given function after clipping the canvas to the image size.
  # The context is restored to its original state before returning.
  # This should not be called inside an @transformed block.
  clipped: (fn, contexts...) ->
    x = if @width == INFINITE then 0 else @position.x
    y = if @height == INFINITE then 0 else @position.y
    width = switch @width
      when INFINITE then @canvas.width
      else @width * @getRenderScale()
    height = switch @height
      when INFINITE then @canvas.height
      else @height * @getRenderScale()

    for ctx in contexts
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()

    fn()

    for ctx in contexts
      ctx.restore()

  # Executes the given function after translating and scaling the context.
  # The context is restored to its original state before returning.
  transformed: (fn, contexts...) ->
    for ctx in contexts
      ctx.save()
      ctx.translate @position.x, @position.y
      scale = @getRenderScale()
      ctx.scale scale, scale

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
    util.getBoundingRect(
      @shapes.map((s) -> s.getBoundingRect()),
      if @width == INFINITE then 0 else @width,
      if @height == INFINITE then 0 else @height)

  getImage: (opts={}) ->
    # {x, y, width, height}
    opts.rect ?= @getContentBounds()

    if not (opts.rect.width and opts.rect.height)
      return

    opts.scale ?= 1
    opts.scaleDownRetina ?= true
    opts.includeWatermark ?= @watermarkImage and true

    opts.scale *= @backingScale unless opts.scaleDownRetina
    @repaintLayer('main', true)

    watermarkCanvas = document.createElement('canvas')
    watermarkCanvas.width = opts.rect.width * opts.scale
    watermarkCanvas.height = opts.rect.height * opts.scale
    watermarkCtx = watermarkCanvas.getContext('2d')
    watermarkCtx.fillStyle = @colors.background
    watermarkCtx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height)

    if opts.includeWatermark
      @_renderWatermark(watermarkCtx, false)

    util.combineCanvases(
      watermarkCanvas,
      util.renderShapes(@backgroundShapes, opts.rect, opts.scale),
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

    snapshot.colors ?= @colors

    for k in ['primary', 'secondary', 'background']
      @setColor(k, snapshot.colors[k])

    @shapes = []
    for shapeRepr in snapshot.shapes
      shape = JSONToShape(shapeRepr)
      @execute(new actions.AddShapeAction(this, shape)) if shape
    @repaintAllLayers()
    @trigger('snapshotLoad')
    @trigger('drawingChange', {})

  loadSnapshotJSON: (str) ->
    @loadSnapshot(JSON.parse(str))
