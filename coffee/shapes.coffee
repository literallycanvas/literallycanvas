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
    @points.push(@tool.makePoint(x, y))
    if not @smoothedPoints or @points.length < @tail
      @smoothedPoints = LC.bspline(@points, @order)
    else
      @smoothedPoints = @smoothedPoints.concat(
        _.last(LC.bspline(_.last(@points, @tail), @order), Math.pow(2, @order))
      )

  draw: (ctx) ->
    return unless @smoothedPoints.length
    fp = @smoothedPoints[0]
    lp = _.last(@smoothedPoints)

    _.each [fp, lp], (p) ->
      ctx.beginPath()
      ctx.fillStyle = p.color
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()

    ctx.beginPath()
    ctx.moveTo(fp.x, fp.y)

    _.each _.rest(@smoothedPoints), (p) ->
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.size
      ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.closePath()

  drawLatest: (ctx) ->
    tail = _.last(@smoothedPoints, Math.pow(2, @order) + 1)
    return unless tail.length > 1
    
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.moveTo(tail[0].x, tail[0].y)

    _.each _.rest(tail), (p) =>
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.size
      ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.closePath()


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
