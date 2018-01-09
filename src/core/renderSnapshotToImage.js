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

  opts.margin ?= {top: 0, right: 0, bottom: 0, left: 0}
  imageSize = snapshot.imageSize or {width: INFINITE, height: INFINITE}

  colors = snapshot.colors or {background: 'transparent'}
  allShapes = shapes.concat(backgroundShapes)

  watermarkCanvas = document.createElement('canvas')
  watermarkCtx = watermarkCanvas.getContext('2d')

  if opts.rect
    opts.rect.x -= opts.margin.left
    opts.rect.y -= opts.margin.top
    opts.rect.width += opts.margin.left + opts.margin.right
    opts.rect.height += opts.margin.top + opts.margin.bottom
  else
    opts.rect = util.getDefaultImageRect(
      (s.getBoundingRect(watermarkCtx) for s in allShapes),
      imageSize,
      opts.margin
    )

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