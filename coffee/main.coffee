window.LC = window.LC ? {}


coordsForEvent = (e) ->
  t = e.originalEvent.changedTouches[0]
  return [t.clientX, t.clientY]


$.fn.literallycanvas = ->
  $c = @find('canvas')
  c = $c.get(0)

  lc = new LC.LiterallyCanvas(c)
  tb = new LC.Toolbar(lc, @find('.toolbar'))

  $c.mousedown (e) =>
    alert 'yes'
    lc.beginDraw(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    lc.continueDraw(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
    lc.endDraw(e.offsetX, e.offsetY)

  $c.mouseout (e) =>
    lc.endDraw(e.offsetX, e.offsetY)

  $c.bind 'touchstart', (e) ->
    e.preventDefault()
    coords = coordsForEvent(e)
    if e.originalEvent.touches.length == 1
      lc.beginDraw(coords[0], coords[1])
    else
      lc.continueDraw(coords[0], coords[1])

  $c.bind 'touchmove', (e) ->
    e.preventDefault()
    coords = coordsForEvent(e)
    lc.continueDraw(coords[0], coords[1])

  $c.bind 'touchend', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    coords = coordsForEvent(e)
    lc.endDraw(coords[0], coords[1])

  $c.bind 'touchcancel', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    coords = coordsForEvent(e)
    lc.endDraw(coords[0], coords[1])


class LC.LiterallyCanvasState

  constructor: ->
    @strokeColor = 'rgba(0, 0, 0, 0.9)'
    @strokeWidth = 5

  makePoint: (x, y) -> new LC.Point(x, y, @strokeWidth, @strokeColor)


class LC.LiterallyCanvas

  constructor: (@canvas) ->
    @state = new LC.LiterallyCanvasState()

    @$canvas = $(@canvas)
    @ctx = @canvas.getContext('2d')
    $(@canvas).css('background-color', '#eee')
    @shapes = []
    @isDrawing = false
    @repaint()

  beginDraw: (x, y) ->
    if @isDrawing
      @saveShape()

    @isDrawing = true
    @currentShape = new LC.LinePathShape(@state)
    @currentShape.addPoint(x, y)
    @currentShape.drawLatest(@ctx)

  continueDraw: (x, y) ->
    return unless @isDrawing
    @currentShape.addPoint(x, y)
    @repaint()

  endDraw: (x, y) ->
    return unless @isDrawing
    @isDrawing = false
    @currentShape.addPoint(x, y)
    @saveShape()

  saveShape: ->
    @shapes.push(@currentShape)
    @currentShape = undefined
    @repaint()

  repaint: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    _.each @shapes, (s) =>
      s.draw(@ctx)
    if @isDrawing then @currentShape.draw(@ctx)
 

class LC.LinePathShape
  constructor: (@lcState) ->
    @points = []

  addPoint: (x, y) ->
    @points.push(@lcState.makePoint(x, y))
    @smoothedPoints = LC.bspline(LC.bspline(LC.bspline(@points)))

  draw: (ctx) ->
    return unless @smoothedPoints.length
    ctx.beginPath()
    ctx.moveTo(@smoothedPoints[0].x, @smoothedPoints[0].y)
    _.each _.rest(@smoothedPoints), (p) ->
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.size
      ctx.lineTo(p.x, p.y)
    ctx.stroke()

  drawLatest: (ctx) ->
    pair = _.last(@points, 2)
    return unless pair.length > 1
    ctx.beginPath()
    ctx.strokeStyle = pair[1].color
    ctx.lineWidth = pair[1].size
    ctx.moveTo(pair[0].x, pair[0].y)
    ctx.lineTo(pair[1].x, pair[1].y)
    ctx.stroke()


class LC.Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
