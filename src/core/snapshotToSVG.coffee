util = require './util'
{JSONToShape} = require './shapes'

INFINITE = 'infinite'
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

  dummyCanvas = document.createElement('canvas')
  ctx = dummyCanvas.getContext('2d')

  opts.margin ?= {top: 0, right: 0, bottom: 0, left: 0}
  unless opts.rect
    opts.rect = util.getBoundingRect(
      (s.getBoundingRect(ctx) for s in allShapes)
      if width == INFINITE then 0 else width,
      if height == INFINITE then 0 else height)
  opts.rect.x -= opts.margin.left
  opts.rect.y -= opts.margin.top
  opts.rect.width += opts.margin.left + opts.margin.right
  opts.rect.height += opts.margin.top + opts.margin.bottom

  return LC.renderShapesToSVG(
    backgroundShapes.concat(shapes), opts.rect, colors.background)
