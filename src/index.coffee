LiterallyCanvas = require './core/LiterallyCanvas'
initReact = require './reactGUI/init'

shapes = require './core/shapes'
util = require './core/util'


require './optionsStyles/font'
require './optionsStyles/stroke-width'
require './optionsStyles/null'
{defineOptionsStyle} = require './optionsStyles/optionsStyles'


baseTools = require './tools/base'
tools =
  Pencil: require './tools/Pencil'
  Eraser: require './tools/Eraser'
  Line: require './tools/Line'
  Rectangle: require './tools/Rectangle'
  Text: require './tools/Text'
  Pan: require './tools/Pan'
  Eyedropper: require './tools/Eyedropper'

  Tool: baseTools.Tool
  ToolWithStroke: baseTools.ToolWithStroke


init = (el, opts = {}) ->
  opts.primaryColor ?= '#000'
  opts.secondaryColor ?= '#fff'
  opts.backgroundColor ?= 'transparent'
  opts.imageURLPrefix ?= 'lib/img'
  opts.keyboardShortcuts ?= true
  opts.preserveCanvasContents ?= false
  opts.sizeToContainer ?= true

  opts.backgroundShapes ?= []
  opts.watermarkImage ?= null

  opts.pickerWidth = 60
  opts.optionsHeight = 60

  unless 'tools' of opts
    opts.tools = [
      tools.Pencil,
      tools.Eraser,
      tools.Line,
      tools.Rectangle,
      tools.Text,
      tools.Pan,
      tools.Eyedropper,
    ]

  canvases = el.getElementsByTagName('canvas')
  backgroundImage = null
  if opts.preserveCanvasContents
    oldCanvas = if canvases.length then canvases[0] else null
    unless oldCanvas
      throw "Can't preserve old canvas if there isn't one"
    backgroundImage = new Image()
    backgroundImage.src = oldCanvas.toDataURL()
    opts.backgroundShapes.unshift(
      shapes.createShape('Image', {x: 0, y: 0, image: backgroundImage}))

  ### henceforth, all pre-existing DOM children shall be destroyed ###

  for child in el.children
    el.removeChild(child)

  ### and now we rebuild the city ###

  if [' ', ' '].join(el.className).indexOf(' literally ') == -1
    el.className = el.className + ' literally'

  pickerElement = document.createElement('div')
  pickerElement.className = 'lc-picker'

  drawingViewElement = document.createElement('div')
  drawingViewElement.className = 'lc-drawing'

  optionsElement = document.createElement('div')
  optionsElement.className = 'lc-options'

  el.appendChild(pickerElement)
  el.appendChild(drawingViewElement)
  el.appendChild(optionsElement)

  ### and get to work ###

  lc = new LiterallyCanvas(drawingViewElement, opts)

  if backgroundImage
    backgroundImage.onload = => lc.repaintLayer('background')

  initReact(pickerElement, optionsElement, lc, opts.tools, opts.imageURLPrefix)

  if 'onInit' of opts
    opts.onInit(lc)

  lc


registerJQueryPlugin = (_$) ->
  _$.fn.literallycanvas = (opts = {}) ->
    @each (ix, el) =>
      el.literallycanvas = init(el, opts)
    this


# non-browserify compatibility
window.LC = {init}
if window.$
    registerJQueryPlugin(window.$)


module.exports = {
  init, registerJQueryPlugin, util, tools, defineOptionsStyle,

  defineShape: shapes.defineShape,
  createShape: shapes.createShape,
  JSONToShape: shapes.JSONToShape,
  shapeToJSON: shapes.shapeToJSON,
}
