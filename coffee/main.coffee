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
    document.onselectstart = -> false # disable selection while dragging
    lc.begin(e.offsetX, e.offsetY)

  $c.mousemove (e) =>
    lc.continue(e.offsetX, e.offsetY)

  $c.mouseup (e) =>
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
    if @isDrawing
      @saveShape()

    @color = lc.primaryColor
    
    x = x - lc.position.x
    y = y - lc.position.y
    @isDrawing = true
    @currentShape = @makeShape()
    @currentShape.addPoint(x, y)

  continue: (x, y, lc) ->
    return unless @isDrawing
    x = x - lc.position.x
    y = y - lc.position.y
    @currentShape.addPoint(x, y)
    lc.repaint(@currentShape)

  end: (x, y, lc) ->
    return unless @isDrawing
    x = x - lc.position.x
    y = y - lc.position.y
    @isDrawing = false
    @currentShape.addPoint(x, y)
    lc.saveShape(@currentShape)
    @currentShape = undefined

  makePoint: (x, y, lc) -> new LC.Point(x, y, @strokeWidth, @color)
  makeShape: -> new LC.LinePathShape(this)


class LC.LiterallyCanvas

  constructor: (@canvas) ->
    @$canvas = $(@canvas)
    @ctx = @canvas.getContext('2d')
    $(@canvas).css('background-color', '#eee')
    @shapes = []
    @isDrawing = false
    @position = {x: 0, y: 0}
    @tool = new LC.Pencil
    @primaryColor = '#000'
    @secondaryColor = '#fff'
    @repaint()

  begin: (x, y) ->
    @tool.begin x, y, this

  continue: (x, y) ->
    @tool.continue x, y, this

  end: (x, y) ->
    @tool.end x, y, this

  saveShape: (shape) ->
    @shapes.push(shape)
    @repaint()

  pan: (x, y) ->
    # Subtract because we are moving the viewport
    @position.x = @position.x - x
    @position.y = @position.y - y

  repaint: (currentShape) ->
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @ctx.save()
    @ctx.translate @position.x, @position.y
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


class LC.Point
  constructor: (@x, @y, @size, @color) ->
  lastPoint: -> this
  draw: (ctx) -> console.log 'draw point', @x, @y, @size, @color
