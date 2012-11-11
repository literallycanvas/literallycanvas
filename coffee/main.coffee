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

  addLine: (x, y) ->
    newLine = new Line(
      _.last(@currentShapeGroup.shapes).lastPoint(),
      quickPoint(x, y))
    @currentShapeGroup.shapes.push(newLine)
    @currentShapeGroup.drawLatest(@ctx)

  beginDraw: (x, y) ->
    if @isDrawing
      @saveShape()

    @isDrawing = true
    @currentShapeGroup = new ShapeGroup([quickPoint(x, y)])
    @currentShapeGroup.drawLatest(@ctx)

  continueDraw: (x, y) ->
    return unless @isDrawing
    @addLine(x, y)

  endDraw: (x, y) ->
    return unless @isDrawing
    @isDrawing = false
    @addLine(x, y)

  saveShape: ->
    @shapes.push(@currentShapeGroup)
    @currentShapeGroup.drawLatest(@ctx)
    @currentShapeGroup = undefined

  repaint: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
 

class ShapeGroup
  constructor: (@shapes = []) ->
  draw: (ctx) ->
    _.each @shapes, (shape) ->
      shape.draw(ctx)

  drawLatest: (ctx) ->
    _.last(@shapes).draw(ctx)


class Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color


class Line
  constructor: (@start, @end) ->
  lastPoint: -> @end
  draw: (ctx) ->
    ctx.lineWidth = @start.size
    ctx.beginPath()
    ctx.moveTo(@start.x, @start.y)
    ctx.lineTo(@end.x, @end.y)
    ctx.stroke()
