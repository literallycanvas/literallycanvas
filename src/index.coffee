require './ie_customevent'
require './ie_setLineDash'

LiterallyCanvas = require './core/LiterallyCanvas'

canvasRenderer = require './core/canvasRenderer'
svgRenderer = require './core/svgRenderer'
shapes = require './core/shapes'
util = require './core/util'
renderSnapshotToImage = require './core/renderSnapshotToImage'
renderSnapshotToSVG = require './core/renderSnapshotToSVG'

{localize} = require './core/localization'

conversion =
  snapshotToShapes: (snapshot) ->
    shapes.JSONToShape(shape) for shape in snapshot.shapes
  snapshotJSONToShapes: (json) -> conversion.snapshotToShapes(JSON.parse(json))

baseTools = require './tools/base'
tools =
  Pencil: require './tools/Pencil'
  Eraser: require './tools/Eraser'
  Line: require './tools/Line'
  Rectangle: require './tools/Rectangle'
  Ellipse: require './tools/Ellipse'
  Text: require './tools/Text'
  Polygon: require './tools/Polygon'
  Pan: require './tools/Pan'
  Eyedropper: require './tools/Eyedropper'

  Tool: baseTools.Tool
  ToolWithStroke: baseTools.ToolWithStroke

defaultTools = [
  tools.Pencil,
  tools.Eraser,
  tools.Line,
  tools.Rectangle,
  tools.Ellipse,
  tools.Text,
  tools.Polygon,

  tools.Pan,
  tools.Eyedropper,
]

defaultImageURLPrefix = 'lib/img'
setDefaultImageURLPrefix = (newDefault) -> defaultImageURLPrefix = newDefault

init = (el, opts = {}) ->
  opts.imageURLPrefix ?= defaultImageURLPrefix

  opts.primaryColor ?= 'hsla(0, 0%, 0%, 1)'
  opts.secondaryColor ?= 'hsla(0, 0%, 100%, 1)'
  opts.backgroundColor ?= 'transparent'

  opts.strokeWidths ?= [1, 2, 5, 10, 20, 30]
  opts.defaultStrokeWidth ?= 5

  opts.toolbarPosition ?= 'top'

  opts.keyboardShortcuts ?= true

  opts.imageSize ?= {width: 'infinite', height: 'infinite'}

  opts.backgroundShapes ?= []
  opts.watermarkImage ?= null
  opts.watermarkScale ?= 1

  opts.zoomMin ?= 0.2
  opts.zoomMax ?= 4.0
  opts.zoomStep ?= 0.2

  opts.snapshot ?= null

  unless 'tools' of opts
    opts.tools = defaultTools

  ### henceforth, all pre-existing DOM children shall be destroyed ###

  for child in el.children
    el.removeChild(child)

  ### and now we rebuild the city ###

  if [' ', ' '].join(el.className).indexOf(' literally ') == -1
    el.className = el.className + ' literally'

  topOrBottomClassName = if opts.toolbarPosition == 'top'
    'toolbar-at-top'
  else if opts.toolbarPosition == 'bottom'
    'toolbar-at-bottom'
  else if opts.toolbarPosition == 'hidden'
    'toolbar-hidden'
  el.className = el.className + ' ' + topOrBottomClassName

  drawingViewElement = document.createElement('div')
  drawingViewElement.className = 'lc-drawing'

  el.appendChild(drawingViewElement)

  ### and get to work ###

  lc = new LiterallyCanvas(drawingViewElement, opts)

  if 'onInit' of opts
    opts.onInit(lc)

  teardown = ->
    lc._teardown()
    drawingViewElement.remove()

  lc.teardown = teardown

  lc

# non-browserify compatibility
window.LC = {init}

module.exports = {
  init, util, tools,
  setDefaultImageURLPrefix, defaultTools,

  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,

  defineCanvasRenderer:  canvasRenderer.defineCanvasRenderer,
  renderShapeToContext: canvasRenderer.renderShapeToContext,
  renderShapeToCanvas: canvasRenderer.renderShapeToCanvas,
  renderShapesToCanvas: util.renderShapes

  defineSVGRenderer: svgRenderer.defineSVGRenderer,
  renderShapeToSVG: svgRenderer.renderShapeToSVG,
  renderShapesToSVG: util.renderShapesToSVG,

  snapshotToShapes: conversion.snapshotToShapes
  snapshotJSONToShapes: conversion.snapshotJSONToShapes

  renderSnapshotToImage: renderSnapshotToImage
  renderSnapshotToSVG: renderSnapshotToSVG

  localize: localize
}
