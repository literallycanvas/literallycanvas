window.LC = window.LC ? {}

LC.bspline = (points, order) ->
  points = dual(dual(refine(points)))
  
  if not order
    return points
  return LC.bspline(points, order - 1)

refine = (points) ->
  refined = []
  
  _.each points, (point, index, points) ->
    refined[index * 2] = point
    refined[index * 2 + 1] = mid point, points[index + 1] if points[index + 1]

  return refined

dual = (points) ->
  points = _.union [points[0]], points, [_.last(points)]
  dualed = []

  _.each points, (point, index, points) ->
    dualed[index] = mid point, points[index + 1] if points[index + 1]

  return dualed

mid = (a, b) ->
  return new LC.Point a.x + ((b.x - a.x) / 2),
                      a.y + ((b.y - a.y) / 2),
                      a.size + ((b.size - a.size) / 2),
                      a.color


LC.scalePositionScalar = (val, viewportSize, oldScale, newScale) ->
  oldSize = viewportSize * oldScale
  newSize = viewportSize * newScale
  return val + (oldSize - newSize) / 2
