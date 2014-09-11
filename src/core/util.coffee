slice = Array.prototype.slice

util =
  last: (array, n = null) ->
    if n
      return slice.call(array, Math.max(array.length - n, 0))
    else
      return array[array.length - 1]

  matchElementSize: (elementToMatch, elementsToResize, scale, callback = ->) ->
    resize = =>
      for el in elementsToResize
        el.style.width = "#{elementToMatch.offsetWidth}px"
        el.style.height = "#{elementToMatch.offsetHeight}px"
        if el.width?
          el.setAttribute('width', el.offsetWidth * scale)
          el.setAttribute('height', el.offsetHeight * scale)
      callback()

    elementToMatch.addEventListener 'resize', resize
    window.addEventListener 'resize', resize
    window.addEventListener 'orientationchange', resize
    resize()

  combineCanvases: (canvases...) ->
    c = document.createElement('canvas')
    c.width = canvases[0].width
    c.height = canvases[0].height
    for canvas in canvases
      c.width = Math.max(canvas.width, c.width)
      c.height = Math.max(canvas.height, c.height)
    ctx = c.getContext('2d')

    for canvas in canvases
      ctx.drawImage(canvas, 0, 0)
      ctx.drawImage(canvas, 0, 0)
    c

  renderShapes: (shapes, bounds, scale=1, canvas=null) ->
    canvas = canvas or document.createElement('canvas')
    canvas.width = bounds.width * scale
    canvas.height = bounds.height * scale
    ctx = canvas.getContext('2d')
    ctx.translate(-bounds.x * scale, -bounds.y * scale)
    ctx.scale(scale, scale)
    for shape in shapes
      shape.draw(ctx)
    canvas

  # [{x, y, width, height}]
  getBoundingRect: (rects, width, height) ->
    return {x: 0, y: 0, width: 0 or width, height: 0 or height} unless rects.length

    # Calculate the bounds for infinite canvas
    minX = rects[0].x
    minY = rects[0].y
    maxX = rects[0].x + rects[0].width
    maxY = rects[0].y + rects[0].height
    for rect in rects
      minX = Math.floor Math.min(rect.x, minX)
      minY = Math.floor Math.min(rect.y, minY)
      maxX = Math.ceil Math.max(maxX, rect.x + rect.width)
      maxY = Math.ceil Math.max(maxY, rect.y + rect.height)

    # Use the image size bounds if they exist
    minX = if width then 0 else minX
    minY = if height then 0 else minY
    maxX = width or maxX
    maxY = height or maxY

    {x: minX, y: minY, width: maxX - minX, height: maxY - minY}

  getBackingScale: (context) ->
    return 1 unless window.devicePixelRatio?
    return 1 unless window.devicePixelRatio > 1
    return window.devicePixelRatio

  requestAnimationFrame: (window.requestAnimationFrame or window.setTimeout).bind(window)

  getGUID: do ->
    s4 = ->
      Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    -> (s4() + s4() + '-' +
        s4() + '-' +
        s4() + '-' +
        s4() + '-' +
        s4() + s4() + s4())

module.exports = util
