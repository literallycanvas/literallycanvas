class LC.LinePathShape
  constructor: (@tool) ->
    @points = []

  addPoint: (x, y) ->
    @points.push(@tool.makePoint(x, y))
    @smoothedPoints = LC.bspline(LC.bspline(LC.bspline(@points)))

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
    pair = _.last(@points, 2)
    return unless pair.length > 1
    ctx.beginPath()
    ctx.strokeStyle = pair[1].color
    ctx.lineWidth = pair[1].size
    ctx.moveTo(pair[0].x, pair[0].y)
    ctx.lineTo(pair[1].x, pair[1].y)
    ctx.stroke()


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
