require './ie_customevent'
require './ie_setLineDash'

LiterallyCanvasModel = require './core/LiterallyCanvas'
defaultOptions = require './core/defaultOptions'

canvasRenderer = require './core/canvasRenderer'
svgRenderer = require './core/svgRenderer'
shapes = require './core/shapes'
util = require './core/util'
renderSnapshotToImage = require './core/renderSnapshotToImage'
renderSnapshotToSVG = require './core/renderSnapshotToSVG'

{localize} = require './core/localization'

# @ifdef INCLUDE_GUI
LiterallyCanvasReactComponent = require './reactGUI/LiterallyCanvas'
initReactDOM = require './reactGUI/initDOM'
require './optionsStyles/font'
require './optionsStyles/stroke-width'
require './optionsStyles/line-options-and-stroke-width'
require './optionsStyles/polygon-and-stroke-width'
require './optionsStyles/stroke-or-fill'
require './optionsStyles/null'
{defineOptionsStyle} = require './optionsStyles/optionsStyles'
# @endif

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
  SelectShape: require './tools/SelectShape'

  Tool: baseTools.Tool
  ToolWithStroke: baseTools.ToolWithStroke


defaultTools = defaultOptions.tools
defaultImageURLPrefix = defaultOptions.imageURLPrefix
setDefaultImageURLPrefix = (newDefault) ->
  defaultImageURLPrefix = newDefault
  defaultOptions.imageURLPrefix = newDefault


init = (el, opts = {}) ->
  for opt of defaultOptions
    unless opt of opts
      opts[opt] = defaultOptions[opt]

  # Destroy all children of the element we're using

  for child in el.children
    el.removeChild(child)

  # @ifdef INCLUDE_GUI
  return require('./reactGUI/initDOM')(el, opts)
  # @endif
  # @ifndef INCLUDE_GUI
  return initWithoutGUI(el, opts)
  # @endif


initWithoutGUI = (el, opts) ->
  originalClassName = el.className
  if [' ', ' '].join(el.className).indexOf(' literally ') == -1
    el.className = el.className + ' literally'

  el.className = el.className + ' toolbar-hidden'

  drawingViewElement = document.createElement('div')
  drawingViewElement.className = 'lc-drawing'
  el.appendChild(drawingViewElement)

  lc = new LiterallyCanvasModel(drawingViewElement, opts)
  lc.teardown = ->
    lc._teardown()
    for child in el.children
      el.removeChild(child)
    el.className = originalClassName

  if 'onInit' of opts
    opts.onInit(lc)

  lc


registerJQueryPlugin = (_$) ->
  _$.fn.literallycanvas = (opts = {}) ->
    @each (ix, el) =>
      el.literallycanvas = init(el, opts)
    this


# non-browserify compatibility
if typeof window != 'undefined'
  window.LC = {init}
  if window.$
      registerJQueryPlugin(window.$)


module.exports = {
  init, registerJQueryPlugin, util, tools,
  setDefaultImageURLPrefix, defaultTools,
  # @ifdef INCLUDE_GUI
  defineOptionsStyle,
  LiterallyCanvasReactComponent,
  # @endif

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
