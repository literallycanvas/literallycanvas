window.LC = window.LC ? {}


coordsForTouchEvent = ($el, e) ->
  t = e.originalEvent.changedTouches[0]
  p = $el.offset()
  return [t.clientX - p.left, t.clientY - p.top]


position = (e) ->
  if e.offsetX?
    {left: e.offsetX, top: e.offsetY}
  else
    p = $(e.target).offset()
    {
      left: e.pageX - p.left,
      top: e.pageY - p.top,
    }


buttonIsDown = (e) ->
  if e.buttons?
    return e.buttons == 1
  else
    return e.which > 0


initLiterallyCanvas = (el, opts = {}) ->
  opts = _.extend({
    backgroundColor: 'rgb(230, 230, 230)'
    imageURLPrefix: 'lib/img'
    keyboardShortcuts: true
    sizeToContainer: true
    toolClasses: [LC.Pencil, LC.RectangleTool, LC.Eraser, LC.Pan, LC.EyeDropper]
  }, opts)
  $el = $(el)
  $el.addClass('literally')
  $tbEl = $('<div class="toolbar">')

  $el.append($tbEl)

  $c = $el.find('canvas')

  lc = new LC.LiterallyCanvas($c.get(0), opts)
  tb = new LC.Toolbar(lc, $tbEl, opts)
  tb.selectTool(tb.tools[0])

  resize = ->
    if opts.sizeToContainer
      $c.css('height', "#{$el.height() - $tbEl.height()}px")
    $c.attr('width', $c.width())
    $c.attr('height', $c.height())
    lc.repaint()

  $el.resize(resize)
  $(window).resize(resize)
  resize()

  $c.mousedown (e) =>
    down = true
    e.originalEvent.preventDefault();
    document.onselectstart = -> false # disable selection while dragging
    p = position(e)
    lc.begin(p.left, p.top)

  $c.mousemove (e) =>
    e.originalEvent.preventDefault()
    p = position(e)
    lc.continue(p.left, p.top)

  $c.mouseup (e) =>
    e.originalEvent.preventDefault()
    document.onselectstart = -> true # enable selection while dragging
    p = position(e)
    lc.end(p.left, p.top)

  $c.mouseenter (e) =>
    p = position(e)
    if buttonIsDown(e)
      lc.begin(p.left, p.top)

  $c.mouseout (e) =>
    p = position(e)
    lc.end(p.left, p.top)

  $c.bind 'touchstart', (e) ->
    e.preventDefault()
    if e.originalEvent.touches.length == 1
      lc.begin(coordsForTouchEvent($c, e)...)
    else
      lc.continue(coordsForTouchEvent($c, e)...)

  $c.bind 'touchmove', (e) ->
    e.preventDefault()
    lc.continue(coordsForTouchEvent($c, e)...)

  $c.bind 'touchend', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    lc.end(coordsForTouchEvent($c, e)...)

  $c.bind 'touchcancel', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    lc.end(coordsForTouchEvent($c, e)...)

  if opts.keyboardShortcuts
    $(document).keydown (e) ->
      switch e.which
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10

      lc.repaint()

  [lc, tb]


$.fn.literallycanvas = (opts = {}) ->
  @each (ix, el) =>
    val = initLiterallyCanvas(el, opts)
    el.literallycanvas = val[0]
    el.literallycanvasToolbar = val[1]
  this


$.fn.canvasForExport = ->
  @get(0).literallycanvas.canvasForExport()
