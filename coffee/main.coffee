window.LC = window.LC ? {}


$.fn.literallycanvas = ->
  lc = new LC.LiterallyCanvas(@find('canvas').get(0))
  tb = new LC.Toolbar(lc, @find('.toolbar'))

  $c = @find('canvas')

  $c.mousedown (e) =>
    lc.beginDraw(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    lc.continueDraw(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
    lc.endDraw(e.offsetX, e.offsetY)

  $c.mouseout (e) =>
    lc.endDraw(e.offsetX, e.offsetY)


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
    @currentShape.drawLatest(@ctx)

  endDraw: (x, y) ->
    return unless @isDrawing
    @isDrawing = false
    @currentShape.addPoint(x, y)
    @currentShape.drawLatest(@ctx)
    @saveShape()

  saveShape: ->
    console.log @currentShape.points
    @currentShape.points = LC.bspline LC.bspline LC.bspline @currentShape.points
    console.log @currentShape.points
    @shapes.push(@currentShape)
    @currentShape.drawLatest(@ctx)
    @currentShape = undefined
    @repaint()

  repaint: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    _.each @shapes, (s) =>
      s.draw(@ctx)
 

class LC.LinePathShape
  constructor: (@lcState) ->
    @points = []

  addPoint: (x, y) ->
    @points.push(@lcState.makePoint(x, y))

  draw: (ctx) ->
    ctx.beginPath()
    ctx.moveTo(@points[0].x, @points[0].y)
    _.each _.rest(@points), (p) ->
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
