window.LC = window.LC ? {}


class LC.Shape

  className: null

  # Redraw the entire shape
  draw: (ctx) ->

  # Draw just the most recent portion of the shape if applicable
  update: (ctx) ->
    @draw(ctx)

  toJSON: -> {className: @className, data: @jsonContent()}
  jsonContent: -> raise "not implemented"
  @fromJSON: (lc, data) -> raise "not implemented"


class LC.ImageShape extends LC.Shape

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
    i = new LC.ImageShape(data.x, data.y, img)
    i


class LC.Rectangle extends LC.Shape

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
    shape = new LC.Rectangle(
      data.x, data.y, data.strokeWidth, data.strokeColor, data.fillColor)
    shape.width = data.width
    shape.height = data.height
    shape


class LC.Line extends LC.Shape

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
    shape = new LC.Line(
      data.x1, data.y1, data.x2, data.y2, data.strokeWidth, data.color)
    shape


class LC.LinePathShape extends LC.Shape

  className: 'LinePathShape'

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
    points = (new LC.Point.fromJSON(lc, pointData) \
              for pointData in data.points)
    new LC.LinePathShape(points, data.order, data.tailSize)

  addPoint: (point) ->
    # Brush Variance Code
    #distance = LC.len(LC.diff(LC.util.last(@points), newPoint)) if @points.length
    #newPoint.size = newPoint.size + Math.sqrt(distance) if distance

    @points.push(point)

    if not @smoothedPoints or @points.length < @sampleSize
      @smoothedPoints = LC.bspline(@points, @order)
    else
      @tail = LC.util.last(
        LC.bspline(LC.util.last(@points, @sampleSize), @order),
                   @segmentSize * @tailSize)

      # Remove the last @tailSize - 1 segments from @smoothedPoints
      # then concat the tail. This is done because smoothed points
      # close to the end of the path will change as new points are
      # added.
      @smoothedPoints = @smoothedPoints.slice(
        0, @smoothedPoints.length - @segmentSize * (@tailSize - 1)
      ).concat(@tail)

  draw: (ctx) ->
    points = @smoothedPoints
    return unless points.length

    ctx.strokeStyle = points[0].color
    ctx.lineWidth = points[0].size
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for point in points.slice(1)
      ctx.lineTo(point.x, point.y)
    ctx.stroke()

    # Polygonal Line Code
    #poly = LC.toPoly(@smoothedPoints)

    #_.each [fp, lp], (p) ->
    #  ctx.beginPath()
    #  ctx.fillStyle = p.color
    #  ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
    #  ctx.fill()
    #  ctx.closePath()

    #ctx.beginPath(poly[0].x, poly[0].y)
    #ctx.fillStyle = poly[0].color
    #_.each poly, (point) ->
    #  ctx.lineTo(point.x, point.y)
    #ctx.closePath()
    #ctx.fill()
    

class LC.EraseLinePathShape extends LC.LinePathShape

  className: 'EraseLinePathShape'

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

  # same as LinePathShape
  @fromJSON: (lc, data) ->
    points = (new LC.Point.fromJSON(lc, pointData) \
              for pointData in data.points)
    new LC.EraseLinePathShape(points, data.order, data.tailSize)


class LC.Point

  className: 'Point'

  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color

  jsonContent: -> {@x, @y, @size, @color}
  @fromJSON: (lc, data) ->
    new LC.Point(data.x, data.y, data.size, data.color)


class LC.TextShape extends LC.Shape

  className: 'TextShape'

  constructor: (@x, @y, @text, @color, @font = '18px sans-serif;') ->
  draw: (ctx) -> 
    ctx.font  = @font
    ctx.fillStyle = @color
    ctx.fillText(@text, @x, @y)
  jsonContent: -> {@x, @y, @text, @color, @font}
  @fromJSON: (lc, data) ->
    new LC.TextShape(data.x, data.y, data.text, data.color, data.font)
