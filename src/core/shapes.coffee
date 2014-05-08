util = require './util'

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
  return new Point a.x + ((b.x - a.x) / 2),
                      a.y + ((b.y - a.y) / 2),
                      a.size + ((b.size - a.size) / 2),
                      a.color


shapes = {}

shapes.Shape = class Shape

  className: null

  # Redraw the entire shape
  draw: (ctx) ->

  # Draw just the most recent portion of the shape if applicable
  update: (ctx) ->
    @draw(ctx)

  toJSON: -> {className: @className, data: @jsonContent()}
  jsonContent: -> raise "not implemented"
  @fromJSON: (lc, data) -> raise "not implemented"


shapes.ImageShape = class ImageShape extends Shape

  className: 'ImageShape'

  # TODO: allow resizing/filling
  constructor: (@x, @y, @image) ->
  draw: (ctx, retryCallback) ->
    if @image.width
      ctx.drawImage(@image, @x, @y)
    else
      @image.onload = retryCallback
  jsonContent: ->
    {@x, @y, imageSrc: @image.src}
  @fromJSON: (lc, data) ->
    img = new Image()
    img.src = data.imageSrc
    i = new ImageShape(data.x, data.y, img)
    i


shapes.Rectangle = class Rectangle extends Shape

  className: 'Rectangle'

  constructor: (@x, @y, @strokeWidth, @strokeColor, @fillColor) ->
    @width = 0
    @height = 0

  draw: (ctx) ->
    ctx.fillStyle = @fillColor
    ctx.fillRect(@x, @y, @width, @height)
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @strokeColor
    ctx.strokeRect(@x, @y, @width, @height)

  jsonContent: ->
    {@x, @y, @width, @height, @strokeWidth, @strokeColor, @fillColor}

  @fromJSON: (lc, data) ->
    shape = new Rectangle(
      data.x, data.y, data.strokeWidth, data.strokeColor, data.fillColor)
    shape.width = data.width
    shape.height = data.height
    shape


shapes.Line = class Line extends Shape

  className: 'Line'

  constructor: (@x1, @y1, @x2, @y2, @strokeWidth, @color) ->

  draw: (ctx) ->
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @color
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(@x1, @y1)
    ctx.lineTo(@x2, @y2)
    ctx.stroke()

  jsonContent: ->
    {@x1, @y1, @x2, @y2, @strokeWidth, @color}

  @fromJSON: (lc, data) ->
    shape = new Rectangle(
      data.x1, data.y1, data.x2, data.y2, data.strokeWidth, data.color)
    shape


shapes.LinePath = class LinePath extends Shape

  className: 'LinePath'

  constructor: (_points = [], @order = 3, @tailSize = 3)->
    # The number of smoothed points generated for each point added
    @segmentSize = Math.pow(2, @order)

    # The number of points used to calculate the bspline to the newest point
    @sampleSize = @tailSize + 1

    @points = []
    for point in _points
      @addPoint(point)

  jsonContent: ->
    # TODO: make point storage more efficient
    {@order, @tailSize, @points}

  @fromJSON: (lc, data) ->
    points = (Point.fromJSON(lc, pointData.data) for pointData in data.points)
    new LinePath(points, data.order, data.tailSize)

  addPoint: (point) ->
    # Brush Variance Code
    #distance = LC.len(LC.diff(LC.util.last(@points), newPoint)) if @points.length
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


shapes.EraseLinePath = class EraseLinePath extends LinePath

  className: 'EraseLinePath'

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

  # same as LinePath
  @fromJSON: (lc, data) ->
    points = (Point.fromJSON(lc, pointData.data) for pointData in data.points)
    new EraseLinePath(points, data.order, data.tailSize)


shapes.Point = class Point extends Shape

  className: 'Point'

  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color

  jsonContent: -> {@x, @y, @size, @color}
  @fromJSON: (lc, data) ->
    new Point(data.x, data.y, data.size, data.color)


shapes.Text = class Text extends Shape

  className: 'Text'

  constructor: (@x, @y, @text, @color, @font = '18px sans-serif;') ->
  draw: (ctx) -> 
    ctx.font  = @font
    ctx.fillStyle = @color
    ctx.fillText(@text, @x, @y)
  jsonContent: -> {@x, @y, @text, @color, @font}
  @fromJSON: (lc, data) ->
    new Text(data.x, data.y, data.text, data.color, data.font)


module.exports = shapes
