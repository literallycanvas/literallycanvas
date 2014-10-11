util = require './util'
lineEndCapShapes = require '../core/lineEndCapShapes.coffee'

shapes = {}


defineShape = (name, props) ->
  Shape = (args...) ->
    props.constructor.call(this, args...)
    this
  Shape.prototype.className = name
  Shape.fromJSON = props.fromJSON
  Shape.prototype.drawLatest = (ctx, bufferCtx) -> @draw(ctx, bufferCtx)

  for k of props
    if k != 'fromJSON'
      Shape.prototype[k] = props[k]

  shapes[name] = Shape
  Shape


createShape = (name, args...) ->
  s = new shapes[name](args...)
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
    @image = args.image or null
  draw: (ctx, retryCallback) ->
    if @image.width
      ctx.drawImage(@image, @x, @y)
    else
      @image.onload = retryCallback
  getBoundingRect: -> {@x, @y, width: @image.width, height: @image.height}
  toJSON: -> {@x, @y, imageSrc: @image.src}
  fromJSON: (data) ->
    img = new Image()
    img.src = data.imageSrc
    createShape('Image', {x: data.x, x: data.y, image: img})


defineShape 'Rectangle',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @width = args.width or 0
    @height = args.height or 0
    @strokeWidth = args.strokeWidth or 1
    @strokeColor = args.strokeColor or 'black'
    @fillColor = args.fillColor or 'transparent'

  draw: (ctx) ->
    ctx.fillStyle = @fillColor
    ctx.fillRect(@x, @y, @width, @height)
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @strokeColor
    ctx.strokeRect(@x, @y, @width, @height)

  getBoundingRect: -> {
    x: @x - @strokeWidth / 2,
    y: @y - @strokeWidth / 2,
    width: @width + @strokeWidth,
    height: @height + @strokeWidth,
  }
  toJSON: -> {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}
  fromJSON: (data) -> createShape('Rectangle', data)


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

  draw: (ctx) ->
    ctx.save()
    halfWidth = Math.floor(@width / 2)
    halfHeight = Math.floor(@height / 2)
    centerX = @x + halfWidth
    centerY = @y + halfHeight

    ctx.translate(centerX, centerY)
    ctx.scale(1, Math.abs(@height / @width))
    ctx.beginPath()
    ctx.arc(0, 0, Math.abs(halfWidth), 0, Math.PI * 2)
    ctx.closePath()
    ctx.restore()

    ctx.fillStyle = @fillColor
    ctx.fill()
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @strokeColor
    ctx.stroke()

  getBoundingRect: -> {
    x: @x - @strokeWidth / 2,
    y: @y - @strokeWidth / 2,
    width: @width + @strokeWidth,
    height: @height + @strokeWidth,
  }
  toJSON: -> {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}
  fromJSON: (data) -> createShape('Ellipse', data)


