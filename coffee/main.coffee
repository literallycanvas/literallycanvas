window.LC = window.LC ? {}


coordsForEvent = ($el, e) ->
  t = e.originalEvent.changedTouches[0]
  p = $el.position()
  return [t.clientX - p.left, t.clientY - p.top]


position = (e) ->
  if e.offsetX?
    {left: e.offsetX, top: e.offsetY}
  else
    p = $(e.delegateTarget).position()
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
    keyboardShortcuts: true
    sizeToContainer: true
    toolClasses: [LC.Pencil, LC.Eraser, LC.Pan, LC.EyeDropper]
  }, opts)
  $el = $(el)
  $el.addClass('literally')
  $tbEl = $('<div class="toolbar">')

  $el.append($tbEl)

  $c = $el.find('canvas')

  lc = new LC.LiterallyCanvas($c.get(0), opts.backgroundColor)
  tb = new LC.Toolbar(lc, $tbEl, opts.toolClasses)
  tb.selectTool(tb.tools[0])

  resize = ->
    if opts.sizeToContainer
      $c.css('height', "#{$el.height() - $tbEl.height()}px")
    $c.attr('width', $c.width())
    $c.attr('height', $c.height())
    lc.repaint()

  $(window).resize(resize)
  resize()

  down = false

  $c.mousedown (e) =>
    down = true
    e.originalEvent.preventDefault();
    document.onselectstart = -> false # disable selection while dragging
    p = position(e)
    lc.begin(p.left, p.top)

  $c.mousemove (e) =>
    e.originalEvent.preventDefault()
    p = position(e)
    if buttonIsDown(e) and not down
      lc.begin(p.left, p.top)
      down = true
    lc.continue(p.left, p.top)

  $c.mouseup (e) =>
    e.originalEvent.preventDefault()
    document.onselectstart = -> true # disable selection while dragging
    p = position(e)
    lc.end(p.left, p.top)
    down = false

  $c.mouseout (e) =>
    p = position(e)
    lc.end(p.left, p.top)
    down = false

  $c.bind 'touchstart', (e) ->
    e.preventDefault()
    if e.originalEvent.touches.length == 1
      lc.begin(coordsForEvent($c, e)...)
    else
      lc.continue(coordsForEvent($c, e)...)

  $c.bind 'touchmove', (e) ->
    e.preventDefault()
    lc.continue(coordsForEvent($c, e)...)

  $c.bind 'touchend', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    lc.end(coordsForEvent($c, e)...)

  $c.bind 'touchcancel', (e) ->
    e.preventDefault()
    return unless e.originalEvent.touches.length == 0
    lc.end(coordsForEvent($c, e)...)

  if opts.keyboardShortcuts
    $(document).keydown (e) ->
      switch e.which
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10

      lc.repaint()


IS_IOS = /iphone|ipad/i.test(navigator.userAgent)
$.fn.literallycanvas = (opts = {}) ->
  if (IS_IOS)
    @bind 'touchstart', (e) ->
      t2 = e.timeStamp
      t1 = @data('lastTouch') || t2
      dt = t2 - t1
      fingers = e.originalEvent.touches.length;
      @data('lastTouch', t2);
      if !dt || dt > 500 || fingers > 1 then return; # not double-tap

      e.preventDefault() # double tap - prevent the zoom
      # also synthesize click events we just swallowed up
      @trigger('click').trigger('click')

  @each (ix, el) ->
    initLiterallyCanvas(el, opts)
