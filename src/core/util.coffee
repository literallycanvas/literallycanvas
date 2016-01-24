slice = Array.prototype.slice
{renderShapeToContext} = require './canvasRenderer'
{renderShapeToSVG} = require './svgRenderer'

util =

  addImageOnload: (img, fn) ->
    oldOnload = img.onload
    img.onload = ->
      oldOnload?()
      fn()
    return img

  last: (array, n = null) ->
    if n
      return slice.call(array, Math.max(array.length - n, 0))
    else
      return array[array.length - 1]

  classSet: (classNameToIsPresent) ->
    classNames = []
    for key of classNameToIsPresent
      if classNameToIsPresent[key]
        classNames.push(key)
    return classNames.join(' ')

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
    c

  renderShapes: (shapes, bounds, scale=1, canvas=null) ->
    canvas = canvas or document.createElement('canvas')
    canvas.width = bounds.width * scale
    canvas.height = bounds.height * scale
    ctx = canvas.getContext('2d')
    ctx.translate(-bounds.x * scale, -bounds.y * scale)
    ctx.scale(scale, scale)
    for shape in shapes
      renderShapeToContext(ctx, shape)
    canvas

  renderShapesToSVG: (shapes, {x, y, width, height}, backgroundColor) ->
    "
      <svg
          xmlns='http://www.w3.org/2000/svg'
          width='#{width}' height='#{height}'
          viewBox='0 0 #{width} #{height}'>
        <rect width='#{width}' height='#{height}' x='0' y='0'
          fill='#{backgroundColor}' />
        <g transform='translate(#{-x}, #{-y})'>
          #{shapes.map(renderShapeToSVG).join('')}
        </g>
      </svg>
    ".replace(/(\r\n|\n|\r)/gm,"")

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

  # Returns the rect LC will use for exporting images using the given params
  getDefaultImageRect: (
      shapeBoundingRects,
      explicitSize={width: 0, height: 0},
      margin={top: 0, right: 0, bottom: 0, left: 0}) ->
    {width, height} = explicitSize

    rect = util.getBoundingRect(
      shapeBoundingRects,
      if width == 'infinite' then 0 else width,
      if height == 'infinite' then 0 else height)

    rect.x -= margin.left
    rect.y -= margin.top
    rect.width += margin.left + margin.right
    rect.height += margin.top + margin.bottom

    rect

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

  requestAnimationFrame: (f) ->
    return window.webkitRequestAnimationFrame(f) if window.webkitRequestAnimationFrame
    return window.requestAnimationFrame(f) if window.requestAnimationFrame
    return window.mozRequestAnimationFrame(f) if window.mozRequestAnimationFrame
    return setTimeout(f, 0)

  cancelAnimationFrame: (f) ->
    return window.webkitCancelRequestAnimationFrame(f) if window.webkitCancelRequestAnimationFrame
    return window.webkitCancelAnimationFrame(f) if window.webkitCancelAnimationFrame
    return window.cancelAnimationFrame(f) if window.cancelAnimationFrame
    return window.mozCancelAnimationFrame(f) if window.mozCancelAnimationFrame
    return clearTimeout(f)

module.exports = util
