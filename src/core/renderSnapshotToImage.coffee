util = require './util'
{JSONToShape} = require './shapes'

# mostly copypasta from LiterallyCanvas.coffee
INFINITE = 'infinite'
renderWatermark = (ctx, image, scale) ->
  return unless image.width

  ctx.save()
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
  ctx.scale(scale, scale)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)
  ctx.restore()

module.exports = (snapshot, opts={}) ->
  opts.scale ?= 1

  shapes = (JSONToShape(s) for s in snapshot.shapes)
  backgroundShapes = []
  if snapshot.backgroundShapes
    backgroundShapes = (JSONToShape(s) for s in snapshot.backgroundShapes)
  imageSize = snapshot.imageSize or {width: INFINITE, height: INFINITE}
  {width, height} = imageSize
  colors = snapshot.colors or {background: 'transparent'}
  allShapes = shapes.concat(backgroundShapes)

  watermarkCanvas = document.createElement('canvas')
  watermarkCtx = watermarkCanvas.getContext('2d')

  opts.margin ?= {top: 0, right: 0, bottom: 0, left: 0}
  unless opts.rect
    opts.rect = util.getBoundingRect(
      (s.getBoundingRect(watermarkCtx) for s in allShapes)
      if width == INFINITE then 0 else width,
      if height == INFINITE then 0 else height)
  opts.rect.x -= opts.margin.left
  opts.rect.y -= opts.margin.top
  opts.rect.width += opts.margin.left + opts.margin.right
  opts.rect.height += opts.margin.top + opts.margin.bottom

  watermarkCanvas.width = opts.rect.width * opts.scale
  watermarkCanvas.height = opts.rect.height * opts.scale
  watermarkCtx.fillStyle = colors.background
  watermarkCtx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height)

  if not (opts.rect.width and opts.rect.height)
    return null

  if opts.watermarkImage
    renderWatermark(watermarkCtx, opts.watermarkImage, opts.watermarkScale)

  util.combineCanvases(
    watermarkCanvas,
    util.renderShapes(backgroundShapes, opts.rect, opts.scale),
    util.renderShapes(shapes, opts.rect, opts.scale))