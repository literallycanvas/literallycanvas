util = require './util'
{JSONToShape} = require './shapes'

INFINITE = 'infinite'
module.exports = (snapshot, opts={}) ->
  shapes = (JSONToShape(s) for s in snapshot.shapes)
  backgroundShapes = []
  if snapshot.backgroundShapes
    backgroundShapes = (JSONToShape(s) for s in snapshot.backgroundShapes)

  opts.margin ?= {top: 0, right: 0, bottom: 0, left: 0}
  imageSize = snapshot.imageSize or {width: INFINITE, height: INFINITE}

  colors = snapshot.colors or {background: 'transparent'}
  allShapes = shapes.concat(backgroundShapes)

  dummyCanvas = document.createElement('canvas')
  ctx = dummyCanvas.getContext('2d')

  if opts.rect
    opts.rect.x -= opts.margin.left
    opts.rect.y -= opts.margin.top
    opts.rect.width += opts.margin.left + opts.margin.right
    opts.rect.height += opts.margin.top + opts.margin.bottom
  else
    opts.rect = util.getDefaultImageRect(
      (s.getBoundingRect(ctx) for s in allShapes),
      imageSize,
      opts.margin
    )

  return LC.renderShapesToSVG(
    backgroundShapes.concat(shapes), opts.rect, colors.background)
