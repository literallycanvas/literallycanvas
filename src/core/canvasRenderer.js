lineEndCapShapes = require './lineEndCapShapes'
renderers = {}


# drawFunc(ctx, shape, retryCallback)
# drawLatest(ctx, bufferCtx, shape, retryCallback)
defineCanvasRenderer = (shapeName, drawFunc, drawLatestFunc) ->
	renderers[shapeName] = {drawFunc, drawLatestFunc}


noop = ->
renderShapeToContext = (ctx, shape, opts={}) ->
  opts.shouldIgnoreUnsupportedShapes ?= false
  opts.retryCallback ?= noop
  opts.shouldOnlyDrawLatest ?= false
  opts.bufferCtx ?= null
  {bufferCtx} = opts

  if renderers[shape.className]
    if opts.shouldOnlyDrawLatest and renderers[shape.className].drawLatestFunc
      renderers[shape.className].drawLatestFunc(
        ctx, bufferCtx, shape, opts.retryCallback)
    else
      renderers[shape.className].drawFunc(ctx, shape, opts.retryCallback)
  else if opts.shouldIgnoreUnsupportedShapes
    console.warn "Can't render shape of type #{shape.className} to canvas"
  else
    throw "Can't render shape of type #{shape.className} to canvas"


renderShapeToCanvas = (canvas, shape, opts) ->
  renderShapeToContext(canvas.getContext('2d'), shape, opts)


defineCanvasRenderer 'Rectangle', (ctx, shape) ->
  x = shape.x
  y = shape.y
  if shape.strokeWidth % 2 != 0
    x += 0.5
    y += 0.5

  ctx.fillStyle = shape.fillColor
  ctx.fillRect(x, y, shape.width, shape.height)
  ctx.lineWidth = shape.strokeWidth
  ctx.strokeStyle = shape.strokeColor
  ctx.strokeRect(x, y, shape.width, shape.height)


defineCanvasRenderer 'Ellipse', (ctx, shape) ->
  ctx.save()
  halfWidth = Math.floor(shape.width / 2)
  halfHeight = Math.floor(shape.height / 2)
  centerX = shape.x + halfWidth
  centerY = shape.y + halfHeight

  ctx.translate(centerX, centerY)
  ctx.scale(1, Math.abs(shape.height / shape.width))
  ctx.beginPath()
  ctx.arc(0, 0, Math.abs(halfWidth), 0, Math.PI * 2)
  ctx.closePath()
  ctx.restore()

  ctx.fillStyle = shape.fillColor
  ctx.fill()
  ctx.lineWidth = shape.strokeWidth
  ctx.strokeStyle = shape.strokeColor
  ctx.stroke()


defineCanvasRenderer 'SelectionBox', do ->
  _drawHandle = (ctx, {x, y}, handleSize) ->
    return if handleSize == 0

    ctx.fillStyle = '#fff'
    ctx.fillRect(x, y, handleSize, handleSize)
    ctx.strokeStyle = '#000'
    ctx.strokeRect(x, y, handleSize, handleSize)

  (ctx, shape) ->
    _drawHandle(ctx, shape.getTopLeftHandleRect(), shape.handleSize)
    _drawHandle(ctx, shape.getTopRightHandleRect(), shape.handleSize)
    _drawHandle(ctx, shape.getBottomLeftHandleRect(), shape.handleSize)
    _drawHandle(ctx, shape.getBottomRightHandleRect(), shape.handleSize)

    if shape.backgroundColor
      ctx.fillStyle = shape.backgroundColor
      ctx.fillRect(
        shape._br.x - shape.margin,
        shape._br.y - shape.margin,
        shape._br.width + shape.margin * 2,
        shape._br.height + shape.margin * 2)
    ctx.lineWidth = 1
    ctx.strokeStyle = '#000'
    ctx.setLineDash([2, 4])
    ctx.strokeRect(
      shape._br.x - shape.margin, shape._br.y - shape.margin,
      shape._br.width + shape.margin * 2, shape._br.height + shape.margin * 2)

    ctx.setLineDash([])


