window.LC = window.LC ? {}


coordsForEvent = ($el, e) ->
  t = e.originalEvent.changedTouches[0]
  p = $el.position()
  return [t.clientX - p.left, t.clientY - p.top]


IS_IOS = /iphone|ipad/i.test(navigator.userAgent)
$.fn.nodoubletapzoom = ->
  if (IS_IOS)
    $(this).bind 'touchstart', (e) ->
      t2 = e.timeStamp
      t1 = $(this).data('lastTouch') || t2
      dt = t2 - t1
      fingers = e.originalEvent.touches.length;
      $(this).data('lastTouch', t2);
      if !dt || dt > 500 || fingers > 1 then return; # not double-tap

      e.preventDefault() # double tap - prevent the zoom
      # also synthesize click events we just swallowed up
      $(this).trigger('click').trigger('click')


$.fn.literallycanvas = ->
  @nodoubletapzoom()

  $c = @find('canvas')
  c = $c.get(0)

  lc = new LC.LiterallyCanvas(c)
  tb = new LC.Toolbar(lc, @find('.toolbar'))

  $c.mousedown (e) =>
    e.originalEvent.preventDefault();
    document.onselectstart = -> false # disable selection while dragging
    lc.begin(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    e.originalEvent.preventDefault();
    lc.continue(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
    e.originalEvent.preventDefault();
    document.onselectstart = -> true # disable selection while dragging
    lc.end(e.offsetX, e.offsetY)

  $c.mouseout (e) =>
    lc.end(e.offsetX, e.offsetY)

  $c.bind 'touchstart', (e) ->
    e.preventDefault()
    coords = coordsForEvent($c, e)
    if e.originalEvent.touches.length == 1
      lc.begin(coords[0], coords[1])
    else
      lc.continue(coords[0], coords[1])

  $c.bind 'touchmove', (e) ->
    e.preventDefault()
    coords = coordsForEvent($c, e)
    lc.continue(coords[0], coords[1])

  $c.bind 'touchend', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    coords = coordsForEvent($c, e)
    lc.end(coords[0], coords[1])

  $c.bind 'touchcancel', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    coords = coordsForEvent($c, e)
    lc.end(coords[0], coords[1])

  $(document).keydown (e) ->
    switch e.which
      when 37 then lc.pan -10, 0
      when 38 then lc.pan 0, -10
      when 39 then lc.pan 10, 0
      when 40 then lc.pan 0, 10

    lc.repaint()


class LC.Tool

  begin: (x, y, lc) ->
  continue: (x, y, lc) ->
  end: (x, y, lc) ->


class LC.Pencil extends LC.Tool

  constructor: ->
    @isDrawing = false
    @strokeWidth = 5

  begin: (x, y, lc) ->
    @color = lc.primaryColor
    @currentShape = @makeShape()
    @currentShape.addPoint(x, y)

  continue: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.repaint(@currentShape)

  end: (x, y, lc) ->
    @currentShape.addPoint(x, y)
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.Eraser extends LC.Pencil

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, '#000')
  makeShape: -> new LC.EraseLinePathShape(this)


class LC.Pan extends LC.Tool

  begin: (x, y, lc) ->
    @start = {x:x, y:y}

  continue: (x, y, lc) ->
    lc.pan @start.x - x, @start.y - y
    lc.repaint()


class LC.EyeDropper extends LC.Tool

  begin: (x, y, lc) ->
    lc.primaryColor = lc.getPixel(x, y)
    lc.trigger 'colorChange', lc.primaryColor

  continue: (x, y, lc) ->
    lc.primaryColor = lc.getPixel(x, y)
    lc.trigger 'colorChange', lc.primaryColor


class LC.LiterallyCanvas

  constructor: (@canvas) ->
    @$canvas = $(@canvas)
    @ctx = @canvas.getContext('2d')
    $(@canvas).css('background-color', '#eee')
    @shapes = []
    @isDragging = false
    @position = {x: 0, y: 0}
    @scale = 1.0
    @tool = new LC.Pencil
    @primaryColor = '#000'
    @secondaryColor = '#fff'
    @repaint()

  trigger: (name, data) ->
    @canvas.dispatchEvent new CustomEvent(name, {
      detail: data
    })

  on: (name, fn) ->
    @canvas.addEventListener name, (e) ->
      fn e.detail

  clientCoordsToDrawingCoords: (x, y) ->
    {
      x: (x - @position.x) / @scale,
      y: (y - @position.y) / @scale,
    }

  drawingCoordsToClientCoords: (x, y) ->
    {
      x: x * @scale + @position.x,
      y: y * @scale + @position.y
    }

  begin: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.begin newPos.x, newPos.y, this
    @isDragging = true

  continue: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.continue newPos.x, newPos.y, this if @isDragging

  end: (x, y) ->
    newPos = @clientCoordsToDrawingCoords(x, y)
    @tool.end newPos.x, newPos.y, this if @isDragging
    @isDragging = false

  saveShape: (shape) ->
    @shapes.push(shape)
    @repaint()

  pan: (x, y) ->
    # Subtract because we are moving the viewport
    @position.x = @position.x - x
    @position.y = @position.y - y

  zoom: (factor) ->
    oldScale = @scale
    @scale = @scale + factor
    @scale = Math.max(@scale, 0.2)
    @scale = Math.min(@scale, 4.0)
    @scale = Math.round(@scale*100)/100

    @position.x = LC.scalePositionScalar(
      @position.x, @canvas.width, oldScale, @scale)
    @position.y = LC.scalePositionScalar(
      @position.y, @canvas.height, oldScale, @scale)

    @repaint()

  repaint: (currentShape = null) ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @ctx.save()
    @ctx.translate @position.x, @position.y
    @ctx.scale @scale, @scale
    _.each @shapes, (s) =>
      s.draw(@ctx)
    currentShape.draw(@ctx) if currentShape
    @ctx.restore()

  clear: ->
    @shapes = []
    @repaint()

  undo: ->
    @shapes = _.initial(@shapes)
    @repaint()

  redo: ->

  getPixel: (x, y) ->
    p = @drawingCoordsToClientCoords x, y
    pixel = @ctx.getImageData(p.x, p.y, 1, 1).data
    return "rgb(" + pixel[0] + "," + pixel[1] + ","  + pixel[2] + ")"


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