defineShape 'Line',
  constructor: (args={}) ->
    @x1 = args.x1 or 0
    @y1 = args.y1 or 0
    @x2 = args.x2 or 0
    @y2 = args.y2 or 0
    @strokeWidth = args.strokeWidth or 1
    @strokeStyle = args.strokeStyle or null
    @color = args.color or 'black'
    @capStyle = args.capStyle or 'round'
    @endCapShapes = args.endCapShapes or [null, null]
    @dash = args.dash or null

  draw: (ctx) ->
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @color
    ctx.lineCap = @capStyle
    ctx.setLineDash(@dash) if @dash
    ctx.beginPath()
    ctx.moveTo(@x1, @y1)
    ctx.lineTo(@x2, @y2)
    ctx.stroke()
    ctx.setLineDash([]) if @dash
    if @endCapShapes[0]
      lineEndCapShapes[@endCapShapes[0]](
        ctx, @x1, @y1, Math.atan2(@y1 - @y2, @x1 - @x2), {@color})
    if @endCapShapes[1]
      lineEndCapShapes[@endCapShapes[1]](
        ctx, @x2, @y2, Math.atan2(@y2 - @y1, @x2 - @x1), {@color})

  getBoundingRect: -> {
    x: Math.min(@x1, @x2) - @strokeWidth / 2,
    y: Math.min(@y1, @y2) - @strokeWidth / 2,
    width: Math.abs(@x2 - @x1) + @strokeWidth / 2,
    height: Math.abs(@y2 - @y1) + @strokeWidth / 2,
  }
  toJSON: ->
    {@x1, @y1, @x2, @y2, @strokeWidth, @color, @capStyle, @dash, @endCapShapes}
  fromJSON: (data) -> createShape('Line', data)


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
  return null unless points[0]
  createShape(shapeName, {
    points, order: data.order, tailSize: data.tailSize, smooth: data.smooth
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
        pointSize: @points[0].size,
        pointColor: @points[0].color
      }
    else
      {@order, @tailSize, @smooth, points: (shapeToJSON(p) for p in @points)}

  fromJSON: (data) -> _createLinePathFromData('LinePath', data)

  draw: (ctx) ->
    @drawPoints(ctx, @smoothedPoints)

  drawLatest: (ctx, bufferCtx) ->
    @drawPoints(ctx, if @tail then @tail else @smoothedPoints)

    if @tail
      segmentStart = @smoothedPoints.length - @segmentSize * @tailSize
      drawStart = if segmentStart < @segmentSize * 2 then 0 else segmentStart
      drawEnd = segmentStart + @segmentSize + 1
      @drawPoints(bufferCtx, @smoothedPoints.slice(drawStart, drawEnd))

  addPoint: (point) ->
    @points.push(point)

    return @smoothedPoints = @points if !@smooth

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

  drawPoints: (ctx, points) ->
    return unless points.length

    ctx.lineCap = 'round'

    ctx.strokeStyle = points[0].color
    ctx.lineWidth = points[0].size

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for point in points.slice(1)
      ctx.lineTo(point.x, point.y)

    ctx.stroke()


LinePath = defineShape 'LinePath', linePathFuncs


defineShape 'ErasedLinePath',
  constructor: linePathFuncs.constructor
  toJSON: linePathFuncs.toJSON
  addPoint: linePathFuncs.addPoint
  drawPoints: linePathFuncs.drawPoints
  getBoundingRect: linePathFuncs.getBoundingRect

  draw: (ctx) ->
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    linePathFuncs.draw.call(this, ctx)
    ctx.restore()

  drawLatest: (ctx, bufferCtx) ->
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    bufferCtx.save()
    bufferCtx.globalCompositeOperation = "destination-out"

    linePathFuncs.drawLatest.call(this, ctx, bufferCtx)

    ctx.restore()
    bufferCtx.restore()

  fromJSON: (data) -> _createLinePathFromData('ErasedLinePath', data)


# this is currently just used for LinePath/ErasedLinePath internal storage.
defineShape 'Point',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @size = args.size or 0
    @color = args.color or ''
  lastPoint: -> this
  draw: (ctx) -> throw "not implemented"
  toJSON: -> {@x, @y, @size, @color}
  fromJSON: (data) -> createShape('Point', data)


defineShape 'Text',
  constructor: (args={}) ->
    @x = args.x or 0
    @y = args.y or 0
    @text = args.text or ''
    @color = args.color or 'black'
    @font  = args.font or '18px sans-serif'
  draw: (ctx) ->
    ctx.font  = @font
    ctx.fillStyle = @color
    ctx.fillText(@text, @x, @y)
    @boundingBoxWidth = Math.ceil ctx.measureText(@text).width
  getBoundingRect: ->
    {@x, @y, width: @boundingBoxWidth, height: 18} # we don't know height :-(
  toJSON: -> {@x, @y, @text, @color, @font}
  fromJSON: (data) -> createShape('Text', data)


module.exports = {defineShape, createShape, JSONToShape, shapeToJSON}
