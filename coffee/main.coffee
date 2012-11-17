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


position = (e) ->
  if e.offsetX?
    {left: e.offsetX, top: e.offsetY}
  else
    p = $(e.delegateTarget).position()
    {
      left: e.pageX - p.left,
      top: e.pageY - p.top,
    }


$.fn.literallycanvas = ->
  @nodoubletapzoom()

  $c = @find('canvas')
  c = $c.get(0)

  @append($('<div class="toolbar">'))

  lc = new LC.LiterallyCanvas(c)
  tb = new LC.Toolbar(lc, @find('.toolbar'))

  $c.mousedown (e) =>
    e.originalEvent.preventDefault();
    document.onselectstart = -> false # disable selection while dragging
    p = position(e)
    lc.begin(p.left, p.top)

  $c.mousemove (e) =>
    e.originalEvent.preventDefault();
    p = position(e)
    lc.continue(p.left, p.top)

  $c.mouseup (e) =>
    e.originalEvent.preventDefault();
    document.onselectstart = -> true # disable selection while dragging
    p = position(e)
    lc.end(p.left, p.top)

  $c.mouseout (e) =>
    p = position(e)
    lc.end(p.left, p.top)

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
