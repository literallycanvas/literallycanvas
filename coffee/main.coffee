$.fn.literallycanvas = ->
  lc = new LiterallyCanvas(@find('canvas').get(0))

  $c = @find('canvas')

  $c.mousedown (e) =>
    lc.beginDraw(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    lc.continueDraw(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
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
    @isDrawing = true
    @currentShapeGroup = new ShapeGroup([quickPoint(x, y)])
    @repaint()

  continueDraw: (x, y) ->
    return unless @isDrawing
    newLine = new Line(
      _.last(@currentShapeGroup.shapes).lastPoint(),
      quickPoint(x, y))
    @currentShapeGroup.shapes.push(newLine)
    @repaint()

  endDraw: (x, y) ->
    @isDrawing = false
    @shapes.push(@currentShapeGroup)
    @currentShapeGroup = undefined
    @repaint()

  repaint: ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    _.each @shapes, (shape) =>
      shape.draw(@ctx)
    @currentShapeGroup.draw(@ctx) if @currentShapeGroup
 

class ShapeGroup
  constructor: (@shapes = []) ->
  draw: (ctx) ->
    _.each @shapes, (shape) ->
      shape.draw(ctx)


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
