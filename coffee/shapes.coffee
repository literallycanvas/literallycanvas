class LC.LinePathShape
  constructor: (@tool) ->
    @points = []
    # Order of the bspline applied to the curve
    # Higher values make the curve smoother, 3 is a cubic bspline
    @order = 3
    # The number of points used to calculate the bspline to the newest point
    # Higher values make slope at joints better, must be at least 3
    @tail = 4

  addPoint: (x, y) ->
    newPoint = @tool.makePoint(x, y)
    
    # Brush Variance Code
    #distance = LC.len(LC.diff(_.last(@points), newPoint)) if @points.length
    #newPoint.size = newPoint.size + Math.sqrt(distance) if distance
    
    @points.push(newPoint)
    if not @smoothedPoints or @points.length < @tail
      @smoothedPoints = LC.bspline(@points, @order)
    else
      @smoothedPoints = @smoothedPoints.concat(
        _.last(LC.bspline(_.last(@points, @tail), @order), Math.pow(2, @order))
      )

  draw: (ctx) ->
    return unless @smoothedPoints.length
    
    ctx.strokeStyle = @smoothedPoints[0].color
    ctx.lineWidth = @smoothedPoints[0].size
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(@smoothedPoints[0].x, @smoothedPoints[0].y)
    _.each _.rest(@smoothedPoints), (point) ->
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

  drawLatest: (ctx) ->
    ctx.save()
    ctx.globalCompositeOperation = "destination-out"
    super(ctx)
    ctx.restore()


class LC.Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
