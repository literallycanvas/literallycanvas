coordsForTouchEvent = ($el, e) ->
  tx = e.originalEvent.changedTouches[0].pageX
  ty = e.originalEvent.changedTouches[0].pageY
  p = $el.offset()
  return [tx - p.left, ty - p.top]


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


LC.bindEvents = (lc, canvas, panWithKeyboard = false) ->
  $c = $(canvas)

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

  if panWithKeyboard
    $(document).keydown (e) ->
      switch e.which
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10

      lc.repaint()