defineCanvasRenderer 'Image', (ctx, shape, retryCallback) ->
  if shape.image.width
    if shape.scale == 1
      ctx.drawImage(shape.image, shape.x, shape.y)
    else
      ctx.drawImage(
        shape.image, shape.x, shape.y,
        shape.image.width * shape.scale, shape.image.height * shape.scale)
  else if retryCallback
    shape.image.onload = retryCallback


defineCanvasRenderer 'Line', (ctx, shape) ->
  if shape.x1 == shape.x2 and shape.y1 == shape.y2
    # browser behavior is not consistent for this case.
    return

  x1 = shape.x1
  x2 = shape.x2
  y1 = shape.y1
  y2 = shape.y2
  if shape.strokeWidth % 2 != 0
    x1 += 0.5
    x2 += 0.5
    y1 += 0.5
    y2 += 0.5

  ctx.lineWidth = shape.strokeWidth
  ctx.strokeStyle = shape.color
  ctx.lineCap = shape.capStyle
  ctx.setLineDash(shape.dash) if shape.dash
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([]) if shape.dash

  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5)
  if shape.endCapShapes[0]
    lineEndCapShapes[shape.endCapShapes[0]].drawToCanvas(
      ctx, x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color)
  if shape.endCapShapes[1]
    lineEndCapShapes[shape.endCapShapes[1]].drawToCanvas(
      ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color)


_drawRawLinePath = (ctx, points, close=false, lineCap='round') ->
  return unless points.length

  ctx.lineCap = lineCap

  ctx.strokeStyle = points[0].color
  ctx.lineWidth = points[0].size

  ctx.beginPath()

  if points[0].size % 2 == 0
    ctx.moveTo(points[0].x, points[0].y)
  else
    ctx.moveTo(points[0].x+0.5, points[0].y+0.5)

  for point in points.slice(1)
    if points[0].size % 2 == 0
      ctx.lineTo(point.x, point.y)
    else
      ctx.lineTo(point.x+0.5, point.y+0.5)

  if close
    ctx.closePath()


drawLinePath = (ctx, shape) ->
  _drawRawLinePath(ctx, shape.smoothedPoints)
  ctx.stroke()
drawLinePathLatest = (ctx, bufferCtx, shape) ->
  if shape.tail
    segmentStart =
      shape.smoothedPoints.length - shape.segmentSize * shape.tailSize
    drawStart =
      if segmentStart < shape.segmentSize * 2 then 0 else segmentStart

    drawEnd = segmentStart + shape.segmentSize + 1

    _drawRawLinePath(bufferCtx, shape.smoothedPoints.slice(drawStart, drawEnd))
    bufferCtx.stroke()
  else
    _drawRawLinePath(bufferCtx, shape.smoothedPoints)
    bufferCtx.stroke()


defineCanvasRenderer 'LinePath', drawLinePath, drawLinePathLatest


# same as the line path funcs, but erase instead of draw
drawErasedLinePath = (ctx, shape) ->
  ctx.save()
  ctx.globalCompositeOperation = "destination-out"
  drawLinePath(ctx, shape)
  ctx.restore()
drawErasedLinePathLatest = (ctx, bufferCtx, shape) ->
  ctx.save()
  ctx.globalCompositeOperation = "destination-out"
  bufferCtx.save()
  bufferCtx.globalCompositeOperation = "destination-out"

  drawLinePathLatest(ctx, bufferCtx, shape)

  ctx.restore()
  bufferCtx.restore()


defineCanvasRenderer(
  'ErasedLinePath', drawErasedLinePath, drawErasedLinePathLatest)


defineCanvasRenderer 'Text', (ctx, shape) ->
  shape._makeRenderer(ctx) unless shape.renderer
  ctx.fillStyle = shape.color
  shape.renderer.draw(ctx, shape.x, shape.y)


defineCanvasRenderer 'Polygon', (ctx, shape) ->
  ctx.fillStyle = shape.fillColor
  _drawRawLinePath(ctx, shape.points, shape.isClosed, 'butt')
  ctx.fill()
  ctx.stroke()


module.exports = {
  defineCanvasRenderer, renderShapeToCanvas, renderShapeToContext
}