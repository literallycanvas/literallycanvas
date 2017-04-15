util = require './util'
{JSONToShape} = require './shapes'

INFINITE = 'infinite'
module.exports = (snapshot, opts={}) ->
  shapes = (JSONToShape(s) for s in snapshot.shapes)
  backgroundShapes = []
  if snapshot.backgroundShapes
    backgroundShapes = (JSONToShape(s) for s in snapshot.backgroundShapes)
  scale = opts.scale or 0.1
  backgroundColor = opts.backgroundColor or 'white'

  return LC.renderShapesToSVG2(
    backgroundShapes.concat(shapes), scale, backgroundColor)
