window.LC = window.LC ? {}

LC.bspline = (points, order) ->
  if not order
    return points
  return LC.bspline(dual(dual(refine(points))), order - 1)

refine = (points) ->
  points = [points[0]].concat(points).concat(LC.util.last(points))
  refined = []

  index = 0
  for point in points
    refined[index * 2] = point
    refined[index * 2 + 1] = mid point, points[index + 1] if points[index + 1]
    index += 1

  return refined

dual = (points) ->
  dualed = []

  index = 0
  for point in points
    dualed[index] = mid point, points[index + 1] if points[index + 1]
    index += 1

  return dualed

mid = (a, b) ->
  return new LC.Point a.x + ((b.x - a.x) / 2),
                      a.y + ((b.y - a.y) / 2),
                      a.size + ((b.size - a.size) / 2),
                      a.color

LC.toPoly = (line) ->
  polyLeft = []
  polyRight = []

  index = 0
  for point in line
    n = normals(point, slope(line, index))
    polyLeft = polyLeft.concat([n[0]])
    polyRight = [n[1]].concat(polyRight)
    index += 1

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

LC.filter = (points) ->
  newPoints = [points[0]]
  i = 1
  last = 0

  while i < points.length
    a = points[last]
    b = points[i]

    # TODO: fix magic number constant
    if LC.len(LC.diff(a, b)) > 0.75
      newPoints.push(b)
      last = i

    i++

  return newPoints

LC.fill = (points) ->
  newPoints = [points[0]]
  i = 1

  while i < points.length
    a = points[i - 1]
    b = points[i]

    newPoints = newPoints.concat(LC.between(a, b).slice(1))
    i++

  return newPoints

LC.between = (a, b) ->
  # TODO: fix magic number constant
  if LC.len(LC.diff(a, b)) < 0.55
    return [a, b]
  else
    m = mid(a, b)
    return LC.between(a, m).concat(LC.between(m, b).slice(1))

LC.distribute = (points, iterations) ->
  newPoints = [points[0]]

  for point, i in points.slice(1, -1) then do (point, i) =>
    m = mid(points[i], points[i + 2])
    newPoints.push(m)

  newPoints.push(points[points.length - 1])

  if iterations > 0
    return LC.distribute(newPoints, iterations - 1)
  else
    return newPoints
