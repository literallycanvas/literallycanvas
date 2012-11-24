window.LC = window.LC ? {}

LC.bspline = (points, order) ->
  if not order
    return points
  return LC.bspline(dual(dual(refine(points))), order - 1)

refine = (points) ->
  points = [_.first(points)].concat(points).concat(_.last(points))
  refined = []
  
  _.each points, (point, index, points) ->
    refined[index * 2] = point
    refined[index * 2 + 1] = mid point, points[index + 1] if points[index + 1]

  return refined

dual = (points) ->
  dualed = []

  _.each points, (point, index, points) ->
    dualed[index] = mid point, points[index + 1] if points[index + 1]

  return dualed

mid = (a, b) ->
  return new LC.Point a.x + ((b.x - a.x) / 2),
                      a.y + ((b.y - a.y) / 2),
                      a.size + ((b.size - a.size) / 2),
                      a.color

LC.toPoly = (line) ->
  polyLeft = []
  polyRight = []

  _.each line, (point, index) =>
    n = normals(point, slope(line, index))
    polyLeft = polyLeft.concat([n[0]])
    polyRight = [n[1]].concat(polyRight)

  return polyLeft.concat(polyRight)

slope = (line, index) ->
  if line.length < 3
    point =  {x:0, y:0}
  if index == 0
    point = slope(line, index + 1)
  else if index == line.length - 1
    point = slope(line, index - 1)
  else
    point = LC.diff line[index - 1], line[index + 1]

  return point

LC.diff = (a, b) ->
  return {x: b.x - a.x, y: b.y - a.y}

unit = (vector) ->
  length = LC.len(vector)
  return {x: vector.x / length, y: vector.y / length}

normals = (p, slope) ->
  slope = unit(slope)
  slope.x = slope.x * p.size / 2
  slope.y = slope.y * p.size / 2
  return [{x: p.x - slope.y, y: p.y + slope.x, color: p.color},
          {x: p.x + slope.y, y: p.y - slope.x, color: p.color}]

LC.len = (vector) ->
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))

LC.scalePositionScalar = (val, viewportSize, oldScale, newScale) ->
  oldSize = viewportSize * oldScale
  newSize = viewportSize * newScale
  return val + (oldSize - newSize) / 2
