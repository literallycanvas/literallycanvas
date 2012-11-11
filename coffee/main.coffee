$.fn.literallycanvas = ->
  lc = new LiterallyCanvas(@find('canvas').get(0))

  $c = @find('canvas')

  $c.mousedown (e) =>
    lc.beginDraw(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    lc.continueDraw(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
    lc.endDraw(e.offsetX, e.offsetY)

  $c.mouseout (e) =>
    lc.endDraw(e.offsetX, e.offsetY)


quickPoint = (x, y) -> new Point(x, y, 5, 'black')


class LiterallyCanvas

  constructor: (@canvas) ->
    @ctx = @canvas.getContext('2d')
    $(@canvas).css('background-color', '#eee')
    @shapes = []
    @isDrawing = false
    @repaint()

  beginDraw: (x, y) ->
    if @isDrawing
      @saveShape()

    @isDrawing = true
    @currentShape = new LinePathShape([quickPoint(x, y)])
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

  saveShape: ->
    @shapes.push(@currentShape)
    @currentShape.drawLatest(@ctx)
    @currentShape = undefined

  repaint: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
 

class LinePathShape
  constructor: (startPoint) ->
    @points = [startPoint]

  addPoint: (x, y) ->
    @points.push(quickPoint(x, y))

  draw: (ctx) ->
    ctx.beginPath()
    ctx.moveTo(@points[0].x, @points[0].y)
    _.each _.rest(@points), (p) ->
      ctx.lineWidth = p.size
      ctx.lineTo(p.x, p.y)
    ctx.stroke()

  drawLatest: (ctx) ->
    pair = _.last(@points, 2)
    ctx.beginPath()
    ctx.lineWidth = pair[1].size
    ctx.moveTo(pair[0].x, pair[0].y)
    ctx.lineTo(pair[1].x, pair[1].y)
    ctx.stroke()


class Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
