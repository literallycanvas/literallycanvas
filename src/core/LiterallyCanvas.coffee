actions = require './actions'
bindEvents = require './bindEvents'
math = require './math'
{createShape, shapeToJSON, JSONToShape} = require './shapes'
{renderShapeToContext} = require './canvasRenderer'
{renderShapeToSVG} = require './svgRenderer'
renderSnapshotToImage = require './renderSnapshotToImage'
renderSnapshotToSVG = require './renderSnapshotToSVG'
Pencil = require '../tools/Pencil'
util = require './util'

INFINITE = 'infinite'

module.exports = class LiterallyCanvas

  constructor: (arg1, arg2) ->
    opts = null
    containerEl = null
    if arg1 instanceof HTMLElement
      containerEl = arg1
      opts = arg2
    else
      opts = arg1

    @opts = opts or {}

    @config =
      zoomMin: opts.zoomMin or 0.2
      zoomMax: opts.zoomMax or 4.0
      zoomStep: opts.zoomStep or 0.2

    @colors =
      primary: opts.primaryColor or '#000'
      secondary: opts.secondaryColor or '#fff'
      background: opts.backgroundColor or 'transparent'

    @watermarkImage = opts.watermarkImage
    @watermarkScale = opts.watermarkScale or 1

    @backgroundCanvas = document.createElement('canvas')
    @backgroundCtx = @backgroundCanvas.getContext('2d')

    @canvas = document.createElement('canvas')
    @canvas.style['background-color'] = 'transparent'

    @buffer = document.createElement('canvas')
    @buffer.style['background-color'] = 'transparent'
    @ctx = @canvas.getContext('2d')
    @bufferCtx = @buffer.getContext('2d')

    @backingScale = util.getBackingScale(@ctx)

    @backgroundShapes = opts.backgroundShapes || []
    @_shapesInProgress = []
    @shapes = []
    @undoStack = []
    @redoStack = []

    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    # GUI immediately replaces this value, but it's initialized so you can have
    # something really simple
    @setTool(new @opts.tools[0](this))

    @width = opts.imageSize.width or INFINITE
    @height = opts.imageSize.height or INFINITE

    # This will ensure that we are zoomed to @scale, panned to @position, and
    # that all layers are repainted.
    @setZoom(@scale)

    @loadSnapshot(opts.snapshot) if opts.snapshot

    @isBound = false
    @bindToElement(containerEl) if containerEl

  bindToElement: (containerEl) ->
    if @containerEl
      console.warn("Trying to bind Literally Canvas to a DOM element more than once is unsupported.")
      return

    @containerEl = containerEl
    @_unsubscribeEvents = bindEvents(this, @containerEl, @opts.keyboardShortcuts)
    @containerEl.style['background-color'] = @colors.background
    @containerEl.appendChild(@backgroundCanvas)
    @containerEl.appendChild(@canvas)

    @isBound = true

    repaintAll = =>
        @keepPanInImageBounds()
        @repaintAllLayers()

    util.matchElementSize(
      @containerEl, [@backgroundCanvas, @canvas], @backingScale, repaintAll)

    if @watermarkImage
      @watermarkImage.onload = => @repaintLayer('background')

    @tool?.didBecomeActive(this)

    repaintAll()

  _teardown: ->
    @tool.willBecomeInactive(this)
    @_unsubscribeEvents?()
    @tool = null
    @containerEl = null
    @isBound = false

  trigger: (name, data) ->
    @canvas.dispatchEvent(new CustomEvent(name, detail: data))
    # dispatchEvent has a boolean value that doesn't mean anything to us, so
    # don't let CoffeeScript send it back
    null

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
    if @isBound
      @tool?.willBecomeInactive(this)
    @tool = tool
    @trigger('toolChange', {tool})
    if @isBound
      @tool.didBecomeActive(this)

  setShapesInProgress: (newVal) -> @_shapesInProgress = newVal

  pointerDown: (x, y) ->
    p = @clientCoordsToDrawingCoords(x, y)
    if @tool.usesSimpleAPI
      @tool.begin p.x, p.y, this
      @isDragging = true
      @trigger("drawStart", {tool: @tool})
    else
      @isDragging = true
      @trigger("lc-pointerdown", {tool: @tool, x: p.x, y: p.y, rawX: x, rawY: y})

  pointerMove: (x, y) ->
    util.requestAnimationFrame () =>
      p = @clientCoordsToDrawingCoords(x, y)
      if @tool?.usesSimpleAPI
        if @isDragging
          @tool.continue p.x, p.y, this
          @trigger("drawContinue", {tool: @tool})
      else
        if @isDragging
          @trigger("lc-pointerdrag", {tool: @tool, x: p.x, y: p.y, rawX: x, rawY: y})
        else
          @trigger("lc-pointermove", {tool: @tool, x: p.x, y: p.y, rawX: x, rawY: y})

  pointerUp: (x, y) ->
    p = @clientCoordsToDrawingCoords(x, y)
    if @tool.usesSimpleAPI
      if @isDragging
        @tool.end p.x, p.y, this
        @isDragging = false
        @trigger("drawEnd", {tool: @tool})
    else
      @isDragging = false
      @trigger("lc-pointerup", {tool: @tool, x: p.x, y: p.y, rawX: x, rawY: y})

  setColor: (name, color) ->
    @colors[name] = color
    return unless @isBound
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
    newScale = Math.max(newScale, @config.zoomMin)
    newScale = Math.min(newScale, @config.zoomMax)
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

  setWatermarkImage: (newImage) ->
    @watermarkImage = newImage
    util.addImageOnload newImage, => @repaintLayer('background')
    @repaintLayer('background') if newImage.width

  repaintAllLayers: ->
    for key in ['background', 'main']
      @repaintLayer(key)
    null

  # Repaints the canvas.
  # If dirty is true then all saved shapes are completely redrawn,
  # otherwise the back buffer is simply copied to the screen as is.
  repaintLayer: (repaintLayerKey, dirty=(repaintLayerKey == 'main')) ->
    return unless @isBound
    switch repaintLayerKey
      when 'background'
        @backgroundCtx.clearRect(
          0, 0, @backgroundCanvas.width, @backgroundCanvas.height)
        retryCallback = => @repaintLayer('background')
        if @watermarkImage
          @_renderWatermark(@backgroundCtx, true, retryCallback)
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

          @clipped (=>
            @transformed (=>
              for shape in @_shapesInProgress
                renderShapeToContext(
                  @ctx, shape, {@bufferCtx, shouldOnlyDrawLatest: true})
            ), @ctx, @bufferCtx
          ), @ctx, @bufferCtx

    @trigger('repaint', {layerKey: repaintLayerKey})

  _renderWatermark: (ctx, worryAboutRetina=true, retryCallback) ->
    unless @watermarkImage.width
      @watermarkImage.onload = retryCallback
      return

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
        renderShapeToContext(
          @ctx, shape, {@bufferCtx, shouldOnlyDrawLatest: true})
      ), @ctx, @bufferCtx
    ), @ctx, @bufferCtx

  # Draws the given shapes translated and scaled to the given context.
  # The context is restored to its original state before returning.
  draw: (shapes, ctx, retryCallback) ->
    return unless shapes.length
    drawShapes = =>
      for shape in shapes
        renderShapeToContext(ctx, shape, {retryCallback})
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
      ctx.translate Math.floor(@position.x), Math.floor(@position.y)
      scale = @getRenderScale()
      ctx.scale scale, scale

    fn()

    for ctx in contexts
      ctx.restore()

  clear: (triggerClearEvent=true) ->
    oldShapes = @shapes
    newShapes = []
    @setShapesInProgress []
    @execute(new actions.ClearAction(this, oldShapes, newShapes))
    @repaintLayer('main')
    if triggerClearEvent
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
      (@shapes.concat(@backgroundShapes)).map((s) -> s.getBoundingRect()),
      if @width == INFINITE then 0 else @width,
      if @height == INFINITE then 0 else @height)

  getDefaultImageRect: (
      explicitSize={width: 0, height: 0},
      margin={top: 0, right: 0, bottom: 0, left: 0}) ->
    return util.getDefaultImageRect(
      (s.getBoundingRect(@ctx) for s in @shapes.concat(@backgroundShapes)),
      explicitSize,
      margin )

  getImage: (opts={}) ->
    opts.includeWatermark ?= true
    opts.scaleDownRetina ?= true
    opts.scale ?= 1
    opts.scale *= @backingScale unless opts.scaleDownRetina

    if opts.includeWatermark
      opts.watermarkImage = @watermarkImage
      opts.watermarkScale = @watermarkScale
      opts.watermarkScale *= @backingScale unless opts.scaleDownRetina
    return renderSnapshotToImage(@getSnapshot(), opts)

  canvasForExport: ->
    @repaintAllLayers()
    util.combineCanvases(@backgroundCanvas, @canvas)

  canvasWithBackground: (backgroundImageOrCanvas) ->
    util.combineCanvases(backgroundImageOrCanvas, @canvasForExport())

  getSnapshot: (keys=null) ->
    keys ?= ['shapes', 'imageSize', 'colors', 'position', 'scale', 'backgroundShapes']
    snapshot = {}
    for k in ['colors', 'position', 'scale']
      snapshot[k] = this[k] if k in keys
    if 'shapes' in keys
      snapshot.shapes = (shapeToJSON(shape) for shape in @shapes)
    if 'backgroundShapes' in keys
      snapshot.backgroundShapes = (shapeToJSON(shape) for shape in @backgroundShapes)
    if 'imageSize' in keys
      snapshot.imageSize = {@width, @height}

    snapshot
  getSnapshotJSON: ->
    console.warn("lc.getSnapshotJSON() is deprecated. use JSON.stringify(lc.getSnapshot()) instead.")
    JSON.stringify(@getSnapshot())

  getSVGString: (opts={}) -> renderSnapshotToSVG(@getSnapshot(), opts)

  loadSnapshot: (snapshot) ->
    return unless snapshot

    if snapshot.colors
      for k in ['primary', 'secondary', 'background']
        @setColor(k, snapshot.colors[k])

    if snapshot.shapes
      @shapes = []
      for shapeRepr in snapshot.shapes
        shape = JSONToShape(shapeRepr)
        @execute(new actions.AddShapeAction(this, shape)) if shape

    if snapshot.backgroundShapes
      @backgroundShapes = (JSONToShape(s) for s in snapshot.backgroundShapes)

    if snapshot.imageSize
      @width = snapshot.imageSize.width
      @height = snapshot.imageSize.height

    @position = snapshot.position if snapshot.position
    @scale = snapshot.scale if snapshot.scale

    @repaintAllLayers()
    @trigger('snapshotLoad')
    @trigger('drawingChange', {})

  loadSnapshotJSON: (str) ->
    console.warn("lc.loadSnapshotJSON() is deprecated. use lc.loadSnapshot(JSON.parse(snapshot)) instead.")
    @loadSnapshot(JSON.parse(str))
