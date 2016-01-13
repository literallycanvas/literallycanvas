lineEndCapShapes = require './lineEndCapShapes'
renderers = {}


# shapeToSVG(shape) -> string
defineSVGRenderer = (shapeName, shapeToSVGFunc) ->
  renderers[shapeName] = shapeToSVGFunc


renderShapeToSVG = (shape, opts={}) ->
  opts.shouldIgnoreUnsupportedShapes ?= false

  if renderers[shape.className]
    return renderers[shape.className](shape)
  else if opts.shouldIgnoreUnsupportedShapes
    console.warn "Can't render shape of type #{shape.className} to SVG"
    return ""
  else
    throw "Can't render shape of type #{shape.className} to SVG"


defineSVGRenderer 'Rectangle', (shape) ->
  x1 = shape.x
  y1 = shape.y
  x2 = shape.x + shape.width
  y2 = shape.y + shape.height

  x = Math.min(x1, x2)
  y = Math.min(y1, y2)
  width = Math.max(x1, x2) - x
  height = Math.max(y1, y2) - y

  if shape.strokeWidth % 2 != 0
    x += 0.5
    y += 0.5

  "
    <rect x='#{x}' y='#{y}'
      width='#{width}' height='#{height}'
      stroke='#{shape.strokeColor}' fill='#{shape.fillColor}'
      stroke-width='#{shape.strokeWidth}' />
  "


defineSVGRenderer 'SelectionBox', (shape) -> return ""


defineSVGRenderer 'Ellipse', (shape) ->
  halfWidth = Math.floor(shape.width / 2)
  halfHeight = Math.floor(shape.height / 2)
  centerX = shape.x + halfWidth
  centerY = shape.y + halfHeight
  "
    <ellipse cx='#{centerX}' cy='#{centerY}' rx='#{Math.abs(halfWidth)}'
      ry='#{Math.abs(halfHeight)}'
      stroke='#{shape.strokeColor}' fill='#{shape.fillColor}'
      stroke-width='#{shape.strokeWidth}' />
  "


defineSVGRenderer 'Image', (shape) ->
  # This will only work when embedded in a web page.
  "
    <image x='#{shape.x}' y='#{shape.y}'
      width='#{shape.image.naturalWidth * shape.scale}'
      height='#{shape.image.naturalHeight * shape.scale}'
      xlink:href='#{shape.image.src}' />
  "


defineSVGRenderer 'Line', (shape) ->
  dashString =
    if shape.dash then "stroke-dasharray='#{shape.dash.join(', ')}'" else ''
  capString = ''
  arrowWidth = Math.max(shape.strokeWidth * 2.2, 5)

  x1 = shape.x1
  x2 = shape.x2
  y1 = shape.y1
  y2 = shape.y2
  if shape.strokeWidth % 2 != 0
    x1 += 0.5
    x2 += 0.5
    y1 += 0.5
    y2 += 0.5

  if shape.endCapShapes[0]
    capString += lineEndCapShapes[shape.endCapShapes[0]].svg(
      x1, y1, Math.atan2(y1 - y2, x1 - x2), arrowWidth, shape.color)
  if shape.endCapShapes[1]
    capString += lineEndCapShapes[shape.endCapShapes[1]].svg(
      x2, y2, Math.atan2(y2 - y1, x2 - x1), arrowWidth, shape.color)
  "
    <g>
      <line x1='#{x1}' y1='#{y1}' x2='#{x2}' y2='#{y2}'
        #{dashString}
        stroke-linecap='#{shape.capStyle}'
        stroke='#{shape.color} 'stroke-width='#{shape.strokeWidth}' />
      #{capString}
    </g>
  "


defineSVGRenderer 'LinePath', (shape) ->
  "
    <polyline
      fill='none'
      points='#{shape.smoothedPoints.map((p) ->
        offset = if p.strokeWidth % 2 == 0 then 0.0 else 0.5
        "#{p.x+offset},#{p.y+offset}").join(' ')
}'
      stroke='#{shape.points[0].color}'
      stroke-linecap='round'
      stroke-width='#{shape.points[0].size}' />
  "


# silently skip erasers
defineSVGRenderer 'ErasedLinePath', (shape) -> ""


defineSVGRenderer 'Polygon', (shape) ->
  if shape.isClosed
    "
      <polygon
        fill='#{shape.fillColor}'
        points='#{shape.points.map((p) ->
          offset = if p.strokeWidth % 2 == 0 then 0.0 else 0.5
          "#{p.x+offset},#{p.y+offset}").join(' ')
}'
        stroke='#{shape.strokeColor}'
        stroke-width='#{shape.strokeWidth}' />
    "
  else
    "
      <polyline
        fill='#{shape.fillColor}'
        points='#{shape.points.map((p) ->
          offset = if p.strokeWidth % 2 == 0 then 0.0 else 0.5
          "#{p.x+offset},#{p.y+offset}").join(' ')
}'
        stroke='none' />
      <polyline
        fill='none'
        points='#{shape.points.map((p) ->
          offset = if p.strokeWidth % 2 == 0 then 0.0 else 0.5
          "#{p.x+offset},#{p.y+offset}").join(' ')
}'
        stroke='#{shape.strokeColor}'
        stroke-width='#{shape.strokeWidth}' />
    "


defineSVGRenderer 'Text', (shape) ->
  # fallback: don't worry about auto-wrapping
  widthString =
    if shape.forcedWidth then "width='#{shape.forcedWidth}px'" else ""
  heightString =
    if shape.forcedHeight then "height='#{shape.forcedHeight}px'" else ""
  textSplitOnLines = shape.text.split(/\r\n|\r|\n/g)

  if shape.renderer
    textSplitOnLines = shape.renderer.lines

  "
  <text x='#{shape.x}' y='#{shape.y}'
        #{widthString} #{heightString}
        fill='#{shape.color}'
        style='font: #{shape.font};'>
    #{textSplitOnLines.map((line, i) =>
      dy = if i == 0 then 0 else '1.2em'
      return "
        <tspan x='#{shape.x}' dy='#{dy}' alignment-baseline='text-before-edge'>
          #{line}
        </tspan>"
    ).join('')}
  </text>
  "


module.exports = {defineSVGRenderer, renderShapeToSVG}