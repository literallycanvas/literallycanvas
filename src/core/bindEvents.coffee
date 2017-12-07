coordsForTouchEvent = (el, e) ->
  tx = e.changedTouches[0].clientX
  ty = e.changedTouches[0].clientY
  p = el.getBoundingClientRect()
  return [tx - p.left, ty - p.top]


position = (el, e) ->
  p = el.getBoundingClientRect()
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
  unsubs = []

  ### MOUSE ###

  mouseMoveListener = (e) =>
    e.preventDefault()
    p = position(canvas, e)
    lc.pointerMove(p.left, p.top)

  mouseUpListener = (e) =>
    e.preventDefault()
    canvas.onselectstart = -> true # enable selection while dragging
    p = position(canvas, e)
    lc.pointerUp(p.left, p.top)
    document.removeEventListener 'mousemove', mouseMoveListener
    document.removeEventListener 'mouseup', mouseUpListener

    canvas.addEventListener 'mousemove', mouseMoveListener

  canvas.addEventListener 'mousedown', (e) =>
    return if e.target.tagName.toLowerCase() != 'canvas'

    down = true
    e.preventDefault()
    canvas.onselectstart = -> false # disable selection while dragging
    p = position(canvas, e)
    lc.pointerDown(p.left, p.top)

    canvas.removeEventListener 'mousemove', mouseMoveListener
    document.addEventListener 'mousemove', mouseMoveListener
    document.addEventListener 'mouseup', mouseUpListener

  ### TOUCH ###

  isPollingForTouchEvents = false
  pollForTouchEvents = (touchStartEvent) ->
    # handle initial event
    touchStartEvent.preventDefault()
    isPollingForTouchEvents = true
    lc.pointerDown(coordsForTouchEvent(canvas, touchStartEvent)...)

    # latest event will be stored here; will be fired if there is a change
    nextEvent = null

    poll = ->
      return unless isPollingForTouchEvents
      window.requestAnimationFrame poll
      return unless nextEvent
      lc.pointerMove(coordsForTouchEvent(canvas, nextEvent)...)
      nextEvent = null

    touchMoveListener = (e) ->
      nextEvent = e

    touchEndListener = (e) ->
      isPollingForTouchEvents = false
      e.preventDefault()
      lc.pointerUp(coordsForTouchEvent(canvas, e)...)
      document.removeEventListener 'touchmove', touchMoveListener
      document.removeEventListener 'touchend', touchEndListener
      document.removeEventListener 'touchcancel', touchEndListener

    document.addEventListener 'touchmove', touchMoveListener
    document.addEventListener 'touchend', touchEndListener
    document.addEventListener 'touchcancel', touchEndListener

    window.requestAnimationFrame poll

  canvas.addEventListener 'touchstart', (e) ->
    return if isPollingForTouchEvents
    return if e.target.tagName.toLowerCase() != 'canvas'
    return if e.touches.length != 1
    pollForTouchEvents(e)

  ### KEYBOARD ###

  if panWithKeyboard
    console.warn("Keyboard panning is deprecated.")
    listener = (e) ->
      switch e.keyCode
        when 37 then lc.pan -10, 0
        when 38 then lc.pan 0, -10
        when 39 then lc.pan 10, 0
        when 40 then lc.pan 0, 10
      lc.repaintAllLayers()

    document.addEventListener 'keydown', listener
    unsubs.push -> document.removeEventListener(listener)

  -> f() for f in unsubs
