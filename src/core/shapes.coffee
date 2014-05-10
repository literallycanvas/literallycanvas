util = require './util'

shapes = {}


defineShape = (name, {constructor, draw, update, toJSON, fromJSON}) ->
  class shapes[name]
    className: name
    constructor: constructor
    toJSON: toJSON
    @fromJSON: fromJSON

    # Redraw the entire shape
    draw: draw
    # Draw just the most recent portion of the shape if applicable
    update: update or (ctx) -> draw(ctx)


# only use this if you know what you're doing.
# NB: fromJSON must be a class variable.
defineShapeWithClass = (name, cls) ->
  cls::className = name
  shapes[name] = cls
  cls


createShape = (name, args...) -> new shapes[name](args...)


JSONToShape = ({className, data}) ->
  if className of shapes
    shape = shapes[className].fromJSON(data)
    if shape
      return shape
    else
      console.log 'Unreadable shape:', className, data
      return null
  else
    console.log "Unknown shape:", className, data
    return null


shapeToJSON = (shape) ->
  {className: shape.className, data: shape.toJSON()}


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
  constructor: ({@x, @y, @image}) ->
  draw: (ctx, retryCallback) ->
    if @image.width
      ctx.drawImage(@image, @x, @y)
    else
      @image.onload = retryCallback
  toJSON: -> {@x, @y, imageSrc: @image.src}
  fromJSON: (data) ->
    img = new Image()
    img.src = data.imageSrc
    createShape('Image', {x: data.x, x: data.y, image: img})


defineShape 'Rectangle',
  constructor: (
      {@x, @y, @strokeWidth, @strokeColor, @fillColor, @width, @height}) ->
    @width ?= 0
    @height ?= 0

  draw: (ctx) ->
    ctx.fillStyle = @fillColor
    ctx.fillRect(@x, @y, @width, @height)
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @strokeColor
    ctx.strokeRect(@x, @y, @width, @height)

  toJSON: -> {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}
  fromJSON: (data) -> createShape('Rectangle', data)


defineShape 'Line',
  constructor: ({@x1, @y1, @x2, @y2, @strokeWidth, @color}) ->

  draw: (ctx) ->
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @color
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(@x1, @y1)
    ctx.lineTo(@x2, @y2)
    ctx.stroke()

  toJSON: -> {@x1, @y1, @x2, @y2, @strokeWidth, @color}
  fromJSON: (data) -> createShape('Line', data)


LinePath = defineShapeWithClass 'LinePath', class LinePath
  constructor: (_points = [], @order = 3, @tailSize = 3)->
    # The number of smoothed points generated for each point added
    @segmentSize = Math.pow(2, @order)

    # The number of points used to calculate the bspline to the newest point
    @sampleSize = @tailSize + 1

    @points = []
    for point in _points
      @addPoint(point)

  toJSON: ->
    # TODO: make point storage more efficient
    {@order, @tailSize, points: (shapeToJSON(p) for p in @points)}

  @fromJSON: (data) ->
    points = (JSONToShape(pointData) for pointData in data.points)
    return null unless points[0]
    createShape('LinePath', points, data.order, data.tailSize)

  addPoint: (point) ->
    # Brush Variance Code
    #if @points.length
    #distance = LC.len(LC.diff(LC.util.last(@points), newPoint))
    #newPoint.size = newPoint.size + Math.sqrt(distance) if distance

    @points.push(point)

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

  draw: (ctx) ->
    @drawPoints(ctx, @smoothedPoints)

  update: (ctx, buffer) ->
    @drawPoints(ctx, if @tail then @tail else @smoothedPoints)

    if @tail
      segmentStart = @smoothedPoints.length - @segmentSize * @tailSize
      segmentEnd = segmentStart + @segmentSize + 1
      @drawPoints(buffer, @smoothedPoints.slice(segmentStart, segmentEnd))

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


defineShapeWithClass 'ErasedLinePath', class ErasedLinePath extends LinePath
  draw: (ctx) ->
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    super(ctx)
    ctx.restore()

  update: (ctx) ->
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    super(ctx)
    ctx.restore()

  # same as LinePah
  @fromJSON: (data) ->
    points = (JSONToShape(pointData) for pointData in data.points)
    return null unless points[0]
    createShape('ErasedLinePath', points, data.order, data.tailSize)


defineShape 'Point',
  constructor: ({@x, @y, @size, @color}) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
  toJSON: -> {@x, @y, @size, @color}
  fromJSON: (data) -> createShape('Point', data)


defineShape 'Text',
  constructor: ({@x, @y, @text, @color, @font}) ->
    @font ?= '18px sans-serif'
  draw: (ctx) -> 
    ctx.font  = @font
    ctx.fillStyle = @color
    ctx.fillText(@text, @x, @y)
  toJSON: -> {@x, @y, @text, @color, @font}
  fromJSON: (data) -> createShape('Text', data)


module.exports = {
  defineShape, defineShapeWithClass, createShape, JSONToShape, shapeToJSON
}
