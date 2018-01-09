util = require './util'
TextRenderer = require './TextRenderer'
lineEndCapShapes = require './lineEndCapShapes'
{defineCanvasRenderer, renderShapeToContext} = require './canvasRenderer'
{defineSVGRenderer, renderShapeToSVG} = require './svgRenderer'

shapes = {}


defineShape = (name, props) ->
  # improve Chrome JIT perf by not using arguments object
  Shape = (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) ->
    props.constructor.call(this, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    this
  Shape.prototype.className = name
  Shape.fromJSON = props.fromJSON

  # support old style of defining canvas drawing methods on shapes
  if props.draw
    legacyDrawFunc = props.draw
    legacyDrawLatestFunc = props.draw or (ctx, bufferCtx, retryCallback) ->
      @draw(ctx, bufferCtx, retryCallback)
    drawFunc = (ctx, shape, retryCallback) ->
      legacyDrawFunc.call(shape, ctx, retryCallback)
    drawLatestFunc = (ctx, bufferCtx, shape, retryCallback) ->
      legacyDrawLatestFunc.call(shape, ctx, bufferCtx, retryCallback)
    delete props.draw
    delete props.drawLatest if props.drawLatest

    defineCanvasRenderer(name, drawFunc, drawLatestFunc)

  # support old style of defining SVG drawing methods on shapes
  if props.toSVG
    legacySVGFunc = props.toSVG
    svgFunc = (shape) -> legacySVGFunc.call(shape)
    delete props.toSVG
    defineSVGRenderer(name, svgFunc)

  Shape.prototype.draw = (ctx, retryCallback) ->
    renderShapeToContext(ctx, this, {retryCallback})
  Shape.prototype.drawLatest = (ctx, bufferCtx, retryCallback) ->
    renderShapeToContext(
      ctx, this, {retryCallback, bufferCtx, shouldOnlyDrawLatest: true})
  Shape.prototype.toSVG = ->
    renderShapeToSVG(this)

  for k of props
    if k != 'fromJSON'
      Shape.prototype[k] = props[k]

  shapes[name] = Shape
  Shape


# improve Chrome JIT perf by not using arguments object
createShape = (name, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) ->
  s = new shapes[name](a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
  s.id = util.getGUID()
  s


JSONToShape = ({className, data, id}) ->
  if className of shapes
    shape = shapes[className].fromJSON(data)
    if shape
      shape.id = id if id
      return shape
    else
      console.log 'Unreadable shape:', className, data
      return null
  else
    console.log "Unknown shape:", className, data
    return null


shapeToJSON = (shape) ->
  {className: shape.className, data: shape.toJSON(), id: shape.id}


# this fn depends on Point, but LinePathShape depends on it, so it can't be
# moved out of this file yet.
bspline = (points, order) ->
  if not order
    return points
  return bspline(_dual(_dual(_refine(points))), order - 1)

_refine = (points) ->
  points = [points[0]].concat(points).concat(util.last(points))
  refined = []

  index = 0
  for point in points
    refined[index * 2] = point
    refined[index * 2 + 1] = _mid point, points[index + 1] if points[index + 1]
    index += 1

  return refined

_dual = (points) ->
  dualed = []

  index = 0
  for point in points
    dualed[index] = _mid point, points[index + 1] if points[index + 1]
    index += 1

  return dualed

_mid = (a, b) ->
  createShape('Point', {
    x: a.x + ((b.x - a.x) / 2),
    y: a.y + ((b.y - a.y) / 2),
    size: a.size + ((b.size - a.size) / 2),
    color: a.color
  })


defineShape 'Image',
  # TODO: allow resizing/filling
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @scale = args.scale or 1
    @image = args.image or null
  getBoundingRect: ->
    {@x, @y, width: @image.width * @scale, height: @image.height * @scale}
  toJSON: -> {@x, @y, imageSrc: @image.src, imageObject: @image, @scale}
  fromJSON: (data) ->
    img = null
    if data.imageObject?.width
      img = data.imageObject
    else
      img = new Image()
      img.src = data.imageSrc
    createShape('Image', {x: data.x, y: data.y, image: img, scale: data.scale})
  move: ( moveInfo={} ) ->
    @x = @x - moveInfo.xDiff
    @y = @y - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    @x = upperLeft.x
    @y = upperLeft.y


defineShape 'Rectangle',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @width = args.width or 0
    @height = args.height or 0
    @strokeWidth = args.strokeWidth or 1
    @strokeColor = args.strokeColor or 'black'
    @fillColor = args.fillColor or 'transparent'

  getBoundingRect: -> {
    x: @x - @strokeWidth / 2,
    y: @y - @strokeWidth / 2,
    width: @width + @strokeWidth,
    height: @height + @strokeWidth,
  }
  toJSON: -> {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}
  fromJSON: (data) -> createShape('Rectangle', data)
  move: ( moveInfo={} ) ->
    @x = @x - moveInfo.xDiff
    @y = @y - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    @x = upperLeft.x
    @y = upperLeft.y


# this is pretty similar to the Rectangle shape. maybe consolidate somehow.
defineShape 'Ellipse',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @width = args.width or 0
    @height = args.height or 0
    @strokeWidth = args.strokeWidth or 1
    @strokeColor = args.strokeColor or 'black'
    @fillColor = args.fillColor or 'transparent'

  getBoundingRect: -> {
    x: @x - @strokeWidth / 2,
    y: @y - @strokeWidth / 2,
    width: @width + @strokeWidth,
    height: @height + @strokeWidth,
  }
  toJSON: -> {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}
  fromJSON: (data) -> createShape('Ellipse', data)
  move: ( moveInfo={} ) ->
    @x = @x - moveInfo.xDiff
    @y = @y - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    @x = upperLeft.x
    @y = upperLeft.y


defineShape 'Line',
  constructor: (args={}) ->
    @x1 = args.x1 or 0
    @y1 = args.y1 or 0
    @x2 = args.x2 or 0
    @y2 = args.y2 or 0
    @strokeWidth = args.strokeWidth or 1
    @color = args.color or 'black'
    @capStyle = args.capStyle or 'round'
    @endCapShapes = args.endCapShapes or [null, null]
    @dash = args.dash or null

  getBoundingRect: -> {
    x: Math.min(@x1, @x2) - @strokeWidth / 2,
    y: Math.min(@y1, @y2) - @strokeWidth / 2,
    width: Math.abs(@x2 - @x1) + @strokeWidth / 2,
    height: Math.abs(@y2 - @y1) + @strokeWidth / 2,
  }
  toJSON: ->
    {@x1, @y1, @x2, @y2, @strokeWidth, @color, @capStyle, @dash, @endCapShapes}
  fromJSON: (data) -> createShape('Line', data)
  move: ( moveInfo={} ) ->
    @x1 = @x1 - moveInfo.xDiff
    @y1 = @y1 - moveInfo.yDiff
    @x2 = @x2 - moveInfo.xDiff
    @y2 = @y2 - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    br = @getBoundingRect()
    xDiff = br.x - upperLeft.x
    yDiff = br.y - upperLeft.y
    @move({ xDiff, yDiff })


# returns false if no points because there are no points to share style
_doAllPointsShareStyle = (points) ->
  return false unless points.length
  size = points[0].size
  color = points[0].color
  for point in points
    unless point.size == size and point.color == color
      console.log size, color, point.size, point.color
    return false unless point.size == size and point.color == color
  return true


_createLinePathFromData = (shapeName, data) ->
  points = null
  if data.points
    points = (JSONToShape(pointData) for pointData in data.points)
  else if data.pointCoordinatePairs
    points = (JSONToShape({
      className: 'Point',
      data: {
        x: x, y: y, size: data.pointSize, color: data.pointColor
        smooth: data.smooth
      }
    }) for [x, y] in data.pointCoordinatePairs)

  smoothedPoints = null
  if data.smoothedPointCoordinatePairs
    smoothedPoints = (JSONToShape({
      className: 'Point',
      data: {
        x: x, y: y, size: data.pointSize, color: data.pointColor
        smooth: data.smooth
      }
    }) for [x, y] in data.smoothedPointCoordinatePairs)

  return null unless points[0]
  createShape(shapeName, {
    points, smoothedPoints,
    order: data.order, tailSize: data.tailSize, smooth: data.smooth
  })


linePathFuncs =
  constructor: (args={}) ->
    points = args.points or []
    @order = args.order or 3
    @tailSize = args.tailSize or 3
    @smooth = if 'smooth' of args then args.smooth else true

    # The number of smoothed points generated for each point added
    @segmentSize = Math.pow(2, @order)

    # The number of points used to calculate the bspline to the newest point
    @sampleSize = @tailSize + 1

    if args.smoothedPoints
      @points = args.points
      @smoothedPoints = args.smoothedPoints
    else
      @points = []
      for point in points
        @addPoint(point)

  getBoundingRect: ->
    util.getBoundingRect @points.map (p) -> {
      x: p.x - p.size / 2,
      y: p.y - p.size / 2,
      width: p.size,
      height: p.size,
    }

  toJSON: ->
    if _doAllPointsShareStyle(@points)
      {
        @order, @tailSize, @smooth,
        pointCoordinatePairs: ([point.x, point.y] for point in @points),
        smoothedPointCoordinatePairs: (
          [point.x, point.y] for point in @smoothedPoints),
        pointSize: @points[0].size,
        pointColor: @points[0].color
      }
    else
      {@order, @tailSize, @smooth, points: (shapeToJSON(p) for p in @points)}

  fromJSON: (data) -> _createLinePathFromData('LinePath', data)

  addPoint: (point) ->
    @points.push(point)

    if !@smooth
      @smoothedPoints = @points
      return

    if not @smoothedPoints or @points.length < @sampleSize
      @smoothedPoints = bspline(@points, @order)
    else
      @tail = util.last(
        bspline(util.last(@points, @sampleSize), @order),
                   @segmentSize * @tailSize)

      # Remove the last @tailSize - 1 segments from @smoothedPoints
      # then concat the tail. This is done because smoothed points
      # close to the end of the path will change as new points are
      # added.
      @smoothedPoints = @smoothedPoints.slice(
        0, @smoothedPoints.length - @segmentSize * (@tailSize - 1)
      ).concat(@tail)

  move: ( moveInfo={} ) ->
    if !@smooth
      pts = @points
    else
      pts = @smoothedPoints

    for pt in pts
      pt.move(moveInfo)

    @points = @smoothedPoints

  setUpperLeft: (upperLeft={}) ->
    br = @getBoundingRect()
    xDiff = br.x - upperLeft.x
    yDiff = br.y - upperLeft.y
    @move({ xDiff, yDiff })

LinePath = defineShape 'LinePath', linePathFuncs


defineShape 'ErasedLinePath',
  constructor: linePathFuncs.constructor
  toJSON: linePathFuncs.toJSON
  addPoint: linePathFuncs.addPoint
  getBoundingRect: linePathFuncs.getBoundingRect

  fromJSON: (data) -> _createLinePathFromData('ErasedLinePath', data)


# this is currently just used for LinePath/ErasedLinePath internal storage.
defineShape 'Point',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @size = args.size or 0
    @color = args.color or ''
  getBoundingRect: ->
    {x: @x - @size / 2, y: @y - @size / 2, width: @size, height: @size}
  toJSON: -> {@x, @y, @size, @color}
  fromJSON: (data) -> createShape('Point', data)
  move: ( moveInfo={} ) ->
    @x = @x - moveInfo.xDiff
    @y = @y - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    @x = upperLeft.x
    @y = upperLeft.y


defineShape 'Polygon',
  constructor: (args={}) ->
    @points = args.points
    @fillColor = args.fillColor or 'white'
    @strokeColor = args.strokeColor or 'black'
    @strokeWidth = args.strokeWidth
    @dash = args.dash or null

    args.isClosed ?= true
    @isClosed = args.isClosed

    # ignore point values
    for point in @points
      point.color = @strokeColor
      point.size = @strokeWidth

  addPoint: (x, y) ->
    @points.push LC.createShape('Point', {x, y})

  getBoundingRect: ->
    return util.getBoundingRect(@points.map((p) -> p.getBoundingRect()))

  toJSON: ->
    {
      @strokeWidth, @fillColor, @strokeColor, @dash, @isClosed
      pointCoordinatePairs: @points.map (p) -> [p.x, p.y]
    }
  fromJSON: (data) ->
    data.points = data.pointCoordinatePairs.map ([x, y]) ->
      createShape('Point', {
        x, y, size: data.strokeWidth, color: data.strokeColor
      })
    createShape('Polygon', data)

  move: ( moveInfo={} ) ->
    for pt in @points
      pt.move(moveInfo)

  setUpperLeft: (upperLeft={}) ->
    br = @getBoundingRect()
    xDiff = br.x - upperLeft.x
    yDiff = br.y - upperLeft.y
    @move({ xDiff, yDiff })


defineShape 'Text',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @v = args.v or 0  # version (<1 needs position repaired)
    @text = args.text or ''
    @color = args.color or 'black'
    @font  = args.font or '18px sans-serif'
    @forcedWidth = args.forcedWidth or null
    @forcedHeight = args.forcedHeight or null

  _makeRenderer: (ctx) ->
    ctx.lineHeight = 1.2
    @renderer = new TextRenderer(
      ctx, @text, @font, @forcedWidth, @forcedHeight)

    if @v < 1
      console.log 'repairing baseline'
      @v = 1
      @x -= @renderer.metrics.bounds.minx
      @y -= @renderer.metrics.leading - @renderer.metrics.descent

  setText: (text) ->
    @text = text
    @renderer = null

  setFont: (font) ->
    @font = font
    @renderer = null

  setPosition: (x, y) ->
    @x = x
    @y = y

  setSize: (forcedWidth, forcedHeight) ->
    @forcedWidth = Math.max(forcedWidth, 0)
    @forcedHeight = Math.max(forcedHeight, 0)
    @renderer = null

  enforceMaxBoundingRect: (lc) ->
    br = @getBoundingRect(lc.ctx)
    lcBoundingRect = {
      x: -lc.position.x / lc.scale,
      y: -lc.position.y / lc.scale,
      width: lc.canvas.width / lc.scale,
      height: lc.canvas.height / lc.scale
    }
    # really just enforce max width
    if br.x + br.width > lcBoundingRect.x + lcBoundingRect.width
      dx = br.x - lcBoundingRect.x
      @forcedWidth = lcBoundingRect.width - dx - 10
      @renderer = null

  getBoundingRect: (ctx, isEditing=false) ->
    # if isEditing == true, add X padding to account for carat
    unless @renderer
      if ctx
        @_makeRenderer(ctx)
      else
        throw "Must pass ctx if text hasn't been rendered yet"
    {
      x: Math.floor(@x), y: Math.floor(@y),
      width: Math.ceil(@renderer.getWidth(true)),
      height: Math.ceil(@renderer.getHeight())
    }
  toJSON: -> {@x, @y, @text, @color, @font, @forcedWidth, @forcedHeight, @v}
  fromJSON: (data) -> createShape('Text', data)
  move: ( moveInfo={} ) ->
    @x = @x - moveInfo.xDiff
    @y = @y - moveInfo.yDiff
  setUpperLeft: (upperLeft={}) ->
    @x = upperLeft.x
    @y = upperLeft.y


defineShape 'SelectionBox',
  constructor: (args={}) ->
    @shape = args.shape
    if args.handleSize?
      @handleSize = args.handleSize
    else
      @handleSize = 10
    @margin = 4
    @backgroundColor = args.backgroundColor or null
    @_br = @shape.getBoundingRect(args.ctx)

  toJSON: -> {shape: shapeToJSON(@shape), @backgroundColor}
  fromJSON: ({shape, handleSize, margin, backgroundColor}) ->
    createShape('SelectionBox', {shape: JSONToShape(shape), backgroundColor})

  getTopLeftHandleRect: ->
    {
      x: @_br.x - @handleSize - @margin, y: @_br.y - @handleSize - @margin,
      width: @handleSize, height: @handleSize
    }

  getBottomLeftHandleRect: ->
    {
      x: @_br.x - @handleSize - @margin, y: @_br.y + @_br.height + @margin,
      width: @handleSize, height: @handleSize
    }

  getTopRightHandleRect: ->
    {
      x: @_br.x + @_br.width + @margin, y: @_br.y - @handleSize - @margin,
      width: @handleSize, height: @handleSize
    }

  getBottomRightHandleRect: ->
    {
      x: @_br.x + @_br.width + @margin, y: @_br.y + @_br.height + @margin,
      width: @handleSize, height: @handleSize
    }

  getBoundingRect: ->
    {
      x: @_br.x - @margin, y: @_br.y - @margin,
      width: @_br.width + @margin * 2, height: @_br.height + @margin * 2
    }


module.exports = {defineShape, createShape, JSONToShape, shapeToJSON}
