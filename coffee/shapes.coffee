class LC.Shape

  # Redraw the entire shape
  draw: (ctx) ->

  # Draw just the most recent portion of the shape if applicable
  update: (ctx) ->
    @draw(ctx)


class LC.Rectangle extends LC.Shape

  constructor: (@x, @y, @strokeWidth, @color) ->
    @width = 0
    @height = 0

  draw: (ctx) ->
    ctx.lineWidth = @strokeWidth
    ctx.strokeStyle = @color
    ctx.strokeRect(@x, @y, @width, @height)


class LC.LinePathShape extends LC.Shape
  constructor: ->
    @points = []

    # Order of the bspline applied to the curve
    # Higher values make the curve smoother but are more expensive
    @order = 3
    
    # The number of smoothed points generated for each point added
    @segmentSize = Math.pow(2, @order)
    
    # The number of segments to use as the tail
    # In other words, when a point is added, how many points do you need to go
    # back before the slope of the old smoothed curve is the same as the slope
    # of the new smoothed curve.
    @tailSize = 3
    
    # The number of points used to calculate the bspline to the newest point
    @sampleSize = @tailSize + 1

  addPoint: (point) ->
    # Brush Variance Code
    #distance = LC.len(LC.diff(_.last(@points), newPoint)) if @points.length
    #newPoint.size = newPoint.size + Math.sqrt(distance) if distance
    
    @points.push(point)
    
    if not @smoothedPoints or @points.length < @sampleSize
      @smoothedPoints = LC.bspline(@points, @order)
    else
      @tail = _.last(
        LC.bspline(_.last(@points, @sampleSize), @order), @segmentSize * @tailSize
      )

      # Remove the last @tailSize - 1 segments from @smoothedPoints
      # then concat the tail. This is done because smoothed points
      # close to the end of the path will change as new points are
      # added.
      @smoothedPoints = _.initial(
        @smoothedPoints, @segmentSize * (@tailSize - 1)
      ).concat(@tail)

  draw: (ctx, points = @smoothedPoints) ->
    return unless points.length
    
    ctx.strokeStyle = points[0].color
    ctx.lineWidth = points[0].size
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    _.each _.rest(points), (point) ->
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


class LC.Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
