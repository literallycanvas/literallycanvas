coordsForTouchEvent = (el, e) ->
  tx = e.changedTouches[0].clientX
  ty = e.changedTouches[0].clientY
  p = el.getBoundingClientRect()
  return [tx - p.left, ty - p.top]


position = (e) ->
  if e.offsetX?
    {left: e.offsetX, top: e.offsetY}
  else
    p = e.target.getBoundingClientRect()
    {
      left: e.clientX - p.left,
      top: e.clientY - p.top,
    }


buttonIsDown = (e) ->
  if e.buttons?
    return e.buttons == 1
  else
    return e.which > 0


module.exports = bindEvents = (lc, canvas, panWithKeyboard = false) ->

  canvas.addEventListener 'mousedown', (e) =>
    down = true
    e.preventDefault()
    document.onselectstart = -> false # disable selection while dragging
    p = position(e)
    lc.begin(p.left, p.top)

  canvas.addEventListener 'mousemove', (e) =>
    e.preventDefault()
    p = position(e)
    lc.continue(p.left, p.top)

  canvas.addEventListener 'mouseup', (e) =>
    e.preventDefault()
    document.onselectstart = -> true # enable selection while dragging
    p = position(e)
    lc.end(p.left, p.top)

  canvas.addEventListener 'mouseenter', (e) =>
    p = position(e)
    if buttonIsDown(e)
      lc.begin(p.left, p.top)

  canvas.addEventListener 'mouseout', (e) =>
    p = position(e)
    lc.end(p.left, p.top)

  canvas.addEventListener 'touchstart', (e) ->
    e.preventDefault()
    if e.touches.length == 1
      lc.begin(coordsForTouchEvent(canvas, e)...)
    else
      lc.continue(coordsForTouchEvent(canvas, e)...)

  canvas.addEventListener 'touchmove', (e) ->
    e.preventDefault()
    lc.continue(coordsForTouchEvent(canvas, e)...)

  canvas.addEventListener 'touchend', (e) ->
    e.preventDefault()
    return unless e.touches.length == 0
    lc.end(coordsForTouchEvent(canvas, e)...)

  canvas.addEventListener 'touchcancel', (e) ->
    e.preventDefault()
    return unless e.touches.length == 0
    lc.end(coordsForTouchEvent(canvas, e)...)

  if panWithKeyboard
    document.addEventListener 'keydown', (e) ->
      switch e.keyCode
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10

      lc.repaintAllLayers()
