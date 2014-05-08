{Point} = require './shapes'
util = require './util'

math = {}

math.toPoly = (line) ->
  polyLeft = []
  polyRight = []

  index = 0
  for point in line
    n = normals(point, _slope(line, index))
    polyLeft = polyLeft.concat([n[0]])
    polyRight = [n[1]].concat(polyRight)
    index += 1

  return polyLeft.concat(polyRight)

_slope = (line, index) ->
  if line.length < 3
    point =  {x:0, y:0}
  if index == 0
    point = _slope(line, index + 1)
  else if index == line.length - 1
    point = _slope(line, index - 1)
  else
    point = math.diff line[index - 1], line[index + 1]

  return point

math.diff = (a, b) ->
  return {x: b.x - a.x, y: b.y - a.y}

unit = (vector) ->
  length = math.len(vector)
  return {x: vector.x / length, y: vector.y / length}

normals = (p, slope) ->
  slope = unit(slope)
  slope.x = slope.x * p.size / 2
  slope.y = slope.y * p.size / 2
  return [{x: p.x - slope.y, y: p.y + slope.x, color: p.color},
          {x: p.x + slope.y, y: p.y - slope.x, color: p.color}]

math.len = (vector) ->
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))

math.scalePositionScalar = (val, viewportSize, oldScale, newScale) ->
  oldSize = viewportSize * oldScale
  newSize = viewportSize * newScale
  return val + (oldSize - newSize) / 2

module.exports = math